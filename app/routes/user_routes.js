const express = require('express')
// Used to make routes require authentication
const passport = require('passport')
// Used to hash and unhash password
const bcrypt = require('bcrypt')
// Used to create 16 byte random hex strings
const crypto = require('crypto')

// Determines the 'amount' the password is hashed, kinda
// 10 is recommended
const bcryptSaltRounds = 10

// Grab custom errors
const errors = require('../../lib/custom_errors.js')
const BadParamsError = errors.BadParamsError
const BadCredentialsError = errors.BadCredentialsError

User = require('../models/user.js')

// Passing this as the second argument to a route
// will require a token to hit that route. It will
// also set req.user
const requireToken = passport.authenticate('bearer', { session: false })

// Instantiate a router
const router = express.Router()

// SIGN UP
// POST /sign-up
router.post('/sign-up', (req, res, next) => {
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

router.post('/sign-in', (req, res, next) => {
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

router.delete('/sign-out', requireToken, (req, res, next) => {
  // Set token on user object to null
  req.user.token = null
  // Save that, and respond with a 204
  req.user.save()
  .then(() => res.sendStatus(204))
  .catch(next)
})

module.exports = router