const express = require('express')
// Used to make routes require authentication
const passport = require('passport')
// Used to hash and unhash password
const bcrypt = require('bcrypt')

// Determines the 'amount' the password is hashed, kinda
// 10 is recommended
const bcryptSaltRounds = 10

// Grab custom errors
const errors = require('../../lib/custom_errors.js')
const BadParamsError = errors.BadParamsError

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
    if (!credentials || !credentials.password) {
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