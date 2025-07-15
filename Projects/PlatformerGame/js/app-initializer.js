// app-initializer.js - Optimized application initialization with preloading

class AppInitializer {
    constructor() {
        this.loadingStages = {
            utils: false,
            assets: false,
            firebase: false,
            game: false
        };
        this.startTime = performance.now();
    }

    // Main initialization method
    async initialize() {
        try {
            console.log('Starting optimized app initialization...');
            
            // Show loading screen
            this.showLoadingScreen();
            
            // Stage 1: Load utilities (parallel loading)
            await this.loadUtilities();
            
            // Stage 2: Initialize Firebase
            await this.initializeFirebase();
            
            // Stage 3: Preload assets
            await this.preloadAssets();
            
            // Stage 4: Initialize game systems
            await this.initializeGameSystems();
            
            // Hide loading screen
            this.hideLoadingScreen();
            
            const loadTime = ((performance.now() - this.startTime) / 1000).toFixed(2);
            console.log(`App initialized in ${loadTime} seconds`);
            
            return true;
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showError('Failed to load game. Please refresh the page.');
            return false;
        }
    }

    // Load utility modules
    async loadUtilities() {
        console.log('Loading utilities...');
        
        // These should be loaded via script tags, but we'll verify they exist
        const requiredUtils = [
            'DOMHelpers',
            'EventHelpers',
            'StorageManager',
            'FirebaseHelpers',
            'AssetPreloader'
        ];
        
        const missing = requiredUtils.filter(util => !window[util]);
        
        if (missing.length > 0) {
            throw new Error(`Missing utilities: ${missing.join(', ')}`);
        }
        
        this.loadingStages.utils = true;
        this.updateLoadingProgress(20);
    }

    // Initialize Firebase
    async initializeFirebase() {
        console.log('Initializing Firebase...');
        
        // Wait for Firebase to be ready
        if (window.firebaseInitPromise) {
            await window.firebaseInitPromise;
        }
        
        // Verify Firebase is initialized
        if (!window.firebase || !window.db) {
            throw new Error('Firebase not initialized');
        }
        
        this.loadingStages.firebase = true;
        this.updateLoadingProgress(40);
    }

    // Preload all game assets
    async preloadAssets() {
        console.log('Preloading assets...');
        
        const preloader = new AssetPreloader();
        
        // Track loading progress
        preloader.onProgress = (progress, loaded, total) => {
            // Map asset loading progress from 40% to 80%
            const mappedProgress = 40 + (progress * 0.4);
            this.updateLoadingProgress(mappedProgress);
        };
        
        // Define all assets to preload
        const audioAssets = [
            { id: 'jump', src: 'audio/jump.mp3' },
            { id: 'death', src: 'audio/death.mp3' },
            { id: 'levelComplete', src: 'audio/level_complete.mp3' },
            { id: 'bgMusic', src: 'audio/background_music.mp3', loop: true },
            { id: 'menuMusic', src: 'audio/HomeScreen.mp3', loop: true }
        ];
        
        // Preload audio
        await preloader.preloadAudio(audioAssets);
        
        // Store preloader for game systems
        window.assetPreloader = preloader;
        
        this.loadingStages.assets = true;
        this.updateLoadingProgress(80);
    }

    // Initialize game systems
    async initializeGameSystems() {
        console.log('Initializing game systems...');
        
        // Initialize optimized systems
        window.audioManager = new OptimizedAudioManager();
        await window.audioManager.initialize();
        
        // Initialize other managers with optimizations
        this.initializeOptimizedManagers();
        
        this.loadingStages.game = true;
        this.updateLoadingProgress(100);
    }

