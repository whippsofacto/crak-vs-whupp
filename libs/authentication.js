const normalizeUrl = require('normalize-url')

module.exports = {
  authentication: (url) => {
    console.log(url)
    let normalizedUrl = normalizeUrl(url)
    console.log(normalizedUrl)
  }
}