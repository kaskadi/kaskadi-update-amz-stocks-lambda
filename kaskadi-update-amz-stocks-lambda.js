const AWS = require('aws-sdk')
const WemaloClient = require('wemalo-api-wrapper')
const client = new WemaloClient({token: process.env.WEMALO_TOKEN})
const lambda = new AWS.Lambda({region: 'eu-central-1'})
const es = require('aws-es-client')({
  id: process.env.ES_ID,
  token: process.env.ES_SECRET,
  url: process.env.ES_ENDPOINT
})

module.exports.handler = async (event) => {
  const lastUpdated = (await es.get({
    id: 'ysws',
    index: 'warehouses'
  }))._source.stockLastUpdated
  const stocks = await getStocksData(lastUpdated)
  await setStockData(stocks)
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      stocks
    })
  }
}

async function setStockData(stocks) {
  if (stocks.length === 0) {
    return
  }
  const event = {
    stockData: stocks,
    warehouse: 'ysws'
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
