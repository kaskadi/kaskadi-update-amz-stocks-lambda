const AWS = require('aws-sdk')
const lambda = new AWS.Lambda({region: 'eu-central-1'})
const es = require('aws-es-client')({
  id: process.env.ES_ID,
  token: process.env.ES_SECRET,
  url: process.env.ES_ENDPOINT
})
const MWS = require('mws-client')({
  AWSAccessKeyId: process.env.ACCESS_KEY,
  SellerId: process.env.SELLER_ID,
  MWSAuthToken: process.env.MWS_AUTH_TOKEN
})

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
  const stockMap = await Promise.all(ids.map(id => updateStocks(id, 500/ids.length)))
  res.body = JSON.stringify(stockMap.filter(data => data.stockData))
  return res
}

async function updateStocks (id, restoreRate) {
  const warehouseId = `amz_${id}` 
  const warehouse = await es.get({
    id: warehouseId,
    index: 'warehouses'
  })
  let payload = {
    warehouse: warehouseId
  }
  if (warehouse.found) {
    const lastUpdated = warehouse._source.stockLastUpdated || 1420066800000 // default to 01/01/2015
    const stocks = await getStocksData(lastUpdated, id.toUpperCase(), restoreRate)
    payload.stockData = stocks
    await setStockData(payload)
  }
  return payload
}

async function setStockData(payload) {
  if (payload.stockData.length === 0) {
    return
  }
  await lambda.invoke({
    FunctionName: 'kaskadi-set-stocks-lambda',
    Payload: JSON.stringify(payload),
    InvocationType: 'Event'
  }).promise()
}

async function getStocksData(lastUpdated, marketplace, restoreRate) {
  await new Promise((resolve, reject) => {setTimeout(resolve, restoreRate)}) // MWS throttling
  const mwsData = await MWS.fulfillmentInventory.listInventorySupply({
    QueryStartDateTime: new Date(lastUpdated).toISOString(),
    ResponseGroup: 'Basic',
    _marketplace: marketplace
  })
  let response = mwsData.ListInventorySupplyResponse
  let result = response.ListInventorySupplyResult
  let NextToken = result.NextToken
  let stocks = [...processStocksData(result.InventorySupplyList.member)]
  while (NextToken) {
    await new Promise((resolve, reject) => {setTimeout(resolve, restoreRate)}) // MWS throttling
    const nextData = await MWS.fulfillmentInventory.listInventorySupplyByNextToken({
      NextToken,
      _marketplace: marketplace
    })
    response = nextData.ListInventorySupplyByNextTokenResponse
    result = response.ListInventorySupplyByNextTokenResult
    NextToken = result.NextToken
    stocks = [...stocks, ...processStocksData(result.InventorySupplyList.member)]
  }
  return stocks
}

function processStocksData(stockData) {
  return stockData.map(product => {
    return {
      id: product.SellerSKU,
      quantity: product.InStockSupplyQuantity,
      condition: product.Condition
    }
  })
}
