const respData = require('../../data.json')
const verifier = require('alexa-verifier')

module.exports = function (app) {

  app.post('/skill', async (req, res) => {
    try {
      // You'll create your note here.
      // let data = await _db.rawSql('SELECT * FROM players')
      // console.log('Headers - - - - - ///')
      // console.log(req.headers)
      // console.log('Body - - - - - ///')
      // console.log(req.body)

      const certUrl = req.headers.signaturecertchainurl
      const signature = req.headers.signature
      const requestBody = req.body
      const verified = await verifier(certUrl, signature, requestBody, function (err) {
        console.log(`verification error ` + err)
        res.status(404).send('not found')
      })

      if (env === 'dev' || verified) {
        const data = await _db.rawSql('SELECT * FROM players')

        let craig = `<speak>${data[0].name}. ${data[0].description}</speak>`
        let whipp = `<speak>${data[1].name}. ${data[1].description}</speak>`
        let randomResponseArr = [craig, whipp]
        let randomResponse = Math.floor(Math.random() * randomResponseArr.length)

        console.log(`Request Type: ${req.body.request.type}`)

        switch (req.body.request.type) {
          case 'LaunchRequest':
            respData.response.outputSpeech.ssml = randomResponseArr[randomResponse]
            respData.response.reprompt.outputSpeech.ssml = randomResponseArr[randomResponse]
            break
          default:
            respData.response.outputSpeech.ssml = `<speak>One of the Built In intents have been chosen.</speak>`
            respData.response.reprompt.outputSpeech.ssml = `<speak>One of the Built In intents have been chosen.</speak>`
        }
        res.send(respData)
      }
    } catch (err) {
      console.log('ERROR skill.js ' + err)
      res.status(404).send('not found')
    }
  })
}