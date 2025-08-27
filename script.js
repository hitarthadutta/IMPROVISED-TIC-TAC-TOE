document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const landingPage = document.getElementById('landing-page');
    const gamePage = document.getElementById('game-page');
    const gameStatus = document.getElementById('game-status');
    const cells = document.querySelectorAll('.cell');
    const vsComputerBtn = document.getElementById('vs-computer');
    const vsPlayerBtn = document.getElementById('vs-player');
    const restartBtn = document.getElementById('restart-game');
    const backToMenuBtn = document.getElementById('back-to-menu');

    // Game variables
    let gameActive = false;
    let currentPlayer = 'X';
    let gameMode = '';
    let gameState = ['', '', '', '', '', '', '', '', ''];
    let playerXMoves = [];
    let playerOMoves = [];
    const winPatterns = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
        [0, 4, 8], [2, 4, 6]             // diagonals
    ];

    // Event Listeners
    vsComputerBtn.addEventListener('click', () => startGame('computer'));
    vsPlayerBtn.addEventListener('click', () => startGame('player'));
    restartBtn.addEventListener('click', restartGame);
    backToMenuBtn.addEventListener('click', backToMenu);
    
    cells.forEach(cell => {
        cell.addEventListener('click', () => handleCellClick(cell));
    });

    // Game Functions
    function startGame(mode) {
        gameMode = mode;
        gameActive = true;
        currentPlayer = 'X';
        gameState = ['', '', '', '', '', '', '', '', ''];
        playerXMoves = [];
        playerOMoves = [];
        cells.forEach(cell => {
            cell.className = 'cell';
            cell.classList.remove('fading');
        });
        cells.forEach(cell => cell.textContent = '');
        gameStatus.textContent = `Player X's Turn`;
        landingPage.classList.add('hidden');
        gamePage.classList.remove('hidden');
    }

    // Audio elements
    const clickSound = new Audio('click.mp3');
    const backgroundMusic = new Audio('background.mp3');
    backgroundMusic.loop = true;
    let isMusicPlaying = false;
    
    // Music toggle button
    const musicToggle = document.getElementById('music-toggle');
    musicToggle.addEventListener('click', toggleMusic);
    
    function toggleMusic() {
        if (isMusicPlaying) {
            backgroundMusic.pause();
            musicToggle.textContent = '🔇';
        } else {
            backgroundMusic.play();
            musicToggle.textContent = '🔊';
        }
        isMusicPlaying = !isMusicPlaying;
    }
    
    function handleCellClick(cell) {
        const index = parseInt(cell.getAttribute('data-index'));

        if (gameState[index] !== '' || !gameActive) return;
        
        // Play click sound
        clickSound.currentTime = 0;
        clickSound.play();

        updateCell(cell, index);
        checkGameResult();

        if (gameActive && gameMode === 'computer' && currentPlayer === 'O') {
            setTimeout(computerMove, 500);
        }
    }

    function updateCell(cell, index) {
        gameState[index] = currentPlayer;
        cell.textContent = currentPlayer;
        cell.classList.add(currentPlayer.toLowerCase());

        // Track moves for each player
        if (currentPlayer === 'X') {
            playerXMoves.push(index);
            
            // Apply fading effect to the oldest move (3 moves before current)
            if (playerXMoves.length >= 3) {
                const oldestMoveIndex = playerXMoves[playerXMoves.length - 3];
                const oldCell = document.querySelector(`.cell[data-index="${oldestMoveIndex}"]`);
                oldCell.classList.add('fading');
            }
            
            // Apply custom rule: after 3rd move, remove the first move
            if (playerXMoves.length > 3) {
                const oldestMoveIndex = playerXMoves[0];
                const oldCell = document.querySelector(`.cell[data-index="${oldestMoveIndex}"]`);
                
                // Remove it
                playerXMoves.shift();
                gameState[oldestMoveIndex] = '';
                oldCell.textContent = '';
                oldCell.classList.remove('x');
                oldCell.classList.remove('fading');
            }
        } else {
            playerOMoves.push(index);
            
            // Apply fading effect to the oldest move (3 moves before current)
            if (playerOMoves.length >= 3) {
                const oldestMoveIndex = playerOMoves[playerOMoves.length - 3];
                const oldCell = document.querySelector(`.cell[data-index="${oldestMoveIndex}"]`);
                oldCell.classList.add('fading');
            }
            
            // Apply custom rule: after 3rd move, remove the first move
            if (playerOMoves.length > 3) {
                const oldestMoveIndex = playerOMoves[0];
                const oldCell = document.querySelector(`.cell[data-index="${oldestMoveIndex}"]`);
                
                // Remove it
                playerOMoves.shift();
                gameState[oldestMoveIndex] = '';
                oldCell.textContent = '';
                oldCell.classList.remove('o');
                oldCell.classList.remove('fading');
            }
        }

        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
        gameStatus.textContent = `Player ${currentPlayer}'s Turn`;
    }

    function checkGameResult() {
        let roundWon = false;

        for (let i = 0; i < winPatterns.length; i++) {
            const [a, b, c] = winPatterns[i];
            if (gameState[a] && gameState[a] === gameState[b] && gameState[a] === gameState[c]) {
                roundWon = true;
                break;
            }
        }

        if (roundWon) {
            const winner = currentPlayer === 'X' ? 'O' : 'X'; // Winner is the previous player
            gameStatus.textContent = `Player ${winner} Wins!`;
            gameActive = false;
            return;
        }

        // Check for draw - this is tricky with our custom rule
        // We'll consider it a draw if all cells are filled AND no win condition
        let roundDraw = !gameState.includes('');
        if (roundDraw) {
            gameStatus.textContent = 'Game Ended in a Draw!';
            gameActive = false;
        }
    }

    function computerMove() {
        if (!gameActive) return;

        // Find available cells
        const availableCells = [];
        gameState.forEach((cell, index) => {
            if (cell === '') availableCells.push(index);
        });

        if (availableCells.length > 0) {
            let computerCellIndex;
            
            // 1. Check if computer can win in the next move
            computerCellIndex = findWinningMove('O');
            
            // 2. If no winning move, check if need to block player
            if (computerCellIndex === -1) {
                computerCellIndex = findWinningMove('X');
            }
            
            // 3. If no blocking needed, try to take the center
            if (computerCellIndex === -1 && gameState[4] === '') {
                computerCellIndex = 4;
            }
            
            // 4. If center taken, try to take a corner
            if (computerCellIndex === -1) {
                const corners = [0, 2, 6, 8].filter(idx => gameState[idx] === '');
                if (corners.length > 0) {
                    computerCellIndex = corners[Math.floor(Math.random() * corners.length)];
                }
            }
            
            // 5. If no strategic move found, make a random move
            if (computerCellIndex === -1) {
                computerCellIndex = availableCells[Math.floor(Math.random() * availableCells.length)];
            }
            
            const computerCell = document.querySelector(`.cell[data-index="${computerCellIndex}"]`);
            
            // Delay for a more natural feel
            setTimeout(() => {
                updateCell(computerCell, computerCellIndex);
                checkGameResult();
            }, 300);
        }
    }
    
    // Helper function to find winning moves or blocking moves
    function findWinningMove(player) {
        // Check each win pattern
        for (let i = 0; i < winPatterns.length; i++) {
            const [a, b, c] = winPatterns[i];
            
            // Check if two positions have the player's mark and the third is empty
            if (gameState[a] === player && gameState[b] === player && gameState[c] === '') {
                return c;
            }
            if (gameState[a] === player && gameState[c] === player && gameState[b] === '') {
                return b;
            }
            if (gameState[b] === player && gameState[c] === player && gameState[a] === '') {
                return a;
            }
        }
        
        return -1; // No winning move found
    }
    


    function restartGame() {
        startGame(gameMode);
    }

    function backToMenu() {
        gameActive = false;
        gamePage.classList.add('hidden');
        landingPage.classList.remove('hidden');
    }
    // Theme toggle functionality
    const themeToggle = document.getElementById('theme-toggle');
    
    // Check for saved theme preference or use default light theme
    if (localStorage.getItem('theme') === 'dark') {
        document.documentElement.classList.add('dark-theme');
        themeToggle.textContent = '☀️';
    }
    
    // Toggle between light and dark themes
    themeToggle.addEventListener('click', () => {
        document.documentElement.classList.toggle('dark-theme');
        
        // Update button icon and save preference
        if (document.documentElement.classList.contains('dark-theme')) {
            themeToggle.textContent = '☀️';
            localStorage.setItem('theme', 'dark');
        } else {
            themeToggle.textContent = '🌙';
            localStorage.setItem('theme', 'light');
        }
    });
});