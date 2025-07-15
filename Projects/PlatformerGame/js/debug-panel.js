/**
 * Debug Panel for Pixel Platformer
 * Provides real-time game state visualization and debugging tools
 */

class DebugPanel {
    constructor(gameManager) {
        this.gameManager = gameManager;
        this.isVisible = false;
        this.updateInterval = null;
        this.selectedTool = 'none';
        this.debugOverlay = {
            showCollisionBoxes: false,
            showTileGrid: false,
            showPlayerStats: true,
            showPerformance: true,
            showParticles: false,
            showLevelData: false,
            showIcePhysics: false
        };
        
        // Performance tracking
        this.fps = 0;
        this.frameTime = 0;
        this.lastFrameTime = performance.now();
        this.frameTimes = [];
        
        // Create debug panel UI
        this.createDebugPanel();
        this.setupKeyboardShortcuts();
    }
    
    createDebugPanel() {
        // Main debug panel container
        const panel = document.createElement('div');
        panel.id = 'debugPanel';
        panel.className = 'debug-panel';
        panel.innerHTML = `
            <div class="debug-header">
                <h3>Debug Panel</h3>
                <button class="debug-toggle" id="debugToggle">×</button>
            </div>
            
            <div class="debug-content">
                <!-- Tab navigation -->
                <div class="debug-tabs">
                    <button class="debug-tab active" data-tab="state">State</button>
                    <button class="debug-tab" data-tab="physics">Physics</button>
                    <button class="debug-tab" data-tab="level">Level</button>
                    <button class="debug-tab" data-tab="performance">Perf</button>
                    <button class="debug-tab" data-tab="tools">Tools</button>
                </div>
                
                <!-- Tab content -->
                <div class="debug-tab-content">
                    <!-- State Tab -->
                    <div id="stateTab" class="debug-tab-panel active">
                        <h4>Game State</h4>
                        <div id="gameStateInfo"></div>
                        
                        <h4>Player State</h4>
                        <div id="playerStateInfo"></div>
                    </div>
                    
                    <!-- Physics Tab -->
                    <div id="physicsTab" class="debug-tab-panel">
                        <h4>Physics Info</h4>
                        <div id="physicsInfo"></div>
                        
                        <h4>Ice Physics</h4>
                        <div id="icePhysicsInfo"></div>
                        
                        <h4>Collision Info</h4>
                        <div id="collisionInfo"></div>
                    </div>
                    
                    <!-- Level Tab -->
                    <div id="levelTab" class="debug-tab-panel">
                        <h4>Level Info</h4>
                        <div id="levelInfo"></div>
                        
                        <h4>Tile Inspector</h4>
                        <div id="tileInspector">
                            <p>Hover over tiles to inspect</p>
                            <div id="tileInfo"></div>
                        </div>
                        
                        <h4>Particles</h4>
                        <div id="particleInfo"></div>
                    </div>
                    
                    <!-- Performance Tab -->
                    <div id="performanceTab" class="debug-tab-panel">
                        <h4>Performance Metrics</h4>
                        <div id="performanceInfo"></div>
                        
                        <canvas id="fpsGraph" width="280" height="100"></canvas>
                    </div>
                    
                    <!-- Tools Tab -->
                    <div id="toolsTab" class="debug-tab-panel">
                        <h4>Debug Overlays</h4>
                        <div class="debug-options">
                            <label><input type="checkbox" id="showCollisionBoxes"> Collision Boxes</label>
                            <label><input type="checkbox" id="showTileGrid"> Tile Grid</label>
                            <label><input type="checkbox" id="showPlayerStats"> Player Stats</label>
                            <label><input type="checkbox" id="showPerformance"> Performance</label>
                            <label><input type="checkbox" id="showParticles"> Particles</label>
                            <label><input type="checkbox" id="showIcePhysics"> Ice Physics</label>
                        </div>
                        
                        <h4>Debug Actions</h4>
                        <div class="debug-actions">
                            <button id="teleportPlayer">Teleport Mode</button>
                            <button id="toggleGodMode">God Mode</button>
                            <button id="spawnParticles">Spawn Particles</button>
                            <button id="slowMotion">Slow Motion</button>
                            <button id="exportState">Export State</button>
                            <button id="importState">Import State</button>
                        </div>
                        
                        <h4>Quick Commands</h4>
                        <div class="debug-commands">
                            <input type="text" id="debugCommand" placeholder="Enter command...">
                            <div id="commandOutput"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add CSS styles
        const styles = document.createElement('style');
        styles.textContent = `
            .debug-panel {
                position: fixed;
                top: 20px;
                right: 20px;
                width: 320px;
                background: rgba(0, 0, 0, 0.95);
                border: 2px solid #4c6baf;
                border-radius: 8px;
                color: #fff;
                font-family: 'Courier New', monospace;
                font-size: 12px;
                z-index: 10000;
                max-height: 80vh;
                overflow: hidden;
                display: none;
            }
            
            .debug-panel.visible {
                display: block;
            }
            
            .debug-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px;
                background: #4c6baf;
                border-radius: 6px 6px 0 0;
            }
            
