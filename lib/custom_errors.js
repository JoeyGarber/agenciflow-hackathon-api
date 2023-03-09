// These are custom errors, which extend Error.prototype
// The easiest way to do this is with ES6 class syntax
// We set this.name and this.message in the constructor of each custom error
// to match the pattern that Express and Mongoose use for custom errors

class BadParamsError extends Error {
  constructor () {
    super()
    this.name = 'BadParamsError'
    this.message = 'A required parameter was omitted or invalid'
  }
}

class BadCredentialsError extends Error {
  constructor () {
    super()
    this.name = 'BadParamsError'
    this.message = 'The provided username or password is incorrect'
  }
}

module.exports = {
  BadParamsError,
  BadCredentialsError
}