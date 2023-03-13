// Require NPM packages
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const passport = require('passport')
// Used to hash and unhash password
const bcrypt = require('bcrypt')
// Used to create 16 byte random hex strings
const crypto = require('crypto')
// Used to read .env files
const dotenv = require('dotenv').config()
// Gets server ready to send TokenRequests
// TokenRequests are basically vouchers that the frontend
// can use to get Ably tokens, which it can then use for interactions with Ably
const Ably = require('ably')
const rest = new Ably.Rest({ key: process.env.ABLY_API_KEY })

// Determines the 'amount' the password is hashed, kinda
// 10 is recommended
const bcryptSaltRounds = 10

// Grab custom errors
const errors = require('../lib/custom_errors.js')
const BadParamsError = errors.BadParamsError
const BadCredentialsError = errors.BadCredentialsError

// Grab user
User = require('../app/models/user.js')

// Passing this as the second argument to a route
// will require a token to hit that route. It will
// also set req.user
const requireToken = passport.authenticate('bearer', { session: false })

// Require route files - not needed in Vercel deployment
// const userRoutes = require('./app/routes/user_routes.js')
// const ablyRoutes = require('./app/routes/ably_routes.js')

// Require middleware
const errorHandler = require('../lib/error_handler.js')
const requestLogger = require('../lib/request_logger.js')

// Require database config logic
// 'db' is the Mongo URI as a string
const db = require('../config/db.js')

// Require configured passport auth middleware
const auth = require('../lib/auth.js')

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
// app.use(userRoutes)
// app.use(ablyRoutes)

app.get('/ably-auth', (req, res, next) => {
  const tokenParams = {
    clientId: 'agenciflow-hackathon-client'
  }

  console.log('Sending signed token request:', JSON.stringify(tokenParams))

  rest.auth.createTokenRequest(tokenParams, (error, tokenRequest) => {
    if (error) {
      res.status(500).send(`Error requesting token request: ${JSON.stringify(error)}`)
    } else {
      console.log('Sent Ably TokenRequest')
      res.setHeader("Content-Type", "application/json");
      res.send(JSON.stringify(tokenRequest))
    }
  })
})

// SIGN UP
// POST /sign-up
app.post('/sign-up', (req, res, next) => {
  // Start a promise chain, so errors pass to handler
  Promise.resolve(req.body.credentials)
  // Reject any requests where 'credentials.password' is not present,
  // or where the password is an empty string
  .then((credentials) => {
    if (!credentials || !credentials.password || credentials.password !== credentials.password_confirmation) {
      throw new BadParamsError()
    }
  })
  // Hash password, return promise
  .then(() => bcrypt.hash(req.body.credentials.password, bcryptSaltRounds))
  .then((hash) => {
    // Return necessary params to create user
    return {
      email: req.body.credentials.email,
      hashedPassword: hash
    }
  })
  // Create user with email and hashed password
  .then((userParams) => User.create(userParams))
  // Send back the user object with a status of 201
  // 'hashedPassword' won't get sent back, because of the toObject 
  // defined on the User model
  .then((user) => res.status(201).json({ user: user.toObject() }))
  // Pass any errors to the error handler
  .catch(next)
})

app.post('/sign-in', (req, res, next) => {
  const password = req.body.credentials.password
  let user
  // Look up user in DB by email
  User.findOne({ email: req.body.credentials.email })
  .then((record) => {
    // If we didn't find the user, send a 401
    if (!record) {
      throw new BadCredentialsError()
    }
    // Save the found user outside of the promise chain
    user = record
    // `bcrypt.compare` hashes password, compares it to 
    // already hashed password, and returns true or false
    return bcrypt.compare(password, user.hashedPassword)
  })
  .then((correctPassword) => {
    // If the passwords matched, 
    if (correctPassword) {
      // create a token, which is a 16 byte random hex string,
      const token = crypto.randomBytes(16).toString('hex')
      // add it to the user object,
      user.token = token
      // and save the token to the DB as a property on the user
      return user.save()
    } else {
      // If the passwords didn't match, throw an error about sending in
      // wrong parameters. That will end the promise chain, and
      // send back a 401 and a message about wrong params
      throw new BadCredentialsError()
    }
  })
  .then((user) => {
    res.status(201).json({ user: user.toObject() })
  })
  .catch(next)
})

app.delete('/sign-out', requireToken, (req, res, next) => {
  // Set token on user object to null
  req.user.token = null
  // Save that, and respond with a 204
  req.user.save()
  .then(() => res.sendStatus(204))
  .catch(next)
})

// Use the error handling middleware
// This comes after the routes, because it has to be there if one of the routes
// has an error, and calls 'next'
app.use(errorHandler)

// run API on designated port
app.listen(port, () => {
  console.log('API listening on port ' + port)
})

module.exports = app