// Require NPM packages
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const dotenv = require('dotenv').config()

// Require route files - not needed in Vercel deployment
const userRoutes = require('./api/user_routes.js')
const ablyRoutes = require('./api/ably_routes.js')

// Require middleware
const errorHandler = require('./lib/error_handler')
const requestLogger = require('./lib/request_logger.js')

// Require database config logic
// 'db' is the Mongo URI as a string
const db = require('./config/db.js')

// Require configured passport auth middleware
const auth = require('./lib/auth.js')

// Define server port
const serverDevPort = 4741
const clientDevPort = 3000

// Establish DB connection
mongoose.connect(db, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})

// Instantiate express app object
const app = express()

// Set CORS header on response from this API using 'cors' NPM package
// `CLIENT_ORIGIN` is a .env variable that we'll set on the deployment site
app.use(cors({ origin: ['https://agenciflow-hackathon.vercel.app/', process.env.CLIENT_ORIGIN, `http://localhost:${clientDevPort}`]}))

// Define port for API to run on
const port = process.env.PORT || serverDevPort

// Register passport auth middleware
// This will also handle the serializing and deserializing
app.use(auth)

// Use 'express.json' middleware to parse JSON requests into objects,
app.use(express.json())
// and this parses requests sent by '$.ajax', which uses a different content type
app.use(express.urlencoded({ extended: true }))

// Use the request logger to log each request
app.use(requestLogger)

// Use the routes - Not needed in Vercel deployment
app.use('/api/user_routes', userRoutes)
app.use('/api/ably_routes', ablyRoutes)

// Use the error handling middleware
// This comes after the routes, because it has to be there if one of the routes
// has an error, and calls 'next'
app.use(errorHandler)

// run API on designated port
app.listen(port, () => {
  console.log('API listening on port ' + port)
})

module.exports = app