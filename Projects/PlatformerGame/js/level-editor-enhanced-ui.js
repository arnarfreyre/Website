/**
 * Enhanced Level Editor UI Controller
 * Handles all the modern UI interactions and visual enhancements
 */

class EnhancedLevelEditorUI {
    constructor() {
        this.currentTool = 'draw';
        this.currentZoom = 1;
        this.isDarkTheme = true;
        this.currentCategory = 'all';
        this.isDrawing = false;
        this.selectedTiles = new Set();
        this.undoStack = [];
        this.redoStack = [];
        this.maxUndoSteps = 50;
        
        // Tile categories mapping
        this.tileCategories = {
            platforms: [1, 4, 5], // Platform, Ice, Conveyor
            hazards: [2], // Spikes
            interactive: [3, 6, 7], // Goal, Bounce, Moving Platform
            decorative: [] // For future decorative tiles
        };
        
        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }
    
    init() {
        this.setupToolbar();
        this.setupTileSearch();
        this.setupTileCategories();
        this.setupZoomControls();
        this.setupThemeToggle();
        this.setupKeyboardShortcuts();
        this.setupMinimap();
        this.setupNotifications();
        this.enhanceTilePalette();
        this.setupHelpModal();
        this.setupGridInteractions();
        this.setupLoadingStates();
    }
    
    // Toolbar Setup
    setupToolbar() {
        const tools = ['draw', 'erase', 'fill', 'select', 'player'];
        
        tools.forEach(tool => {
            const button = document.getElementById(`${tool}-tool`);
            if (button) {
                button.addEventListener('click', () => this.selectTool(tool));
            }
        });
    }
    
    selectTool(tool) {
        this.currentTool = tool;
        
        // Update active states
        document.querySelectorAll('.tool-button').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById(`${tool}-tool`)?.classList.add('active');
        
        // Update cursor
        this.updateCursor(tool);
        
        // Show notification
        this.showNotification(`${tool.charAt(0).toUpperCase() + tool.slice(1)} tool selected`, 'info', 1500);
    }
    
    updateCursor(tool) {
        const grid = document.getElementById('level-grid');
        if (!grid) return;
        
        const cursors = {
            draw: 'crosshair',
            erase: 'grab',
            fill: 'cell',
            select: 'crosshair',
            player: 'pointer'
        };
        
        grid.style.cursor = cursors[tool] || 'default';
    }
    
