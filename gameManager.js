export default class gameRoom {
    constructor(xSize, ySize, players, turn) {
        this.xSize = xSize
        this.ySize = ySize
        this.players = 2
        this.turn = 0
        this.firstTurns = true
        this.playerTiles = []

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
        if (this.turn == player) {
            const coords = tileId.split(',')
            if (this.boardOwner[coords[0]][coords[1]] == -1 && this.firstTurns) {
                this.boardOwner[coords[0]][coords[1]] = this.turn
                this.playerTiles[this.turn]++
                this.boardValue[coords[0]][coords[1]] = 3
            } else if (this.boardOwner[coords[0]][coords[1]] == this.turn) {
                this.boardValue[coords[0]][coords[1]]++

                await this.checkAndExpand(tileId)
            } else {
                return
            }

            if (this.turn == this.players - 1) {
                this.turn = 0
                this.firstTurns = false
            } else {
                this.turn++
            }
        }
    }

    checkAndExpand(id) {
        const coords = id.split(',')
        if (this.boardValue[coords[0]][coords[1]] == 4) {    
            let expaned = false

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
            this.checkAndExpand(foundId)
          }
        }
    }
}