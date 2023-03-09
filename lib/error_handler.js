// Error handler middleware that runs anytime one of the route handlers
// calls `next`, which happens when an error is thrown in a promise chain
module.exports = function (err, req, res, next) {
  // Log timestamp
  console.log('\n', new Date().toTimeString() + ':')
  // Log error
  console.error(err)

  // HTTP responses

  // There's `ValidationError`s and `ValidatorError`s, so use a regex to catch both
  if (err.name.match(/Valid/) || err.name === 'MongoError') {
    const message = 'The received params failed a Mongoose validation'
    err = { status: 422, message }
  } else if (err.name === 'DocumentNotFoundError') {
    err.status = 404
  } else if (err.name === 'CastError' || err.name === 'BadParamsError') {
    err.status = 422
  } else if (err.name === 'BadCredentialsError') {
    err.status = 401
  }

  res.status(err.status || 500).json(err)
}