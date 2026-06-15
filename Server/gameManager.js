//Sleep
const SLEEP = (ms) => new Promise(resolve => setTimeout(resolve, ms))

export default class gameRoom {
    constructor(xSize, ySize, players, roomId, mainFunctions) {
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
        this.deadPlayers = []
        this.ended = false
        this.winner = "Noone"
        this.roomId = roomId

        this.audio = ""

        this.totalLoop = 0
        this.loop = 0

        this.sendBoard = mainFunctions[0]
        this.endRoom = mainFunctions[1]

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
        if (this.turn == player && this.loop == 0 && !this.ended) {
            const coords = tileId.split(',')
            if (this.boardOwner[coords[0]][coords[1]] == -1 && this.firstTurns) {
                this.audio = "firstPlace"

                this.boardOwner[coords[0]][coords[1]] = this.turn
                this.playerTiles[this.turn]++
                this.boardValue[coords[0]][coords[1]] = 3

                await this.checkAndExpand(tileId)
            } else if (this.boardOwner[coords[0]][coords[1]] == this.turn) {
                this.boardValue[coords[0]][coords[1]]++
                this.audio = "Add"

                this.totalLoop = 0
                await this.checkAndExpand(tileId)
            } else {
                return
            }
        }
    }

    async checkAndExpand(id) {
        const coords = id.split(',')
        if (this.boardValue[coords[0]][coords[1]] >= 4 && !this.ended) {
            this.loop++

            const speedLimit = 1.7
            let speedModifer = 1 + (0.05 * this.loop)

            speedModifer = speedModifer > speedLimit ? speedLimit : speedModifer

            await SLEEP(600 / speedModifer)

            this.loop--
    
            let expaned = false
            let foundIds = new Array

            const owner = this.boardOwner[coords[0]][coords[1]]
            if (owner == -1) {
                return
            }

            this.boardValue[coords[0]][coords[1]] = 0
            this.boardOwner[coords[0]][coords[1]] = -1
            this.playerTiles[owner]--

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
                
                if (this.boardOwner[newCoord[0]][newCoord[1]] != -1) {
                    this.playerTiles[this.boardOwner[newCoord[0]][newCoord[1]]]--
                }

                this.boardValue[newCoord[0]][newCoord[1]]++ 
                this.boardOwner[newCoord[0]][newCoord[1]] = owner

                this.playerTiles[owner]++

                let foundId = newCoord.join()
                foundIds[foundIds.length] = foundId
                this.loop--
            }
            this.totalLoop++
            if (foundIds.length > 0) {
                this.audio = "Expand"

                let expandPromises = []
                for (let i = 0; i < foundIds.length; i++) {
                    this.loop++
                    
                    let task = this.checkAndExpand(foundIds[i]).then(() => {
                        this.loop--
                    })
                    expandPromises.push(task)
                }

                this.sendBoard(this.roomId)

                await Promise.all(expandPromises)
            }
        }
        
        //end room check
        if (this.loop == 0){
            this.totalLoop = 0

            if (!this.ended) {
                for (let i = 0; i < this.totalSize; i++) {
                    if (this.playerTiles[i] == 0 && !this.firstTurns) {
                        if (!this.deadPlayers.includes(i)) {
                            this.deadPlayers.push(i)
                        }           
                    }

                    if (this.deadPlayers.length == this.totalSize - 1 && this.totalSize > 1) {
                        this.ended = true
                        for (let j = 0; j < this.totalSize; j++) {
                            if (!this.deadPlayers.includes(j)) {
                                this.winner = j
                                break
                            }
                        }
                    }
                }
                if (!this.ended) {
                    let nextTurn = this.turn;
                    let attempts = 0;

                    do {
                        nextTurn = (nextTurn + 1) % this.totalSize;
                        attempts++;
                        
                        if (nextTurn === 0) {
                            this.firstTurns = false;
                        }
                    } while (this.deadPlayers.includes(nextTurn) && attempts < this.totalSize);

                    this.turn = nextTurn;
                }
                this.sendBoard(this.roomId, this.turn);
            }
        }

        if (this.ended) {
            this.endRoom(this.roomId, this.winner)
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
            this.playerTiles[this.joinedPlayers] = 0
            this.joinedPlayers++

            console.log(playerId, "Joined because there is space")
            return this.joinedPlayers - 1 //return the index value
        } else {
            console.log(playerId, "Failed to join", this.roomId)
            return -1 //if declined
        }
    }
}
