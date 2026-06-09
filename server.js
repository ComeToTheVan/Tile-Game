import { createServer } from 'node:http'
import { Server } from 'socket.io'
import express from 'express'
import cors from 'cors'
import gameRoom from './gameManager.js'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "*"
  }
});

let Room = new gameRoom(10, 10, 2)

app.use(cors()); 
app.use(express.json())

app.use('/socket-assets', express.static('node_modules/socket.io/client-dist'))

app.use(express.static(__dirname))

app.get('/', (req, res) => {
    res.sendFile("index.html")
})

app.get('/api/board', (req, res) => {
  console.log("Board request")
  const boardJson = {
    "value": Room.boardValue,
    "owner": Room.boardOwner,
    "xSize": Room.xSize,
    "ySize": Room.ySize
  }
  res.status(200).json(boardJson)
})

app.post('/api/onTileClick', (req, res) => {
  console.log(Room.turn)

  const { id, player } = req.body
  
  console.log("On tile Click POST:", req.body);

  Room.playerClick(id, player)

  io.emit('boardStateUpdate', {
    "turn": Room.turn,
    "value": Room.boardValue,
    "owner": Room.boardOwner,
    "xSize": Room.xSize,
    "ySize": Room.ySize
  })

  res.status(200).send()
})

io.on('connection', (socket) => {
  console.log(`Player connected on socket pipe ID: ${socket.id}`)
  
  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
  });
})

httpServer.listen(3000, '127.0.0.1', () => {
  console.log('Listening on 127.0.0.1:3000')
})import { createServer } from 'node:http';
import { Server } from 'socket.io';
import express from 'express';
import cors from 'cors';
import gameRoom from './gameManager.js'

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "*"
  }
});

let Room = new gameRoom(10, 10, 2)

app.use(cors()); 
app.use(express.json())

app.use('/socket-assets', express.static('node_modules/socket.io/client-dist'))

app.use(express.static('/home/bazzite/MeStuff/htmlllll/yellowGame'))

app.get('/', (req, res) => {
    res.sendFile("index.html")
})

app.get('/api/board', (req, res) => {
  console.log("Board request")
  const boardJson = {
    "value": Room.boardValue,
    "owner": Room.boardOwner,
    "xSize": Room.xSize,
    "ySize": Room.ySize
  }
  res.status(200).json(boardJson)
})

app.post('/api/onTileClick', (req, res) => {
  console.log(Room.turn)

  const { id, player } = req.body
  
  console.log("On tile Click POST:", req.body);

  Room.playerClick(id, player)

  io.emit('boardStateUpdate', {
    "turn": Room.turn,
    "value": Room.boardValue,
    "owner": Room.boardOwner,
    "xSize": Room.xSize,
    "ySize": Room.ySize
  })

  res.status(200).send()
})

io.on('connection', (socket) => {
  console.log(`Player connected on socket pipe ID: ${socket.id}`)
  
  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
  });
})

httpServer.listen(3000, '127.0.0.1', () => {
  console.log('Listening on 127.0.0.1:3000')
})
