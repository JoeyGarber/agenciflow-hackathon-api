// require auth packages
const passport = require('passport')
const bearer = require('passport-http-bearer')

// user model will be used to set req.user
// in authenticated routes
const User = require('../app/models/user.js')

// this strategy will grab a bearer token from the HTTP headers
// then run the callback with the found token as 'token'
const strategy = new bearer.Strategy(
  function (token, done) {
    // Look for a user with a matching token in the DB
    User.findOne({ token: token }, function (err, user) {
      if (err) { return done(err) }
      // If we found the user, pass it to the route
      // If we didn't, 'user' will be null
      return done(null, user, { scopes: 'all' })
    })
  }
)

// serialize and deserialize the user
// This will set 'req.user' in the routes
passport.serializeUser((user, done) => {
  // We want to pass along the full Mongoose object from the strategy callback,
  // so we just pass it right along with no modifications
  done(null, user)
})

passport.deserializeUser((user, done) => {
  done(null, user)
})

// register strategy with passport
passport.use(strategy)

// create a passport middleware based on all the above configurations
module.exports = passport.initialize()