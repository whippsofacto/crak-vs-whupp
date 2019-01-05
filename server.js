const express = require('express')
const bodyParser = require('body-parser')
const app = express()
require('dotenv').config({path: `${__dirname}/.env`})
require('dotenv-safe').config({example: `${__dirname}/.env.example`})
const port = 8000

global._db = require('./libs/db')
global.auth = require('./libs/authentication')
global.env = process.env.ENVIRONMENT

app.use(bodyParser.urlencoded({extended: true, limit: '50mb'}))
app.use(bodyParser.json({limit: '50mb'}))

require('./api/v1/skill')(app, {})

app.listen(port, () => {
  console.log('We are live on ' + port)
})