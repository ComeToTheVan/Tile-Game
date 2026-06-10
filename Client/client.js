import { io } from "socket.io-client";

export class clientGame {
  constructor(player, players) {
    this.player = 0
    this.players = players
    this.roomId = "h"

    this.socket = io()  

    this.socket.on('boardStateUpdate', (boardState) => {
      this.updateBoard(boardState)
    })
  }
  
  async onTileClick(id) {
    const clickData = {
      "id": id,
      "player": this.player,
      "roomId": this.roomId
    }
    console.log(clickData)
    await fetch("/api/onTileClick", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(clickData)
    })
  }

  updateBoard(boardState) {
    console.log(boardState.owner)
    console.log(boardState.value)

    for (let i = 0; i < boardState.xSize; i++) {
      for (let j = 0; j < boardState.ySize; j++) {
        let id = i + ',' + j

        if (boardState.owner[i][j] == '0') {
          document.getElementById(id).style.backgroundColor = "red"
        } else if (boardState.owner[i][j] == '1') {
          document.getElementById(id).style.backgroundColor = "blue"
        } else if (boardState.owner[i][j] == '2') {
          document.getElementById(id).style.backgroundColor = "yellow"
        } else if (boardState.owner[i][j] == '3') {
          document.getElementById(id).style.backgroundColor = "green"
        } else {
          document.getElementById(id).style.backgroundColor = ""
        }

        if (boardState.value[i][j] == '1') {
          document.getElementById(id+"img").src = "images/one.png"
          document.getElementById(id+"img").alt = "1"
        } else if (boardState.value[i][j] == '2') {
          document.getElementById(id+"img").src = "images/two.png"
          document.getElementById(id+"img").alt = "2"
        } else if (boardState.value[i][j] == '3') {
          document.getElementById(id+"img").src = "images/three.png"
          document.getElementById(id+"img").alt = "3"
        } else if (boardState.value[i][j] >= '4') {
          document.getElementById(id+"img").src = "images/four.png"
          document.getElementById(id+"img").alt = "4"
        } else {
          document.getElementById(id+"img").src = "images/blank.png"
          document.getElementById(id+"img").alt = "0"
        }
      }
    }   
  }

  async Start() {
    const roomId = {
      "roomId": this.roomId
    }

    const boardRequestRespone = await fetch("/api/board", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(roomId)
    })
    
    const boardState = await boardRequestRespone.json()

    let xSize = boardState.xSize
    let ySize = boardState.ySize
    this.players = document.getElementById("pAmount").value - 1

    if (this.players == -1 || xSize <= 0 || ySize <= 0) {
      return
    }

    document.getElementById("begining").style.visibility = "hidden"
    document.getElementById("tiles").style.width = xSize * 75
    document.getElementById("tiles").style.height = ySize * 75
        
    if (xSize < 0) {
      xSize = 10
    }
    if (ySize < 0) {
      ySize = 10
    }

    //make tiles
    for (let i = 0; i < xSize; i++) {
      for (let j = 0; j < ySize; j++) {
        let newTile = document.createElement("div")
        newTile.className = "cell";
        newTile.id = i + ',' + j
        newTile.addEventListener("click", () => { this.onTileClick(newTile.id) })
        newTile.dataset.owner = boardState.owner[i][j]
        newTile.dataset.value = boardState.value[i][j]

        newTile.style.left = (75 * i) + "px"
        newTile.style.top = (75 * j) + "px"
          
        await document.getElementById("tiles").appendChild(newTile)

        let img = document.createElement("img")
        img.src = ""
        img.className = "tileImage"
        img.id = newTile.id + "img"
        document.getElementById(newTile.id).appendChild(img)
      }
    }
    document.getElementById("roomIdDisplay").style.top = (ySize * 75) + "px"
    document.getElementById("roomIdDisplay").style.visibility = "visible"

    this.updateBoard(boardState)
  }

  //create room
  async createRoom() {
    const config = {
      "xSize": document.getElementById("xAmount").value,
      "ySize": document.getElementById("yAmount").value,
      "players": document.getElementById("pAmount").value
    }

    const createRoomResponce = await fetch("/api/createRoom", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(config)
    })

    const roomId = await createRoomResponce.json()
    this.player = 0
    console.log("Made room:", roomId.roomId)

    this.joinRoom(roomId.roomId)
  }

  //join room
  async joinRoom(roomId) {
    roomId = roomId.toUpperCase()
    const Ids = {
      "playerId": document.cookie,
      "roomId": roomId
    }

    console.log(Ids["roomId"])

    const createRoomResponce = await fetch("/api/joinRoom", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(Ids)
    })

    const playerNum = await createRoomResponce.json()

    if (playerNum.playerNum == -1) {
      console.log("no join")
      return
    }

    this.player = playerNum.playerNum
    this.roomId = roomId
    
    document.getElementById("roomIdDisplay").textContent = "Room Id: " + roomId

    console.log("Joined room:", this.roomId, " as player:", playerNum.playerNum)
    this.Start()
  }
}