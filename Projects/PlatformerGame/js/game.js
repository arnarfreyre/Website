/**
 * Game Manager
 * Handles game initialization, loop, and state management
 */
import { levelLoader } from './levels-firebase.js';
import { audioManager } from './audio.js';

class GameManager {
    /**
     * Initialize the game manager
     */
    constructor() {
        // Initialize canvas and subsystems
        this.canvas = document.getElementById('gameCanvas');
        this.renderer = new Renderer(this.canvas);

        // Will be set by app.js after construction
        this.uiManager = null;

        // Initialize debug panel
        this.debugPanel = null;
        if (window.DebugPanel) {
            this.debugPanel = new window.DebugPanel(this);
        }

        // Game state
        this.gameState = {
            player: null,
            currentLevel: null,
            levelStartTime: 0,
            levelTime: 0,
            deaths: 0,
            keys: {},
            state: GameStates.MENU,
            particles: []
        };

        // Game loop timing
        this.lastUpdateTime = 0;
        this.updateInterval = 1000 / 60; // Target 60 FPS
        this.accumulatedTime = 0;
        this.animationFrameId = null;

        // Initialize game
        this.checkForTestLevel();
        this.loadSettings();
        this.setupEventListeners();
    }

    /**
     * Check if a test level is specified in the URL
     */
    checkForTestLevel() {
        const urlParams = new URLSearchParams(window.location.search);
        const testLevel = urlParams.get('testLevel');
        const playOnline = urlParams.get('playOnline');

        if (playOnline) {
            // Playing an online level directly
            this.playOnlineLevelId = playOnline;
        } else if (testLevel === 'temp') {
            // Testing a temporary level from editor
            this.testTempLevel = true;
        } else if (testLevel !== null) {
            this.testLevelIndex = parseInt(testLevel);
        }
    }

    /**
     * Load game settings from storage
     */
    loadSettings() {
        try {
            let settings;
            if (window.gameStorage) {
                settings = window.gameStorage.loadSettings();
            } else {
                // Fallback to localStorage if GameStorage not available
                const savedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
                settings = savedSettings ? JSON.parse(savedSettings) : DEFAULT_SETTINGS;
            }
            this.updateSettings(settings);
        } catch (error) {
            console.error("Error loading settings:", error);
            this.updateSettings(DEFAULT_SETTINGS);
        }
    }

