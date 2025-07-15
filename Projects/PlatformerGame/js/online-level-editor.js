        // online-level-editor.js - Modifications to level editor for online functionality

        // Add these functions to your existing level-editor.js

        /**
         * Initialize online features in the level editor
         */
        function initializeOnlineFeatures() {
            // Initialize auth manager first
            if (window.authManager) {
                window.authManager.init();
            }

            // Add auth UI
            addAuthUI();

            // Add online save button
            addOnlineSaveButton();

            // Add publish/unpublish toggle
            addPublishToggle();

            // Add difficulty selector
            addDifficultySelector();

            // Add tags input
            addTagsInput();

            // Initialize Firebase if not already done
            if (typeof firebase === 'undefined') {
                loadFirebaseScript();
            }

            // Listen for auth state changes
            if (window.authManager) {
                window.authManager.onAuthStateChanged((user) => {
                    updateAuthUI(user);
                });
            }
        }

        /**
         * Add authentication UI
         */
        function addAuthUI() {
            const header = document.querySelector('.header');
            if (!header) return;

            const authContainer = document.createElement('div');
            authContainer.id = 'auth-container';
            authContainer.style.cssText = 'display: flex; align-items: center; gap: 10px;';

            // User info display
            const userInfo = document.createElement('span');
            userInfo.id = 'user-info';
            userInfo.style.cssText = 'color: #6d8ad0; margin-right: 10px;';
            userInfo.textContent = 'Not signed in';

            // Sign in button
            const signInBtn = document.createElement('button');
            signInBtn.id = 'sign-in-btn';
            signInBtn.textContent = 'Sign In';
            signInBtn.style.cssText = 'background-color: #4c6baf; padding: 5px 15px;';
            signInBtn.addEventListener('click', showSignInDialog);

            // Sign out button (hidden by default)
            const signOutBtn = document.createElement('button');
            signOutBtn.id = 'sign-out-btn';
            signOutBtn.textContent = 'Sign Out';
            signOutBtn.style.cssText = 'background-color: #666; padding: 5px 15px; display: none;';
            signOutBtn.addEventListener('click', () => {
                if (window.authManager) {
                    window.authManager.signOut();
                }
            });

            authContainer.appendChild(userInfo);
            authContainer.appendChild(signInBtn);
            authContainer.appendChild(signOutBtn);

            header.appendChild(authContainer);
        }

        /**
         * Update auth UI based on user state
         */
        async function updateAuthUI(user) {
            const userInfo = document.getElementById('user-info');
            const signInBtn = document.getElementById('sign-in-btn');
            const signOutBtn = document.getElementById('sign-out-btn');

            // Check if elements exist before updating them
            if (!userInfo || !signInBtn || !signOutBtn) {
                return;
            }

            if (user) {
                let displayText = `Signed in as: ${user.displayName || user.email || 'Anonymous'}`;
                
                // Check if user is admin
                const isAdmin = await window.authManager.isAdmin();
                if (isAdmin) {
                    displayText += ' <span style="color: #FFD700;">[ADMIN]</span>';
                }
                
                userInfo.innerHTML = displayText;
                signInBtn.style.display = 'none';
                signOutBtn.style.display = 'block';
            } else {
                userInfo.textContent = 'Not signed in';
                signInBtn.style.display = 'block';
                signOutBtn.style.display = 'none';
            }
        }

        /**
         * Show sign in dialog
         */
        function showSignInDialog() {
            // Create modal
            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.style.display = 'flex';
            modal.innerHTML = `
                <div class="modal-content" style="max-width: 400px;">
                    <span class="close" onclick="this.parentElement.parentElement.remove()">&times;</span>
                    <h2>Sign In to Save Levels</h2>
                    <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 20px;">
                        <button id="google-sign-in" style="background-color: #4285f4; padding: 10px;">
                            Sign in with Google
                        </button>
                        <button id="anonymous-sign-in" style="background-color: #666; padding: 10px;">
                            Continue as Guest
                        </button>
                        <hr style="margin: 10px 0; border-color: #444;">
                        <input type="email" id="email-input" placeholder="Email" style="padding: 10px;">
                        <input type="password" id="password-input" placeholder="Password" style="padding: 10px;">
                        <button id="email-sign-in" style="background-color: #4c6baf; padding: 10px;">
                            Sign In with Email
                        </button>
                        <button id="create-account" style="background-color: #41a547; padding: 10px;">
                            Create Account
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            // Add event listeners
            document.getElementById('google-sign-in').addEventListener('click', async () => {
                try {
                    await window.authManager.signInWithGoogle();
                    modal.remove();
                } catch (error) {
                    alert('Sign in failed: ' + error.message);
                }
            });

            document.getElementById('anonymous-sign-in').addEventListener('click', async () => {
                try {
                    await window.authManager.signInAnonymously();
                    modal.remove();
                } catch (error) {
                    alert('Sign in failed: ' + error.message);
                }
            });

            document.getElementById('email-sign-in').addEventListener('click', async () => {
                const email = document.getElementById('email-input').value;
                const password = document.getElementById('password-input').value;
                try {
                    await window.authManager.signInWithEmail(email, password);
                    modal.remove();
                } catch (error) {
                    alert('Sign in failed: ' + error.message);
                }
            });

            document.getElementById('create-account').addEventListener('click', async () => {
                const email = document.getElementById('email-input').value;
                const password = document.getElementById('password-input').value;
                
                if (!email || !password) {
                    alert('Please enter both email and password');
                    return;
                }
                
                const displayName = prompt('Enter your display name (username):');
                if (!displayName || displayName.trim().length < 3) {
                    alert('Display name must be at least 3 characters long');
                    return;
                }
                
                try {
                    await window.authManager.createAccount(email, password, displayName.trim());
                    modal.remove();
                    showNotification('Account created successfully!', 3000);
                } catch (error) {
                    alert('Account creation failed: ' + error.message);
                }
            });
        }

        /**
         * Add online save button to the controls
         */
        function addOnlineSaveButton() {
            const controlsContainer = document.querySelector('.controls div:first-child');
            if (!controlsContainer) return;

            // Check if we're editing an existing level
            const urlParams = new URLSearchParams(window.location.search);
            const editLevelId = urlParams.get('edit');
            
            // Create online save button
            const onlineSaveBtn = document.createElement('button');
            onlineSaveBtn.id = 'online-save-btn';
            onlineSaveBtn.textContent = editLevelId ? 'Update Level' : 'Post Online';
            onlineSaveBtn.style.backgroundColor = editLevelId ? '#4c6baf' : '#41a547';
            onlineSaveBtn.title = editLevelId ? 'Update this level' : 'Post this level online for everyone to play';

            // Remove any existing save button to avoid duplicates
            const existingSaveBtn = document.getElementById('save-btn');
            if (existingSaveBtn) {
                existingSaveBtn.style.display = 'none';
            }

            // Insert the online save button
            const clearBtn = document.getElementById('clear-btn');
            if (clearBtn) {
                controlsContainer.insertBefore(onlineSaveBtn, clearBtn);
            } else {
                controlsContainer.appendChild(onlineSaveBtn);
            }

            // Add click handler
            onlineSaveBtn.addEventListener('click', saveLevelOnline);
        }

        /**
         * Add publish toggle to controls
         */
        function addPublishToggle() {
            const controlsContainer = document.querySelector('.controls div:last-child');
            if (!controlsContainer) return;

            const publishContainer = document.createElement('div');
            publishContainer.style.display = 'inline-block';
            publishContainer.style.marginLeft = '10px';
            publishContainer.innerHTML = `
                <input type="checkbox" id="publish-level" checked>
                <label for="publish-level" style="color: white; margin-left: 5px;">Public</label>
            `;

            controlsContainer.appendChild(publishContainer);
        }

        /**
         * Add difficulty selector
         */
        function addDifficultySelector() {
            const levelNameInput = document.getElementById('level-name');
            if (!levelNameInput || !levelNameInput.parentElement) return;

            const difficultyContainer = document.createElement('div');
            difficultyContainer.style.display = 'inline-block';
            difficultyContainer.style.marginLeft = '10px';
            difficultyContainer.innerHTML = `
                <label for="level-difficulty" style="color: white; margin-right: 5px;">Difficulty:</label>
                <select id="level-difficulty" style="background-color: #333; color: white; border: 1px solid #555; padding: 5px;">
                    <option value="easy">Easy</option>
                    <option value="medium" selected>Medium</option>
                    <option value="hard">Hard</option>
                    <option value="extreme">Extreme</option>
                </select>
            `;

            levelNameInput.parentElement.appendChild(difficultyContainer);
        }

        /**
         * Add tags input
         */
        function addTagsInput() {
            const levelNameInput = document.getElementById('level-name');
            if (!levelNameInput || !levelNameInput.parentElement) return;

            const tagsContainer = document.createElement('div');
            tagsContainer.style.marginTop = '10px';
            tagsContainer.innerHTML = `
                <input type="text" id="level-tags" placeholder="Tags (comma separated)" 
                       style="background-color: #333; color: white; border: 1px solid #555; 
                              padding: 5px; width: 300px; margin-left: 5px;">
            `;

            levelNameInput.parentElement.appendChild(tagsContainer);
        }

        /**
         * Save level online
         */
        async function saveLevelOnline() {
            // Check if user is signed in
            if (!window.authManager || !window.authManager.isSignedIn()) {
                showSignInDialog();
                return;
            }
            // First save locally if the function exists
            if (typeof window.saveLevels === 'function') {
                window.saveLevels(false);
            } else {
                // Manual save if saveLevels is not available
                if (window.levels && window.levelNames) {
                    localStorage.setItem(STORAGE_KEYS.LEVELS, JSON.stringify(window.levels));
                    localStorage.setItem(STORAGE_KEYS.LEVEL_NAMES, JSON.stringify(window.levelNames));

                    // Save spike rotations if they exist
                    if (window.rotationData) {
                        localStorage.setItem('platformerSpikeRotations', JSON.stringify(window.rotationData));
                    }
                }
            }

            // Get level data - using window references
            const currentUser = window.authManager.getCurrentUser();
            
            // Get player start position for current level
            let playerStart = null;
            if (window.playerStartPositions && window.playerStartPositions[window.currentLevel]) {
                playerStart = window.playerStartPositions[window.currentLevel];
            } else if (window.playerStartX !== null && window.playerStartY !== null) {
                playerStart = { x: window.playerStartX, y: window.playerStartY };
            }
            
            // Check for existing level ID from multiple sources
            let existingLevelId = null;
            if (window.onlineLevelIds && window.onlineLevelIds[window.currentLevel || 0]) {
                existingLevelId = window.onlineLevelIds[window.currentLevel || 0];
            } else if (window.currentOnlineLevelId) {
                existingLevelId = window.currentOnlineLevelId;
            }
            
            const levelData = {
                name: window.levelNames?.[window.currentLevel] || `Level ${(window.currentLevel || 0) + 1}`,
                author: window.authManager.getUserDisplayName(),
                authorId: window.authManager.getUserId(),
                grid: window.levels?.[window.currentLevel || 0],
                playerStart: playerStart,
                spikeRotations: window.rotationData?.[window.currentLevel || 0] || null,
                difficulty: document.getElementById('level-difficulty')?.value || 'medium',
                tags: getTagsArray(),
                isPublic: document.getElementById('publish-level')?.checked !== false,
                // Check if we're updating an existing level
                id: existingLevelId
            };

            // Show loading state
            const onlineSaveBtn = document.getElementById('online-save-btn');
            const originalText = onlineSaveBtn.textContent;
            onlineSaveBtn.textContent = 'Saving...';
            onlineSaveBtn.disabled = true;

            try {
                // Check if level API is available
                if (!window.levelAPI) {
                    throw new Error('Online features not available. Please check your connection.');
                }

                // Save or update the level
                let savedLevel;
                if (levelData.id) {
                    // Update existing level
                    try {
                        console.log('Attempting to update level:', levelData.id);
                        savedLevel = await window.levelAPI.updateLevel(levelData.id, levelData);
                    } catch (updateError) {
                        console.error('Update failed, trying to create new level instead:', updateError);
                        // If update fails, try creating a new level
                        delete levelData.id;
                        savedLevel = await window.levelAPI.saveLevel(levelData);
                    }
                } else {
                    // Create new level
                    console.log('Creating new level');
                    savedLevel = await window.levelAPI.saveLevel(levelData);
                    
                    // Store the online ID for future updates in both systems
                    if (!window.onlineLevelIds) {
                        window.onlineLevelIds = {};
                    }
                    window.onlineLevelIds[window.currentLevel || 0] = savedLevel.id;
                    window.currentOnlineLevelId = savedLevel.id;
                    localStorage.setItem('platformerOnlineLevelIds', JSON.stringify(window.onlineLevelIds));
                }

                // Show success notification
                const isNewLevel = !levelData.id;
                if (typeof window.showNotification === 'function') {
                    window.showNotification(isNewLevel ? `Level posted online! ID: ${savedLevel.id}` : 'Level updated successfully!', 5000);
                } else {
                    alert(isNewLevel ? `Level posted online! ID: ${savedLevel.id}` : 'Level updated successfully!');
                }

                // Update button to show update instead of save
                onlineSaveBtn.textContent = 'Update Level';
                onlineSaveBtn.style.backgroundColor = '#4c6baf';

            } catch (error) {
                console.error('Error saving level online:', error);
                const message = 'Failed to save level online: ' + error.message;

                if (typeof window.showNotification === 'function') {
                    window.showNotification(message, 5000);
                } else {
                    alert(message);
                }
                onlineSaveBtn.textContent = originalText;
            } finally {
                onlineSaveBtn.disabled = false;
            }
        }
        /**
         * Get author name (implement your own authentication)
         */
        function getAuthorName() {
            // Simple implementation - in production, use proper authentication
            let authorName = localStorage.getItem('platformerAuthorName');

            if (!authorName) {
                authorName = prompt('Enter your name (this will be shown as the level author):');
                if (authorName) {
                    localStorage.setItem('platformerAuthorName', authorName);
                } else {
                    authorName = 'Anonymous';
                }
            }

            return authorName;
        }

        /**
         * Get tags as array
         */
        function getTagsArray() {
            const tagsInput = document.getElementById('level-tags');
            if (!tagsInput || !tagsInput.value) return [];

            return tagsInput.value
                .split(',')
                .map(tag => tag.trim())
                .filter(tag => tag.length > 0);
        }

        /**
         * Load Firebase script dynamically
         */
        function loadFirebaseScript() {
            const scripts = [
                'https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js',
                'https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore-compat.js'
            ];

            scripts.forEach(src => {
                const script = document.createElement('script');
                script.src = src;
                document.head.appendChild(script);
            });

            // Load configuration after scripts are loaded
            setTimeout(() => {
                const configScript = document.createElement('script');
                configScript.src = 'js/firebase-config.js';
                document.head.appendChild(configScript);

                // Load level API
                setTimeout(() => {
                    const apiScript = document.createElement('script');
                    apiScript.src = 'js/level-api.js';
                    document.head.appendChild(apiScript);
                }, 500);
            }, 1000);
        }

        /**
         * Load online level IDs from storage
         */
        function loadOnlineLevelIds() {
            const savedIds = localStorage.getItem('platformerOnlineLevelIds');
            if (savedIds) {
                window.onlineLevelIds = JSON.parse(savedIds);
            } else {
                window.onlineLevelIds = {};
            }
        }

        /**
         * Load level for editing
         */
        async function loadLevelForEditing() {
            const urlParams = new URLSearchParams(window.location.search);
            const editLevelId = urlParams.get('edit');
            
            if (!editLevelId) return;
            
            try {
                // Load the level from Firebase
                const level = await window.levelAPI.getLevel(editLevelId);
                
                // Check if user owns this level
                if (level.authorId !== window.authManager.getUserId()) {
                    alert('You can only edit your own levels!');
                    window.location.href = 'my-levels.html';
                    return;
                }
                
                // Set up the level data
                window.levels = [level.grid];
                window.levelNames = [level.name];
                window.currentLevel = 0;
                
                // Set player start position
                if (level.playerStart) {
                    window.playerStartX = level.playerStart.x;
                    window.playerStartY = level.playerStart.y;
                    window.playerStartPositions = [level.playerStart];
                }
                
                // Set rotation data
                if (level.spikeRotations) {
                    window.rotationData = [level.spikeRotations];
                }
                
                // Store the level ID for saving
                window.onlineLevelIds = { 0: editLevelId };
                
                // Update UI
                if (window.displayLevel) {
                    window.displayLevel(0);
                }
                if (window.updateLevelSelector) {
                    window.updateLevelSelector();
                }
                
                // Update save button text
                const onlineSaveBtn = document.getElementById('online-save-btn');
                if (onlineSaveBtn) {
                    onlineSaveBtn.textContent = 'Update Level';
                    onlineSaveBtn.style.backgroundColor = '#4c6baf';
                }
                
                // Set level name
                const levelNameInput = document.getElementById('level-name');
                if (levelNameInput) {
                    levelNameInput.value = level.name;
                }
                
                // Set difficulty
                const difficultySelect = document.getElementById('level-difficulty');
                if (difficultySelect && level.difficulty) {
                    difficultySelect.value = level.difficulty;
                }
                
                // Set tags
                const tagsInput = document.getElementById('level-tags');
                if (tagsInput && level.tags) {
                    tagsInput.value = level.tags.join(', ');
                }
                
                // Set public/private
                const publishCheckbox = document.getElementById('publish-level');
                if (publishCheckbox) {
                    publishCheckbox.checked = level.isPublic !== false;
                }
                
            } catch (error) {
                console.error('Error loading level for editing:', error);
                alert('Failed to load level for editing. ' + error.message);
                window.location.href = 'my-levels.html';
            }
        }

        // Initialize online features when the editor loads
        document.addEventListener('DOMContentLoaded', function() {
            // Wait for the basic editor to initialize
            setTimeout(async () => {
                initializeOnlineFeatures();
                loadOnlineLevelIds();
                await loadLevelForEditing();
            }, 1000);
        });