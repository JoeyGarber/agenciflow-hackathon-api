// This route file is not being used
// Deployment to Vercel (essentially) requires
// Routes to live in index.js

const express = require('express')
// Gets server ready to send TokenRequests
// TokenRequests are basically vouchers that the frontend
// can use to get Ably tokens, which it can then use for interactions with Ably
const Ably = require('ably')
const rest = new Ably.Rest({ key: process.env.ABLY_API_KEY })

// Instantiate a router
const router = express.Router()

router.get('/ably-auth', (req, res, next) => {
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

module.exports = router