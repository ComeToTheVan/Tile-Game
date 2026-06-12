import { io } from "socket.io-client"

const SLEEP = (ms) => new Promise(resolve => setTimeout(resolve, ms))

export class clientGame {
  constructor(player, players) {
    this.player = 0
    this.players = players
    this.roomId = "none"

    this.audio = []

    this.socket = io()  

    this.socket.on('boardStateUpdate', (boardState) => {
      if (boardState.roomId == this.roomId) {
        this.updateBoard(boardState)
      }
    })
    
    this.socket.on('endGame', (endInfo) => {
      if (endInfo.roomId == this.roomId) {
        this.roomId = "none"
        this.endGame(endInfo)
      }
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

  async updateBoard(boardState) {
    console.log(boardState.owner)
    console.log(boardState.value)
    console.log(boardState.audio)
    
    if (boardState.audio != "") {
      let audio = document.createElement("audio")
      let source = document.createElement("source")
      source.src = "sound/" + boardState.audio + ".mp3"
      source.type = "audio/mpeg"

      audio.appendChild(source)
      document.body.appendChild(audio)
      await audio.play()

      audio.addEventListener('ended', () => {
        audio.remove()
      })
    }
    
    if (boardState.turn == 0) {
      document.getElementById("turnDisplay").textContent = "Turn: Red"
    } else if (boardState.turn == 1) {
      document.getElementById("turnDisplay").textContent = "Turn: Blue"
    } else if (boardState.turn == 2) {
      document.getElementById("turnDisplay").textContent = "Turn: Yellow"
    } else if (boardState.turn == 3) {
      document.getElementById("turnDisplay").textContent = "Turn: Green"
    } else if (boardState.turn == 4) {
      document.getElementById("turnDisplay").textContent = "Turn: Purple"
    } else if (boardState.turn == 5) {
      document.getElementById("turnDisplay").textContent = "Turn: Orange"
    } else if (boardState.turn == 6) {
      document.getElementById("turnDisplay").textContent = "Turn: Pink"
    } else{
      document.getElementById("turnDisplay").textContent = "Turn: " + (boardState.turn + 1)
    }

    for (let i = 0; i < boardState.xSize; i++) {
      for (let j = 0; j < boardState.ySize; j++) {
        let id = i + ',' + j

        if (boardState.owner[i][j] == '0') {
          document.getElementById(id).style.backgroundColor = "red"
        } else if (boardState.owner[i][j] == 1) {
          document.getElementById(id).style.backgroundColor = "blue"
        } else if (boardState.owner[i][j] == 2) {
          document.getElementById(id).style.backgroundColor = "yellow"
        } else if (boardState.owner[i][j] == 3) {
          document.getElementById(id).style.backgroundColor = "green"
        } else if (boardState.owner[i][j] == 4) {
          document.getElementById(id).style.backgroundColor = "purple"
        } else if (boardState.owner[i][j] == 5) {
          document.getElementById(id).style.backgroundColor = "orange"
        } else if (boardState.owner[i][j] == 6) {
          document.getElementById(id).style.backgroundColor = "pink"
        } else if (boardState.owner[i][j] >= 7) {
          let r = boardState.owner[i][j] * 189
          while (r > 255) { r -= 255 }
          let b = boardState.owner[i][j] * 47
          while (b > 255) { b -= 255 }
          let g = boardState.owner[i][j] * 241
          while (g > 255) { g -= 255 }
          document.getElementById(id).style.backgroundColor = "rgb("+r+","+b+","+g+")"
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

  //create room
  async createRoom() {
    try {
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
    } catch { return }
  }

  //join room
  async joinRoom(roomId) {
    let pList = []
    pList[0] = document.createElement("p")
    pList[0].className = "roomText"
    pList[0].id = "roomIdDisplay"
    pList[1] = document.createElement("p")
    pList[1].className = "roomText"
    pList[1].id = "turnDisplay"
    pList[2] = document.createElement("p")
    pList[2].className = "roomText"
    pList[2].id = "playerDisplay"

    document.getElementById("game").appendChild(pList[0])
    document.getElementById("game").appendChild(pList[1])
    document.getElementById("game").appendChild(pList[2])

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
    if (this.player == 0) {
      document.getElementById("playerDisplay").textContent = "You are: Red"
    } else if (this.player == 1) {
      document.getElementById("playerDisplay").textContent = "You are: Blue"
    } else if (this.player == 2) {
      document.getElementById("playerDisplay").textContent = "You are: Yellow"
    } else if (this.player == 3) {
      document.getElementById("playerDisplay").textContent = "You are: Green"
    } else if (this.player == 4) {
      document.getElementById("playerDisplay").textContent = "You are: Purple"
    } else if (this.player == 5) {
      document.getElementById("playerDisplay").textContent = "You are: Orange"
    } else if (this.player == 6) {
      document.getElementById("playerDisplay").textContent = "You are: Pink"
    } else {
      document.getElementById("playerDisplay").textContent = "You are: " + this.player
    }

    //
    
    console.log("Joined room:", this.roomId, " as player:", playerNum.playerNum)
    const roomIdSend = {
      "roomId": this.roomId
    }

    const boardRequestRespone = await fetch("/api/board", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(roomIdSend)
    })
    
    const boardState = await boardRequestRespone.json()

    if (boardState.turn == -1) { return }

    console.log(boardState)

    let xSize = boardState.xSize
    let ySize = boardState.ySize
    this.players = document.getElementById("pAmount").value - 1

    if (this.players == -1 || xSize <= 0 || ySize <= 0) {
      return
    }

    document.getElementById("begining").style.visibility = "hidden"
    document.getElementById("game").style.width = xSize * 75
    document.getElementById("game").style.height = ySize * 75

    //make tiles
    for (let i = 0; i < xSize; i++) {
      for (let j = 0; j < ySize; j++) {
        let newTile = document.createElement("div")
        newTile.className = "cell"
        newTile.id = i + ',' + j
        newTile.addEventListener("click", () => { this.onTileClick(newTile.id) })
        newTile.dataset.owner = boardState.owner[i][j]
        newTile.dataset.value = boardState.value[i][j]

        newTile.style.left = (75 * i) + "px"
        newTile.style.top = (75 * j) + "px"
          
        await document.getElementById("game").appendChild(newTile)

        let img = document.createElement("img")
        img.src = ""
        img.className = "tileImage"
        img.id = newTile.id + "img"
        document.getElementById(newTile.id).appendChild(img)
      }
    }
    document.getElementById("turnDisplay").style.top = ((ySize * 75)) + "px"
    document.getElementById("turnDisplay").style.visibility = "visible"

    document.getElementById("playerDisplay").style.top = ((ySize * 75) + 25) + "px"
    document.getElementById("playerDisplay").style.visibility = "visible"
    
    document.getElementById("roomIdDisplay").style.top = ((ySize * 75) + 50) + "px"
    document.getElementById("roomIdDisplay").style.visibility = "visible"

    this.updateBoard(boardState)
  }

  async endGame(endInfo) {
    let winner = endInfo.winner
    document.getElementById("game").textContent = "" //AH HAHAHAHA >:)
    document.getElementById("endOverlay").style.visibility = "visible"
    await SLEEP(2000)
    if (winner == 0) {
      document.getElementById("winnerDisplay").textContent = "Red!"
    } else if (winner == 1) {
      document.getElementById("winnerDisplay").textContent = "Blue!"
    } else if (winner == 2) {
      document.getElementById("winnerDisplay").textContent = "Yellow!"
    } else if (winner == 3) {
      document.getElementById("winnerDisplay").textContent = "Green!"
    } else if (winner == 4) {
      document.getElementById("winnerDisplay").textContent = "Purple!"
    } else if (winner == 5) {
      document.getElementById("winnerDisplay").textContent = "Orange!"
    } else if (winner == 6) {
      document.getElementById("winnerDisplay").textContent = "Pink!"
    } else {
      document.getElementById("winnerDisplay").textContent = winner + "!"
    } 
    document.getElementById("winnerDisplay").style.visibility = "visible"
    await SLEEP(1000)
    document.getElementById("closeButton").style.visibility = "visible"
  }

  async endOverlayNoMore() {
    document.getElementById("endOverlay").style.visibility = "hidden"
    document.getElementById("winnerDisplay").textContent = "Noone"
    document.getElementById("winnerDisplay").style.visibility = "hidden"
    document.getElementById("closeButton").style.visibility = "hidden"
    document.getElementById("begining").style.visibility = "visible"
  }
}