// audio-optimized.js - Optimized audio management using AssetPreloader

class OptimizedAudioManager {
    constructor() {
        this.preloader = new AssetPreloader();
        this.settings = {
            musicEnabled: true,
            soundEnabled: true,
            musicVolume: 0.3,
            soundVolume: 0.5
        };
        this.currentMusic = null;
        this.soundPool = new Map(); // Pool for sound effects
        this.initialized = false;
    }

    // Initialize and preload all audio assets
    async initialize() {
        if (this.initialized) return;

        // Define audio assets
        const audioAssets = [
            { id: 'jump', src: 'audio/jump.mp3' },
            { id: 'death', src: 'audio/death.mp3' },
            { id: 'levelComplete', src: 'audio/level_complete.mp3' },
            { id: 'bgMusic', src: 'audio/background_music.mp3', loop: true },
            { id: 'menuMusic', src: 'audio/HomeScreen.mp3', loop: true }
        ];

        // Set up progress tracking
        this.preloader.onProgress = (progress, loaded, total) => {
            console.log(`Loading audio: ${loaded}/${total} (${progress.toFixed(1)}%)`);
        };

        try {
            // Preload all audio
            await this.preloader.preloadAudio(audioAssets);
            
            // Load settings from storage
            this.loadSettings();
            
            // Apply initial volumes
            this.applyVolumeSettings();
            
            this.initialized = true;
            console.log('Audio manager initialized successfully');
        } catch (error) {
            console.error('Failed to initialize audio:', error);
        }
    }

    // Load settings from storage
    loadSettings() {
        const saved = window.storageManager?.get('audioSettings');
        if (saved) {
            Object.assign(this.settings, saved);
        }
    }

    // Save settings to storage
    saveSettings() {
        window.storageManager?.set('audioSettings', this.settings);
    }

    // Apply volume settings to all audio
    applyVolumeSettings() {
        // Apply to preloaded audio
        this.preloader.assets.audio.forEach((audio, id) => {
            if (id.includes('Music')) {
                audio.volume = this.settings.musicVolume;
            } else {
                audio.volume = this.settings.soundVolume;
            }
        });
    }

    // Play sound effect
    playSound(soundId) {
        if (!this.settings.soundEnabled || !this.initialized) return;

        try {
            // Get or create a pooled audio instance
            let audio = this.getPooledSound(soundId);
            
            if (audio) {
                audio.currentTime = 0;
                audio.volume = this.settings.soundVolume;
                audio.play().catch(e => console.warn(`Failed to play ${soundId}:`, e));
            }
        } catch (error) {
            console.error(`Error playing sound ${soundId}:`, error);
        }
    }

    // Get pooled sound instance
    getPooledSound(soundId) {
        // Check if we have a free instance in the pool
        if (!this.soundPool.has(soundId)) {
            this.soundPool.set(soundId, []);
        }

        const pool = this.soundPool.get(soundId);
        
        // Find a free instance
        let freeAudio = pool.find(audio => audio.paused || audio.ended);
        
        if (!freeAudio) {
            // Create a new instance if pool is full
            freeAudio = this.preloader.cloneAudio(soundId);
            if (freeAudio) {
                pool.push(freeAudio);
            }
        }

        return freeAudio;
    }

    // Play background music
    playMusic(musicId) {
        if (!this.settings.musicEnabled || !this.initialized) return;

        try {
            // Stop current music if playing
            this.stopMusic();

            // Get the music audio
            const music = this.preloader.getAudio(musicId);
            if (music) {
                music.volume = this.settings.musicVolume;
                music.currentTime = 0;
                music.play().catch(e => console.warn(`Failed to play music ${musicId}:`, e));
                this.currentMusic = music;
            }
        } catch (error) {
            console.error(`Error playing music ${musicId}:`, error);
        }
    }

    // Stop current music
    stopMusic() {
        if (this.currentMusic) {
            this.currentMusic.pause();
            this.currentMusic.currentTime = 0;
            this.currentMusic = null;
        }
    }

    // Pause current music
    pauseMusic() {
        if (this.currentMusic) {
            this.currentMusic.pause();
        }
    }

    // Resume current music
    resumeMusic() {
        if (this.currentMusic && this.settings.musicEnabled) {
            this.currentMusic.play().catch(e => console.warn('Failed to resume music:', e));
        }
    }

    // Toggle music
    toggleMusic() {
        this.settings.musicEnabled = !this.settings.musicEnabled;
        this.saveSettings();

        if (!this.settings.musicEnabled) {
            this.stopMusic();
        }
        
        return this.settings.musicEnabled;
    }

    // Toggle sound effects
    toggleSound() {
        this.settings.soundEnabled = !this.settings.soundEnabled;
        this.saveSettings();
        return this.settings.soundEnabled;
    }

    // Set music volume
    setMusicVolume(volume) {
        this.settings.musicVolume = Math.max(0, Math.min(1, volume));
        this.saveSettings();

        // Apply to all music
        this.preloader.assets.audio.forEach((audio, id) => {
            if (id.includes('Music')) {
                audio.volume = this.settings.musicVolume;
            }
        });

        if (this.currentMusic) {
            this.currentMusic.volume = this.settings.musicVolume;
        }
    }

    // Set sound volume
    setSoundVolume(volume) {
        this.settings.soundVolume = Math.max(0, Math.min(1, volume));
        this.saveSettings();

        // Apply to all sounds
        this.preloader.assets.audio.forEach((audio, id) => {
            if (!id.includes('Music')) {
                audio.volume = this.settings.soundVolume;
            }
        });
    }

    // Specific sound methods for game integration
    playJump() {
        this.playSound('jump');
    }

    playDeath() {
        this.playSound('death');
    }

    playLevelComplete() {
        this.playSound('levelComplete');
    }

    playGameMusic() {
        this.playMusic('bgMusic');
    }

    playMenuMusic() {
        this.playMusic('menuMusic');
    }

    // Clean up resources
    cleanup() {
        this.stopMusic();
        this.soundPool.clear();
        this.preloader.clear();
        this.initialized = false;
    }

    // Get current settings
    getSettings() {
        return { ...this.settings };
    }

    // Check if specific audio is loaded
    isAudioLoaded(audioId) {
        return this.preloader.assets.audio.has(audioId);
    }

    // Get loading progress
    getLoadingProgress() {
        return {
            loaded: this.preloader.loadedAssets,
            total: this.preloader.totalAssets,
            percentage: this.preloader.totalAssets > 0 
                ? (this.preloader.loadedAssets / this.preloader.totalAssets) * 100 
                : 0
        };
    }
}

// Export for use
window.OptimizedAudioManager = OptimizedAudioManager;