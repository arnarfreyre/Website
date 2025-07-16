/**
 * UI Manager for handling menu interactions and UI updates
 */
import { levelLoader } from './levels-firebase.js';
import { audioManager } from './audio.js';

class UIManager {
    constructor(gameManagerRef) {
        // Store reference to game manager
        this.gameManager = gameManagerRef;

        // UI elements
        this.uiElement = document.getElementById('ui');
        this.mainMenu = document.getElementById('mainMenu');
        this.levelSelectMenu = document.getElementById('levelSelectMenu');
        this.settingsMenu = document.getElementById('settingsMenu');
        this.gameOverMenu = document.getElementById('gameOverMenu');
        this.pauseMenu = document.getElementById('pauseMenu');
        this.levelButtons = document.getElementById('levelButtons');

        // Buttons
        this.playButton = document.getElementById('playButton');
        this.levelSelectButton = document.getElementById('levelSelectButton');
        this.settingsButton = document.getElementById('settingsButton');
        this.levelEditorButton = document.getElementById('levelEditorButton');
        this.myAccountButton = document.getElementById('myAccountButton');
        this.backFromLevelSelect = document.getElementById('backFromLevelSelect');
        this.backFromSettings = document.getElementById('backFromSettings');
        this.nextLevelButton = document.getElementById('nextLevelButton');
        this.restartButton = document.getElementById('restartButton');
        this.menuButton = document.getElementById('menuButton');
        this.resumeButton = document.getElementById('resumeButton');
        this.restartFromPause = document.getElementById('restartFromPause');
        this.settingsFromPause = document.getElementById('settingsFromPause');
        this.exitToMenu = document.getElementById('exitToMenu');
        this.onlineLevelsButton = document.getElementById('onlineLevelsButton');

        // Settings elements
        this.musicVolumeSlider = document.getElementById('musicVolume');
        this.musicVolumeValue = document.getElementById('musicVolumeValue');
        this.sfxVolumeSlider = document.getElementById('sfxVolume');
        this.sfxVolumeValue = document.getElementById('sfxVolumeValue');
        this.showFPSCheckbox = document.getElementById('showFPS');
        this.pixelPerfectCheckbox = document.getElementById('pixelPerfect');

        // Game over menu elements
        this.levelCompleteText = document.getElementById('levelCompleteText');
        this.levelDeaths = document.getElementById('levelDeaths');
        this.levelTime = document.getElementById('levelTime');

        this.setupEventListeners();

        this.onlineLevelsButton = document.getElementById('onlineLevelsButton');

        // Initialize online browser
        this.onlineBrowser = null;
    }

    setupEventListeners() {
        // Main menu buttons
        if (this.playButton) {
            this.playButton.addEventListener('click', () => {
                if (this.gameManager) {
                    this.gameManager.startGame();
                } else {
                    console.error("GameManager reference not found");
                }
            });
        }

        if (this.levelSelectButton) {
            this.levelSelectButton.addEventListener('click', () => this.showMenu(GameStates.LEVEL_SELECT));
        }

        if (this.settingsButton) {
            this.settingsButton.addEventListener('click', () => this.showMenu(GameStates.SETTINGS));
        }

        if (this.levelEditorButton) {
            this.levelEditorButton.addEventListener('click', () => this.openLevelEditor());
        }

        if (this.myAccountButton) {
            this.myAccountButton.addEventListener('click', () => {
                // Navigate to accounts page
                window.location.href = 'accounts.html';
            });
        }

        // Level select menu
        if (this.backFromLevelSelect) {
            this.backFromLevelSelect.addEventListener('click', () => this.showMenu(GameStates.MENU));
        }

        // Settings menu
        if (this.backFromSettings) {
            this.backFromSettings.addEventListener('click', () => {
                // Save settings before returning
                this.saveSettings();
                this.showPreviousMenu();
            });
        }

        // Game over menu
        if (this.nextLevelButton) {
            this.nextLevelButton.addEventListener('click', () => this.gameManager.nextLevel());
        }

        if (this.restartButton) {
            this.restartButton.addEventListener('click', () => this.gameManager.restartLevel());
        }

        if (this.menuButton) {
            this.menuButton.addEventListener('click', () => this.gameManager.exitToMainMenu());
        }

        // Pause menu
        if (this.resumeButton) {
            this.resumeButton.addEventListener('click', () => this.gameManager.resumeGame());
        }

        if (this.restartFromPause) {
            this.restartFromPause.addEventListener('click', () => this.gameManager.restartLevel());
        }

        if (this.settingsFromPause) {
            this.settingsFromPause.addEventListener('click', () => this.showMenu(GameStates.SETTINGS));
        }

        if (this.exitToMenu) {
            this.exitToMenu.addEventListener('click', () => this.gameManager.exitToMainMenu());
        }

        // Settings controls
        if (this.musicVolumeSlider) {
            this.musicVolumeSlider.addEventListener('input', () => this.updateVolumeDisplay());
        }

        if (this.sfxVolumeSlider) {
            this.sfxVolumeSlider.addEventListener('input', () => this.updateVolumeDisplay());
        }
        if (this.onlineLevelsButton) {
            this.onlineLevelsButton.addEventListener('click', () => {
                this.showOnlineLevels();
            });
        }
        
        // Back button for online levels
        const backFromOnlineLevels = document.getElementById('backFromOnlineLevels');
        if (backFromOnlineLevels) {
            backFromOnlineLevels.addEventListener('click', () => {
                this.showMenu(GameStates.MENU);
            });
        }
    }