            .debug-header h3 {
                margin: 0;
                font-size: 14px;
            }
            
            .debug-toggle {
                background: none;
                border: none;
                color: #fff;
                font-size: 20px;
                cursor: pointer;
                padding: 0;
                width: 24px;
                height: 24px;
                line-height: 20px;
            }
            
            .debug-content {
                padding: 10px;
                max-height: calc(80vh - 50px);
                overflow-y: auto;
            }
            
            .debug-tabs {
                display: flex;
                gap: 5px;
                margin-bottom: 10px;
                flex-wrap: wrap;
            }
            
            .debug-tab {
                padding: 5px 10px;
                background: #333;
                border: 1px solid #555;
                color: #fff;
                cursor: pointer;
                border-radius: 4px;
                font-size: 11px;
            }
            
            .debug-tab.active {
                background: #4c6baf;
                border-color: #4c6baf;
            }
            
            .debug-tab-panel {
                display: none;
            }
            
            .debug-tab-panel.active {
                display: block;
            }
            
            .debug-tab-panel h4 {
                margin: 10px 0 5px;
                color: #6d8ad0;
                font-size: 13px;
            }
            
            .debug-info-line {
                margin: 2px 0;
                padding: 2px 5px;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 3px;
                display: flex;
                justify-content: space-between;
            }
            
            .debug-info-label {
                color: #999;
            }
            
            .debug-info-value {
                color: #fff;
                font-weight: bold;
            }
            
            .debug-options label {
                display: block;
                margin: 5px 0;
                cursor: pointer;
            }
            
            .debug-options input[type="checkbox"] {
                margin-right: 5px;
            }
            
            .debug-actions button {
                display: block;
                width: 100%;
                padding: 5px;
                margin: 5px 0;
                background: #333;
                border: 1px solid #555;
                color: #fff;
                cursor: pointer;
                border-radius: 4px;
                font-size: 11px;
            }
            
            .debug-actions button:hover {
                background: #444;
            }
            
            .debug-actions button.active {
                background: #4c6baf;
                border-color: #4c6baf;
            }
            
