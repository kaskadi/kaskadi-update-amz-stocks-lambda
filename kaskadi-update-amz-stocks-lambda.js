module.exports.handler = async (event) => {
  let ids
  let res = {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*'
    }
  }
  if (event.queryStringParameters) {
    const countryCode = event.queryStringParameters.code
    if (!countryCode) {
      res.statusCode = 400
      res.body = JSON.stringify({ message: `Please provide a warehouse country code in your query string.` })
      return res
    }
    ids = [countryCode.toLowerCase()]
  } else {
    ids = Object.keys(require('./marketplaces.js')).map(key => key.toLowerCase())
  }
  res.body = JSON.stringify(await updateStocks(ids))
  return res
}

async function updateStocks (ids) {
  const es = require('aws-es-client')({
    id: process.env.ES_ID,
    token: process.env.ES_SECRET,
    url: process.env.ES_ENDPOINT
  })
  let stockMap = {}
  for (const id of ids) {
    const warehouse = await es.get({
      id: `amz_${id}`,
      index: 'warehouses'
    })
    if (warehouse.found) {
      const lastUpdated = warehouse._source.stockLastUpdated || 1262300400000 // default to 01/01/2015
      const stocks = await getStocksData(lastUpdated, id.toUpperCase())
      stockMap[warehouse] = stocks
      await setStockData(stocks, warehouse)
    }
  }
  return stockMap
}

async function setStockData(stocks, warehouse) {
  const AWS = require('aws-sdk')
  const lambda = new AWS.Lambda({region: 'eu-central-1'})
  if (stocks.length === 0) {
    return
  }
  const event = {
    stockData: stocks,
    warehouse
  }
  await lambda.invoke({
    FunctionName: 'kaskadi-update-stocks-lambda',
    Payload: JSON.stringify(event),
    InvocationType: 'Event'
  }).promise()
}

async function getStocksData(lastUpdated, marketplace) {
  const MWS = require('mws-client')({
    AWSAccessKeyId: process.env.AWS_ACCESS_KEY,
    SellerId: process.env.SELLER_ID,
    MWSAuthToken: process.env.MWS_AUTH_TOKEN
  })
  const mwsData = await MWS.fulfillmentInventory.listInventorySupply({ QueryStartDateTime: new Date(lastUpdated).toISOString(), ResponseGroup: 'Basic', _marketplace: marketplace })
  return mwsData.ListInventorySupplyResponse.ListInventorySupplyResult.InventorySupplyList.member.map(product => {
    return {
      id: product.SellerSKU,
      quantity: product.InStockSupplyQuantity,
      condition: product.Condition
    }
  })
}
