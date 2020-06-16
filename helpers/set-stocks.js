const AWS = require('aws-sdk')
const lambda = new AWS.Lambda({region: 'eu-central-1'})

module.exports = async (stocks) => {
  let res = {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*'
    }
  }
  // if (stocks.length === 0) {
  //   res.statusCode = 404
  //   res.body = JSON.stringify({ message: 'No warehouses were found for the given country code.' })
  //   return res
  // }
  // await Promise.all(stocks.map(setStocksForId))
  // for test purpose
  console.log(JSON.stringify(stocks, null, 2))
  res.body = JSON.stringify(stocks)
  return res
}

function setStocksForId(stock) {
  if (stock.stockData.length === 0) {
    return Promise.resolve()
  }
  return lambda.invoke({
    FunctionName: 'kaskadi-set-stocks-lambda',
    Payload: JSON.stringify(stock),
    InvocationType: 'Event'
  }).promise()
}