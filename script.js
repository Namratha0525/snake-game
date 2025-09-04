document.addEventListener('DOMContentLoaded', () => {
    // Game canvas setup
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    const startBtn = document.getElementById('start-btn');
    const restartBtn = document.getElementById('restart-btn');
    const scoreElement = document.getElementById('score');
    const highScoreElement = document.getElementById('high-score');

    // Game constants
    const GRID_SIZE = 20;
    const GAME_SPEED = 150; // milliseconds
    const CANVAS_WIDTH = canvas.width;
    const CANVAS_HEIGHT = canvas.height;
    const GRID_WIDTH = CANVAS_WIDTH / GRID_SIZE;
    const GRID_HEIGHT = CANVAS_HEIGHT / GRID_SIZE;

    // Game variables
    let snake = [];
    let food = {};
    let direction = 'right';
    let nextDirection = 'right';
    let gameInterval;
    let score = 0;
    let highScore = localStorage.getItem('snakeHighScore') || 0;
    let gameRunning = false;
    let gameOver = false;

    // Initialize high score display
    highScoreElement.textContent = highScore;

    // Initialize game
    function initGame() {
        // Reset game state
        snake = [
            { x: 5, y: 10 },
            { x: 4, y: 10 },
            { x: 3, y: 10 }
        ];
        score = 0;
        scoreElement.textContent = score;
        direction = 'right';
        nextDirection = 'right';
        gameOver = false;
        
        // Generate initial food
        generateFood();
        
        // Clear previous interval if exists
        if (gameInterval) {
            clearInterval(gameInterval);
        }
        
        // Draw initial state
        draw();
    }

    // Generate food at random position
    function generateFood() {
        // Generate random coordinates
        let foodX, foodY;
        let validPosition = false;
        
        while (!validPosition) {
            foodX = Math.floor(Math.random() * GRID_WIDTH);
            foodY = Math.floor(Math.random() * GRID_HEIGHT);
            
            // Check if food is not on snake
            validPosition = true;
            for (let segment of snake) {
                if (segment.x === foodX && segment.y === foodY) {
                    validPosition = false;
                    break;
                }
            }
        }
        
        food = { x: foodX, y: foodY };
    }

    // Draw game elements
    function draw() {
        // Clear canvas
        ctx.fillStyle = '#222';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        // Draw snake
        snake.forEach((segment, index) => {
            // Head is a different color
            if (index === 0) {
                ctx.fillStyle = '#4CAF50'; // Green head
            } else {
                ctx.fillStyle = '#8BC34A'; // Lighter green body
            }
            
            ctx.fillRect(
                segment.x * GRID_SIZE,
                segment.y * GRID_SIZE,
                GRID_SIZE,
                GRID_SIZE
            );
            
            // Add eyes to the head
            if (index === 0) {
                ctx.fillStyle = '#000';
                
                // Position eyes based on direction
                let leftEyeX, leftEyeY, rightEyeX, rightEyeY;
                const eyeSize = GRID_SIZE / 5;
                const eyeOffset = GRID_SIZE / 3;
                
                switch(direction) {
                    case 'up':
                        leftEyeX = segment.x * GRID_SIZE + eyeOffset;
                        leftEyeY = segment.y * GRID_SIZE + eyeOffset;
                        rightEyeX = segment.x * GRID_SIZE + GRID_SIZE - eyeOffset - eyeSize;
                        rightEyeY = segment.y * GRID_SIZE + eyeOffset;
                        break;
                    case 'down':
                        leftEyeX = segment.x * GRID_SIZE + eyeOffset;
                        leftEyeY = segment.y * GRID_SIZE + GRID_SIZE - eyeOffset - eyeSize;
                        rightEyeX = segment.x * GRID_SIZE + GRID_SIZE - eyeOffset - eyeSize;
                        rightEyeY = segment.y * GRID_SIZE + GRID_SIZE - eyeOffset - eyeSize;
                        break;
                    case 'left':
                        leftEyeX = segment.x * GRID_SIZE + eyeOffset;
                        leftEyeY = segment.y * GRID_SIZE + eyeOffset;
                        rightEyeX = segment.x * GRID_SIZE + eyeOffset;
                        rightEyeY = segment.y * GRID_SIZE + GRID_SIZE - eyeOffset - eyeSize;
                        break;
                    case 'right':
                        leftEyeX = segment.x * GRID_SIZE + GRID_SIZE - eyeOffset - eyeSize;
                        leftEyeY = segment.y * GRID_SIZE + eyeOffset;
                        rightEyeX = segment.x * GRID_SIZE + GRID_SIZE - eyeOffset - eyeSize;
                        rightEyeY = segment.y * GRID_SIZE + GRID_SIZE - eyeOffset - eyeSize;
                        break;
                }
                
                ctx.fillRect(leftEyeX, leftEyeY, eyeSize, eyeSize);
                ctx.fillRect(rightEyeX, rightEyeY, eyeSize, eyeSize);
            }
        });
        
        // Draw food
        ctx.fillStyle = '#FF5722'; // Orange food
        ctx.beginPath();
        ctx.arc(
            food.x * GRID_SIZE + GRID_SIZE / 2,
            food.y * GRID_SIZE + GRID_SIZE / 2,
            GRID_SIZE / 2,
            0,
            Math.PI * 2
        );
        ctx.fill();
        
        // Draw game over message if game is over
        if (gameOver) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            
            ctx.font = '30px Arial';
            ctx.fillStyle = '#FFF';
            ctx.textAlign = 'center';
            ctx.fillText('Game Over!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 15);
            
            ctx.font = '20px Arial';
            ctx.fillText(`Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
            ctx.fillText('Press Restart to play again', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
        }
    }

    // Update game state
    function update() {
        if (gameOver) return;
        
        // Update direction from nextDirection
        direction = nextDirection;
        
        // Calculate new head position
        const head = { ...snake[0] };
        
        switch (direction) {
            case 'up':
                head.y -= 1;
                break;
            case 'down':
                head.y += 1;
                break;
            case 'left':
                head.x -= 1;
                break;
            case 'right':
                head.x += 1;
                break;
        }
        
        // Check for collisions
        if (
            // Wall collision
            head.x < 0 || head.x >= GRID_WIDTH ||
            head.y < 0 || head.y >= GRID_HEIGHT ||
            // Self collision
            snake.some(segment => segment.x === head.x && segment.y === head.y)
        ) {
            handleGameOver();
            return;
        }
        
        // Add new head
        snake.unshift(head);
        
        // Check if snake ate food
        if (head.x === food.x && head.y === food.y) {
            // Increase score
            score += 10;
            scoreElement.textContent = score;
            
            // Update high score if needed
            if (score > highScore) {
                highScore = score;
                highScoreElement.textContent = highScore;
                localStorage.setItem('snakeHighScore', highScore);
            }
            
            // Generate new food
            generateFood();
        } else {
            // Remove tail if no food was eaten
            snake.pop();
        }
        
        // Draw updated state
        draw();
    }

    // Handle game over
    function handleGameOver() {
        gameOver = true;
        gameRunning = false;
        clearInterval(gameInterval);
        draw(); // Draw final state with game over message
    }

    // Start game
    function startGame() {
        if (gameRunning) return;
        
        initGame();
        gameRunning = true;
        gameInterval = setInterval(update, GAME_SPEED);
    }

    // Restart game
    function restartGame() {
        initGame();
        if (gameRunning) {
            clearInterval(gameInterval);
        }
        gameRunning = true;
        gameInterval = setInterval(update, GAME_SPEED);
    }

    // Event listeners
    startBtn.addEventListener('click', startGame);
    restartBtn.addEventListener('click', restartGame);

    // Keyboard controls
    document.addEventListener('keydown', (e) => {
        // Prevent default behavior for arrow keys
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault();
        }
        
        // Update direction based on key press
        // Prevent 180-degree turns (can't go directly opposite of current direction)
        switch (e.key) {
            case 'ArrowUp':
                if (direction !== 'down') {
                    nextDirection = 'up';
                }
                break;
            case 'ArrowDown':
                if (direction !== 'up') {
                    nextDirection = 'down';
                }
                break;
            case 'ArrowLeft':
                if (direction !== 'right') {
                    nextDirection = 'left';
                }
                break;
            case 'ArrowRight':
                if (direction !== 'left') {
                    nextDirection = 'right';
                }
                break;
        }
    });

    // Initialize game on load
    initGame();
});