
console.log("Server managed to start. At least.")

//Nasty global variables
var stringToTrack = "#savedave";
var mapSize = 3;
var map;
var player;

var connections = 0;

var tweetDataQueue = [];

var win = false;

var tweetLock = false;

/////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////

/////////
//SETUP//
/////////

const express = require('express');
const socketIO = require('socket.io');
const path = require('path');

const PORT = process.env.PORT || 3000;
const INDEX = path.join(__dirname, 'public/index.html');

const server = express()
  .use(express.static('public'))
  .listen(PORT, () => console.log(`Listening on ${ PORT }`));

console.log("IP: " + process.env.IP)

const io = socketIO(server);

// Require all things twitter

var Twit = require('twit')
console.log("twitter requirements loaded successfully")

// Set up new twit object
// LOCAL
// var keys = require("./keys/keys.js");
// var T = new Twit({
//   consumer_key:         keys.getAPIKey(),
//   consumer_secret:      keys.getAPISecret(),
//   access_token:         keys.getAccessToken(),
//   access_token_secret:  keys.getAccessTokenSecret(),
//   timeout_ms:           60*1000,  // optional HTTP request timeout to apply to all requests.
// })

//SERVER
var T = new Twit({
  consumer_key:         process.env.MY_API_KEY,
  consumer_secret:      process.env.MY_API_SECRET,
  access_token:         process.env.ACCESS_TOKEN,
  access_token_secret:  process.env.ACCESS_SECRET,
  timeout_ms:           60*1000,  // optional HTTP request timeout to apply to all requests.
})

// Set up a listener for updates on the twitter stream
var stream = T.stream('statuses/filter', { track: stringToTrack })
console.log("twitter listener started successfully");

/////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////

///////////////////////
// NETWORK FUNCTIONS //
///////////////////////

var SendMap = function(socket){
  try{
      socket.emit('mapres', { mapData:  map.getMapToSend(), 
                              mapSize:  map.getMapSize(), 
                              mapStart: map.getMapStart(),
                              mapEnd:   map.getMapEnd() });
    }
    catch(err){
      console.log(err);
      console.log("Likely no map yet");
    }
}

var SendPosition = function(socket){
	//console.log("SENDING POSITION INFORMATION")
  socket.emit("newmove", player.GetPlayerPosition());
}

var SendTweet = function(socket, tweet){

	var dataToSend = []

	var tweets = tweetDataQueue.forEach(function(tweet){
		dataToSend.push({	name: tweet.user.name,
							text: tweet.text})
	});
	
  	socket.emit('tweets', { data: dataToSend
                          });

}

var SendWin = function(socket){
  console.log("SENDING WIN");
  var names = [];

  if(player.path.length < 1){
  	console.log("No names on record :(");
  	socket.emit('win', {names: ["No names on record :("]})
  	return;
  }

  player.path.forEach(function(data){
    names.push(data.name);
  })

  console.log(names);
  socket.emit('win', {names: names})
}

/////////////
//LISTENERS//
/////////////

//Listen for new socket connection
io.on('connection', function(socket){
  console.log("A new user has connected");
  connections++;

  var pinger = setInterval(function(){ 
  	
    socket.emit('ping', {users: connections});
    SendPosition(socket);
    SendTweet(socket);
    SendMap(socket);
    if(win){
    	win = false;
    	SendWin(io);
    }

  }, 1000);

  //console.log("New user connected");
  socket.on('mapreq', function(){
    SendMap(socket);
  });

  socket.on('posreq', function(){
    SendPosition(socket);
  })

  socket.on('error', function(e){
    console.log('Socketio error');
    console.log(e);
  });

  socket.on('disconnect', function(){
    connections--;
    clearInterval(pinger);              //Otherwise we'll have hundreds of pingers after a while
    console.log('user disconnected');
  });

  socket.on('cheatcode', function(){
  	console.log("CHEAT CODE DETECTED")
  	player.SetPlayerPosition({x:0, y:0});
  })

})