    // Initialize optimized managers
    initializeOptimizedManagers() {
        // Example of how to create optimized UI manager
        class OptimizedUIManager {
            constructor() {
                // Cache DOM elements
                this.elements = DOMHelpers.getElements([
                    'mainMenu',
                    'gameCanvas',
                    'pauseMenu',
                    'gameOverMenu',
                    'levelSelectMenu',
                    'settingsMenu',
                    'onlineLevelsMenu'
                ]);
                
                // Use event delegation for better performance
                this.setupEventDelegation();
            }
            
            setupEventDelegation() {
                // Use event delegation for menu buttons
                EventHelpers.delegate(document.body, '.menu-button', 'click', (e) => {
                    const action = e.target.dataset.action;
                    this.handleMenuAction(action);
                });
                
                // Use debounced resize handler
                EventHelpers.on(window, 'resize', 
                    EventHelpers.debounce(() => this.handleResize(), 250)
                );
            }
            
            handleMenuAction(action) {
                // Handle menu actions
                console.log('Menu action:', action);
            }
            
            handleResize() {
                // Handle window resize
                console.log('Window resized');
            }
            
            showMenu(menuId) {
                // Hide all menus
                Object.values(this.elements).forEach(el => {
                    if (el) DOMHelpers.hide(el);
                });
                
                // Show specific menu
                DOMHelpers.show(this.elements[menuId], 'flex');
            }
        }
        
        // Create instances
        window.uiManager = new OptimizedUIManager();
    }

    // Show loading screen
    showLoadingScreen() {
        const loadingScreen = DOMHelpers.createElement('div', {
            id: 'optimizedLoadingScreen',
            style: {
                position: 'fixed',
                top: '0',
                left: '0',
                width: '100%',
                height: '100%',
                backgroundColor: '#1a1a2e',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: '10000',
                color: '#fff',
                fontFamily: 'monospace'
            }
        });
        
        loadingScreen.innerHTML = `
            <h1 style="margin-bottom: 30px; font-size: 2.5em;">Pixel Platformer</h1>
            <div style="width: 300px; height: 20px; background: #333; border-radius: 10px; overflow: hidden;">
                <div id="loadingBar" style="width: 0%; height: 100%; background: #4CAF50; transition: width 0.3s;"></div>
            </div>
            <p id="loadingText" style="margin-top: 20px;">Initializing...</p>
            <div id="loadingDetails" style="margin-top: 10px; font-size: 0.9em; color: #888;"></div>
        `;
        
        document.body.appendChild(loadingScreen);
    }

    // Update loading progress
    updateLoadingProgress(percentage) {
        const loadingBar = DOMHelpers.getElement('loadingBar');
        const loadingText = DOMHelpers.getElement('loadingText');
        const loadingDetails = DOMHelpers.getElement('loadingDetails');
        
        if (loadingBar) {
            loadingBar.style.width = `${percentage}%`;
        }
        
        if (loadingText) {
            const messages = {
                20: 'Loading utilities...',
                40: 'Connecting to server...',
                60: 'Loading game assets...',
                80: 'Preparing game...',
                100: 'Ready!'
            };
            
            const message = messages[Math.floor(percentage / 20) * 20] || 'Loading...';
            loadingText.textContent = message;
        }
        
        if (loadingDetails) {
            const completed = Object.entries(this.loadingStages)
                .filter(([_, done]) => done)
                .map(([stage, _]) => stage);
            
            loadingDetails.textContent = completed.length > 0 
                ? `Loaded: ${completed.join(', ')}` 
                : '';
        }
    }

    // Hide loading screen
    hideLoadingScreen() {
        const loadingScreen = DOMHelpers.getElement('optimizedLoadingScreen');
        if (loadingScreen) {
            // Fade out animation
            loadingScreen.style.transition = 'opacity 0.5s';
            loadingScreen.style.opacity = '0';
            
            setTimeout(() => {
                DOMHelpers.remove(loadingScreen);
            }, 500);
        }
    }

    // Show error message
    showError(message) {
        const errorDiv = DOMHelpers.createElement('div', {
            style: {
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                background: '#f44336',
                color: 'white',
                padding: '20px',
                borderRadius: '5px',
                zIndex: '10001'
            }
        });
        
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
    }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', async () => {
        window.appInitializer = new AppInitializer();
        await window.appInitializer.initialize();
    });
} else {
    // DOM already loaded
    window.appInitializer = new AppInitializer();
    window.appInitializer.initialize();
}

// Export for use
window.AppInitializer = AppInitializer;