            #debugCommand {
                width: 100%;
                padding: 5px;
                background: #222;
                border: 1px solid #555;
                color: #fff;
                border-radius: 4px;
                font-family: inherit;
                font-size: 11px;
            }
            
            #commandOutput {
                margin-top: 5px;
                padding: 5px;
                background: #111;
                border-radius: 4px;
                max-height: 100px;
                overflow-y: auto;
                font-size: 10px;
                color: #0f0;
            }
            
            #fpsGraph {
                border: 1px solid #333;
                margin-top: 10px;
                width: 100%;
                height: 100px;
            }
            
            /* Highlight values based on state */
            .debug-info-value.good { color: #0f0; }
            .debug-info-value.warning { color: #ff0; }
            .debug-info-value.bad { color: #f00; }
            .debug-info-value.ice { color: #00ffff; }
            
            /* Floating debug info */
            .debug-floating-info {
                position: fixed;
                background: rgba(0, 0, 0, 0.8);
                color: #fff;
                padding: 5px 10px;
                border-radius: 4px;
                font-family: 'Courier New', monospace;
                font-size: 11px;
                pointer-events: none;
                z-index: 9999;
            }
        `;
        
        document.head.appendChild(styles);
        document.body.appendChild(panel);
        
        // Setup event listeners
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Toggle panel visibility
        document.getElementById('debugToggle').addEventListener('click', () => {
            this.hide();
        });
        
        // Tab switching
        document.querySelectorAll('.debug-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });
        
        // Debug overlay toggles
        Object.keys(this.debugOverlay).forEach(key => {
            const checkbox = document.getElementById(key);
            if (checkbox) {
                checkbox.addEventListener('change', (e) => {
                    this.debugOverlay[key] = e.target.checked;
                });
            }
        });
        
        // Debug actions
        document.getElementById('teleportPlayer').addEventListener('click', () => {
            this.toggleTeleportMode();
        });
        
        document.getElementById('toggleGodMode').addEventListener('click', () => {
            this.toggleGodMode();
        });
        
        document.getElementById('spawnParticles').addEventListener('click', () => {
            this.spawnDebugParticles();
        });
        
        document.getElementById('slowMotion').addEventListener('click', () => {
            this.toggleSlowMotion();
        });
        
        document.getElementById('exportState').addEventListener('click', () => {
            this.exportGameState();
        });
        
        document.getElementById('importState').addEventListener('click', () => {
            this.importGameState();
        });
        
        // Debug command input
        document.getElementById('debugCommand').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.executeCommand(e.target.value);
                e.target.value = '';
            }
        });
        
        // Canvas click for teleport mode
        this.gameManager.canvas.addEventListener('click', (e) => {
            if (this.selectedTool === 'teleport') {
                this.teleportPlayer(e);
            }
        });
        
        // Canvas hover for tile inspection
        this.gameManager.canvas.addEventListener('mousemove', (e) => {
            if (this.debugOverlay.showLevelData) {
                this.inspectTile(e);
            }
        });
    }
    
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Toggle debug panel with F1
            if (e.key === 'F1') {
                e.preventDefault();
                this.toggle();
            }
            
            // Quick toggles
            if (e.ctrlKey && e.shiftKey) {
                switch(e.key) {
                    case 'C':
                        e.preventDefault();
                        this.debugOverlay.showCollisionBoxes = !this.debugOverlay.showCollisionBoxes;
                        document.getElementById('showCollisionBoxes').checked = this.debugOverlay.showCollisionBoxes;
                        break;
                    case 'G':
                        e.preventDefault();
                        this.debugOverlay.showTileGrid = !this.debugOverlay.showTileGrid;
                        document.getElementById('showTileGrid').checked = this.debugOverlay.showTileGrid;
                        break;
                    case 'P':
                        e.preventDefault();
                        this.debugOverlay.showPerformance = !this.debugOverlay.showPerformance;
                        document.getElementById('showPerformance').checked = this.debugOverlay.showPerformance;
                        break;
                }
            }
        });
    }
    
    show() {
        this.isVisible = true;
        document.getElementById('debugPanel').classList.add('visible');
        
        // Start update loop
        this.updateInterval = setInterval(() => {
            this.update();
        }, 100);
    }
    
    hide() {
        this.isVisible = false;
        document.getElementById('debugPanel').classList.remove('visible');
        
        // Stop update loop
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
    
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }
    
    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.debug-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        // Update tab panels
        document.querySelectorAll('.debug-tab-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        document.getElementById(`${tabName}Tab`).classList.add('active');
    }
    
    update() {
        if (!this.isVisible) return;
        
        // Update performance metrics
        this.updatePerformance();
        
        // Update active tab content
        const activeTab = document.querySelector('.debug-tab.active').dataset.tab;
        
        switch(activeTab) {
            case 'state':
                this.updateStateInfo();
                break;
            case 'physics':
                this.updatePhysicsInfo();
                break;
            case 'level':
                this.updateLevelInfo();
                break;
            case 'performance':
                this.updatePerformanceInfo();
                break;
        }
    }
    
    updateStateInfo() {
        const gameState = this.gameManager.gameState;
        const player = gameState.player;
        
        // Game state info
        const gameStateHtml = `
            <div class="debug-info-line">
                <span class="debug-info-label">State:</span>
                <span class="debug-info-value">${this.getGameStateName(gameState.state)}</span>
            </div>
            <div class="debug-info-line">
                <span class="debug-info-label">Level:</span>
                <span class="debug-info-value">${this.gameManager.levelLoader?.currentLevel ?? 'N/A'}</span>
            </div>
            <div class="debug-info-line">
                <span class="debug-info-label">Deaths:</span>
                <span class="debug-info-value ${gameState.deaths > 10 ? 'bad' : gameState.deaths > 5 ? 'warning' : 'good'}">${gameState.deaths}</span>
            </div>
            <div class="debug-info-line">
                <span class="debug-info-label">Time:</span>
                <span class="debug-info-value">${gameState.levelTime.toFixed(2)}s</span>
            </div>
            <div class="debug-info-line">
                <span class="debug-info-label">Particles:</span>
                <span class="debug-info-value">${gameState.particles.length}</span>
            </div>
        `;
        document.getElementById('gameStateInfo').innerHTML = gameStateHtml;
        
        // Player state info
        if (player) {
            const playerStateHtml = `
                <div class="debug-info-line">
                    <span class="debug-info-label">Position:</span>
                    <span class="debug-info-value">${Math.round(player.x)}, ${Math.round(player.y)}</span>
                </div>
                <div class="debug-info-line">
                    <span class="debug-info-label">Grid Pos:</span>
                    <span class="debug-info-value">${Math.floor(player.x / TILE_SIZE)}, ${Math.floor(player.y / TILE_SIZE)}</span>
                </div>
                <div class="debug-info-line">
                    <span class="debug-info-label">Alive:</span>
                    <span class="debug-info-value ${player.alive ? 'good' : 'bad'}">${player.alive}</span>
                </div>
                <div class="debug-info-line">
                    <span class="debug-info-label">Grounded:</span>
                    <span class="debug-info-value ${player.grounded ? 'good' : 'warning'}">${player.grounded}</span>
                </div>
                <div class="debug-info-line">
                    <span class="debug-info-label">On Ice:</span>
                    <span class="debug-info-value ${player.onIce ? 'ice' : ''}">${player.onIce}</span>
                </div>
            `;
            document.getElementById('playerStateInfo').innerHTML = playerStateHtml;
        }
    }
    
    updatePhysicsInfo() {
        const player = this.gameManager.gameState.player;
        if (!player) return;
        
        // Physics info
        const physicsHtml = `
            <div class="debug-info-line">
                <span class="debug-info-label">Velocity X:</span>
                <span class="debug-info-value">${player.velX.toFixed(2)}</span>
            </div>
            <div class="debug-info-line">
                <span class="debug-info-label">Velocity Y:</span>
                <span class="debug-info-value">${player.velY.toFixed(2)}</span>
            </div>
            <div class="debug-info-line">
                <span class="debug-info-label">Speed:</span>
                <span class="debug-info-value">${Math.sqrt(player.velX**2 + player.velY**2).toFixed(2)}</span>
            </div>
            <div class="debug-info-line">
                <span class="debug-info-label">Friction:</span>
                <span class="debug-info-value">${player.friction.toFixed(3)}</span>
            </div>
            <div class="debug-info-line">
                <span class="debug-info-label">Max Speed:</span>
                <span class="debug-info-value">${player.maxSpeed}</span>
            </div>
        `;
        document.getElementById('physicsInfo').innerHTML = physicsHtml;
        
        // Ice physics info
        const icePhysicsHtml = `
            <div class="debug-info-line">
                <span class="debug-info-label">Ice Time:</span>
                <span class="debug-info-value ${player.onIce ? 'ice' : ''}">${player.iceTime.toFixed(1)}</span>
            </div>
            <div class="debug-info-line">
                <span class="debug-info-label">Ice Acceleration:</span>
                <span class="debug-info-value">${player.iceAccelerationApplied}</span>
            </div>
            <div class="debug-info-line">
                <span class="debug-info-label">Ice Jump Timer:</span>
                <span class="debug-info-value">${player.iceJumpTimer.toFixed(1)}</span>
            </div>
            <div class="debug-info-line">
                <span class="debug-info-label">Ice Inertia:</span>
                <span class="debug-info-value">${player.iceInertia.toFixed(2)}</span>
            </div>
            <div class="debug-info-line">
                <span class="debug-info-label">Current Tile:</span>
                <span class="debug-info-value">${player.currentTile?.name || 'None'}</span>
            </div>
        `;
        document.getElementById('icePhysicsInfo').innerHTML = icePhysicsHtml;
        
        // Collision info
        const collisionHtml = `
            <div class="debug-info-line">
                <span class="debug-info-label">Jumping:</span>
                <span class="debug-info-value">${player.jumping}</span>
            </div>
            <div class="debug-info-line">
                <span class="debug-info-label">Jump Angled:</span>
                <span class="debug-info-value">${player.jumpAngled}</span>
            </div>
            <div class="debug-info-line">
                <span class="debug-info-label">Jump Direction:</span>
                <span class="debug-info-value">${player.jumpDirection}</span>
            </div>
            <div class="debug-info-line">
                <span class="debug-info-label">Facing Right:</span>
                <span class="debug-info-value">${player.facingRight}</span>
            </div>
        `;
        document.getElementById('collisionInfo').innerHTML = collisionHtml;
    }
    
    updateLevelInfo() {
        const level = this.gameManager.gameState.currentLevel;
        const particles = this.gameManager.gameState.particles;
        
        if (level) {
            const levelHtml = `
                <div class="debug-info-line">
                    <span class="debug-info-label">Width:</span>
                    <span class="debug-info-value">${level[0]?.length || 0} tiles</span>
                </div>
                <div class="debug-info-line">
                    <span class="debug-info-label">Height:</span>
                    <span class="debug-info-value">${level.length} tiles</span>
                </div>
                <div class="debug-info-line">
                    <span class="debug-info-label">Total Tiles:</span>
                    <span class="debug-info-value">${level.length * (level[0]?.length || 0)}</span>
                </div>
            `;
            document.getElementById('levelInfo').innerHTML = levelHtml;
        }
        
        // Particle info
        const particleTypes = {};
        particles.forEach(p => {
            const type = p.color || 'unknown';
            particleTypes[type] = (particleTypes[type] || 0) + 1;
        });
        
        let particleHtml = `
            <div class="debug-info-line">
                <span class="debug-info-label">Total:</span>
                <span class="debug-info-value">${particles.length}</span>
            </div>
        `;
        
        Object.entries(particleTypes).forEach(([type, count]) => {
            particleHtml += `
                <div class="debug-info-line">
                    <span class="debug-info-label">${type}:</span>
                    <span class="debug-info-value">${count}</span>
                </div>
            `;
        });
        
        document.getElementById('particleInfo').innerHTML = particleHtml;
    }
    
    updatePerformance() {
        const now = performance.now();
        const deltaTime = now - this.lastFrameTime;
        this.lastFrameTime = now;
        
        // Calculate FPS
        this.frameTimes.push(deltaTime);
        if (this.frameTimes.length > 60) {
            this.frameTimes.shift();
        }
        
        const avgFrameTime = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
        this.fps = 1000 / avgFrameTime;
        this.frameTime = avgFrameTime;
    }
    
    updatePerformanceInfo() {
        const perfHtml = `
            <div class="debug-info-line">
                <span class="debug-info-label">FPS:</span>
                <span class="debug-info-value ${this.fps < 30 ? 'bad' : this.fps < 50 ? 'warning' : 'good'}">${this.fps.toFixed(1)}</span>
            </div>
            <div class="debug-info-line">
                <span class="debug-info-label">Frame Time:</span>
                <span class="debug-info-value">${this.frameTime.toFixed(2)}ms</span>
            </div>
            <div class="debug-info-line">
                <span class="debug-info-label">Memory:</span>
                <span class="debug-info-value">${this.getMemoryUsage()}</span>
            </div>
        `;
        document.getElementById('performanceInfo').innerHTML = perfHtml;
        
        // Update FPS graph
        this.updateFPSGraph();
    }
    
    updateFPSGraph() {
        const canvas = document.getElementById('fpsGraph');
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        
        // Clear canvas
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, width, height);
        
        // Draw grid
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 60; i += 20) {
            const y = height - (i / 60) * height;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
        
        // Draw FPS line
        ctx.strokeStyle = '#0f0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        const samples = Math.min(this.frameTimes.length, width);
        for (let i = 0; i < samples; i++) {
            const fps = 1000 / this.frameTimes[this.frameTimes.length - samples + i];
            const x = (i / samples) * width;
            const y = height - (fps / 60) * height;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();
        
        // Draw current FPS text
        ctx.fillStyle = '#fff';
        ctx.font = '12px Courier New';
        ctx.fillText(`${this.fps.toFixed(1)} FPS`, 5, 15);
    }
    
    getMemoryUsage() {
        if (performance.memory) {
            const used = performance.memory.usedJSHeapSize / 1048576;
            const total = performance.memory.totalJSHeapSize / 1048576;
            return `${used.toFixed(1)}/${total.toFixed(1)}MB`;
        }
        return 'N/A';
    }
    
    getGameStateName(state) {
        const states = {
            0: 'MENU',
            1: 'PLAYING',
            2: 'PAUSED',
            3: 'GAME_OVER',
            4: 'LEVEL_COMPLETE',
            5: 'LEVEL_SELECT',
            6: 'SETTINGS'
        };
        return states[state] || 'UNKNOWN';
    }
    
    // Debug tool methods
    toggleTeleportMode() {
        this.selectedTool = this.selectedTool === 'teleport' ? 'none' : 'teleport';
        const btn = document.getElementById('teleportPlayer');
        btn.classList.toggle('active', this.selectedTool === 'teleport');
        
        if (this.selectedTool === 'teleport') {
            this.gameManager.canvas.style.cursor = 'crosshair';
            this.showMessage('Click anywhere to teleport player');
        } else {
            this.gameManager.canvas.style.cursor = 'default';
        }
    }
    
    teleportPlayer(e) {
        const rect = this.gameManager.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        if (this.gameManager.gameState.player) {
            this.gameManager.gameState.player.x = x - this.gameManager.gameState.player.width / 2;
            this.gameManager.gameState.player.y = y - this.gameManager.gameState.player.height / 2;
            this.gameManager.gameState.player.velX = 0;
            this.gameManager.gameState.player.velY = 0;
            
            this.showMessage(`Teleported to (${Math.round(x)}, ${Math.round(y)})`);
        }
        
        // Disable teleport mode after use
        this.toggleTeleportMode();
    }
    
    toggleGodMode() {
        if (!this.gameManager.gameState.player) return;
        
        this.godMode = !this.godMode;
        const btn = document.getElementById('toggleGodMode');
        btn.classList.toggle('active', this.godMode);
        
        if (this.godMode) {
            // Store original player methods
            this.originalPlayerMethods = {
                checkHorizontalCollisions: this.gameManager.gameState.player.checkHorizontalCollisions,
                checkVerticalCollisions: this.gameManager.gameState.player.checkVerticalCollisions
            };
            
            // Override collision methods
            this.gameManager.gameState.player.checkHorizontalCollisions = function() {};
            this.gameManager.gameState.player.checkVerticalCollisions = function() {};
            
            this.showMessage('God Mode: ON - Collisions disabled');
        } else {
            // Restore original methods
            if (this.originalPlayerMethods) {
                this.gameManager.gameState.player.checkHorizontalCollisions = this.originalPlayerMethods.checkHorizontalCollisions;
                this.gameManager.gameState.player.checkVerticalCollisions = this.originalPlayerMethods.checkVerticalCollisions;
            }
            
            this.showMessage('God Mode: OFF');
        }
    }
    
    spawnDebugParticles() {
        const particles = this.gameManager.gameState.particles;
        const player = this.gameManager.gameState.player;
        
        if (!player) return;
        
        // Spawn a burst of colorful particles
        const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
        
        for (let i = 0; i < 50; i++) {
            const angle = (Math.PI * 2 * i) / 50;
            const speed = 3 + Math.random() * 3;
            
            particles.push({
                x: player.x + player.width / 2,
                y: player.y + player.height / 2,
                size: 2 + Math.random() * 4,
                color: colors[Math.floor(Math.random() * colors.length)],
                velX: Math.cos(angle) * speed,
                velY: Math.sin(angle) * speed,
                gravity: 0.1,
                life: 60 + Math.random() * 60
            });
        }
        
        this.showMessage('Spawned 50 debug particles');
    }
    
    toggleSlowMotion() {
        this.slowMotion = !this.slowMotion;
        const btn = document.getElementById('slowMotion');
        btn.classList.toggle('active', this.slowMotion);
        
        if (this.slowMotion) {
            this.gameManager.updateInterval = 1000 / 30; // 30 FPS
            this.showMessage('Slow Motion: ON (30 FPS)');
        } else {
            this.gameManager.updateInterval = 1000 / 60; // 60 FPS
            this.showMessage('Slow Motion: OFF (60 FPS)');
        }
    }
    
    exportGameState() {
        const state = {
            gameState: {
                state: this.gameManager.gameState.state,
                levelTime: this.gameManager.gameState.levelTime,
                deaths: this.gameManager.gameState.deaths,
                currentLevel: this.gameManager.levelLoader?.currentLevel
            },
            player: null,
            particles: this.gameManager.gameState.particles.length
        };
        
        if (this.gameManager.gameState.player) {
            const p = this.gameManager.gameState.player;
            state.player = {
                x: p.x,
                y: p.y,
                velX: p.velX,
                velY: p.velY,
                alive: p.alive,
                grounded: p.grounded,
                onIce: p.onIce
            };
        }
        
        const json = JSON.stringify(state, null, 2);
        navigator.clipboard.writeText(json);
        this.showMessage('Game state copied to clipboard');
        
        console.log('Exported game state:', state);
    }
    
    importGameState() {
        const input = prompt('Paste game state JSON:');
        if (!input) return;
        
        try {
            const state = JSON.parse(input);
            
            // Apply state
            if (state.player && this.gameManager.gameState.player) {
                Object.assign(this.gameManager.gameState.player, state.player);
            }
            
            if (state.gameState) {
                this.gameManager.gameState.deaths = state.gameState.deaths;
                this.gameManager.gameState.levelTime = state.gameState.levelTime;
            }
            
            this.showMessage('Game state imported successfully');
        } catch (e) {
            this.showMessage('Failed to import game state: ' + e.message);
        }
    }
    
    executeCommand(command) {
        const output = document.getElementById('commandOutput');
        const parts = command.split(' ');
        const cmd = parts[0].toLowerCase();
        
        let result = '';
        
        switch(cmd) {
            case 'help':
                result = 'Commands: help, level <n>, restart, kill, win, particles, clear';
                break;
                
            case 'level':
                const levelNum = parseInt(parts[1]);
                if (!isNaN(levelNum)) {
                    this.gameManager.startLevel(levelNum);
                    result = `Started level ${levelNum}`;
                } else {
                    result = 'Usage: level <number>';
                }
                break;
                
            case 'restart':
                this.gameManager.restartLevel();
                result = 'Level restarted';
                break;
                
            case 'kill':
                if (this.gameManager.gameState.player) {
                    this.gameManager.gameState.player.alive = false;
                    this.gameManager.handlePlayerDeath();
                    result = 'Player killed';
                }
                break;
                
            case 'win':
                this.gameManager.handleLevelComplete();
                result = 'Level completed';
                break;
                
            case 'particles':
                result = `Particle count: ${this.gameManager.gameState.particles.length}`;
                break;
                
            case 'clear':
                output.innerHTML = '';
                return;
                
            default:
                result = `Unknown command: ${cmd}`;
        }
        
        output.innerHTML += `> ${command}\n${result}\n`;
        output.scrollTop = output.scrollHeight;
    }
    
    inspectTile(e) {
        const rect = this.gameManager.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const tileX = Math.floor(x / TILE_SIZE);
        const tileY = Math.floor(y / TILE_SIZE);
        
        const level = this.gameManager.gameState.currentLevel;
        if (level && tileY >= 0 && tileY < level.length && tileX >= 0 && tileX < level[tileY].length) {
            const tileId = level[tileY][tileX];
            const tileType = TILE_TYPES[tileId];
            
            const tileInfoHtml = `
                <div class="debug-info-line">
                    <span class="debug-info-label">Position:</span>
                    <span class="debug-info-value">${tileX}, ${tileY}</span>
                </div>
                <div class="debug-info-line">
                    <span class="debug-info-label">ID:</span>
                    <span class="debug-info-value">${tileId}</span>
                </div>
                <div class="debug-info-line">
                    <span class="debug-info-label">Type:</span>
                    <span class="debug-info-value">${tileType?.name || 'Empty'}</span>
                </div>
                ${tileType ? `
                <div class="debug-info-line">
                    <span class="debug-info-label">Solid:</span>
                    <span class="debug-info-value">${tileType.solid || false}</span>
                </div>
                <div class="debug-info-line">
                    <span class="debug-info-label">Deadly:</span>
                    <span class="debug-info-value">${tileType.deadly || false}</span>
                </div>
                ` : ''}
            `;
            
            document.getElementById('tileInfo').innerHTML = tileInfoHtml;
        }
    }
    
    showMessage(message) {
        const msg = document.createElement('div');
        msg.className = 'debug-floating-info';
        msg.textContent = message;
        msg.style.top = '60px';
        msg.style.left = '50%';
        msg.style.transform = 'translateX(-50%)';
        
        document.body.appendChild(msg);
        
        setTimeout(() => {
            msg.remove();
        }, 3000);
    }
    
    // Render debug overlays
    renderDebugOverlays(ctx) {
        if (!this.isVisible && !Object.values(this.debugOverlay).some(v => v)) return;
        
        ctx.save();
        
        // Tile grid
        if (this.debugOverlay.showTileGrid) {
            this.renderTileGrid(ctx);
        }
        
        // Collision boxes
        if (this.debugOverlay.showCollisionBoxes) {
            this.renderCollisionBoxes(ctx);
        }
        
        // Player stats
        if (this.debugOverlay.showPlayerStats) {
            this.renderPlayerStats(ctx);
        }
        
        // Performance overlay
        if (this.debugOverlay.showPerformance) {
            this.renderPerformanceOverlay(ctx);
        }
        
        // Particle visualization
        if (this.debugOverlay.showParticles) {
            this.renderParticleInfo(ctx);
        }
        
        // Ice physics visualization
        if (this.debugOverlay.showIcePhysics) {
            this.renderIcePhysics(ctx);
        }
        
        ctx.restore();
    }
    
    renderTileGrid(ctx) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        
        const level = this.gameManager.gameState.currentLevel;
        if (!level) return;
        
        // Vertical lines
        for (let x = 0; x <= level[0].length * TILE_SIZE; x += TILE_SIZE) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, level.length * TILE_SIZE);
            ctx.stroke();
        }
        
        // Horizontal lines
        for (let y = 0; y <= level.length * TILE_SIZE; y += TILE_SIZE) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(level[0].length * TILE_SIZE, y);
            ctx.stroke();
        }
    }
    
    renderCollisionBoxes(ctx) {
        const player = this.gameManager.gameState.player;
        if (!player) return;
        
        // Player collision box
        ctx.strokeStyle = player.alive ? '#0f0' : '#f00';
        ctx.lineWidth = 2;
        ctx.strokeRect(player.x, player.y, player.width, player.height);
        
        // Player center point
        ctx.fillStyle = '#ff0';
        ctx.fillRect(player.x + player.width/2 - 2, player.y + player.height/2 - 2, 4, 4);
        
        // Collision detection points
        const points = [
            { x: player.x + 2, y: player.y + player.height, color: '#f0f' },              // Left foot
            { x: player.x + player.width / 2, y: player.y + player.height, color: '#0ff' }, // Center foot
            { x: player.x + player.width - 2, y: player.y + player.height, color: '#f0f' }  // Right foot
        ];
        
        points.forEach(point => {
            ctx.fillStyle = point.color;
            ctx.fillRect(point.x - 2, point.y - 2, 4, 4);
        });
        
        // Show deadly tiles with red overlay
        const level = this.gameManager.gameState.currentLevel;
        if (level) {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
            for (let y = 0; y < level.length; y++) {
                for (let x = 0; x < level[y].length; x++) {
                    const tile = TILE_TYPES[level[y][x]];
                    if (tile && tile.deadly) {
                        ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                    }
                }
            }
        }
    }
    
    renderPlayerStats(ctx) {
        const player = this.gameManager.gameState.player;
        if (!player) return;
        
        ctx.font = '10px Courier New';
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        
        const stats = [
            `Vel: ${player.velX.toFixed(1)}, ${player.velY.toFixed(1)}`,
            `Pos: ${Math.round(player.x)}, ${Math.round(player.y)}`,
            player.grounded ? 'Grounded' : 'Airborne',
            player.onIce ? 'ON ICE' : ''
        ].filter(s => s);
        
        stats.forEach((stat, i) => {
            const text = stat;
            const x = player.x + player.width / 2;
            const y = player.y - 5 - (i * 12);
            
            ctx.strokeText(text, x - ctx.measureText(text).width / 2, y);
            ctx.fillText(text, x - ctx.measureText(text).width / 2, y);
        });
    }
    
    renderPerformanceOverlay(ctx) {
        ctx.font = '12px Courier New';
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        
        const text = `FPS: ${this.fps.toFixed(1)}`;
        ctx.strokeText(text, 10, 20);
        ctx.fillText(text, 10, 20);
    }
    
    renderParticleInfo(ctx) {
        const particles = this.gameManager.gameState.particles;
        
        particles.forEach(p => {
            // Draw particle bounds
            ctx.strokeStyle = p.color;
            ctx.lineWidth = 1;
            ctx.strokeRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
            
            // Draw velocity vector
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x + p.velX * 5, p.y + p.velY * 5);
            ctx.stroke();
        });
    }
    
    renderIcePhysics(ctx) {
        const player = this.gameManager.gameState.player;
        if (!player || !player.onIce) return;
        
        // Visualize ice effect area
        ctx.fillStyle = 'rgba(0, 255, 255, 0.2)';
        ctx.fillRect(player.x - 10, player.y - 10, player.width + 20, player.height + 20);
        
        // Show ice momentum vector
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(player.x + player.width/2, player.y + player.height/2);
        ctx.lineTo(player.x + player.width/2 + player.iceInertia * 10, player.y + player.height/2);
        ctx.stroke();
        
        // Ice timer visualization
        if (player.iceJumpTimer > 0) {
            const progress = player.iceJumpTimer / player.iceJumpDuration;
            ctx.fillStyle = `rgba(0, 255, 255, ${1 - progress})`;
            ctx.fillRect(player.x, player.y - 20, player.width * (1 - progress), 4);
        }
    }
}

// Export the debug panel
window.DebugPanel = DebugPanel;