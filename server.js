import { createServer } from 'node:http'
import { Server } from 'socket.io'
import express from 'express'
import cors from 'cors'
import gameRoom from './Server/gameManager.js'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { setTimeout } from 'node:timers/promises';
import { TIMEOUT } from 'node:dns'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const httpServer = createServer(app)

const Rooms = {}

const io = new Server(httpServer, {
  cors: {
    origin: "*"
  }
})

app.use(cors())
app.use(express.json())

function sendBoard(roomId, turn = -1) {
  if (Rooms[roomId] != null) {
    io.emit('boardStateUpdate', {
      "turn": turn,
      "value": Rooms[roomId].boardValue,
      "owner": Rooms[roomId].boardOwner,
      "xSize": Rooms[roomId].xSize,
      "ySize": Rooms[roomId].ySize,
      "audio": Rooms[roomId].audio,
      "roomId": roomId
    })
    Rooms[roomId].audio = ""
  }
}

//end/destroy room 
async function endRoom(roomId, winner) {
  console.log("Going to delete", roomId, "in 10 seconds")
  
  await sendBoard(roomId)
  await setTimeout(5000)
  io.emit('endGame', {
    "roomId": roomId,
    "winner": winner
  })
  await setTimeout(5000)

  delete Rooms[roomId]

  console.log("room", roomId, "has been deleted")
}

//create room
app.post('/api/createRoom', (req, res) => {
  const { xSize, ySize, players } = req.body

  const functions = [
    sendBoard,
    endRoom
  ]
  
  const newRoomId = Math.random().toString(36).substring(2, 6).toUpperCase()
  Rooms[newRoomId] = new gameRoom(xSize, ySize, players, newRoomId, functions)
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

  try {
    const boardJson = {
      "turn": Rooms[roomId].turn,
      "value": Rooms[roomId].boardValue,
      "owner": Rooms[roomId].boardOwner,
      "xSize": Rooms[roomId].xSize,
      "ySize": Rooms[roomId].ySize,
      "audio": Rooms[roomId].audio
    }
    Rooms[roomId].audio = ""

    res.status(200).json(boardJson)
  } catch {
    res.status(200).json({"turn": -1})
  }
})

//tile click
app.post('/api/onTileClick', (req, res) => {
  const { id, player, roomId } = req.body

  try {
    Rooms[roomId].playerClick(id, player)
  } catch {
    return
  }
  
  sendBoard(roomId)

  res.status(200).send()
})

//socket
io.on('connection', (socket) => {
  console.log(`Player connected on socket pipe ID: ${socket.id}`)
  
  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`)
  })
})

httpServer.listen(3000, '127.0.0.1', () => {
  console.log('Listening on 127.0.0.1:3000')
})