    /**
     * Update game settings
     * @param {Object} settings - The settings to apply
     */
    updateSettings(settings) {
        // Update renderer settings
        if (settings.showFPS !== undefined) {
            this.renderer.settings.showFPS = settings.showFPS;
        }

        if (settings.pixelPerfect !== undefined) {
            this.renderer.settings.pixelPerfect = settings.pixelPerfect;
            this.renderer.updateRenderSettings();
        }

        // Update audio settings
        audioManager.updateSettings(settings);

        // Update UI to reflect new settings (if UI manager exists)
        if (this.uiManager) {
            this.uiManager.loadSettingsIntoUI(settings);
        }
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Keyboard events for player control
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keyup', this.handleKeyUp.bind(this));

        // Pause when tab is not active
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.gameState.state === GameStates.PLAYING) {
                this.pauseGame();
            }
        });
    }

    /**
     * Handle key down events
     */
    handleKeyDown(e) {
        this.gameState.keys[e.key] = true;

        // Handle special keys
        switch (e.key) {
            case 'Escape':
                if (this.gameState.state === GameStates.PLAYING) {
                    this.pauseGame();
                } else if (this.gameState.state === GameStates.PAUSED) {
                    this.resumeGame();
                }
                break;
            case 'r':
                if (this.gameState.state === GameStates.PLAYING) {
                    this.restartLevel();
                }
                break;
        }
    }

    /**
     * Handle key up events
     */
    handleKeyUp(e) {
        this.gameState.keys[e.key] = false;
    }

    /**
     * Start the game
     */
    async startGame() {
        console.log("Starting game...");
        
        // Check for special level loading cases
        if (this.playOnlineLevelId) {
            // Load and play a specific online level
            await this.loadAndPlayOnlineLevel(this.playOnlineLevelId);
            return;
        } else if (this.testTempLevel) {
            // Load temporary test level from localStorage
            await this.loadTempTestLevel();
            return;
        }
        
        // Normal game start - ensure levels are loaded from Firebase
        await levelLoader.ensureLoaded();

        // If a test level was specified, start that level
        if (this.testLevelIndex !== undefined) {
            this.startLevel(this.testLevelIndex);
            // Don't clear testLevelIndex so it persists across deaths
        } else {
            this.startLevel(0); // Start from first level
        }
    }

    /**
     * Start a specific level
     * @param {number} levelIndex - The level index to start
     */
    startLevel(levelIndex) {
        console.log("Starting level:", levelIndex);

        if (!levelLoader.setCurrentLevel(levelIndex)) {
            console.error("Invalid level index:", levelIndex);
            return;
        }

        // When explicitly starting a level from level select, reset deaths counter
        if (this.gameState.state !== GameStates.PLAYING) {
            this.gameState.deaths = 0;
        }

        this.resetGameState();

        if (this.uiManager) {
            this.uiManager.hideAllMenus();
        }

        // Start game loop
        this.gameState.state = GameStates.PLAYING;
        this.lastUpdateTime = performance.now();
        this.accumulatedTime = 0;

        // Clear any existing animation frame
        this.cancelAnimationFrame();

        // Start the game loop
        this.gameLoop();

        // Start audio
        audioManager.initialize();
        audioManager.playGameMusic();
    }

    /**
     * Reset the game state for a new level
     */
    resetGameState() {
        // Get current level
        this.gameState.currentLevel = levelLoader.getCurrentLevel();

        // Find player start position
        const startPos = levelLoader.findPlayerStartPosition();

        // Create or reset player
        if (this.gameState.player) {
            this.gameState.player.reset(startPos.x, startPos.y);
        } else {
            this.gameState.player = new Player(startPos.x, startPos.y);
        }

        // Reset game state
        this.gameState.particles = [];
        this.gameState.levelStartTime = performance.now();
        this.gameState.levelTime = 0;

        // Update UI
        if (this.uiManager) {
            this.uiManager.updateGameUI(levelLoader.currentLevel, this.gameState.deaths, this.gameState.levelTime);
        }
    }

    /**
     * Pause the game
     */
    pauseGame() {
        if (this.gameState.state === GameStates.PLAYING) {
            this.gameState.state = GameStates.PAUSED;

            if (this.uiManager) {
                this.uiManager.showMenu(GameStates.PAUSED);
            }

            audioManager.pauseMusic();
            this.cancelAnimationFrame();
        }
    }

    /**
     * Resume the game
     */
    resumeGame() {
        if (this.gameState.state === GameStates.PAUSED) {
            this.gameState.state = GameStates.PLAYING;

            if (this.uiManager) {
                this.uiManager.hideAllMenus();
            }

            audioManager.resumeMusic();

            // Reset timing to avoid large jumps
            this.lastUpdateTime = performance.now();
            this.accumulatedTime = 0;

            // Restart the game loop
            this.gameLoop();
        }
    }

    /**
     * Cancel the current animation frame
     */
    cancelAnimationFrame() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    /**
     * Exit to main menu
     */
    exitToMainMenu() {
        this.gameState.state = GameStates.MENU;

        if (this.uiManager) {
            this.uiManager.showMenu(GameStates.MENU);
        }

        // Switch to menu music when returning to main menu
        audioManager.playMenuMusic();
        
        // Clear custom level state when returning to menu
        if (levelLoader.isPlayingCustomLevel) {
            levelLoader.isPlayingCustomLevel = false;
            levelLoader.customLevel = null;
        }
    }

    /**
     * Go to next level
     */
    nextLevel() {
        // Reset deaths counter when completing a level
        this.gameState.deaths = 0;

        if (levelLoader.currentLevel >= levelLoader.getLevelCount() - 1) {
            // No more levels, go back to menu
            this.exitToMainMenu();
        } else {
            levelLoader.nextLevel();
            this.startLevel(levelLoader.currentLevel);
        }
    }

    /**
     * Restart current level
     */
    restartLevel() {
        // If we're playing a custom level (online or temp), just reset the game state
        if (levelLoader.isPlayingCustomLevel) {
            this.resetGameState();
            
            // Restart game loop if needed
            if (this.gameState.state !== GameStates.PLAYING) {
                this.gameState.state = GameStates.PLAYING;
                this.lastUpdateTime = performance.now();
                this.accumulatedTime = 0;
                this.cancelAnimationFrame();
                this.gameLoop();
            }
        } else {
            // Normal level restart
            this.startLevel(levelLoader.currentLevel);
        }
    }

    /**
     * Handle player death
     */
    handlePlayerDeath() {
        // Increment death counter
        this.gameState.deaths++;

        // Update UI
        if (this.uiManager) {
            this.uiManager.updateGameUI(levelLoader.currentLevel, this.gameState.deaths, this.gameState.levelTime);
        }

        // Create death particles
        if (this.gameState.player) {
            this.gameState.player.createParticleEffect(this.gameState.particles, PARTICLE_TYPES.DEATH);
        }

        // Play death sound
        audioManager.playSound('death');

        // Reset level after a delay
        setTimeout(() => {
            this.resetGameState();
        }, 1000);
    }

    /**
     * Handle level completion
     */
    handleLevelComplete() {
        // Don't handle if already completed
        if (this.gameState.state === GameStates.LEVEL_COMPLETE) {
            return;
        }

        // Calculate level time
        this.gameState.levelTime = (performance.now() - this.gameState.levelStartTime) / 1000;

        // Set game state
        this.gameState.state = GameStates.LEVEL_COMPLETE;

        // Start player celebration effect and create goal particles
        if (this.gameState.player) {
            this.gameState.player.startCelebration();
            this.gameState.player.createGoalParticles(this.gameState.particles);
        }

        // Play completion sound
        audioManager.playSound('levelComplete');

        // Save best time if user is authenticated
        this.saveBestTime(levelLoader.currentLevel, this.gameState.levelTime);

        // Show level complete screen after a delay
        setTimeout(() => {
            if (this.uiManager) {
                this.uiManager.showLevelComplete(
                    this.gameState.deaths,
                    this.gameState.levelTime
                );
            }
        }, 1000); // Longer delay for celebration effect
    }

    /**
     * Update particles
     * @param {number} deltaTime - Time since last update in ms
     */
    updateParticles(deltaTime) {
        const timeScale = deltaTime / (1000 / 60); // Scale for 60 FPS

        for (let i = this.gameState.particles.length - 1; i >= 0; i--) {
            const particle = this.gameState.particles[i];

            // Update particle physics
            particle.x += particle.velX * timeScale;
            particle.y += particle.velY * timeScale;
            particle.velY += particle.gravity * timeScale;
            particle.life -= timeScale;

            // Remove dead particles
            if (particle.life <= 0) {
                this.gameState.particles.splice(i, 1);
            }
        }
    }

    /**
     * Main update function
     * @param {number} deltaTime - Time since last update in ms
     */
    update(deltaTime) {
        if (this.gameState.state !== GameStates.PLAYING) return;

        // Update level time
        this.gameState.levelTime = (performance.now() - this.gameState.levelStartTime) / 1000;

        // Update UI with current time
        if (this.uiManager) {
            this.uiManager.updateGameUI(levelLoader.currentLevel, this.gameState.deaths, this.gameState.levelTime);
        }

        // Update player
        this.gameState.player.update(
            this.gameState.currentLevel,
            this.gameState.keys,
            this.gameState.particles,
            deltaTime
        );

        // Update particles
        this.updateParticles(deltaTime);

        // Check for level completion
        if (this.gameState.player &&
            this.gameState.player.alive &&
            this.gameState.player.isOnGoal(this.gameState.currentLevel)) {
            this.handleLevelComplete();
        }

        // Generate ice particles if player is moving on ice
        if (this.gameState.player &&
            this.gameState.player.onIce &&
            Math.abs(this.gameState.player.velX) > 5 &&
            this.gameState.player.grounded) {
            // Randomly generate ice slide particles
            if (Math.random() < 0.2) { // 20% chance each frame
                this.gameState.player.createParticleEffect(
                    this.gameState.particles,
                    PARTICLE_TYPES.ICE_SLIDE
                );
            }
        }
    }

    /**
     * Main game loop with fixed timestep
     */
    gameLoop() {
        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastUpdateTime;
        this.lastUpdateTime = currentTime;

        // Accumulate time since last frame
        this.accumulatedTime += deltaTime;

        // Fixed timestep loop with catch-up
        const maxUpdates = 5; // Prevent spiral of death
        let updateCount = 0;

        while (this.accumulatedTime >= this.updateInterval && updateCount < maxUpdates) {
            this.update(this.updateInterval);
            this.accumulatedTime -= this.updateInterval;
            updateCount++;
        }

        // If we hit max updates, drop accumulated time to prevent lag
        if (updateCount >= maxUpdates) {
            this.accumulatedTime = 0;
        }

        // Add delta time to game state for debug purposes
        this.gameState.deltaTime = deltaTime;
        
        // Render current state
        this.renderer.render(this.gameState);

        // Continue game loop if playing
        if (this.gameState.state === GameStates.PLAYING) {
            this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
        }
    }

    /**
     * Load and play a specific online level
     * @param {string} levelId - The Firebase document ID of the online level
     */
    async loadAndPlayOnlineLevel(levelId) {
        try {
            console.log("Loading online level:", levelId);
            
            // Load the level from Firebase
            const doc = await window.db.collection('levels').doc(levelId).get();
            
            if (!doc.exists) {
                console.error("Online level not found:", levelId);
                alert("Level not found!");
                return;
            }
            
            const levelData = doc.data();
            
            // Parse the level grid
            let grid;
            if (levelData.data) {
                grid = typeof levelData.data === 'string' ? JSON.parse(levelData.data) : levelData.data;
            } else if (levelData.grid) {
                grid = typeof levelData.grid === 'string' ? JSON.parse(levelData.grid) : levelData.grid;
            } else {
                console.error("No level data found");
                alert("Invalid level data!");
                return;
            }
            
            // Parse rotation data if available
            let rotationData = null;
            if (levelData.rotationData) {
                rotationData = typeof levelData.rotationData === 'string' ? 
                    JSON.parse(levelData.rotationData) : levelData.rotationData;
            }
            
            // Parse player start position if available
            let playerStart = null;
            if (levelData.playerStart) {
                // playerStart is stored as an object, not a string
                playerStart = levelData.playerStart;
            } else if (levelData.startPosition) {
                playerStart = levelData.startPosition;
            }
            
            // Create a temporary level object
            const tempLevel = {
                grid: grid,
                rotationData: rotationData,
                playerStart: playerStart,
                name: levelData.name || 'Online Level'
            };
            
            // Store it in the level loader's memory
            levelLoader.customLevel = tempLevel;
            levelLoader.isPlayingCustomLevel = true;
            
            // Set the current level
            this.gameState.currentLevel = grid;
            
            // Find player start position
            let startPos;
            if (playerStart && playerStart.x !== undefined && playerStart.y !== undefined) {
                console.log("Using saved player start position:", playerStart);
                startPos = {
                    x: playerStart.x * TILE_SIZE,
                    y: playerStart.y * TILE_SIZE
                };
            } else {
                // Search for player tile in the grid
                console.log("No player start position found, using default");
                startPos = { x: TILE_SIZE, y: TILE_SIZE };
                for (let y = 0; y < grid.length; y++) {
                    for (let x = 0; x < grid[y].length; x++) {
                        if (grid[y][x] === 9) {
                            startPos = { x: x * TILE_SIZE, y: y * TILE_SIZE };
                            break;
                        }
                    }
                }
            }
            
            // Create or reset player
            if (this.gameState.player) {
                this.gameState.player.reset(startPos.x, startPos.y);
            } else {
                this.gameState.player = new Player(startPos.x, startPos.y);
            }
            
            // Reset game state
            this.gameState.particles = [];
            this.gameState.levelStartTime = performance.now();
            this.gameState.levelTime = 0;
            this.gameState.deaths = 0;
            
            // Hide menus and start game
            if (this.uiManager) {
                this.uiManager.hideAllMenus();
            }
            
            // Start game loop
            this.gameState.state = GameStates.PLAYING;
            this.lastUpdateTime = performance.now();
            this.accumulatedTime = 0;
            
            // Clear any existing animation frame
            this.cancelAnimationFrame();
            
            // Start the game loop
            this.gameLoop();
            
            // Start audio
            audioManager.initialize();
            audioManager.playGameMusic();
            
        } catch (error) {
            console.error("Error loading online level:", error);
            alert("Failed to load level: " + error.message);
        }
    }

    /**
     * Load and play a temporary test level from localStorage
     */
    async loadTempTestLevel() {
        try {
            console.log("Loading temporary test level");
            
            // Get the level from storage
            const tempLevelData = window.gameStorage ? 
                window.gameStorage.getTempTestLevel() : 
                JSON.parse(localStorage.getItem('tempTestLevel') || 'null');
            
            if (!tempLevelData) {
                console.error("No temporary test level found");
                alert("No test level found!");
                return;
            }
            
            const levelData = JSON.parse(tempLevelData);
            
            // Parse the level grid
            let grid = levelData.grid;
            if (typeof grid === 'string') {
                grid = JSON.parse(grid);
            }
            
            // Create a temporary level object
            const tempLevel = {
                grid: grid,
                rotationData: levelData.rotationData,
                playerStart: levelData.playerStart || levelData.startPosition,
                name: levelData.name || 'Test Level'
            };
            
            // Store it in the level loader's memory
            levelLoader.customLevel = tempLevel;
            levelLoader.isPlayingCustomLevel = true;
            
            // Set the current level
            this.gameState.currentLevel = grid;
            
            // Find player start position
            let startPos;
            if (levelData.playerStart && levelData.playerStart.x !== undefined && levelData.playerStart.y !== undefined) {
                console.log("Using saved player start position:", levelData.playerStart);
                startPos = {
                    x: levelData.playerStart.x * TILE_SIZE,
                    y: levelData.playerStart.y * TILE_SIZE
                };
            } else {
                // Search for player tile in the grid
                console.log("No player start position found, using default");
                startPos = { x: TILE_SIZE, y: TILE_SIZE };
                for (let y = 0; y < grid.length; y++) {
                    for (let x = 0; x < grid[y].length; x++) {
                        if (grid[y][x] === 9) {
                            startPos = { x: x * TILE_SIZE, y: y * TILE_SIZE };
                            break;
                        }
                    }
                }
            }
            
            // Create or reset player
            if (this.gameState.player) {
                this.gameState.player.reset(startPos.x, startPos.y);
            } else {
                this.gameState.player = new Player(startPos.x, startPos.y);
            }
            
            // Reset game state
            this.gameState.particles = [];
            this.gameState.levelStartTime = performance.now();
            this.gameState.levelTime = 0;
            this.gameState.deaths = 0;
            
            // Hide menus and start game
            if (this.uiManager) {
                this.uiManager.hideAllMenus();
            }
            
            // Start game loop
            this.gameState.state = GameStates.PLAYING;
            this.lastUpdateTime = performance.now();
            this.accumulatedTime = 0;
            
            // Clear any existing animation frame
            this.cancelAnimationFrame();
            
            // Start the game loop
            this.gameLoop();
            
            // Start audio
            audioManager.initialize();
            audioManager.playGameMusic();
            
            // Clear the temp level from storage after loading
            if (window.gameStorage) {
                window.gameStorage.removeTempTestLevel();
            } else {
                localStorage.removeItem('tempTestLevel');
            }
            
        } catch (error) {
            console.error("Error loading temp test level:", error);
            alert("Failed to load test level: " + error.message);
        }
    }

    /**
     * Save best time for a level if user is authenticated
     * @param {number|string} levelIdentifier - The level index for default levels or level ID for online levels
     * @param {number} time - The completion time in seconds
     */
    async saveBestTime(levelIdentifier, time) {
        try {
            // Check if user is authenticated
            if (!window.authManager || !window.authManager.currentUser) {
                return; // Skip if not authenticated
            }

            const userId = window.authManager.currentUser.uid;
            const userRef = window.db.collection('users').doc(userId);
            
            // Get current user data
            const userDoc = await userRef.get();
            const userData = userDoc.exists ? userDoc.data() : {};
            
            // Initialize bestTimes object if it doesn't exist
            const bestTimes = userData.bestTimes || {};
            
            // Determine the level key based on whether it's a custom/online level
            let levelKey;
            if (levelLoader.isPlayingCustomLevel && this.playOnlineLevelId) {
                // Online level - use the level ID
                levelKey = `online_${this.playOnlineLevelId}`;
            } else if (typeof levelIdentifier === 'number') {
                // Default level - use index
                levelKey = `level_${levelIdentifier}`;
            } else {
                // Custom level with ID
                levelKey = `custom_${levelIdentifier}`;
            }
            
            const currentBest = bestTimes[levelKey];
            
            if (!currentBest || time < currentBest) {
                // Update best time
                bestTimes[levelKey] = time;
                
                // Save to Firestore
                await userRef.update({
                    bestTimes: bestTimes,
                    lastPlayed: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                console.log(`New best time for ${levelKey}: ${time.toFixed(2)}s`);
                
                // Show a visual notification to the user
                if (!currentBest) {
                    this.showBestTimeNotification('First completion! Time: ' + this.formatTime(time));
                } else {
                    const improvement = currentBest - time;
                    this.showBestTimeNotification(`New best time! Improved by ${improvement.toFixed(2)}s`);
                }
            }
        } catch (error) {
            console.error('Error saving best time:', error);
            // Don't interrupt gameplay if saving fails
        }
    }

    /**
     * Get best time for a level
     * @param {number|string} levelIdentifier - The level index for default levels or level ID for online levels
     * @returns {Promise<number|null>} The best time or null if none exists
     */
    async getBestTime(levelIdentifier) {
        try {
            if (!window.authManager || !window.authManager.currentUser) {
                return null;
            }

            const userId = window.authManager.currentUser.uid;
            const userDoc = await window.db.collection('users').doc(userId).get();
            
            if (userDoc.exists) {
                const userData = userDoc.data();
                const bestTimes = userData.bestTimes || {};
                
                // Determine the level key based on whether it's a custom/online level
                let levelKey;
                if (levelLoader.isPlayingCustomLevel && this.playOnlineLevelId) {
                    // Online level - use the level ID
                    levelKey = `online_${this.playOnlineLevelId}`;
                } else if (typeof levelIdentifier === 'number') {
                    // Default level - use index
                    levelKey = `level_${levelIdentifier}`;
                } else {
                    // Custom level with ID
                    levelKey = `custom_${levelIdentifier}`;
                }
                
                return bestTimes[levelKey] || null;
            }
            
            return null;
        } catch (error) {
            console.error('Error getting best time:', error);
            return null;
        }
    }
    
    /**
     * Format time in MM:SS format
     * @param {number} timeInSeconds - Time in seconds
     * @returns {string} Formatted time string
     */
    formatTime(timeInSeconds) {
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = Math.floor(timeInSeconds % 60);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    /**
     * Show best time notification
     * @param {string} message - The notification message
     */
    showBestTimeNotification(message) {
        // Create notification element
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            left: 50%;
            transform: translateX(-50%);
            background-color: #4c6baf;
            color: white;
            padding: 15px 30px;
            border-radius: 5px;
            font-size: 18px;
            font-weight: bold;
            z-index: 1000;
            animation: slideDown 0.3s ease-out;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
        `;
        notification.textContent = message;
        
        // Add animation keyframes
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideDown {
                from {
                    transform: translate(-50%, -100px);
                    opacity: 0;
                }
                to {
                    transform: translate(-50%, 0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
        
        // Add to document
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideDown 0.3s ease-out reverse';
            setTimeout(() => {
                notification.remove();
                style.remove();
            }, 300);
        }, 3000);
    }
}

// Export the GameManager class
export { GameManager };