// Upon receiving a new tweet, do somthing.
stream.on('tweet', function (tweet) {
  
  while(tweetLock){
  	//wait
  }

  tweetLock = true;

  console.log("NEW TWEET");

  var tweetData = tweet.text.toLowerCase();
  if(tweetDataQueue.length > 5){
  	var first = tweetDataQueue.shift();
  }
  tweetDataQueue.push(tweet)

  var direction;
  if(tweetData.includes("up")){
    direction = 0;
  }else if(tweetData.includes("right")){
    direction = 1;
  }else if(tweetData.includes("down")){
    direction = 2;
  }else if(tweetData.includes("left")){
    direction = 3;
  }else{
    console.log("No movement");
 	tweetLock = false;
    return;
  }
  console.log("Attempting to move player: " + direction);
  if(player.UpdateLocation(direction)){
  	console.log("Adding to path")
  	console.log({name: tweet.user.name, text: tweet.text})

    player.path.push({name: tweet.user.name, text: tweet.text});
    console.log("TWEET: " + tweet.text);
    console.log("BY: " + tweet.user.name);
    console.log("---");

    console.log("PATH")
    console.log(player.path);

  }
  else{
    console.log("Unable to move, sorry");
  }
  tweetLock = false;

})

/////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////


///////////////////////////
//////////// GAME ENGINE //
///////////////////////////


///////////////
// FUNCTIONS //
///////////////

var createEmptyMap = function(size){
  var map = [];
  for (var x = 0; x < size; x++) {
    map.push([]);
    for (var y = 0; y < size; y++) {
      map[x].push( new Tile(x,y) );
    }
  }
  return map;
}

var countUnvisitedCells = function(map){
  var count = 0;

  for (var x = 0; x < map.length; x++) {
    for (var y = 0; y < map[x].length; y++) {
      //If cell is unvisited
      if(!map[x][y].getVisited()){
        count++;
      }
    }
  }
  return count;
}

var IsOutOfBounds = function(tile, map, xoff, yoff){
  return ((tile.x + xoff) < 0 || (tile.x + xoff) >= map.length || (tile.y + yoff) < 0 || (tile.y + yoff) >= map[0].length);
}

var getUnvisitedNeighbours = function(tile, map){
  var neighbours = [];

  for (var xoff = -1; xoff <=1; xoff++){
    for(var yoff = -1; yoff <= 1; yoff++){
      
        if(xoff == 0 && yoff == 0){continue;} //Do not check self
        if(xoff==0 || yoff == 0) //Only check non-diagonal neighbours
        {
          try{  //Neighbour may or may not exist
            //CheckBounds
            if(IsOutOfBounds(tile, map, xoff,yoff)){
            	//console.log("OUT OF BOUNDS")
              continue;
            }else{
              var neighbourTile = map[tile.x + xoff][tile.y + yoff];

              if(neighbourTile.getVisited() == false){
                //Unvisited neighbour! Add to list
                neighbours.push(neighbourTile);
                
              }
            }
          }
          catch(err){
            //console.log(err);
          }
      }
      
    }
  }
  //console.log("Unvisited Neighbours: " + neighbours);
  return neighbours;
}

var chooseFromArray = function(arr){
  return arr[Math.floor(Math.random() * arr.length)];
}

var establishConnection = function(tile, nextTile){
  // Determine direction of connection
  direction = { x: nextTile.x - tile.x,
                y: nextTile.y - tile.y};

  
  //Given that tile.walls is arranged [up, right, down, left], from direction we can determine which wall to change:
  // Be sure to change the reverse tile on nextTile


  if(direction.x == 1){           //RIGHT
      tile.removeWall(1);
      nextTile.removeWall(3);
  }else if(direction.x == -1){    //LEFT
      tile.removeWall(3);
      nextTile.removeWall(1);
  }

  if(direction.y == 1){           //UP
      tile.removeWall(0);
      nextTile.removeWall(2);
  }else if(direction.y == -1){    //DOWN
      tile.removeWall(2);
      nextTile.removeWall(0);
  }

}

var findPath = function(tile, map, searchStack){

  //Mark current cell as visited
  tile.setVisited(true);

  while(countUnvisitedCells(map) > 0){
    var neighbours = getUnvisitedNeighbours(tile, map)
    if(neighbours.length > 0)
    {
      var nextTile = chooseFromArray(neighbours);
      searchStack.push(tile);
      establishConnection(tile, nextTile);
      findPath(nextTile, map, searchStack);
    }
    else
    {
      prevTile = searchStack.pop();
      findPath(prevTile, map, searchStack);
    }

  }
}


var OnWinCondition = function(){
  console.log("GAME WON! WOO")
  
  win = true;
  mapSize++;
  StartGame(mapSize);
}


/////////////
// CLASSES //
/////////////


