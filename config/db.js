'use strict'

// create a base name for the mongodb
const mongooseBaseName = 'AgenciFlow-Hackathon-API'

const currentDb = process.env.DB_URI || `mongodb:localhost/${mongooseBaseName}`

module.exports = currentDb