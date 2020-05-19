const AWS = require('aws-sdk')
const lambda = new AWS.Lambda({region: 'eu-central-1'})
const es = require('aws-es-client')({
  id: process.env.ES_ID,
  token: process.env.ES_SECRET,
  url: process.env.ES_ENDPOINT
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
  res.body = JSON.stringify(await updateStocks(ids))
  return res
}

async function updateStocks (ids) {
  let stockMap = {}
  for (const id of ids) {
    const warehouse = await es.get({
      id: `amz_${id}`,
      index: 'warehouses'
    })
    if (warehouse.found) {
      const lastUpdated = warehouse._source.stockLastUpdated || 1262300400000 // default to 01/01/2015
      const stocks = await getStocksData(lastUpdated)
      stockMap[warehouse] = stocks
      await setStockData(stocks, warehouse)
    }
  }
  return stockMap
}

async function setStockData(stocks, warehouse) {
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

async function getStocksData(lastUpdated) {
  const yswsData = await client.availableStock(new Date(lastUpdated))
  return yswsData.articles.map(article => {
    return {
      id: article.externalId,
      quantity: article.quantity
    }
  })
}
