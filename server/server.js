console.log("Server managed to start. At least.")

/////////
//SETUP//
/////////

// Require all things socket.io
var app = require('express')();
var http = require('http').Server(app);
//var io = require('socket.io')(http);
var io = require('socket.io')(http, {transports: ['websocket']});
console.log("socket.io requirements loaded successfully")

// Require all things twitter
var keys = require("./keys/keys.js");
var Twit = require('twit')
console.log("twitter requirements loaded successfully")

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
console.log("twitter listener started successfully");

//////////
//ROUTES//
//////////

app.get('/', function(req, res){
  res.send('<h1>Hello world</h1>');
});

/////////////
//LISTENERS//
/////////////

//Listen for new socket connection
io.on('connection', function(socket){
  console.log("New user connected");

	socket.on('requestMap', (data) => {
	  console.log("Sending Map");
	  socket.send('sendMap');
	});
  // socket.on("requestMap", function(){

  // 	// socket.send("sendMap", getGameMap(getGameMap));
  // 	socket.send('sendMap');
  // 	console.log("Map Sent")
  // });

  socket.on('error', function(e){
    console.log('error');
    console.log(e);
  });
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });

});

// Upon receiving a new tweet, do somthing.
stream.on('tweet', function (tweet) {
  console.log("Text: " + tweet.text)
  console.log("By: " + tweet.user.name)
  console.log("--- END ---");
})

http.listen(3000, function(){
  console.log('listening on *:3000');
});


///////////////
//GAME ENGINE//
///////////////

/*
	Game map is an array of arrays. Each inside array is a row.
	To reference 3 down, 2 across, you would call gameMap[2][1];
*/


var gameMap = [	[0,0,0,1,0],
				[1,1,0,0,0],
				[0,0,0,1,1],
				[0,1,0,1,0],
				[0,0,0,0,0]]

var getGameMap = function(){
	return gameMap;
}