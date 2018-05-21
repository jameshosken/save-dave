console.log("Server managed to start. At least.")

//Nasty global variables
var stringToTrack = "#savedave";
var mapSize = 5;
var map;
var player;

var connections = 0;

/////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////

/////////
//SETUP//
/////////

// Require all things socket.io 
io = require('socket.io')({transports: "polling"});

// Stuff to let socketio work on heroku:
// io.configure(function () {  
//   io.set("transports", ["xhr-polling"]); 
//   io.set("polling duration", 10); 
// });

io.attach(process.env.PORT || 3000);

console.log("socket.io requirements loaded successfully")
console.log("io listening on port: " + process.env.PORT)

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
  //console.log("Send New Position");
  socket.emit("newmove", player.GetPlayerPosition());
}

var SendTweet = function(socket, tweet){
  socket.emit('newtweet', { name: tweet.user.name,
                            text: tweet.text
                          });

}

var SendWin = function(socket){
  var names = [];
  player.path.forEach(function(tweet){
    names.push(tweet.user.name);
  })
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

})


// Upon receiving a new tweet, do somthing.
stream.on('tweet', function (tweet) {
  //console.log("NEW TWEET");

  if(connections < 1){  //no one is connected
    return;
  }
  

  var tweetData = tweet.text.toLowerCase();
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
    //console.log("No movement");
    return;
  }

  //console.log("Attempting to move player: " + direction);
  if(player.UpdateLocation(direction)){
    //console.log("Successful move! Sending position to clients");
    SendPosition(io);
    SendTweet(io,tweet);

    
    
    player.path.push({name: tweet.name, text: tweet.text});

    console.log("TWEET: " + tweet.text);
    console.log("BY: " + tweet.user.name);
    console.log("---");

  }
  else{
    //console.log("There's a wall in the way, sorry");
  }
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
  return (tile.x + xoff < 0 || tile.x + xoff > map.length || tile.y + yoff < 0 || tile.y + yoff > map[0].length);
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
  mapSize++;
  SendWin(io);
  StartGame(mapSize);
}

var RefreshExistingClients = function(){
  SendMap(io);
  SendPosition(io);
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
    return {  x:0, 
              y:0}
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
  this.map = map;
  this.location = map.getMapStart();        //{x:val, y:val}
  this.tile = map.map[this.location.x][this.location.y];

  this.path = [];                           //Array of tweets that got us here

  this.directionArray =   [ {x:0,y:1},      //Up
                            {x:1,y:0},      //Right
                            {x:0,y:-1},     //Down
                            {x:-1,y:0}      //Left
                          ]

  this.GetPlayerPosition = function(direction){
    return this.location;
  }

  this.UpdateLocation = function(directionIndex){
    //Checking for walls should also catch out of bounds errors
    //console.log(this.tile.walls);
    try{
      if(!this.tile.walls[directionIndex]){ //If there is no wall in the way
        //figure out which tile to move to:
        

          this.location.x += this.directionArray[directionIndex].x;
          this.location.y += this.directionArray[directionIndex].y;
          if(this.location == this.map.getMapEnd()){
            //WIN! Reset and try again

            OnWinCondition();
            return true;
          }else{
          this.tile = this.map.map[this.location.x][this.location.y];
            return true;
          }
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

  RefreshExistingClients();

}

StartGame(mapSize);


