/**
 * Debug Overlay Renderer
 * Provides visual debugging information directly on the game canvas
 */

class DebugOverlay {
    constructor() {
        this.enabled = false;
        this.settings = {
            showHitboxes: false,
            showVelocityVectors: false,
            showTileInfo: false,
            showPathfinding: false,
            showTriggerZones: false,
            showDebugText: true
        };
        
        // Path recording for movement visualization
        this.playerPath = [];
        this.maxPathLength = 100;
        
        // Tile hover info
        this.hoveredTile = null;
        
        // Custom debug markers
        this.debugMarkers = [];
        
        // Colors for different debug elements
        this.colors = {
            player: '#00ff00',
            playerDanger: '#ff0000',
            solid: '#ffffff',
            deadly: '#ff0000',
            ice: '#00ffff',
            bounce: '#ff00ff',
            goal: '#ffff00',
            velocity: '#00ff00',
            path: 'rgba(0, 255, 0, 0.3)',
            text: '#ffffff',
            textShadow: '#000000'
        };
    }
    
    /**
     * Toggle debug overlay
     */
    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }
    
    /**
     * Update debug overlay data
     */
    update(gameState) {
        if (!this.enabled) return;
        
        // Update player path
        if (gameState.player && gameState.player.alive) {
            this.playerPath.push({
                x: gameState.player.x + gameState.player.width / 2,
                y: gameState.player.y + gameState.player.height / 2,
                onIce: gameState.player.onIce,
                grounded: gameState.player.grounded
            });
            
            if (this.playerPath.length > this.maxPathLength) {
                this.playerPath.shift();
            }
        }
        
        // Clean up old debug markers
        this.debugMarkers = this.debugMarkers.filter(marker => {
            marker.lifetime--;
            return marker.lifetime > 0;
        });
    }
    
    /**
     * Render debug overlay
     */
    render(ctx, gameState) {
        if (!this.enabled) return;
        
        ctx.save();
        
        // Render in order of importance
        if (this.settings.showTileInfo) {
            this.renderTileInfo(ctx, gameState);
        }
        
        if (this.settings.showPathfinding) {
            this.renderPlayerPath(ctx);
        }
        
        if (this.settings.showHitboxes) {
            this.renderHitboxes(ctx, gameState);
        }
        
        if (this.settings.showVelocityVectors) {
            this.renderVelocityVectors(ctx, gameState);
        }
        
        if (this.settings.showTriggerZones) {
            this.renderTriggerZones(ctx, gameState);
        }
        
        // Render custom debug markers
        this.renderDebugMarkers(ctx);
        
        if (this.settings.showDebugText) {
            this.renderDebugText(ctx, gameState);
        }
        
        ctx.restore();
    }
    
    /**
     * Render tile information
     */
    renderTileInfo(ctx, gameState) {
        const level = gameState.currentLevel;
        if (!level) return;
        
        // Highlight special tiles
        for (let y = 0; y < level.length; y++) {
            for (let x = 0; x < level[y].length; x++) {
                const tileId = level[y][x];
                const tileType = TILE_TYPES[tileId];
                
                if (tileType) {
                    const tileX = x * TILE_SIZE;
                    const tileY = y * TILE_SIZE;
                    
                    // Draw tile overlays based on type with enhanced visibility
                    if (tileType.deadly) {
                        // Red stripes for deadly tiles
                        ctx.fillStyle = 'rgba(255, 0, 0, 0.4)';
                        ctx.fillRect(tileX, tileY, TILE_SIZE, TILE_SIZE);
                        
                        // Diagonal stripes
                        ctx.strokeStyle = '#ff0000';
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        for (let i = -TILE_SIZE; i < TILE_SIZE * 2; i += 8) {
                            ctx.moveTo(tileX + i, tileY);
                            ctx.lineTo(tileX + i - TILE_SIZE, tileY + TILE_SIZE);
                        }
                        ctx.stroke();
                        
                        // Draw danger symbol with glow
                        ctx.shadowColor = '#ff0000';
                        ctx.shadowBlur = 5;
                        ctx.font = 'bold 20px Arial';
                        ctx.fillStyle = '#ffffff';
                        ctx.strokeStyle = '#ff0000';
                        ctx.lineWidth = 3;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.strokeText('⚠', tileX + TILE_SIZE/2, tileY + TILE_SIZE/2);
                        ctx.fillText('⚠', tileX + TILE_SIZE/2, tileY + TILE_SIZE/2);
                        ctx.shadowBlur = 0;
                    } else if (tileType.ice) {
                        // Ice effect with shimmer
                        ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
                        ctx.fillRect(tileX, tileY, TILE_SIZE, TILE_SIZE);
                        
                        // Ice crystals pattern
                        ctx.strokeStyle = '#00ffff';
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(tileX + TILE_SIZE/2, tileY + 5);
                        ctx.lineTo(tileX + TILE_SIZE/2, tileY + TILE_SIZE - 5);
                        ctx.moveTo(tileX + 5, tileY + TILE_SIZE/2);
                        ctx.lineTo(tileX + TILE_SIZE - 5, tileY + TILE_SIZE/2);
                        ctx.stroke();
                    } else if (tileType.bounce) {
                        // Spring effect for bounce pads
                        ctx.fillStyle = 'rgba(255, 0, 255, 0.3)';
                        ctx.fillRect(tileX, tileY, TILE_SIZE, TILE_SIZE);
                        
                        // Spring symbol
                        ctx.strokeStyle = '#ff00ff';
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        for (let i = 0; i < 3; i++) {
                            const y = tileY + 10 + i * 8;
                            ctx.moveTo(tileX + 8, y);
                            ctx.quadraticCurveTo(tileX + TILE_SIZE/2, y - 3, tileX + TILE_SIZE - 8, y);
                        }
                        ctx.stroke();
                    } else if (tileId === 3) { // Goal
                        // Pulsing goal effect
                        const pulse = Math.sin(Date.now() * 0.005) * 0.2 + 0.3;
                        ctx.fillStyle = `rgba(255, 255, 0, ${pulse})`;
                        ctx.fillRect(tileX, tileY, TILE_SIZE, TILE_SIZE);
                        
                        // Star symbol
                        ctx.fillStyle = '#ffff00';
                        ctx.font = 'bold 20px Arial';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText('★', tileX + TILE_SIZE/2, tileY + TILE_SIZE/2);
                    } else if (tileType.solid) {
                        // Outline solid tiles
                        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                        ctx.lineWidth = 1;
                        ctx.strokeRect(tileX + 0.5, tileY + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
                    }
                    
                    // Draw tile ID in corner
                    ctx.font = '8px Arial';
                    ctx.fillStyle = '#ffffff';
                    ctx.strokeStyle = '#000000';
                    ctx.lineWidth = 2;
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'top';
                    const idText = tileId.toString();
                    ctx.strokeText(idText, tileX + 2, tileY + 2);
                    ctx.fillText(idText, tileX + 2, tileY + 2);
                }
            }
        }
        
        // Tile grid overlay
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 0.5;
        
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
    
    /**
     * Render hitboxes for all entities
     */
    renderHitboxes(ctx, gameState) {
        const player = gameState.player;
        
        if (player) {
            // Draw shadow/glow effect for better visibility
            ctx.shadowColor = player.alive ? '#00ff00' : '#ff0000';
            ctx.shadowBlur = 10;
            
            // Player hitbox with thick border
            ctx.strokeStyle = player.alive ? '#00ff00' : '#ff0000';
            ctx.lineWidth = 3;
            ctx.strokeRect(player.x, player.y, player.width, player.height);
            
            // Inner hitbox for better visibility
            ctx.strokeStyle = player.alive ? '#ffffff' : '#ffaaaa';
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(player.x + 1, player.y + 1, player.width - 2, player.height - 2);
            ctx.setLineDash([]);
            
            // Reset shadow
            ctx.shadowBlur = 0;
            
            // Player center with larger indicator
            ctx.fillStyle = '#ffff00';
            const centerX = player.x + player.width / 2;
            const centerY = player.y + player.height / 2;
            
            // Draw crosshair at center
            ctx.strokeStyle = '#ffff00';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(centerX - 6, centerY);
            ctx.lineTo(centerX + 6, centerY);
            ctx.moveTo(centerX, centerY - 6);
            ctx.lineTo(centerX, centerY + 6);
            ctx.stroke();
            
            // Ground detection points with better visibility
            const groundPoints = [
                { x: player.x + 2, y: player.y + player.height, label: 'L' },
                { x: player.x + player.width / 2, y: player.y + player.height, label: 'C' },
                { x: player.x + player.width - 2, y: player.y + player.height, label: 'R' }
            ];
            
            groundPoints.forEach(point => {
                // Outer circle
                ctx.strokeStyle = player.grounded ? '#00ff00' : '#ff0000';
                ctx.fillStyle = player.grounded ? '#00ff00' : '#ff0000';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
                ctx.stroke();
                
                // Inner dot
                ctx.beginPath();
                ctx.arc(point.x, point.y, 2, 0, Math.PI * 2);
                ctx.fill();
                
                // Label
                ctx.font = 'bold 8px Arial';
                ctx.fillStyle = '#ffffff';
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 3;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'bottom';
                ctx.strokeText(point.label, point.x, point.y - 6);
                ctx.fillText(point.label, point.x, point.y - 6);
            });
            
            // Show player bounds info with better background
            ctx.font = 'bold 12px Arial';
            const boundsText = `(${Math.round(player.x)}, ${Math.round(player.y)})`;
            const textWidth = ctx.measureText(boundsText).width;
            
            // Background for text
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(player.x - 2, player.y - 20, textWidth + 8, 16);
            
            // Text with shadow
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 3;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'bottom';
            ctx.strokeText(boundsText, player.x + 2, player.y - 5);
            ctx.fillText(boundsText, player.x + 2, player.y - 5);
            
            // Direction indicator
            if (Math.abs(player.velX) > 0.1) {
                ctx.strokeStyle = '#00ffff';
                ctx.lineWidth = 3;
                ctx.beginPath();
                const arrowX = player.velX > 0 ? player.x + player.width + 5 : player.x - 5;
                const arrowY = player.y + player.height / 2;
                
                if (player.velX > 0) {
                    ctx.moveTo(arrowX, arrowY);
                    ctx.lineTo(arrowX + 10, arrowY);
                    ctx.lineTo(arrowX + 7, arrowY - 3);
                    ctx.moveTo(arrowX + 10, arrowY);
                    ctx.lineTo(arrowX + 7, arrowY + 3);
                } else {
                    ctx.moveTo(arrowX, arrowY);
                    ctx.lineTo(arrowX - 10, arrowY);
                    ctx.lineTo(arrowX - 7, arrowY - 3);
                    ctx.moveTo(arrowX - 10, arrowY);
                    ctx.lineTo(arrowX - 7, arrowY + 3);
                }
                ctx.stroke();
            }
        }
        
        // Particle hitboxes with better visibility
        gameState.particles.forEach(particle => {
            ctx.strokeStyle = particle.color;
            ctx.lineWidth = 2;
            ctx.globalAlpha = particle.life / 60;
            
            // Outer glow
            ctx.shadowColor = particle.color;
            ctx.shadowBlur = 5;
            
            ctx.strokeRect(
                particle.x - particle.size/2,
                particle.y - particle.size/2,
                particle.size,
                particle.size
            );
            
            // Center dot
            ctx.fillStyle = particle.color;
            ctx.fillRect(particle.x - 1, particle.y - 1, 2, 2);
            
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1;
        });
    }
    
    /**
     * Render velocity vectors
     */
    renderVelocityVectors(ctx, gameState) {
        const player = gameState.player;
        
        if (player) {
            const centerX = player.x + player.width / 2;
            const centerY = player.y + player.height / 2;
            
            // Velocity vector
            ctx.strokeStyle = this.colors.velocity;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(centerX + player.velX * 5, centerY + player.velY * 5);
            ctx.stroke();
            
            // Velocity magnitude
            const speed = Math.sqrt(player.velX * player.velX + player.velY * player.velY);
            
            ctx.font = '10px Arial';
            ctx.fillStyle = this.colors.text;
            ctx.strokeStyle = this.colors.textShadow;
            ctx.lineWidth = 2;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            
            const speedText = speed.toFixed(1);
            ctx.strokeText(speedText, centerX, player.y + player.height + 5);
            ctx.fillText(speedText, centerX, player.y + player.height + 5);
            
            // Show ice momentum if applicable
            if (player.onIce || player.iceInertia !== 0) {
                ctx.strokeStyle = this.colors.ice;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(centerX, centerY);
                ctx.lineTo(centerX + player.iceInertia * 10, centerY);
                ctx.stroke();
            }
        }
        
        // Particle velocities
        gameState.particles.forEach(particle => {
            ctx.strokeStyle = particle.color;
            ctx.lineWidth = 1;
            ctx.globalAlpha = particle.life / 60;
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(particle.x + particle.velX * 3, particle.y + particle.velY * 3);
            ctx.stroke();
            ctx.globalAlpha = 1;
        });
    }
    
    /**
     * Render player movement path
     */
    renderPlayerPath(ctx) {
        if (this.playerPath.length < 2) return;
        
        ctx.lineWidth = 2;
        
        for (let i = 1; i < this.playerPath.length; i++) {
            const prev = this.playerPath[i - 1];
            const curr = this.playerPath[i];
            
            // Fade older points
            ctx.globalAlpha = i / this.playerPath.length;
            
            // Color based on state
            if (curr.onIce) {
                ctx.strokeStyle = this.colors.ice;
            } else if (!curr.grounded) {
                ctx.strokeStyle = '#ffff00';
            } else {
                ctx.strokeStyle = this.colors.path;
            }
            
            ctx.beginPath();
            ctx.moveTo(prev.x, prev.y);
            ctx.lineTo(curr.x, curr.y);
            ctx.stroke();
            
            // Draw point
            ctx.fillStyle = ctx.strokeStyle;
            ctx.fillRect(curr.x - 1, curr.y - 1, 2, 2);
        }
        
        ctx.globalAlpha = 1;
    }
    
    /**
     * Render trigger zones (goals, checkpoints, etc)
     */
    renderTriggerZones(ctx, gameState) {
        const level = gameState.currentLevel;
        if (!level) return;
        
        // Find and highlight goal tiles
        for (let y = 0; y < level.length; y++) {
            for (let x = 0; x < level[y].length; x++) {
                if (level[y][x] === 3) { // Goal tile
                    const tileX = x * TILE_SIZE;
                    const tileY = y * TILE_SIZE;
                    
                    // Pulsing effect
                    const pulse = Math.sin(Date.now() * 0.005) * 0.3 + 0.7;
                    
                    ctx.strokeStyle = this.colors.goal;
                    ctx.lineWidth = 3;
                    ctx.globalAlpha = pulse;
                    ctx.strokeRect(tileX - 5, tileY - 5, TILE_SIZE + 10, TILE_SIZE + 10);
                    
                    // Inner glow
                    ctx.strokeStyle = this.colors.goal;
                    ctx.lineWidth = 1;
                    ctx.strokeRect(tileX - 2, tileY - 2, TILE_SIZE + 4, TILE_SIZE + 4);
                    
                    ctx.globalAlpha = 1;
                }
            }
        }
    }
    
    /**
     * Render custom debug markers
     */
    renderDebugMarkers(ctx) {
        this.debugMarkers.forEach(marker => {
            ctx.save();
            
            ctx.globalAlpha = marker.lifetime / marker.maxLifetime;
            
            switch (marker.type) {
                case 'point':
                    ctx.fillStyle = marker.color;
                    ctx.fillRect(marker.x - 2, marker.y - 2, 4, 4);
                    break;
                    
                case 'circle':
                    ctx.strokeStyle = marker.color;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(marker.x, marker.y, marker.radius, 0, Math.PI * 2);
                    ctx.stroke();
                    break;
                    
                case 'line':
                    ctx.strokeStyle = marker.color;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(marker.x1, marker.y1);
                    ctx.lineTo(marker.x2, marker.y2);
                    ctx.stroke();
                    break;
                    
                case 'text':
                    ctx.font = '12px Arial';
                    ctx.fillStyle = marker.color;
                    ctx.strokeStyle = '#000000';
                    ctx.lineWidth = 3;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.strokeText(marker.text, marker.x, marker.y);
                    ctx.fillText(marker.text, marker.x, marker.y);
                    break;
            }
            
            ctx.restore();
        });
    }
    
    /**
     * Render debug text overlay
     */
    renderDebugText(ctx, gameState) {
        const player = gameState.player;
        if (!player) return;
        
        const debugInfo = [
            `FPS: ${(1000 / gameState.deltaTime).toFixed(1)}`,
            `Player: (${Math.round(player.x)}, ${Math.round(player.y)})`,
            `Velocity: (${player.velX.toFixed(1)}, ${player.velY.toFixed(1)})`,
            `State: ${player.alive ? 'Alive' : 'Dead'} | ${player.grounded ? 'Grounded' : 'Airborne'}`,
            `Surface: ${player.onIce ? 'ICE' : 'Normal'}`,
            `Level: ${gameState.levelIndex || 'Custom'}`,
            `Deaths: ${gameState.deaths}`,
            `Particles: ${gameState.particles.length}`
        ];
        
        // Add ice-specific info
        if (player.onIce || player.iceJumpTimer > 0) {
            debugInfo.push(`Ice Time: ${player.iceTime.toFixed(1)}`);
            debugInfo.push(`Ice Jump: ${player.iceJumpTimer.toFixed(1)}/${player.iceJumpDuration}`);
            debugInfo.push(`Ice Inertia: ${player.iceInertia.toFixed(2)}`);
        }
        
        // Background for text
        const padding = 10;
        const lineHeight = 14;
        const maxWidth = Math.max(...debugInfo.map(line => ctx.measureText(line).width));
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(5, 5, maxWidth + padding * 2, debugInfo.length * lineHeight + padding * 2);
        
        // Debug text
        ctx.font = '12px Courier New';
        ctx.fillStyle = this.colors.text;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        
        debugInfo.forEach((line, index) => {
            ctx.fillText(line, 5 + padding, 5 + padding + index * lineHeight);
        });
    }
    
    /**
     * Add a debug marker
     */
    addMarker(type, options) {
        const marker = {
            type: type,
            lifetime: options.lifetime || 60,
            maxLifetime: options.lifetime || 60,
            color: options.color || '#ffffff',
            ...options
        };
        
        this.debugMarkers.push(marker);
    }
    
    /**
     * Clear all debug data
     */
    clear() {
        this.playerPath = [];
        this.debugMarkers = [];
    }
    
    /**
     * Handle mouse move for tile inspection
     */
    handleMouseMove(x, y) {
        this.hoveredTile = {
            x: Math.floor(x / TILE_SIZE),
            y: Math.floor(y / TILE_SIZE)
        };
    }
}

// Export the debug overlay
window.DebugOverlay = DebugOverlay;