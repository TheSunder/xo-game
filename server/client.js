let clientId
let gameId
let socket
let symbol
let num
let countX = 0
let countO = 0
let n = 19
const create = document.querySelector('.createBtn')
create.disabled = true
const join = document.querySelector('.joinBtn')
join.disabled = true
const cells = document.getElementsByClassName('cell')

join.addEventListener('click', () => {   
    socket.send(JSON.stringify({
        'key' : 'join',
        'clientId': clientId,
        'gameId' : gameId,
        'size': n
    }))
})

create.addEventListener('click', () =>{
    socket.send(JSON.stringify({
        'key' : 'create',
        'clientId' : clientId,
        'size': n
    }))
})



const scoreCounterX = document.querySelector('.scoreCounterX')
const scoreCounterO = document.querySelector('.scoreCounterO')
const board = document.querySelector('.board')
const list = document.querySelector('ul')
const sidebar = document.querySelector('.sidebar')
const connect = document.querySelector('.connectionBtn')
connect.addEventListener('click', (src) => {
    socket = new WebSocket('ws://localhost:8080')
    socket.onmessage = onMessage
    src.target.disabled = true
})

function onMessage(msg){
    const data =JSON.parse(msg.data)
    switch(data.key){
        case 'connected':
            clientId = data.clientId
            create.disabled = false
            join.disabled = false
            break
            
        case 'games':
            const games = data.list
            while(list.firstChild){
                list.removeChild(list.lastChild)
            }
            games.forEach( game => {     
                const li = document.createElement('li')
                li.tabIndex = 0
                li.innerText = "игра #" + game
                li.style.textAlign = 'center'
                list.appendChild(li)
                li.addEventListener('click', () => {
                    gameId = game
                })
            })
            break
        
        case 'created':
            gameId = data.gameId
            create.disabled = true
            join.disabled = true
            break
        case 'joined':
            document.querySelector('.board').style.display = 'grid'
            board.style.gridTemplateColumns = `repeat(${n}, auto)`
            for (let i=0;i<Math.pow(n,2);i++){
                const cell = document.createElement('div');
                cell.className = "cell";
                board.appendChild(cell);
            }
            symbol = data.symbol
            if (symbol == 'x'){
                board.classList.remove('circle')
                board.classList.add('cross')
            }
            if (symbol == 'o'){
                board.classList.add('circle')
                board.classList.remove('cross')}
            break
        case 'update':
                for (let cell of cells){
                    if (cell.classList.contains('cross'))
                        cell.classList.remove('cross')
                    else if (cell.classList.contains('circle'))
                        cell.classList.remove('circle')
                }

                for (i=0;i<Math.pow(n,2);i++){
                    if(data.board[i]=='x')
                        cells[i].classList.add('cross')
                    else if (data.board[i] == 'o')
                        cells[i].classList.add('circle')
                }
                for (i=0;i<Math.pow(n,2);i++){
                    if(data.board[i]=='x')
                        cells[i].classList.add('cross')
                    else if (data.board[i] == 'o')
                        cells[i].classList.add('circle')
                }
                if (data.isTurn)
                    makeMove()
                break

        case 'winner':
            window.alert(`Победитель: ${data.winner} !`)
            if (data.winner == 'x')
                scoreCounterX.innerText = 'X: ' + ++countX
            else scoreCounterO.innerText = 'O: ' + ++countO
            for (let cell of cells){
                if (cell.classList.contains('cross'))
                    cell.classList.remove('cross')
                else if (cell.classList.contains('circle'))
                    cell.classList.remove('circle')
            }
            for (i=0;i<Math.pow(n,2);i++){
                if(data.board[i] == 'x')
                    data.board[i]= ''
                else if (data.board[i] == 'o')
                    data.board[i]= ''
            }
            makeMove()
            break
        case 'draw':
            window.alert('Ничья!')
            for (let cell of cells){
                if (cell.classList.contains('cross'))
                    cell.classList.remove('cross')
                else if (cell.classList.contains('circle'))
                    cell.classList.remove('circle')
            }
            for (i=0;i<Math.pow(n,2);i++){
                if(data.board[i] == 'x')
                    data.board[i]= ''
                else if (data.board[i] == 'o')
                    data.board[i]= ''
            }
            makeMove()
            break
    }
}

function makeMove(){
    let arrayCells = [];
    for (var i = 0; i < cells.length; i++){
        arrayCells.push(cells[i]);
        arrayCells[i].addEventListener('click', function(e){
           num = arrayCells.indexOf(e.target);
        })}

        for (let cell of cells){
            if ((!cell.classList.contains('cross') &&
        !cell.classList.contains('circle'))){
            cell.addEventListener('click', cellClicked)
        }
    }
}

function cellClicked(src){
    let icon
    if (symbol == 'x')
        icon = 'cross'
    else icon = 'circle'
        src.target.classList.add(icon)
    const board = []
    for (i=0; i<Math.pow(n,2); i++){
        if (cells[i].classList.contains('circle')){
            board[i] = 'o'}
        else if (cells[i].classList.contains('cross')){
            board[i] = 'x'}
        else
        board[i] = ''
    }

    for (let cell of cells){
        cell.removeEventListener('click',cellClicked)
    }

    socket.send(JSON.stringify({
        'key' : 'moveMade',
        'board' : board,
        'clientId' : clientId,
        'gameId' : gameId,
        'numOfCell': num
    }))
}