function Tile(x, y) {
  //console.log("NEW TILE: " + x + ", " + y )
  this.x = x;
  this.y = y;
  this.visited = false;
  this.walls=[true,true,true,true]; //up,right,down,left

  this.setVisited = function(status){
    this.visited = status;
  }

  this.getVisited = function(){
    return this.visited;
  }

  this.removeWall = function(index){
    this.walls[index] = false;
  }
}

var Map = function(){
  this.map;
  this.searchStack = [];
  
  this.CreateMap = function(size){
    this.map = createEmptyMap(size)
  }
  this.PopulateMap = function(){
    startTile = this.map[0][0];
    findPath(startTile, this.map, this.searchStack);

  }
  this.getMapToSend = function(){
    mapData = []

    for(var i = 0; i < this.map.length; i++){
      for (var j = 0; j < this.map[i].length; j++) {
        var tile = this.map[i][j];
        var usefulData = {  x: tile.x,
                            y: tile.y,
                            walls: tile.walls};
        mapData.push(usefulData)
      }
    }
    return mapData;
  }

  this.getMapSize = function(){
    return {x: this.map.length, y:this.map[0].length};
  }

  this.getMapStart = function(){
    var safeRadius = 10;  //todo randomly generate start point
    return {  x: Math.floor(this.map.length/2) ,
              y: Math.floor(this.map[0].length/2)}
  }

  this.getMapEnd = function(){
    return {x:0,y:0}
  }


  this.printMap = function(){
    console.log("Printing Map:");
    for(var i = 0; i < this.map.length; i++){
      console.log(this.map[i]);
    }
  }
}


var Player = function(map){
  //console.log(map);
  myPlayer = this;
  myPlayer.location = map.getMapStart();        //{x:val, y:val}
  myPlayer.tile = map.map[myPlayer.location.x][myPlayer.location.y];

  myPlayer.path = [];                           //Array of tweets that got us here

  myPlayer.directionArray =   [ {x:0,y:1},      //Up
                            {x:1,y:0},      //Right
                            {x:0,y:-1},     //Down
                            {x:-1,y:0}      //Left
                          ]

  myPlayer.GetPlayerPosition = function(direction){
    return this.location;
  }

  myPlayer.SetPlayerPosition = function(pos){
    myPlayer.location = pos;
    myPlayer.CheckWin();
  }

  myPlayer.CheckWin = function(){
  	console.log("WIN CONDITIONS CHECKING")
  	console.log(myPlayer.location.x)
  	console.log(map.getMapEnd().x)
  	console.log(myPlayer.location.y)
  	console.log(map.getMapEnd().y)


  	if(myPlayer.location.x == map.getMapEnd().x && myPlayer.location.y == map.getMapEnd().y){
        //WIN! Reset and try again
        console.log("Checkwin == true")
        OnWinCondition();
        return true;
    }else{
    	return false;
    }
  }

  myPlayer.UpdateLocation = function(directionIndex){
    //Checking for walls should also catch out of bounds errors
    //console.log(this.tile.walls);
			console.log("MOVING");
			//console.log(directionIndex);
          	console.log(myPlayer.directionArray[directionIndex].x + ", " + myPlayer.directionArray[directionIndex].y)

    		console.log("Walls:");
    		console.log(myPlayer.tile.walls);

    try{
      if(!myPlayer.tile.walls[directionIndex]){ //If there is no wall in the way
        //figure out which tile to move to:
        console.log("Valid Move")

          myPlayer.location.x += myPlayer.directionArray[directionIndex].x;
          myPlayer.location.y += myPlayer.directionArray[directionIndex].y;
          
    	  //console.log(this.map.map[this.location.x][this.location.y]);
          myPlayer.tile = map.map[myPlayer.location.x][myPlayer.location.y];

          //console.log("Tile:");
    	  //console.log(this.tile);

          if(myPlayer.CheckWin()){
          	return true;
          }
          else
          {	
            return true;
          }
        }else{
        	console.log("Invalid Move")

        }
    }catch(err){
      console.log("Problem updating location:");
      console.log(err);
    }
    return false;
  }
}


/////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////

///////////////
// MAIN LOOP //
///////////////

var StartGame = function(size){
  console.log("Starting New Game. Map Size: " + mapSize);
  map = new Map();
  map.CreateMap(size);
  map.PopulateMap();

  player = new Player(map);
}

StartGame(mapSize);

// Dead functions

// var RefreshExistingClients = function(){
//   SendMap(io);
//   SendPosition(io);
// }
