
// All things twitter
var keys = require("./keys/keys.js");
var Twit = require('twit')

// Set up new twit object
var T = new Twit({
  consumer_key:         keys.getAPIKey(),
  consumer_secret:      keys.getAPISecret(),
  access_token:         keys.getAccessToken(),
  access_token_secret:  keys.getAccessTokenSecret(),
  timeout_ms:           60*1000,  // optional HTTP request timeout to apply to all requests.
})

// Set up a listener for updates on the twitter stream
var stream = T.stream('statuses/filter', { track: 'goright' })

// Upon receiving a new tweet, do somthing.
stream.on('tweet', function (tweet) {
  console.log("Text: " + tweet.text)
  console.log("By: " + tweet.user.name)
  console.log("--- END ---");
})