    showOnlineLevels() {
    // Initialize auth manager if needed
    if (window.authManager && !window.authManager.initialized) {
        window.authManager.init();
    }
    
    if (!this.onlineBrowser) {
        this.onlineBrowser = new window.OnlineLevelBrowser(this, this.gameManager);
        // Make it globally accessible for onclick handlers
        window.onlineLevelBrowser = this.onlineBrowser;
    }

    this.hideAllMenus();
    this.onlineBrowser.show();
    }
    // Initialize the level select menu with buttons for each level
    async initLevelSelectMenu() {
        console.log("Initializing level select menu");
        if (!this.levelButtons) {
            console.error("Level buttons container not found");
            return;
        }

        // Show loading message
        this.levelButtons.innerHTML = '<p style="text-align: center; color: #6d8ad0;">Loading levels...</p>';

        // Make sure levelLoader is available
        if (!levelLoader) {
            console.error("Level manager not available");
            return;
        }
        
        // Ensure levels are loaded from Firebase
        await levelLoader.ensureLoaded();
        
        // Clear loading message
        this.levelButtons.innerHTML = '';

        const levelCount = levelLoader.getLevelCount();

        // Log level count for debugging
        console.log(`Initializing level select menu with ${levelCount} levels`);
        console.log(`Unlocked levels: ${levelLoader.unlockedLevels}`);

        for (let i = 0; i < levelCount; i++) {
            const levelButton = document.createElement('button');
            levelButton.className = 'level-button';
            levelButton.textContent = (i + 1).toString();
            levelButton.title = levelLoader.levelNames[i] || `Level ${i + 1}`;
            
            // Mark default levels
            if (i < levelLoader.defaultLevelCount) {
                levelButton.classList.add('default-level');
            }

            // Add classes based on level status
            if (!levelLoader.isLevelUnlocked(i)) {
                levelButton.classList.add('locked');
                levelButton.title += ' (Locked)';
            } else {
                // Add a click handler for unlocked levels
                levelButton.addEventListener('click', () => {
                    this.gameManager.startLevel(i);
                });
            }

            this.levelButtons.appendChild(levelButton);
        }
    }

    // Update volume display values
    updateVolumeDisplay() {
        if (this.musicVolumeValue && this.sfxVolumeValue) {
            this.musicVolumeValue.textContent = `${this.musicVolumeSlider.value}%`;
            this.sfxVolumeValue.textContent = `${this.sfxVolumeSlider.value}%`;

            // Update audio settings in real-time
            audioManager.updateSettings({
                musicVolume: parseInt(this.musicVolumeSlider.value),
                sfxVolume: parseInt(this.sfxVolumeSlider.value)
            });
        }
    }

    // Load settings into UI elements
    loadSettingsIntoUI(settings) {
        if (!settings) return;

        if (this.musicVolumeSlider) this.musicVolumeSlider.value = settings.musicVolume;
        if (this.sfxVolumeSlider) this.sfxVolumeSlider.value = settings.sfxVolume;
        if (this.showFPSCheckbox) this.showFPSCheckbox.checked = settings.showFPS;
        if (this.pixelPerfectCheckbox) this.pixelPerfectCheckbox.checked = settings.pixelPerfect;

        this.updateVolumeDisplay();
    }