    // Tile Search
    setupTileSearch() {
        const searchInput = document.getElementById('tile-search-input');
        if (!searchInput) return;
        
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            this.filterTiles(query);
        });
    }
    
    filterTiles(query) {
        const tiles = document.querySelectorAll('.tile-option-enhanced');
        tiles.forEach(tile => {
            const tileName = tile.dataset.tileName?.toLowerCase() || '';
            const matches = tileName.includes(query);
            tile.style.display = matches ? 'block' : 'none';
        });
    }
    
    // Tile Categories
    setupTileCategories() {
        const categoryButtons = document.querySelectorAll('.tile-category-btn');
        
        categoryButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.currentCategory = button.dataset.category;
                this.filterByCategory(this.currentCategory);
                
                // Update active state
                categoryButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
            });
        });
    }
    
    filterByCategory(category) {
        const tiles = document.querySelectorAll('.tile-option-enhanced');
        
        tiles.forEach(tile => {
            const tileType = parseInt(tile.dataset.tileType);
            
            if (category === 'all') {
                tile.style.display = 'block';
            } else {
                const categoryTiles = this.tileCategories[category] || [];
                tile.style.display = categoryTiles.includes(tileType) ? 'block' : 'none';
            }
        });
    }
    
    // Enhanced Tile Palette
    enhanceTilePalette() {
        const tileGrid = document.getElementById('tile-grid');
        if (!tileGrid) return;
        
        // Clear existing tiles
        tileGrid.innerHTML = '';
        tileGrid.className = 'tile-grid-enhanced';
        
        // Add tile options with enhanced styling
        const tileNames = [
            'Empty', 'Platform', 'Spike', 'Goal', 'Ice', 'Conveyor', 'Bounce', 'Moving'
        ];
        
        for (let i = 0; i < TILE_TYPES.length; i++) {
            const tileOption = document.createElement('div');
            tileOption.className = 'tile-option-enhanced';
            tileOption.dataset.tileType = i;
            tileOption.dataset.tileName = tileNames[i] || `Tile ${i}`;
            
            // Add tile preview
            const canvas = document.createElement('canvas');
            canvas.width = 32;
            canvas.height = 32;
            const ctx = canvas.getContext('2d');
            
            // Draw tile preview
            this.drawTilePreview(ctx, i);
            
            tileOption.appendChild(canvas);
            
            // Add click handler
            tileOption.addEventListener('click', () => {
                // Remove previous selection
                document.querySelectorAll('.tile-option-enhanced').forEach(t => {
                    t.classList.remove('selected');
                });
                
                // Add selection to clicked tile
                tileOption.classList.add('selected');
                
                // Update tile info
                this.updateTileInfo(i, tileNames[i]);
                
                // Update current tile type (assuming window.currentTileType exists)
                if (window.currentTileType !== undefined) {
                    window.currentTileType = i;
                }
            });
            
            tileGrid.appendChild(tileOption);
        }
        
        // Select first tile by default
        tileGrid.firstChild?.classList.add('selected');
    }
    
    drawTilePreview(ctx, tileType) {
        const colors = [
            'transparent',     // Empty
            '#666666',        // Platform
            '#ff4444',        // Spike
            '#ffdd00',        // Goal
            '#88ddff',        // Ice
            '#888888',        // Conveyor
            '#44ff44',        // Bounce
            '#aa66ff'         // Moving Platform
        ];
        
        ctx.fillStyle = colors[tileType] || '#333333';
        
        if (tileType === 0) {
            // Empty tile - draw a grid pattern
            ctx.strokeStyle = '#444444';
            ctx.lineWidth = 1;
            for (let i = 0; i < 32; i += 8) {
                ctx.beginPath();
                ctx.moveTo(i, 0);
                ctx.lineTo(i, 32);
                ctx.moveTo(0, i);
                ctx.lineTo(32, i);
                ctx.stroke();
            }
        } else if (tileType === 2) {
            // Spike - draw triangle
            ctx.beginPath();
            ctx.moveTo(16, 4);
            ctx.lineTo(28, 28);
            ctx.lineTo(4, 28);
            ctx.closePath();
            ctx.fill();
        } else if (tileType === 3) {
            // Goal - draw star
            this.drawStar(ctx, 16, 16, 12, 6, 5);
            ctx.fill();
        } else {
            // Other tiles - simple square
            ctx.fillRect(2, 2, 28, 28);
            
            // Add patterns for special tiles
            if (tileType === 4) { // Ice
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.fillRect(6, 6, 8, 8);
                ctx.fillRect(18, 18, 8, 8);
            } else if (tileType === 5) { // Conveyor
                ctx.strokeStyle = '#aaaaaa';
                ctx.lineWidth = 2;
                for (let i = 0; i < 32; i += 8) {
                    ctx.beginPath();
                    ctx.moveTo(i, 2);
                    ctx.lineTo(i + 4, 30);
                    ctx.stroke();
                }
            }
        }
    }
    
    drawStar(ctx, cx, cy, outerRadius, innerRadius, points) {
        let angle = -Math.PI / 2;
        const step = Math.PI / points;
        
        ctx.beginPath();
        for (let i = 0; i < points * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const x = cx + Math.cos(angle) * radius;
            const y = cy + Math.sin(angle) * radius;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
            
            angle += step;
        }
        ctx.closePath();
    }
    
    updateTileInfo(tileType, tileName) {
        const tileInfo = document.getElementById('selected-tile-name');
        if (tileInfo) {
            tileInfo.textContent = `${tileName} (${tileType})`;
        }
        
        // Show/hide rotation controls for spikes
        const rotationControls = document.getElementById('rotation-controls');
        if (rotationControls) {
            rotationControls.style.display = tileType === 2 ? 'block' : 'none';
        }
    }
    
    // Zoom Controls
    setupZoomControls() {
        const zoomIn = document.getElementById('zoom-in');
        const zoomOut = document.getElementById('zoom-out');
        const zoomFit = document.getElementById('zoom-fit');
        const zoomLevel = document.getElementById('zoom-level');
        const grid = document.getElementById('level-grid');
        
        if (!grid) return;
        
        zoomIn?.addEventListener('click', () => {
            this.currentZoom = Math.min(this.currentZoom * 1.2, 3);
            this.applyZoom();
        });
        
        zoomOut?.addEventListener('click', () => {
            this.currentZoom = Math.max(this.currentZoom / 1.2, 0.5);
            this.applyZoom();
        });
        
        zoomFit?.addEventListener('click', () => {
            this.fitToScreen();
        });
        
        // Mouse wheel zoom
        grid.parentElement?.addEventListener('wheel', (e) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                const delta = e.deltaY > 0 ? 0.9 : 1.1;
                this.currentZoom = Math.max(0.5, Math.min(3, this.currentZoom * delta));
                this.applyZoom();
            }
        });
    }
    
    applyZoom() {
        const grid = document.getElementById('level-grid');
        const zoomLevel = document.getElementById('zoom-level');
        
        if (grid) {
            grid.style.transform = `scale(${this.currentZoom})`;
            grid.style.transformOrigin = 'center center';
        }
        
        if (zoomLevel) {
            zoomLevel.textContent = `${Math.round(this.currentZoom * 100)}%`;
        }
        
        this.updateMinimap();
    }
    
    fitToScreen() {
        const gridWrapper = document.querySelector('.level-grid-wrapper');
        const grid = document.getElementById('level-grid');
        
        if (!gridWrapper || !grid) return;
        
        const wrapperRect = gridWrapper.getBoundingClientRect();
        const gridRect = grid.getBoundingClientRect();
        
        const scaleX = (wrapperRect.width - 40) / gridRect.width;
        const scaleY = (wrapperRect.height - 40) / gridRect.height;
        
        this.currentZoom = Math.min(scaleX, scaleY, 1);
        this.applyZoom();
    }
    
    // Theme Toggle
    setupThemeToggle() {
        const themeToggle = document.getElementById('theme-toggle');
        const themeIcon = document.getElementById('theme-icon');
        
        themeToggle?.addEventListener('click', () => {
            this.isDarkTheme = !this.isDarkTheme;
            document.body.classList.toggle('light-theme');
            
            if (themeIcon) {
                themeIcon.textContent = this.isDarkTheme ? '🌙' : '☀️';
            }
            
            this.showNotification(
                `Switched to ${this.isDarkTheme ? 'dark' : 'light'} theme`,
                'info',
                2000
            );
        });
    }
    
    // Keyboard Shortcuts
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Don't trigger shortcuts when typing in inputs
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }
            
            const shortcuts = {
                'd': () => this.selectTool('draw'),
                'e': () => this.selectTool('erase'),
                'f': () => this.selectTool('fill'),
                's': () => this.selectTool('select'),
                'p': () => this.selectTool('player'),
                'g': () => this.toggleGrid(),
                'Tab': (e) => {
                    e.preventDefault();
                    this.selectNextTile(e.shiftKey ? -1 : 1);
                },
                '+': () => document.getElementById('zoom-in')?.click(),
                '-': () => document.getElementById('zoom-out')?.click(),
                '?': () => this.showHelp()
            };
            
            // Ctrl/Cmd shortcuts
            if (e.ctrlKey || e.metaKey) {
                const ctrlShortcuts = {
                    's': (e) => {
                        e.preventDefault();
                        document.getElementById('online-save-btn')?.click();
                    },
                    'z': (e) => {
                        e.preventDefault();
                        this.undo();
                    },
                    'y': (e) => {
                        e.preventDefault();
                        this.redo();
                    }
                };
                
                const action = ctrlShortcuts[e.key.toLowerCase()];
                if (action) action(e);
            } else {
                const action = shortcuts[e.key.toLowerCase()];
                if (action) action(e);
            }
        });
    }
    
    selectNextTile(direction) {
        const tiles = Array.from(document.querySelectorAll('.tile-option-enhanced:not([style*="display: none"])'));
        const currentIndex = tiles.findIndex(tile => tile.classList.contains('selected'));
        
        let newIndex = currentIndex + direction;
        if (newIndex < 0) newIndex = tiles.length - 1;
        if (newIndex >= tiles.length) newIndex = 0;
        
        tiles[newIndex]?.click();
    }
    
    toggleGrid() {
        const grid = document.getElementById('level-grid');
        if (grid) {
            grid.classList.toggle('hide-grid');
            this.showNotification('Grid ' + (grid.classList.contains('hide-grid') ? 'hidden' : 'shown'), 'info', 1500);
        }
    }
    
    // Minimap
    setupMinimap() {
        const minimap = document.getElementById('minimap');
        const minimapCanvas = document.getElementById('minimap-canvas');
        
        if (!minimap || !minimapCanvas) return;
        
        // Set canvas size
        minimapCanvas.width = 150;
        minimapCanvas.height = 96;
        
        // Update minimap periodically
        setInterval(() => this.updateMinimap(), 1000);
        
        // Click to jump
        minimap.addEventListener('click', (e) => {
            const rect = minimap.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;
            this.jumpToPosition(x, y);
        });
    }
    
    updateMinimap() {
        const minimapCanvas = document.getElementById('minimap-canvas');
        const ctx = minimapCanvas?.getContext('2d');
        const grid = document.getElementById('level-grid');
        
        if (!ctx || !grid) return;
        
        // Clear minimap
        ctx.fillStyle = '#0a0a1a';
        ctx.fillRect(0, 0, minimapCanvas.width, minimapCanvas.height);
        
        // Draw level tiles (simplified)
        const cells = grid.querySelectorAll('.grid-cell-enhanced');
        const gridCols = 25;
        const gridRows = 16;
        const cellWidth = minimapCanvas.width / gridCols;
        const cellHeight = minimapCanvas.height / gridRows;
        
        cells.forEach((cell, index) => {
            if (cell.dataset.tileType && cell.dataset.tileType !== '0') {
                const x = (index % gridCols) * cellWidth;
                const y = Math.floor(index / gridCols) * cellHeight;
                
                ctx.fillStyle = this.getTileColor(parseInt(cell.dataset.tileType));
                ctx.fillRect(x, y, cellWidth - 0.5, cellHeight - 0.5);
            }
        });
        
        // Update viewport indicator
        this.updateMinimapViewport();
    }
    
    getTileColor(tileType) {
        const colors = [
            'transparent',
            '#666666',
            '#ff4444',
            '#ffdd00',
            '#88ddff',
            '#888888',
            '#44ff44',
            '#aa66ff'
        ];
        return colors[tileType] || '#333333';
    }
    
    updateMinimapViewport() {
        const viewport = document.querySelector('.minimap-viewport');
        const gridWrapper = document.querySelector('.level-grid-wrapper');
        const grid = document.getElementById('level-grid');
        
        if (!viewport || !gridWrapper || !grid) return;
        
        const wrapperRect = gridWrapper.getBoundingClientRect();
        const gridRect = grid.getBoundingClientRect();
        
        const x = (gridWrapper.scrollLeft / grid.scrollWidth) * 100;
        const y = (gridWrapper.scrollTop / grid.scrollHeight) * 100;
        const width = (wrapperRect.width / gridRect.width) * 100;
        const height = (wrapperRect.height / gridRect.height) * 100;
        
        viewport.style.left = `${x}%`;
        viewport.style.top = `${y}%`;
        viewport.style.width = `${width}%`;
        viewport.style.height = `${height}%`;
    }
    
    jumpToPosition(x, y) {
        const gridWrapper = document.querySelector('.level-grid-wrapper');
        const grid = document.getElementById('level-grid');
        
        if (!gridWrapper || !grid) return;
        
        gridWrapper.scrollLeft = x * grid.scrollWidth - gridWrapper.clientWidth / 2;
        gridWrapper.scrollTop = y * grid.scrollHeight - gridWrapper.clientHeight / 2;
    }
    
    // Notifications
    setupNotifications() {
        // Create notification container if it doesn't exist
        if (!document.getElementById('notification-container')) {
            const container = document.createElement('div');
            container.id = 'notification-container';
            document.body.appendChild(container);
        }
    }
    
    showNotification(message, type = 'info', duration = 3000) {
        const container = document.getElementById('notification-container');
        if (!container) return;
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        container.appendChild(notification);
        
        // Animate in
        setTimeout(() => notification.style.opacity = '1', 10);
        
        // Remove after duration
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }, duration);
    }
    
    // Help Modal
    setupHelpModal() {
        const helpBtn = document.getElementById('help-btn');
        const helpModal = document.getElementById('help-modal');
        const modalBackdrop = document.getElementById('modal-backdrop');
        
        helpBtn?.addEventListener('click', () => this.showHelp());
        
        modalBackdrop?.addEventListener('click', () => {
            helpModal.style.display = 'none';
            modalBackdrop.style.display = 'none';
        });
    }
    
    showHelp() {
        const helpModal = document.getElementById('help-modal');
        const modalBackdrop = document.getElementById('modal-backdrop');
        
        if (helpModal) helpModal.style.display = 'block';
        if (modalBackdrop) modalBackdrop.style.display = 'block';
    }
    
    // Grid Interactions
    setupGridInteractions() {
        const grid = document.getElementById('level-grid');
        if (!grid) return;
        
        // Pan with middle mouse or space
        let isPanning = false;
        let panStart = { x: 0, y: 0 };
        let scrollStart = { x: 0, y: 0 };
        
        grid.addEventListener('mousedown', (e) => {
            if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
                isPanning = true;
                panStart = { x: e.clientX, y: e.clientY };
                const wrapper = grid.parentElement;
                scrollStart = { x: wrapper.scrollLeft, y: wrapper.scrollTop };
                e.preventDefault();
            }
        });
        
        document.addEventListener('mousemove', (e) => {
            if (isPanning) {
                const wrapper = grid.parentElement;
                wrapper.scrollLeft = scrollStart.x - (e.clientX - panStart.x);
                wrapper.scrollTop = scrollStart.y - (e.clientY - panStart.y);
            }
        });
        
        document.addEventListener('mouseup', () => {
            isPanning = false;
        });
    }
    
    // Loading States
    setupLoadingStates() {
        // Override save functions to show loading
        const originalSave = window.saveLevelOnline;
        if (originalSave) {
            window.saveLevelOnline = async function() {
                const loadingOverlay = document.getElementById('loading-overlay');
                if (loadingOverlay) loadingOverlay.style.display = 'flex';
                
                try {
                    await originalSave.apply(window, arguments);
                } finally {
                    if (loadingOverlay) loadingOverlay.style.display = 'none';
                }
            };
        }
    }
    
    // Undo/Redo functionality
    saveState() {
        if (!window.levels || !window.currentLevel) return;
        
        const state = {
            grid: JSON.parse(JSON.stringify(window.levels[window.currentLevel])),
            playerStart: window.playerStartPositions ? 
                JSON.parse(JSON.stringify(window.playerStartPositions[window.currentLevel])) : null
        };
        
        this.undoStack.push(state);
        if (this.undoStack.length > this.maxUndoSteps) {
            this.undoStack.shift();
        }
        
        this.redoStack = [];
    }
    
    undo() {
        if (this.undoStack.length === 0) return;
        
        const currentState = {
            grid: JSON.parse(JSON.stringify(window.levels[window.currentLevel])),
            playerStart: window.playerStartPositions ? 
                JSON.parse(JSON.stringify(window.playerStartPositions[window.currentLevel])) : null
        };
        
        this.redoStack.push(currentState);
        
        const previousState = this.undoStack.pop();
        this.applyState(previousState);
        
        this.showNotification('Undo', 'info', 1000);
    }
    
    redo() {
        if (this.redoStack.length === 0) return;
        
        const currentState = {
            grid: JSON.parse(JSON.stringify(window.levels[window.currentLevel])),
            playerStart: window.playerStartPositions ? 
                JSON.parse(JSON.stringify(window.playerStartPositions[window.currentLevel])) : null
        };
        
        this.undoStack.push(currentState);
        
        const nextState = this.redoStack.pop();
        this.applyState(nextState);
        
        this.showNotification('Redo', 'info', 1000);
    }
    
    applyState(state) {
        if (!state || !window.levels) return;
        
        window.levels[window.currentLevel] = state.grid;
        
        if (window.playerStartPositions && state.playerStart) {
            window.playerStartPositions[window.currentLevel] = state.playerStart;
        }
        
        // Refresh the display
        if (window.displayLevel) {
            window.displayLevel(window.currentLevel);
        }
    }
}

// Initialize the enhanced UI
const enhancedUI = new EnhancedLevelEditorUI();

// Export for use in other scripts
window.EnhancedLevelEditorUI = EnhancedLevelEditorUI;
window.enhancedUI = enhancedUI;