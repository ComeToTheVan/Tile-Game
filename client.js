import { io } from "socket.io-client";

export class clientGame {
  constructor(player, players) {
    this.player = 0
    this.players = players

    this.socket = io()  

    this.socket.on('boardStateUpdate', (boardState) => {
      this.updateBoard(boardState)
    })
  }
  
  async onTileClick(id) {
    const clickData = {
      "id": id,
      "player": this.player
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

        document.getElementById(id).innerHTML = boardState.value[i][j]
        document.getElementById(id).style.backgroundColor = ""

        if (boardState.owner[i][j] == '0') {
          document.getElementById(id).style.backgroundColor = "red"
        } else if (boardState.owner[i][j] == '1') {
          document.getElementById(id).style.backgroundColor = "blue"
        } else {
          document.getElementById(id).style.backgroundColor = ""
        }
      }
    }   
  }

  async Start() {
    const boardRequestRespone = await fetch("/api/board")
    let boardState = await boardRequestRespone.json()

    let xSize = boardState.xSize
    let ySize = boardState.ySize
    this.players = document.getElementById("pAmount").value - 1
    this.player = document.getElementById("p").value

    if (this.players == -1 || xSize <= 0 || ySize <= 0) {
      return
    }

    document.getElementById("begining").style.visibility = "hidden";
        
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
        newTile.id = i + ',' + j
        newTile.addEventListener("click", () => { this.onTileClick(newTile.id) })
        newTile.classList.add('tile')
        newTile.dataset.owner = boardState.owner[i][j]
        newTile.dataset.value = boardState.value[i][j]

        newTile.style.left = (50 * i) + "px"
        newTile.style.top = (50 * j) + "px"
          
        document.getElementById("tiles").appendChild(newTile)

        newTile.innerHTML = 0  
      }
    }
    this.updateBoard(boardState)
  }
}