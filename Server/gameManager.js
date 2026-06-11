//Sleep
const SLEEP = (ms) => new Promise(resolve => setTimeout(resolve, ms))

export default class gameRoom {
    constructor(xSize, ySize, players, roomId, sendBoardCallback) {
        this.xSize = xSize
        this.ySize = ySize
        if (xSize < 0) {
            this.xSize = 10
        }
        if (ySize < 0) {
            this.ySize = 10
        }
        this.players = new Array(players)
        this.totalSize = players
        this.joinedPlayers = 0
        this.turn = 0
        this.firstTurns = true
        this.playerTiles = []
        this.started = false
        this.roomId = roomId

        this.audio = ""

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
        console.log(player, "attempting to click",tileId)
        if (this.turn == player && this.loop == 0) {
            console.log("did it")
            this.loop++
            const coords = tileId.split(',')
            if (this.boardOwner[coords[0]][coords[1]] == -1 && this.firstTurns) {
                console.log("first move")
                this.audio = "first"

                this.boardOwner[coords[0]][coords[1]] = this.turn
                this.playerTiles[this.turn]++
                this.boardValue[coords[0]][coords[1]] = 3

            } else if (this.boardOwner[coords[0]][coords[1]] == this.turn) {
                console.log("adding")

                this.boardValue[coords[0]][coords[1]]++
                this.audio = "add"

                this.totalLoop = 0
                await this.checkAndExpand(tileId)
            } else {
                console.log("invaild")
                this.loop--
                return
            }

            if (this.turn == this.totalSize - 1) {
                this.turn = 0
                this.firstTurns = false
            } else {
                this.turn++
            }
            this.loop--
        }
    }

    async checkAndExpand(id) {
        const coords = id.split(',')
        if (this.boardValue[coords[0]][coords[1]] >= 4) {
            this.loop++
            if (this.totalLoop == 0) {
                await SLEEP(600)
            } else {
                await SLEEP(600 / Math.round(this.totalLoop / 4))
            }
            this.loop--
    
            let expaned = false
            let foundIds = new Array

            const owner = this.boardOwner[coords[0]][coords[1]]
            if (owner == -1) {
                return
            }

            this.boardValue[coords[0]][coords[1]] = 0
            this.boardOwner[coords[0]][coords[1]] = -1
            this.playerTiles[this.turn]--
            for (let i = 0; i < 4; i++) {
                this.loop++
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
                    this.loop--
                    continue
                }
                
                this.boardValue[newCoord[0]][newCoord[1]]++ 
                this.boardOwner[newCoord[0]][newCoord[1]] = owner

                this.playerTiles[owner]++

                let foundId = newCoord.join()
                foundIds[foundIds.length] = foundId
                this.loop--
            }
            this.loop++
            this.totalLoop++
            if (foundIds.length > 0) {
                this.audio = "expand"

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
}
