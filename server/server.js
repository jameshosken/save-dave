console.log("Server managed to start. At least.")

var stringToTrack = "right";


/////////
//SETUP//
/////////

// Require all things socket.io
var io = require('socket.io')({transports: ['websocket'],});
io.attach(3000);
console.log("Listening on port 4567");

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
var stream = T.stream('statuses/filter', { track: stringToTrack })
console.log("twitter listener started successfully");

/////////////
//LISTENERS//
/////////////

//Listen for new socket connection
io.on('connection', function(socket){

  //console.log("New user connected");
  socket.on('mapreq', function(){
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
  });

  socket.on('posreq', function(){
    console.log("New position request");
    io.emit("newmove", player.GetPlayerPosition());
  })

  socket.on('error', function(e){
    console.log('error');
    console.log(e);
  });

  socket.on('disconnect', function(){
    console.log('user disconnected');
  });

})


// Upon receiving a new tweet, do somthing.
stream.on('tweet', function (tweet) {
  console.log("NEW TWEET");
  console.log("Text: " + tweet.text);
  console.log("By: " + tweet.user.name);

  //Directions: 0 == UP, 1 == RIGHT, 2 == DOWN, 3 == LEFT

  var direction = Math.floor(Math.random() * 4);

  console.log("Attempting to move player: " + direction);
  if(player.UpdateLocation(direction)){
    console.log("Successful move! Sending to clients");
    io.emit("newmove", player.GetPlayerPosition());
  }
  else{
    console.log("Oops, something went wrong")
  }

  console.log("--- END ---\n\n");
})



///////////////
//GAME ENGINE//
///////////////

/*
	Game map is an array of arrays. Each inside array is a row.
	To reference 3 down, 2 across, you would call gameMap[2][1];
*/


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
  console.log(map);
  this.map = map;
  this.location = map.getMapStart();        //{x:val, y:val}
  this.tile = map.map[this.location.x][this.location.y];

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
    console.log(this.tile.walls);
    try{
      if(!this.tile.walls[directionIndex]){ //If there is no wall in the way
        //figure out which tile to move to:
        
          this.location.x += this.directionArray[directionIndex].x;
          this.location.y += this.directionArray[directionIndex].y;
          this.tile = this.map.map[this.location.x][this.location.y];
          return true;
        }
    }catch(err){
      console.log("Problem updating location:");
      console.log(err);
    }
    return false;
  }
}



var map = new Map();
map.CreateMap(10);
map.PopulateMap();
var player = new Player(map);

var counter = 0;

