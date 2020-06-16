// we need to filter our stocks data because over time some products saw their SKUs edited manually to be able to relist product while reusing EAN/ASIN. This means that only products whose SellerSKU ends with "-new" (non-case sensitive!) are the ones for which we should consider stock changes for a given EAN/ASIN
module.exports = (stocks) => {
  return stocks.map(removeDuplicatedStock).map(removeSkuField)
}

function removeDuplicatedStock (stock) {
  const stockData = stock.stockData
  let ids = stockData.map(data => data.id)
  ids = [...new Set(ids)] // remove duplicated ids
  return {
    ...stock,
    stockData: ids.map(getStockDataForId(stockData))
  }
}

function getStockDataForId (stockData) {
  return id => {
    const dataOccurences = stockData.filter(stock => stock.id === id)
    return dataOccurences.length === 1 ? dataOccurences[0] : dataOccurences.filter(data => data.sku[data.sku.length - 4].toLowerCase() === '-new') 
  }
}

function removeSkuField (stock) {
  const noSkuStock = { ...stock }
  delete noSkuStock.sku
  return noSkuStock
}