    // Save settings from UI elements
    saveSettings() {
        const newSettings = {
            musicVolume: parseInt(this.musicVolumeSlider.value),
            sfxVolume: parseInt(this.sfxVolumeSlider.value),
            showFPS: this.showFPSCheckbox.checked,
            pixelPerfect: this.pixelPerfectCheckbox.checked
        };

        // Update game manager settings
        this.gameManager.updateSettings(newSettings);

        // Save to storage using GameStorage
        if (window.gameStorage) {
            window.gameStorage.saveSettings(newSettings);
        } else {
            // Fallback to localStorage if GameStorage not available
            localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));
        }
    }

    // Show specific menu
    showMenu(menuState) {
        // Hide all menus first
        this.hideAllMenus();

        // Show the requested menu
        switch (menuState) {
            case GameStates.MENU:
                if (this.mainMenu) this.mainMenu.style.display = 'flex';
                // Play menu music when showing main menu
                audioManager.playMenuMusic();
                break;
            case GameStates.LEVEL_SELECT:
                this.initLevelSelectMenu();
                if (this.levelSelectMenu) this.levelSelectMenu.style.display = 'flex';
                break;
            case GameStates.SETTINGS:
                if (this.settingsMenu) this.settingsMenu.style.display = 'flex';
                break;
            case GameStates.GAME_OVER:
                if (this.gameOverMenu) this.gameOverMenu.style.display = 'flex';
                break;
            case GameStates.PAUSED:
                if (this.pauseMenu) this.pauseMenu.style.display = 'flex';
                break;
        }
    }

    // Show previous menu (usually after settings)
    showPreviousMenu() {
        if (this.gameManager.gameState.state === GameStates.PLAYING ||
            this.gameManager.gameState.state === GameStates.PAUSED) {
            this.showMenu(GameStates.PAUSED);
        } else {
            this.showMenu(GameStates.MENU);
        }
    }

    // Hide all menus (for starting the game)
    hideAllMenus() {
        if (this.mainMenu) this.mainMenu.style.display = 'none';
        if (this.levelSelectMenu) this.levelSelectMenu.style.display = 'none';
        if (this.settingsMenu) this.settingsMenu.style.display = 'none';
        if (this.gameOverMenu) this.gameOverMenu.style.display = 'none';
        if (this.pauseMenu) this.pauseMenu.style.display = 'none';
        
        // Hide online levels menu
        const onlineLevelsMenu = document.getElementById('onlineLevelsMenu');
        if (onlineLevelsMenu) onlineLevelsMenu.style.display = 'none';
    }

    openLevelEditor() {
        window.location.href = 'level-editor.html';
    }

    openMyAccount() {
        window.location.href = 'accounts.html';
    }

    // Show level complete screen
    showLevelComplete(deaths, timeInSeconds) {
        if (this.levelCompleteText) {
            this.levelCompleteText.textContent = `Level ${levelLoader.currentLevel + 1} Complete!`;
        }

        if (this.levelDeaths) {
            this.levelDeaths.textContent = deaths;
        }

        // Format time as MM:SS
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = Math.floor(timeInSeconds % 60);

        if (this.levelTime) {
            this.levelTime.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }

        // If this is the last level, change the next button text
        if (this.nextLevelButton) {
            if (levelLoader.currentLevel >= levelLoader.getLevelCount() - 1) {
                this.nextLevelButton.textContent = 'Back to Menu';
            } else {
                this.nextLevelButton.textContent = 'Next Level';
            }
        }

        // Show the game over menu
        this.showMenu(GameStates.GAME_OVER);
    }

    // Update in-game UI
    updateGameUI(levelIndex, deaths, timeInSeconds = 0) {
        if (this.uiElement) {
            // Format time as MM:SS
            const minutes = Math.floor(timeInSeconds / 60);
            const seconds = Math.floor(timeInSeconds % 60);
            const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            this.uiElement.textContent = `Level: ${levelIndex + 1} | Deaths: ${deaths} | Time: ${timeString}`;
        }
    }
}

// Export the UIManager class
export { UIManager };