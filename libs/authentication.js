const nodeUrl = require('url')

module.exports = {
  verifySignatureCertURL: (url, protocol, hostname, port, path) => {
    console.log('new url test - - - - - - - - - - - - - - - - -')
    console.log(url)
    let urlContents = nodeUrl.parse(url)
    let passedAllTests = false

    let testUrl = (a, b) => {
      console.log(`urlContent: ${a} + envTestVar: ${b}`)
      if (a && a !== b) {
        console.log('false')
        passedAllTests = false
      }
      else {
        console.log('true')
        passedAllTests = true
      }
    }

    urlContents.firstPath = urlContents.path.split('/')[1]

    let urlContentArr = [urlContents.protocol, urlContents.hostname, urlContents.port, urlContents.firstPath]
    let testUrlArr = [protocol, hostname, port, path]

    for (let i = 0; i < testUrlArr.length; i++) {
      testUrl(urlContentArr[i], testUrlArr[i])
    }

    return passedAllTests
  }
}