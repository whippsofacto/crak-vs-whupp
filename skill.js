const verifier = require('alexa-verifier')

module.exports = function (app, db) {
  app.post('/skill', async (req, res) => {
    try {
      if (env !== 'dev') {
        // If in production authenticate the request signature
        let certUrl = req.headers.signaturecertchainurl
        let signature = req.headers.signature

        verifier(certUrl, signature, req.body, function (er) {
          if (er) {
            res.status(400).json({status: 'failure', reason: er})
          } else {
            next()
          }
        })
      }

      // You'll create your note here.
      // let data = await _db.rawSql('SELECT * FROM players')
      console.log('Headers - - - - - ///')
      console.log(req.headers)
      console.log('Body - - - - - ///')
      console.log(req.body)

      const data = await _db.rawSql('SELECT * FROM players')

      console.log(data)

      let craig = `<speak>${data[0].name}. ${data[0].description}</speak>`
      let whipp = `<speak>${data[1].name}. ${data[1].description}</speak>`
      let randomResponseArr = [craig, whipp]
      let randomResponse = Math.floor(Math.random() * randomResponseArr.length)

      console.log(`Request Type: ${req.body.request.type}`)

      switch (req.body.request.type) {
        case 'LaunchRequest':
          res.json({
            'version': '1.0',
            'response': {
              'outputSpeech': {
                'type': 'SSML',
                'ssml': `${randomResponseArr[randomResponse]}`
              },
              'reprompt': {
                'outputSpeech': {
                  'type': 'SSML',
                  'ssml': '<speak>Welcome to the Alexa Skills Kit, you can say hello!</speak>'
                }
              },
              'shouldEndSession': true
            }
          })
          break
        default:
          res.json({
            'version': '1.0',
            'response': {
              'outputSpeech': {
                'type': 'SSML',
                'ssml': `<speak>One of the Built In intents have been chosen.</speak>`
              },
              'reprompt': {
                'outputSpeech': {
                  'type': 'SSML',
                  'ssml': '<speak>One of the Built In intents have been chosen.</speak>'
                }
              },
              'shouldEndSession': true
            }
          })
      }

    } catch (err) {
      console.log(err)
    }
  })
}