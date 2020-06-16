// we need filtering because over time some products got listed multiple time with the same ASIN/EAN
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
    return dataOccurences.length === 1 ? dataOccurences[0] : dataOccurences.filter(filterDataOccurences)[0] 
  }
}

function filterDataOccurences (data) {
  return (filterBySku(sku)) || data.quantity > 0
}

function filterBySku (sku) {
  // SKUs should contains 'NEW' at the end and have at least 4 sections delimited by '-'
  const skuSplit = sku.split('-')
  return skuSplit.length > 3 && skuSplit[skuSplit.length - 1].toLowerCase().includes('-new')
}

function removeSkuField (stock) {
  return {
    ...stock,
    stockData: stock.stockData.map(data => {
      const noSkuStockData = { ...data }
      delete noSkuStockData.sku
      return noSkuStockData
    })
  }
}