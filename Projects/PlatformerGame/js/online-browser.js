// online-browser.js - Handles the online level browsing interface

class OnlineLevelBrowser {
    constructor(uiManager, gameManager) {
        this.uiManager = uiManager;
        this.gameManager = gameManager;

        // Pagination state
        this.lastDoc = null;
        this.hasMore = true;
        this.currentFilter = {
            orderBy: 'createdAt',
            difficulty: null
        };

        // Current level being viewed
        this.currentViewedLevel = null;

        // Initialize
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Browse tab controls
        const sortBy = document.getElementById('sortBy');
        const difficultyFilter = document.getElementById('difficultyFilter');
        const loadMoreBtn = document.getElementById('loadMoreLevels');

        if (sortBy) {
            sortBy.addEventListener('change', () => this.applyFilters());
        }

        if (difficultyFilter) {
            difficultyFilter.addEventListener('change', () => this.applyFilters());
        }

        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => this.loadMoreLevels());
        }

        // Search functionality
        const searchButton = document.getElementById('searchButton');
        const searchInput = document.getElementById('levelSearchInput');

        if (searchButton) {
            searchButton.addEventListener('click', () => this.searchLevels());
        }

        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.searchLevels();
            });
        }

        // Level details modal
        const modalClose = document.getElementById('levelDetailsClose');
        const playButton = document.getElementById('playOnlineLevel');
        const rateButton = document.getElementById('rateLevelButton');
        const submitRating = document.getElementById('submitRating');

        if (modalClose) {
            modalClose.addEventListener('click', () => this.closeLevelDetails());
        }

        if (playButton) {
            playButton.addEventListener('click', () => this.playSelectedLevel());
        }

        if (rateButton) {
            rateButton.addEventListener('click', () => this.showRatingInterface());
        }

        if (submitRating) {
            submitRating.addEventListener('click', () => this.submitRating());
        }

        // Star rating input
        document.querySelectorAll('.star-rating-input .star').forEach(star => {
            star.addEventListener('click', (e) => this.selectRating(e.target));
            star.addEventListener('mouseenter', (e) => this.hoverRating(e.target));
        });

        document.querySelector('.star-rating-input')?.addEventListener('mouseleave',
            () => this.resetRatingHover());
    }

    async show() {
        console.log('Showing online levels browser');
        console.log('window.levelAPI available:', !!window.levelAPI);
        console.log('window.db available:', !!window.db);
        
        // Get the menu element
        const menu = document.getElementById('onlineLevelsMenu');
        if (!menu) {
            console.error('Online levels menu element not found!');
            return;
        }
        
        // Show the online levels menu
        menu.style.display = 'flex';
        console.log('Online levels menu display set to flex');
        
        // Double-check it's visible
        setTimeout(() => {
            const currentDisplay = menu.style.display;
            console.log('Online levels menu display after 100ms:', currentDisplay);
            if (currentDisplay === 'none') {
                console.error('Online levels menu was hidden again!');
            }
        }, 100);

        // Load initial content
        await this.loadBrowseLevels();
    }

    hide() {
        document.getElementById('onlineLevelsMenu').style.display = 'none';
    }

    switchTab(tabName) {
        // Update active tab button
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Update active tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.style.display = 'none';
            content.classList.remove('active');
        });

        const activeTab = document.getElementById(tabName + 'Tab');
        if (activeTab) {
            activeTab.style.display = 'block';
            activeTab.classList.add('active');
        }

        // Load content for the tab
        switch (tabName) {
            case 'browse':
                this.loadBrowseLevels();
                break;
            case 'featured':
                this.loadFeaturedLevels();
                break;
            case 'my-levels':
                this.loadMyLevels();
                break;
        }
    }

    async loadBrowseLevels(reset = true) {
        if (reset) {
            this.lastDoc = null;
            this.hasMore = true;
            const levelsList = document.getElementById('onlineLevelsList');
            if (levelsList) {
                levelsList.innerHTML = '<p style="text-align: center; color: #999;">Loading levels...</p>';
            }
        }

        try {
            // Check if levelAPI is available
            if (!window.levelAPI) {
                console.error('Level API not available');
                this.showError('Online features not available. Please check your connection.');
                return;
            }

            const options = {
                orderBy: this.currentFilter.orderBy,
                startAfter: this.lastDoc,
                filters: {}
            };

            if (this.currentFilter.difficulty) {
                options.filters.difficulty = this.currentFilter.difficulty;
            }

            console.log('Loading online levels with options:', options);
            const result = await window.levelAPI.getLevels(options);
            console.log('Loaded levels:', result);

            if (result && result.levels) {
                this.displayLevels(result.levels, 'onlineLevelsList');
                this.lastDoc = result.lastDoc;
                this.hasMore = result.hasMore;
            } else {
                console.error('Invalid result structure:', result);
                this.showError('Failed to load levels: Invalid response');
            }

            // Update load more button
            const loadMoreBtn = document.getElementById('loadMoreLevels');
            if (loadMoreBtn) {
                loadMoreBtn.style.display = this.hasMore ? 'block' : 'none';
            }

        } catch (error) {
            console.error('Error loading levels:', error);
            this.showError('Failed to load levels');
        }
    }

    async loadMoreLevels() {
        await this.loadBrowseLevels(false);
    }

    applyFilters() {
        this.currentFilter.orderBy = document.getElementById('sortBy').value;
        this.currentFilter.difficulty = document.getElementById('difficultyFilter').value || null;
        this.loadBrowseLevels();
    }

    async loadFeaturedLevels() {
        try {
            // Load featured levels (marked with isFeatured flag)
            const featuredQuery = await window.db.collection('levels')
                .where('isFeatured', '==', true)
                .orderBy('featuredAt', 'desc')
                .limit(10)
                .get();
            
            const featuredLevels = [];
            featuredQuery.forEach(doc => {
                featuredLevels.push({ id: doc.id, ...doc.data() });
            });
            
            this.displayLevels(featuredLevels, 'featuredLevels');

            // Also load popular/top rated/recent
            const featured = await window.levelAPI.getFeaturedLevels();
            this.displayLevels(featured.popular, 'popularLevels');
            this.displayLevels(featured.topRated, 'topRatedLevels');
            this.displayLevels(featured.recent, 'recentLevels');

        } catch (error) {
            console.error('Error loading featured levels:', error);
            this.showError('Failed to load featured levels');
        }
    }

    async searchLevels() {
        const searchTerm = document.getElementById('levelSearchInput').value.trim();

        if (!searchTerm) {
            this.showError('Please enter a search term');
            return;
        }

        try {
            const results = await window.levelAPI.searchLevels(searchTerm);
            this.displayLevels(results, 'searchResults');

            if (results.length === 0) {
                document.getElementById('searchResults').innerHTML =
                    '<p style="text-align: center; color: #888;">No levels found matching your search.</p>';
            }

        } catch (error) {
            console.error('Error searching levels:', error);
            this.showError('Failed to search levels');
        }
    }

    async loadMyLevels() {
        // Check if user is authenticated
        if (!window.authManager || !window.authManager.isSignedIn()) {
            document.querySelector('.no-levels-message').style.display = 'block';
            document.getElementById('myLevelsList').innerHTML = '<p style="text-align: center; color: #666;">Please sign in to view your levels</p>';
            return;
        }

        try {
            // Get user levels using the auth manager
            const userLevels = await window.authManager.getUserLevels();

            if (userLevels.length === 0) {
                document.querySelector('.no-levels-message').style.display = 'block';
                document.getElementById('myLevelsList').innerHTML = '';
            } else {
                document.querySelector('.no-levels-message').style.display = 'none';
                this.displayLevels(userLevels, 'myLevelsList');
            }

        } catch (error) {
            console.error('Error loading my levels:', error);
            this.showError('Failed to load your levels');
        }
    }

    async displayLevels(levels, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // For featured lists, clear existing content
        if (containerId.includes('Levels') && containerId !== 'onlineLevelsList') {
            container.innerHTML = '';
        }

        // Check if levels is valid
        if (!levels || !Array.isArray(levels)) {
            console.error('Invalid levels data:', levels);
            container.innerHTML = '<p style="text-align: center; color: #999;">No levels available</p>';
            return;
        }

        // If no levels, show a message
        if (levels.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #999;">No levels found</p>';
            return;
        }

        // Create cards asynchronously
        const cards = await Promise.all(levels.map(level => this.createLevelCard(level)));
        cards.forEach(card => container.appendChild(card));
    }

    async createLevelCard(level) {
        const card = document.createElement('div');
        card.className = 'online-level-card';
        card.onclick = () => this.showLevelDetails(level);

        const difficultyClass = `difficulty-${level.difficulty || 'medium'}`;
        const rating = level.rating ? '★'.repeat(Math.round(level.rating)) : 'Not rated';
        
        // Check if current user is admin
        const isAdmin = await this.checkUserIsAdmin();

        card.innerHTML = `
            <div class="level-card-header">
                <h3 class="level-card-title">${this.escapeHtml(level.name)}</h3>
                <span class="difficulty-badge ${difficultyClass}">${level.difficulty || 'Medium'}</span>
                ${level.isFeatured ? '<span class="featured-badge">⭐ Featured</span>' : ''}
            </div>
            <div class="level-card-stats">
                <div class="stat-item">
                    <span>🎮</span>
                    <span>${level.plays || 0} plays</span>
                </div>
                <div class="stat-item">
                    <span>✓</span>
                    <span>${level.completions || 0} completed</span>
                </div>
                <div class="stat-item">
                    <span>⭐</span>
                    <span>${rating}</span>
                </div>
                <div class="stat-item">
                    <span>📅</span>
                    <span>${this.formatDate(level.createdAt)}</span>
                </div>
            </div>
            <div class="level-card-author">by ${this.escapeHtml(level.author)}</div>
            ${isAdmin ? `
                <div class="admin-controls">
                    <button class="admin-feature-btn" onclick="event.stopPropagation(); window.onlineLevelBrowser.toggleFeatureLevel('${level.id}', ${!!level.isFeatured})">
                        ${level.isFeatured ? 'Unfeature' : 'Feature'}
                    </button>
                </div>
            ` : ''}
        `;

        return card;
    }

    createLevelDetailsModal() {
        // Check if modal already exists
        if (document.getElementById('levelDetailsModal')) {
            return;
        }

        // Create modal HTML
        const modal = document.createElement('div');
        modal.id = 'levelDetailsModal';
        modal.className = 'modal';
        modal.style.display = 'none';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <span class="close" onclick="window.onlineLevelBrowser.closeLevelDetails()">&times;</span>
                <h2 id="levelDetailsName"></h2>
                <div class="level-details-info">
                    <p>Author: <span id="levelDetailsAuthor"></span></p>
                    <p>Difficulty: <span id="levelDetailsDifficulty"></span></p>
                    <p>Plays: <span id="levelDetailsPlays"></span></p>
                    <p>Completions: <span id="levelDetailsCompletions"></span></p>
                    <p>Rating: <span id="levelDetailsRating" class="rating-display"></span></p>
                </div>
                <canvas id="levelPreviewCanvas" width="400" height="300" style="border: 1px solid #555; margin: 20px auto; display: block;"></canvas>
                <div id="ratingInterface" style="display: none; margin: 20px 0;">
                    <p>Rate this level:</p>
                    <div class="rating-stars" id="ratingStars">
                        <span data-rating="1">☆</span>
                        <span data-rating="2">☆</span>
                        <span data-rating="3">☆</span>
                        <span data-rating="4">☆</span>
                        <span data-rating="5">☆</span>
                    </div>
                </div>
                <div class="modal-buttons">
                    <button onclick="window.onlineLevelBrowser.playSelectedLevel()" class="primary-button">Play Level</button>
                    <button onclick="window.onlineLevelBrowser.closeLevelDetails()">Close</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);

        // Add rating event listeners
        const stars = modal.querySelectorAll('.rating-stars span');
        stars.forEach(star => {
            star.addEventListener('click', (e) => {
                const rating = parseInt(e.target.dataset.rating);
                this.rateLevel(rating);
            });
            star.addEventListener('mouseover', (e) => {
                const rating = parseInt(e.target.dataset.rating);
                this.updateStarDisplay(rating);
            });
        });

        modal.querySelector('.rating-stars').addEventListener('mouseleave', () => {
            this.updateStarDisplay(this.currentViewedLevel?.userRating || 0);
        });
    }

    async showLevelDetails(level) {
        console.log('Showing level details for:', level);
        this.currentViewedLevel = level;

        // Ensure modal exists
        this.createLevelDetailsModal();

        // Update modal content
        document.getElementById('levelDetailsName').textContent = level.name;
        document.getElementById('levelDetailsAuthor').textContent = level.author;
        document.getElementById('levelDetailsDifficulty').textContent = level.difficulty || 'Medium';
        document.getElementById('levelDetailsPlays').textContent = level.plays || 0;
        document.getElementById('levelDetailsCompletions').textContent = level.completions || 0;

        // Update rating display
        const ratingContainer = document.getElementById('levelDetailsRating');
        const rating = Math.round(level.rating || 0);
        ratingContainer.innerHTML = '★'.repeat(rating) + '☆'.repeat(5 - rating);

        // Draw level preview
        this.drawLevelPreview(level);

        // Show modal
        document.getElementById('levelDetailsModal').style.display = 'flex';

        // Hide rating interface initially
        document.getElementById('ratingInterface').style.display = 'none';
    }

    drawLevelPreview(level) {
        const canvas = document.getElementById('levelPreviewCanvas');
        const ctx = canvas.getContext('2d');

        // Clear canvas
        ctx.fillStyle = '#000022';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Calculate scale
        const scale = canvas.width / (GRID_WIDTH * TILE_SIZE);
        const scaledTileSize = TILE_SIZE * scale;

        // Draw tiles
        if (level.grid) {
            for (let y = 0; y < level.grid.length; y++) {
                for (let x = 0; x < level.grid[y].length; x++) {
                    const tileId = level.grid[y][x];
                    if (tileId === 0) continue;

                    const tileType = TILE_TYPES[tileId];
                    if (!tileType) continue;

                    ctx.fillStyle = tileType.color;
                    ctx.fillRect(
                        x * scaledTileSize,
                        y * scaledTileSize,
                        scaledTileSize,
                        scaledTileSize
                    );
                }
            }
        }

        // Draw start position
        if (level.startPosition) {
            ctx.fillStyle = '#FFA500';
            ctx.fillRect(
                level.startPosition.x * scaledTileSize,
                level.startPosition.y * scaledTileSize,
                PLAYER_WIDTH * scale,
                PLAYER_HEIGHT * scale
            );
        }
    }

    closeLevelDetails() {
        document.getElementById('levelDetailsModal').style.display = 'none';
        this.currentViewedLevel = null;
    }

    async playSelectedLevel() {
        if (!this.currentViewedLevel) return;

        try {
            const level = this.currentViewedLevel;
            
            // Try to update play count, but don't fail if it doesn't work
            try {
                await window.db.collection('levels').doc(level.id).update({
                    plays: window.firebase.firestore.FieldValue.increment(1),
                    lastPlayed: window.firebase.firestore.FieldValue.serverTimestamp()
                });
            } catch (updateError) {
                console.log('Could not update play count:', updateError);
                // Continue anyway - the level can still be played
            }

            // Close the modal and online levels menu
            this.closeLevelDetails();
            this.hide();
            
            // Load and play the level directly
            if (this.gameManager) {
                await this.gameManager.loadAndPlayOnlineLevel(level.id);
            } else {
                console.error('Game manager not available');
                this.showError('Failed to load level: Game manager not found');
            }

        } catch (error) {
            console.error('Error loading level:', error);
            this.showError('Failed to load level: ' + error.message);
        }
    }
    showRatingInterface() {
        document.getElementById('ratingInterface').style.display = 'block';
        document.getElementById('rateLevelButton').style.display = 'none';
    }

    selectRating(star) {
        const rating = parseInt(star.dataset.rating);

        document.querySelectorAll('.star-rating-input .star').forEach((s, index) => {
            s.classList.toggle('selected', index < rating);
            s.textContent = index < rating ? '★' : '☆';
        });

        star.dataset.selectedRating = rating;
    }

    hoverRating(star) {
        const rating = parseInt(star.dataset.rating);

        document.querySelectorAll('.star-rating-input .star').forEach((s, index) => {
            s.textContent = index < rating ? '★' : '☆';
        });
    }

    resetRatingHover() {
        document.querySelectorAll('.star-rating-input .star').forEach(s => {
            s.textContent = s.classList.contains('selected') ? '★' : '☆';
        });
    }

    async submitRating() {
        const selectedStar = document.querySelector('.star-rating-input .star.selected:last-of-type');

        if (!selectedStar || !this.currentViewedLevel) {
            this.showError('Please select a rating');
            return;
        }

        const rating = parseInt(selectedStar.dataset.rating) + 1; // Convert to 1-5 scale

        try {
            const success = await window.levelLoader.rateLevel(
                this.currentViewedLevel.id,
                rating
            );

            if (success) {
                // Hide rating interface
                document.getElementById('ratingInterface').style.display = 'none';

                // Show success message
                this.showNotification('Rating submitted successfully!');

                // Refresh level details
                const updatedLevel = await window.levelAPI.getLevel(this.currentViewedLevel.id);
                this.showLevelDetails(updatedLevel);
            }

        } catch (error) {
            console.error('Error submitting rating:', error);
            this.showError(error.message || 'Failed to submit rating');
        }
    }

    // Utility methods
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    async checkUserIsAdmin() {
        try {
            const user = window.authManager?.getCurrentUser();
            if (!user) return false;
            
            const userDoc = await window.db.collection('users').doc(user.uid).get();
            if (userDoc.exists) {
                return userDoc.data().isAdmin === true;
            }
            return false;
        } catch (error) {
            console.error('Error checking admin status:', error);
            return false;
        }
    }

    async toggleFeatureLevel(levelId, isCurrentlyFeatured) {
        try {
            const user = window.authManager?.getCurrentUser();
            if (!user) {
                alert('You must be signed in to perform this action');
                return;
            }

            // Double-check admin status
            const isAdmin = await this.checkUserIsAdmin();
            if (!isAdmin) {
                alert('Only admins can feature levels');
                return;
            }

            // Update the level's featured status
            await window.db.collection('levels').doc(levelId).update({
                isFeatured: !isCurrentlyFeatured,
                featuredBy: !isCurrentlyFeatured ? user.uid : null,
                featuredAt: !isCurrentlyFeatured ? firebase.firestore.FieldValue.serverTimestamp() : null
            });

            // Refresh the current view
            const activeTab = document.querySelector('.tab-button.active');
            if (activeTab) {
                this.switchTab(activeTab.dataset.tab);
            }

            console.log(`Level ${levelId} ${!isCurrentlyFeatured ? 'featured' : 'unfeatured'} successfully`);
        } catch (error) {
            console.error('Error toggling feature status:', error);
            alert('Failed to update level feature status');
        }
    }

    formatDate(timestamp) {
        if (!timestamp) return 'Unknown';

        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) return 'Today';
        if (days === 1) return 'Yesterday';
        if (days < 7) return `${days} days ago`;
        if (days < 30) return `${Math.floor(days / 7)} weeks ago`;

        return date.toLocaleDateString();
    }

    showError(message) {
        // You can implement a toast notification here
        alert(message);
    }

    showNotification(message) {
        // Use the existing notification system if available
        if (typeof window.showNotification === 'function') {
            window.showNotification(message, 3000);
        } else {
            alert(message);
        }
    }
}

// Export for use in other modules
window.OnlineLevelBrowser = OnlineLevelBrowser;