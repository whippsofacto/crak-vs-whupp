const express = require('express')
const bodyParser = require('body-parser')
const app = express()
require('dotenv').config({path: `${__dirname}/.env`})
require('dotenv-safe').config({example: `${__dirname}/.env.example`})
const port = 8000

global._db = require('./libs/db')
global.auth = require('./libs/authentication')
global.env = process.env.ENVIRONMENT
global.authProtocol = process.env.AUTH_PROTOCOL
global.authHostname = process.env.AUTH_HOSTNAME
global.authPort = process.env.AUTH_PORT
global.authPath = process.env.AUTH_PATH

app.use(bodyParser.urlencoded({extended: true, limit: '50mb'}))
app.use(bodyParser.json({limit: '50mb'}))

// require('./api/v1/skill')(app, {})
app.use('/api', require('./api/v1/router'))
app.use('/', express.static('./site/public'))

app.use((req, res, next) => {
  console.log(`UNKNOWN ROUTE: ${req.url}`)
  res.status(404)
  res.send('This page does not exist')
})

app.listen(port, () => {
  console.log('We are live on ' + port)
})