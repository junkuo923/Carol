// 初始化 GUN
const gun = Gun({
    peers: ['https://gun-manhattan.herokuapp.com/gun']
});

// 遊戲狀態
const gameState = gun.get('tic-tac-toe');
const players = gun.get('players');
let currentPlayer = null;
let mySymbol = null;

// DOM 元素
const gameBoard = document.getElementById('game-board');
const playerInfo = document.getElementById('player-info');
const playerNameInput = document.getElementById('player-name');
const joinButton = document.getElementById('join-game');
const gameStatus = document.getElementById('game-status');
const playersList = document.getElementById('players');
const restartButton = document.getElementById('restart-game');

// 初始化遊戲板
let board = Array(9).fill('');

// 勝利組合
const winPatterns = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // 橫向
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // 直向
    [0, 4, 8], [2, 4, 6] // 斜向
];

// 加入遊戲
joinButton.addEventListener('click', () => {
    const playerName = playerNameInput.value.trim();
    if (!playerName) return;

    currentPlayer = {
        id: gun._.opt.pid,
        name: playerName,
        timestamp: Date.now()
    };

    players.get(currentPlayer.id).put(currentPlayer);
    playerInfo.style.display = 'none';
    gameStatus.textContent = '等待其他玩家...';
});

// 監聽玩家列表變化
players.map().on((player, id) => {
    updatePlayersList();
    assignSymbols();
});

// 更新玩家列表
function updatePlayersList() {
    playersList.innerHTML = '';
    let playerArray = [];
    
    players.map().once((player) => {
        if (player) {
            playerArray.push(player);
        }
    });

    // 根據加入時間排序
    setTimeout(() => {
        playerArray.sort((a, b) => a.timestamp - b.timestamp);
        playerArray.forEach(player => {
            const li = document.createElement('li');
            li.textContent = player.name + (player.id === currentPlayer?.id ? ' (你)' : '');
            playersList.appendChild(li);
        });
    }, 100);
}

// 分配符號 (X 或 O)
function assignSymbols() {
    players.map().once((player) => {
        if (player && player.id === currentPlayer?.id) {
            const playerArray = [];
            players.map().once((p) => {
                if (p) playerArray.push(p);
            });

            setTimeout(() => {
                playerArray.sort((a, b) => a.timestamp - b.timestamp);
                const playerIndex = playerArray.findIndex(p => p.id === currentPlayer.id);
                mySymbol = playerIndex === 0 ? 'X' : 'O';
                
                if (playerArray.length === 2) {
                    if (playerIndex === 0) {
                        gameStatus.textContent = '輪到你了 (X)';
                    } else {
                        gameStatus.textContent = '等待對手下棋 (O)';
                    }
                }
            }, 100);
        }
    });
}

// 監聽遊戲板變化
gameState.get('board').map().on((value, index) => {
    if (value) {
        updateCell(parseInt(index), value);
        checkGameStatus();
    }
});

// 更新遊戲格子
function updateCell(index, value) {
    const cell = gameBoard.children[index];
    cell.textContent = value;
    cell.classList.add(value);
    board[index] = value;
}

// 檢查遊戲狀態
function checkGameStatus() {
    // 檢查勝利
    for (let pattern of winPatterns) {
        const [a, b, c] = pattern;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            gameStatus.textContent = `玩家 ${board[a]} 獲勝！`;
            gameStatus.style.color = board[a] === 'X' ? '#dc3545' : '#0d6efd';
            disableBoard();
            document.getElementById('restart-game').style.display = 'block';
            return;
        }
    }

    // 檢查平局
    if (!board.includes('')) {
        gameStatus.textContent = '平局！';
        gameStatus.style.color = '#6c757d';
        disableBoard();
        document.getElementById('restart-game').style.display = 'block';
        return;
    }

    // 更新回合狀態
    const isXTurn = board.filter(cell => cell !== '').length % 2 === 0;
    if (mySymbol === 'X' && isXTurn || mySymbol === 'O' && !isXTurn) {
        gameStatus.textContent = '🎮 輪到你了！';
        gameStatus.style.color = mySymbol === 'X' ? '#dc3545' : '#0d6efd';
        gameBoard.style.pointerEvents = 'auto';
    } else {
        gameStatus.textContent = '⌛ 等待對手下棋中...';
        gameStatus.style.color = '#6c757d';
        gameBoard.style.pointerEvents = 'none';
    }

    // 在狀態下方顯示符號提醒
    const symbolReminder = document.createElement('div');
    symbolReminder.style.fontSize = '0.8em';
    symbolReminder.style.marginTop = '5px';
    symbolReminder.textContent = `你的符號是 ${mySymbol}`;
    gameStatus.appendChild(symbolReminder);
}

// 顯示重新開始按鈕
function showRestartButton() {
    restartButton.style.display = 'block';
}

// 隱藏重新開始按鈕
function hideRestartButton() {
    restartButton.style.display = 'none';
}

// 重置遊戲
function resetGame() {
    board = Array(9).fill('');
    gameBoard.querySelectorAll('.cell').forEach(cell => {
        cell.textContent = '';
        cell.className = 'cell';
    });
    gameBoard.style.pointerEvents = 'auto';
    document.getElementById('restart-game').style.display = 'none';
    gameStatus.innerHTML = '';
    checkGameStatus();
}

// 監聽重新開始按鈕點擊事件
restartButton.addEventListener('click', resetGame);

// 禁用遊戲板
function disableBoard() {
    gameBoard.style.pointerEvents = 'none';
}

// 處理點擊事件
gameBoard.addEventListener('click', (e) => {
    if (!currentPlayer || !mySymbol) return;

    const cell = e.target;
    if (!cell.classList.contains('cell')) return;
    
    const index = cell.dataset.index;
    if (board[index] !== '') return;

    const isXTurn = board.filter(cell => cell !== '').length % 2 === 0;
    if ((mySymbol === 'X' && !isXTurn) || (mySymbol === 'O' && isXTurn)) return;

    gameState.get('board').get(index).put(mySymbol);
});

// 初始化遊戲
gameState.get('board').map().once((value, index) => {
    if (value) {
        updateCell(parseInt(index), value);
    }
});

// 添加重新開始按鈕事件監聽
document.getElementById('restart-game').addEventListener('click', () => {
    gameState.get('board').map().put(null);
    resetGame();
});

// 清空資料庫
function clearDatabase() {
    // 清空遊戲板
    gameState.get('board').map().put(null);
    
    // 清空玩家列表
    players.map().once((data, key) => {
        if (data) {
            players.get(key).put(null);
        }
    });
    
    // 重置遊戲狀態
    resetGame();
    
    // 顯示加入遊戲區域
    playerInfo.style.display = 'block';
    playerNameInput.value = '';
    
    // 重置當前玩家
    currentPlayer = null;
    mySymbol = null;
}

// 添加清空資料庫按鈕到 HTML
const clearDbButton = document.createElement('button');
clearDbButton.textContent = '清空遊戲資料';
clearDbButton.id = 'clear-db';
clearDbButton.style.backgroundColor = '#dc3545';
clearDbButton.style.marginTop = '20px';
document.getElementById('app').appendChild(clearDbButton);

// 監聽清空資料庫按鈕點擊事件
clearDbButton.addEventListener('click', clearDatabase);