var keys = require("./keys/keys.js");

console.log(keys.getAPIKey())
console.log(keys.getAPISecret())
console.log(keys.getAccessToken())
console.log(keys.getAccessTokenSecret())


var Twit = require('twit')

var T = new Twit({
  consumer_key:         keys.getAPIKey(),
  consumer_secret:      keys.getAPISecret(),
  access_token:         keys.getAccessToken(),
  access_token_secret:  keys.getAccessTokenSecret(),
  timeout_ms:           60*1000,  // optional HTTP request timeout to apply to all requests.
})

var stream = T.stream('statuses/filter', { track: 'elephant' })

stream.on('tweet', function (tweet) {
  console.log("Text: " + tweet.text)
  console.log("By: " + tweet.user.name)
  console.log("--- END ---");
})