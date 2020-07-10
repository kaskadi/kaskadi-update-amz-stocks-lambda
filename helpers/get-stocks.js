const es = require('aws-es-client')({
  id: process.env.ES_ID,
  token: process.env.ES_SECRET,
  url: process.env.ES_ENDPOINT
})
const MWS = require('mws-client')({
  AWSAccessKeyId: process.env.MWS_KEY_ID,
  SellerId: process.env.AMZ_EU_SELLER_ID,
  MWSAuthToken: process.env.MWS_KEY_SECRET
})

module.exports = async (countryIds) => {
  let stocks = []
  for (const id of countryIds) {
    const warehouseId = `amz_${id}`
    const warehouse = await getWarehouse(warehouseId)
    if (warehouse.body.found) {
      stocks = [...stocks, await getWarehouseStocks(warehouse, warehouseId, id)]
    }
  }
  return stocks
}

function getWarehouse (warehouseId) {
  return es.get({
    id: warehouseId,
    index: 'warehouses'
  })
}

async function getWarehouseStocks (warehouse, warehouseId, id) {
  const lastUpdated = warehouse.body._source.stockLastUpdated || 1420066800000
  return {
    idType: 'ASIN',
    warehouse: warehouseId,
    stockData: await getWarehouseStocksData(lastUpdated, id.toUpperCase())
  }
}

async function getWarehouseStocksData(lastUpdated, countryId) {
  const restoreRate = 500 // 2 requests restored every seconds, for throttling implementation
  const mwsData = await listInventorySupply(lastUpdated, countryId, restoreRate)
  let result = mwsData.body.ListInventorySupplyResponse.ListInventorySupplyResult
  let NextToken = result.NextToken
  let stocks = result.InventorySupplyList.member ? [...processStocksData(result.InventorySupplyList.member)] : []
  while (NextToken) {
    const nextData = await listInventorySupplyByNextToken(NextToken, countryId, restoreRate)
    result = nextData.body.ListInventorySupplyByNextTokenResponse.ListInventorySupplyByNextTokenResult
    NextToken = result.NextToken
    stocks = [...stocks, ...processStocksData(result.InventorySupplyList.member)]
  }
  return stocks
}

function listInventorySupply (lastUpdated, countryId, restoreRate) {
  return new Promise(resolve => setTimeout(resolve, restoreRate))
  .then(res => MWS.fulfillmentInventory.listInventorySupply({
    QueryStartDateTime: new Date(lastUpdated).toISOString(),
    ResponseGroup: 'Basic',
    _marketplace: countryId
  }))
}

function listInventorySupplyByNextToken(NextToken, countryId, restoreRate) {
  return new Promise(resolve => setTimeout(resolve, restoreRate))
  .then(res => MWS.fulfillmentInventory.listInventorySupplyByNextToken({
    NextToken,
    _marketplace: countryId
  }))
}

function processStocksData(stockData) {
  return stockData.map(product => {
    return {
      id: product.ASIN,
      sku: product.SellerSKU,
      quantity: Number(product.InStockSupplyQuantity),
      condition: product.Condition
    }
  })
}