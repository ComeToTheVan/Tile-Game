import { join } from "node:path"

//Sleep
const SLEEP = (ms) => new Promise(resolve => setTimeout(resolve, ms))

export default class gameRoom {
    constructor(xSize, ySize, players, roomId, sendBoardCallback) {
        this.xSize = xSize
        this.ySize = ySize
        this.players = new Array(players)
        this.totalSize = players
        this.joinedPlayers = 0
        this.turn = 0
        this.firstTurns = true
        this.playerTiles = []
        this.started = false
        this.roomId = roomId
        this.busy = false

        this.totalLoop = 0
        this.loop = 0

        this.sendBoardCallback = sendBoardCallback;

        this.boardOwner = new Array(this.xSize)
        for (let i = 0; i < this.xSize; i++) {
            this.boardOwner[i] = new Array(this.ySize)
            for (let j = 0; j < this.ySize; j++) {
                this.boardOwner[i][j] = -1
            }    
        }
        this.boardValue = new Array(this.xSize) //value of tiles
        for (let i = 0; i < this.xSize; i++) {
            this.boardValue[i] = new Array(this.ySize)
            for (let j = 0; j < this.ySize; j++) {
                this.boardValue[i][j] = 0
            }    
        }
    }

    async playerClick(tileId, player) {
        console.log(this.busy)
        if (this.turn == player && !this.busy) {
            this.busy = true
            const coords = tileId.split(',')
            if (this.boardOwner[coords[0]][coords[1]] == -1 && this.firstTurns) {
                this.boardOwner[coords[0]][coords[1]] = this.turn
                this.playerTiles[this.turn]++
                this.boardValue[coords[0]][coords[1]] = 3

                this.busy = false
            } else if (this.boardOwner[coords[0]][coords[1]] == this.turn) {
                this.boardValue[coords[0]][coords[1]]++

                await this.checkAndExpand(tileId)
            } else {
                this.busy = false
                return
            }

            if (this.turn == this.totalSize - 1) {
                this.turn = 0
                this.firstTurns = false
            } else {
                this.turn++
            }
        }
    }

    async checkAndExpand(id) {
        const coords = id.split(',')
        if (this.boardValue[coords[0]][coords[1]] >= 4) {
            if (this.totalLoop == 0) {
                await SLEEP(600)
            } else {
                await SLEEP(600 / this.totalLoop)
            }
    
            let expaned = false
            let foundIds = new Array

            this.boardValue[coords[0]][coords[1]] = 0
            this.boardOwner[coords[0]][coords[1]] = -1
            this.playerTiles[this.turn]--
            for (let i = 0; i < 4; i++) {
                let newCoord = []

                switch (i) {
                    case 0:
                        newCoord[0] = parseInt(coords[0])
                        newCoord[1] = parseInt(coords[1]) + 1
                        break
                    case 1:
                        newCoord[0] = parseInt(coords[0]) + 1
                        newCoord[1] = parseInt(coords[1]) 
                        break
                    case 2:
                        newCoord[0] = parseInt(coords[0])
                        newCoord[1] = parseInt(coords[1]) - 1
                        break
                    case 3:
                        newCoord[0] = parseInt(coords[0]) - 1
                        newCoord[1] = parseInt(coords[1]) 
                        break
                }
                if (newCoord[0] == -1 || newCoord[1] == -1 || newCoord[0] == this.xSize || newCoord[1] == this.ySize) {
                    continue
                }
                
                this.boardValue[newCoord[0]][newCoord[1]]++ 
                this.boardOwner[newCoord[0]][newCoord[1]] = this.turn

                this.playerTiles[this.turn]++

                let foundId = newCoord.join()
                foundIds[foundIds.length] = foundId
            }
            this.loop++
            this.totalLoop++
            if (foundIds.length > 0) {             
                for (let i = 0; i < foundIds.length; i++) {
                    this.checkAndExpand(foundIds[i])
                }
                if (typeof this.sendBoardCallback === 'function') {
                    this.sendBoardCallback(this.roomId);
                }
            }
            this.loop--
        }
        if (this.loop == 0){
            this.totalLoop = 0
            this.busy = false
        }
    }

    playerJoin(playerId) {
        for (let i = 0; i < this.totalSize; i++) {
            if (this.players[i] == playerId) {
                console.log(playerId, "Joined because they are already in room", this.roomId)
                return i
            }
        }
        if (this.totalSize > this.joinedPlayers) {
            this.players[this.joinedPlayers] = playerId
            this.joinedPlayers++

            console.log(playerId, "Joined because there is space")
            return this.joinedPlayers - 1 //return the index value
        } else {
            console.log(playerId, "Failed to join", this.roomId)
            return -1 //if declined
        }
    }
}import { createServer } from 'node:http'
import { Server } from 'socket.io'
import express from 'express'
import cors from 'cors'
import gameRoom from './Server/gameManager.js'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express();
const httpServer = createServer(app);

const Rooms = {}

const io = new Server(httpServer, {
  cors: {
    origin: "*"
  }
});

app.use(cors()); 
app.use(express.json())

function sendBoard(roomId) {
  io.emit('boardStateUpdate', {
    "turn": Rooms[roomId].turn,
    "value": Rooms[roomId].boardValue,
    "owner": Rooms[roomId].boardOwner,
    "xSize": Rooms[roomId].xSize,
    "ySize": Rooms[roomId].ySize
  })
}

//create room
app.post('/api/createRoom', (req, res) => {
  const { xSize, ySize, players } = req.body

  const newRoomId = Math.random().toString(36).substring(2, 6).toUpperCase()
  Rooms[newRoomId] = new gameRoom(xSize, ySize, players, newRoomId, sendBoard)
  console.log(`Dynamic Room [${newRoomId}] created safely.`)

  const roomId = {
    roomId: newRoomId
  }

  res.status(200).json(roomId)
})

//join room
app.post('/api/joinRoom', (req, res) => {
  const { playerId, roomId } = req.body

  const playerNum = {
    playerNum: Rooms[roomId].playerJoin(playerId)
  }
  res.status(200).json(playerNum)
})

app.use('/socket-assets', express.static(join(__dirname, 'node_modules', 'socket.io', 'client-dist')))

app.use(express.static(join(__dirname, 'Client')))

//send html on connect
app.get('/', (req, res) => {
  res.sendFile(join("index.html"))
})

//board request
app.post('/api/board', (req, res) => {
  const { roomId } = req.body
  console.log("Board request for room:", roomId)

  const boardJson = {
    "value": Rooms[roomId].boardValue,
    "owner": Rooms[roomId].boardOwner,
    "xSize": Rooms[roomId].xSize,
    "ySize": Rooms[roomId].ySize
  }
  res.status(200).json(boardJson)
})

//tile click
app.post('/api/onTileClick', (req, res) => {
  const { id, player, roomId } = req.body
  
  console.log("On tile Click POST:", req.body);

  Rooms[roomId].playerClick(id, player)

  sendBoard(roomId)

  res.status(200).send()
})

//socket
io.on('connection', (socket) => {
  console.log(`Player connected on socket pipe ID: ${socket.id}`)
  
  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
  });
})

httpServer.listen(3000, '127.0.0.1', () => {
  console.log('Listening on 127.0.0.1:3000')
})
