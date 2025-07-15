/**
 * Main entry point for the Pixel Platformer Game
 * This file coordinates the loading and initialization of all game components
 */

import { levelLoader } from './levels-firebase.js';  // Use Firebase version
import { audioManager } from './audio.js';
import { GameManager } from './game.js';
import { UIManager } from './ui.js';

// Create global reference to key components for debugging
window.levelLoader = levelLoader;  // Updated reference

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', async () => {
    console.log("Initializing game...");
    
    // Wait for Firebase to be ready
    let firebaseReady = false;
    const maxWaitTime = 5000; // 5 seconds
    const startTime = Date.now();
    
    while (!window.db && (Date.now() - startTime) < maxWaitTime) {
        await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    if (window.db) {
        console.log("Firebase is ready");
        firebaseReady = true;
    } else {
        console.warn("Firebase initialization timed out - proceeding with fallback");
    }

    // Initialize audio manager first
    audioManager.initialize();
    window.audioManager = audioManager;

    // Create game manager
    const gameManager = new GameManager();
    window.gameManager = gameManager;

    // Create UI manager with reference to game manager
    const uiManager = new UIManager(gameManager);
    gameManager.uiManager = uiManager;
    window.uiManager = uiManager;

    // Initialize level selection menu
    uiManager.initLevelSelectMenu();

    // Show the main menu
    gameManager.gameState.state = GameStates.MENU;
    uiManager.showMenu(GameStates.MENU);
    
    // Play menu music on startup
    audioManager.playMenuMusic();

    console.log("Game initialized with", levelLoader.getLevelCount(), "levels");  // Updated reference
});