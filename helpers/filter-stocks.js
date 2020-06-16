// we need to filter our stocks data because over time some products saw their SKUs edited manually to be able to relist product while reusing EAN/ASIN. This means that only products whose SellerSKU ends with "-new" (non-case sensitive!) are the ones for which we should consider stock changes for a given EAN/ASIN
module.exports = (stocks) => {
  return stocks.map(filterStockData).map(removeSkuField)
}

function filterStockData (stock) {
    const rawStockData = stock.stockData
    return {
      ...stock,
      stockData: rawStockData.filter(stockDataFilterHandler(rawStockData))
    }
}

function stockDataFilterHandler (stockData) {
  return data => {
    const dataOccurences = stockData.filter(stock => stock.id === data.id)
    const sku = data.sku
    return dataOccurences.length === 1 ? true : sku[sku.length - 4].toLowerCase() === '-new' 
  }
}

function removeSkuField (stock) {
  const noSkuStock = { ...stock }
  delete noSkuStock.sku
  return noSkuStock
}