module.exports = (queryStringParameters) => {
  if (queryStringParameters) {
    const countryCode = event.queryStringParameters.code
    return countryCode ? [countryCode.toLowerCase()] : []
  }
  return Object.keys(require('../marketplaces.js')).map(key => key.toLowerCase())
}