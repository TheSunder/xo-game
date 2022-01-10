let clients = {}
let games = {}
let symbol
const http = require('http').createServer().listen(8080, console.log('listening on port 8080'))
const server = require('websocket').server
const socket = new server({'httpServer': http})
let size
socket.on('request', (req) => {
    const connection = req.accept(null, req.origin)
    const clientId = Math.round(Math.random() * 10) + Math.round(Math.random() * 10) + Math.round(Math.random() * 10)
    clients[clientId] = {'connection' : connection}
    connection.send(JSON.stringify({
        'key' : 'connected',
        'clientId' : clientId,
        'size': size
    }))   
    sendAvailableGames()
    connection.on('message', onMessage)
})

function sendAvailableGames(){
    const gamesList = []
    for (const game in games){
        if (games[game].players.length < 2)
            gamesList.push(game)
    }
    for (const client in clients)
        clients[client].connection.send(JSON.stringify({
            'key' : 'games',
            'list' : gamesList
        }))
}

function onMessage(msg){
    const data = JSON.parse(msg.utf8Data)
    switch(data.key){
        case 'create':
            const gameId = Math.round(Math.random() * 100) + Math.round(Math.random() * 100) + Math.round(Math.random() * 100)
            size = data.size
            const board = []
            for (let i = 0; i < Math.pow(size,2); i++){
                board[i] = ''
            }
            
            var player = {
                'clientId' : data.clientId,
                'symbol' : 'x',
                'isTurn' :  true
            }
            const players = Array(player)

            games[gameId] = {
                'board': board,
                'players' : players
            }
            clients[data.clientId].connection.send(JSON.stringify({
                'key' : 'created',
                'gameId' : gameId
            }))
            sendAvailableGames()
            break
        
        case 'join':
            player = {
                'clientId' : data.clientId,
                'symbol' : 'o',
                'isTurn' : false
            }
            games[data.gameId].players.push(player)
            sendAvailableGames()
            games[data.gameId].players.forEach(player =>
                {
                    clients[player.clientId].connection.send(JSON.stringify({
                        'key' : 'joined',
                        'gameId' : data.gameId,
                        'symbol' : player.symbol,
                        'size' : size
                    }))
                })
            updateBoard(data.gameId)
            break
        case 'moveMade':
            games[data.gameId].board = data.board
            let num = data.numOfCell
            if (winScanner(data.gameId, num)) {
                games[data.gameId].players.forEach(player => {
                    clients[player.clientId].connection.send(JSON.stringify({
                        'key' : 'winner',
                        'winner' : symbol,
                        'board': games[data.gameId].board,
                        'size': size
                    }))
                })
            }
            else if (drawState(data.gameId)){
                games[data.gameId].players.forEach(player => {
                    clients[player.clientId].connection.send(JSON.stringify({
                        'key' : 'draw',
                        'board': games[data.gameId].board,
                        'size': size
                    }))
                })
            }
            else {
                games[data.gameId].players.forEach(player => {
                    player.isTurn = !player.isTurn
                })
                updateBoard(data.gameId)
            }
            break


        }
        
}

function updateBoard(gameId){
    games[gameId].players.forEach(player => {
        clients[player.clientId].connection.send(JSON.stringify({
            'key' : 'update',
            'isTurn' : player.isTurn,
            'board' : games[gameId].board,
            'size' : size
        }))
    })
}


function winScanner(gameId, num){
    //проверка по горизнотали
    for (let i = num - 4; i < num + 4; i++){
        if (games[gameId].board[i] == games[gameId].board[i+1] && games[gameId].board[i+1] == games[gameId].board[i+2]
            && games[gameId].board[i+2] == games[gameId].board[i+3] && games[gameId].board[i+3] == games[gameId].board[i+4]
            && (games[gameId].board[i] == 'x' || games[gameId].board[i] == 'o')){
                symbol = games[gameId].board[i]
            return true
        }
    }
    //проверка по вертикали
    for (let i = num - 4*size; i < num + 4*size; i = i + size)
        if (games[gameId].board[i] == games[gameId].board[i + size] && games[gameId].board[i+size] == games[gameId].board[i + size*2]
            && games[gameId].board[i+size*2] == games[gameId].board[i+size*3] && games[gameId].board[i+size*3] == games[gameId].board[i+size*4]
            && (games[gameId].board[i] == 'x' || games[gameId].board[i] == 'o')){
                symbol = games[gameId].board[i]
            return true
            }

    //главная диагональ
    for (let i = num - 4*(size + 1); i < num + 4*(size + 1); i = i + size + 1)
            if (games[gameId].board[i] == games[gameId].board[i+size+1] && games[gameId].board[i+size+1] == games[gameId].board[i+2*(size+1)]
            && games[gameId].board[i+2*(size+1)] == games[gameId].board[i+3*(size+1)] && games[gameId].board[i+3*(size+1)] == games[gameId].board[i+4*(size+1)]
            && (games[gameId].board[i] == 'x' || games[gameId].board[i] == 'o')){
                symbol = games[gameId].board[i]
                return true
        }

    //побочная диагональ
    for (let i = num - 4*(size - 1); i < num + 4*(size - 1); i = i + size - 1)
            if (games[gameId].board[i] == games[gameId].board[i+size-1] && games[gameId].board[i+size-1] == games[gameId].board[i+2*(size-1)]
            && games[gameId].board[i+2*(size-1)] == games[gameId].board[i+3*(size-1)] && games[gameId].board[i+3*(size-1)] == games[gameId].board[i+4*(size-1)]
             && (games[gameId].board[i] == 'x' || games[gameId].board[i] == 'o')){
                symbol = games[gameId].board[i]
                return true
            }
    return false
    
}

function drawState(gameId){
    for (let i = 0; i < Math.pow(size,2); i++)
        if (games[gameId].board[i] == '')
            return false
    return true
}