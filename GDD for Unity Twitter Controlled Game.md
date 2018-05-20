GDD for Unity Twitter Controlled Game

"Help Dave find his way Twitter"! 


# Step 1: Unity game. 
- Character must find way through maze
- control system must be entirely abstracted; i.e. movement must not rely on any in-game controls or data. Receive external command -> move character. 

## Client Game Loop:
 - Game begins. Request map info and player position from server
 - Once position received, move player to received position.
 	- Potential issues: many commands per second. Possible solution: queue commands?
 - Wait until next command.
 - Once command received, execute command.

 End condition:
 - one player sends to server,
 OR
 - Server 



# Server Loop:

- Server constructs map (recursive backtracker)
- Server establishes 'player' object on current tile (initial tile) 
- Server listens for socket connections. When connection made:
	- Send map information to new client
	- Send location information to new client

- Server listens for tweets. When relevant tweet received:
	- IF no current connections:
		- Return. 
	- Filter for content (direction and user)
	- Determine if 'player' object can move in that direction (is direction a valid neighbour)
	- If player can move:
		- Move player object (i.e. update player postition)
		- Broadcast move information
		- Check win condition (is player tile == end tile)

Listeners:
- Client connected
	- Client lost
- Twitter stream listener


- Server should only update movements IF


# Recursive backtracker
- Set up initial cell
- Make initial cell current cell and mark as visited
- While there are unvisited cells:
	- If current cell has unvisited neighbours:
		- Randomly choose an unvisited neighbour
		- Push current cell to the stack
		- Remove wall between current cell and chosen cell (make a connection)
		- Make chosen cell current cell and mark it as visited
	- Else if stack is not empty:
		- Pop a cell from the stack
		- Make it the current cell.


# Twitter activation

#savedave


---
# Extra things to have
- A log of all #savedave tweets
	(add "4) You can see a history of #savedave tweets at generallyplayful.com/savedave" to UI )