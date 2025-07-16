// auth.js - Firebase Authentication Module

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.authStateListeners = [];
        this.initialized = false;
    }

    /**
     * Initialize authentication
     */
    async init() {
        if (this.initialized) return;
        this.initialized = true;

        // Wait for Firebase to be ready
        await this.waitForFirebase();

        // Check for redirect result (in case of redirect sign-in)
        try {
            const result = await firebase.auth().getRedirectResult();
            if (result.user) {
                console.log('Redirect sign-in completed for user:', result.user.email);
                // Handle new user setup if needed
                const userDoc = await db.collection('users').doc(result.user.uid).get();
                if (!userDoc.exists) {
                    await this.createUserProfile(result.user);
                }
            }
        } catch (error) {
            console.error('Error getting redirect result:', error);
        }

        // Set up auth state listener
        firebase.auth().onAuthStateChanged((user) => {
            this.currentUser = user;
            this.notifyAuthStateChanged(user);
        });
    }

    /**
     * Wait for Firebase to be initialized
     */
    async waitForFirebase() {
        return new Promise((resolve) => {
            // Check if already initialized
            if (window.firebase && window.firebase.auth && window.db) {
                resolve();
                return;
            }

            let attempts = 0;
            const maxAttempts = 100; // 5 seconds total
            
            const checkInterval = setInterval(() => {
                attempts++;
                
                if (window.firebase && window.firebase.auth && window.db) {
                    clearInterval(checkInterval);
                    console.log('Firebase initialized successfully');
                    resolve();
                } else if (attempts >= maxAttempts) {
                    clearInterval(checkInterval);
                    console.error('Firebase auth initialization timeout. Firebase:', !!window.firebase, 'Auth:', !!(window.firebase && window.firebase.auth), 'DB:', !!window.db);
                    resolve(); // Still resolve to prevent hanging
                }
            }, 50);
        });
    }

    /**
     * Sign in with Google
     */
    async signInWithGoogle() {
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            
            // Force account selection
            provider.setCustomParameters({
                prompt: 'select_account'
            });
            
            let result;
            
            try {
                // Try popup first
                result = await firebase.auth().signInWithPopup(provider);
            } catch (popupError) {
                console.warn('Popup blocked or failed, trying redirect method:', popupError);
                
                // Check for specific popup blocked error
                if (popupError.code === 'auth/popup-blocked' || 
                    popupError.code === 'auth/popup-closed-by-user' ||
                    popupError.code === 'auth/cancelled-popup-request') {
                    
                    // Use redirect as fallback
                    await firebase.auth().signInWithRedirect(provider);
                    // Throw a specific error that can be caught and handled differently
                    throw new Error('Redirecting to Google sign-in page. The page will redirect.');
                } else if (popupError.code === 'auth/unauthorized-domain') {
                    throw new Error('This domain is not authorized for Google sign-in. Please contact the administrator.');
                } else if (popupError.code === 'auth/operation-not-allowed') {
                    throw new Error('Google sign-in is not enabled. Please contact the administrator.');
                } else {
                    throw popupError;
                }
            }
            
            // Check if this is a new user
            const userDoc = await db.collection('users').doc(result.user.uid).get();
            
            if (!userDoc.exists) {
                // New user - need to set up profile with unique display name
                let displayName = result.user.displayName;
                let isUnique = false;
                let attempts = 0;
                
                // Try to find a unique display name
                while (!isUnique && attempts < 10) {
                    const nameToCheck = attempts === 0 ? displayName : `${displayName}${attempts}`;
                    const isTaken = await this.checkDisplayNameExists(nameToCheck);
                    
                    if (!isTaken) {
                        displayName = nameToCheck;
                        isUnique = true;
                    } else {
                        attempts++;
                    }
                }
                
                // If still not unique after attempts, add timestamp
                if (!isUnique) {
                    displayName = `${displayName}${Date.now()}`;
                }
                
                // Update the user's display name
                await result.user.updateProfile({ displayName });
                
                // Create user profile
                await this.createUserProfile(result.user);
            }
            
            return result.user;
        } catch (error) {
            console.error('Google sign-in error:', error);
            
            // Provide user-friendly error messages
            if (error.code === 'auth/network-request-failed') {
                throw new Error('Network error. Please check your internet connection and try again.');
            } else if (error.code === 'auth/user-cancelled') {
                throw new Error('Sign-in cancelled.');
            } else if (error.message) {
                throw error;
            } else {
                throw new Error('Failed to sign in with Google. Please try again.');
            }
        }
    }

    /**
     * Sign in anonymously
     */
    async signInAnonymously() {
        try {
            const result = await firebase.auth().signInAnonymously();
            return result.user;
        } catch (error) {
            console.error('Anonymous sign-in error:', error);
            throw error;
        }
    }

    /**
     * Sign in with email and password
     */
    async signInWithEmail(email, password) {
        try {
            const result = await firebase.auth().signInWithEmailAndPassword(email, password);
            return result.user;
        } catch (error) {
            console.error('Email sign-in error:', error);
            throw error;
        }
    }

    /**
     * Create account with email and password
     */
    async createAccount(email, password, displayName) {
        try {
            // First check if display name is already taken
            if (displayName) {
                const isNameTaken = await this.checkDisplayNameExists(displayName);
                if (isNameTaken) {
                    throw new Error('This username is already taken. Please choose another one.');
                }
            }
            
            const result = await firebase.auth().createUserWithEmailAndPassword(email, password);
            
            // Update display name
            if (displayName) {
                await result.user.updateProfile({
                    displayName: displayName
                });
            }

            // Create user profile in Firestore
            await this.createUserProfile(result.user);

            return result.user;
        } catch (error) {
            // Handle specific Firebase auth errors
            if (error.code === 'auth/email-already-in-use') {
                throw new Error('This email is already registered. Please sign in or use a different email.');
            } else if (error.code === 'auth/weak-password') {
                throw new Error('Password should be at least 6 characters.');
            } else if (error.code === 'auth/invalid-email') {
                throw new Error('Please enter a valid email address.');
            }
            
            console.error('Account creation error:', error);
            throw error;
        }
    }

    /**
     * Check if display name already exists
     */
    async checkDisplayNameExists(displayName) {
        try {
            // Normalize the display name for case-insensitive comparison
            const normalizedName = displayName.toLowerCase().trim();
            
            const snapshot = await db.collection('users')
                .where('displayNameLower', '==', normalizedName)
                .limit(1)
                .get();
                
            return !snapshot.empty;
        } catch (error) {
            console.error('Error checking display name:', error);
            return false;
        }
    }

    /**
     * Create user profile in Firestore
     */
    async createUserProfile(user) {
        try {
            const userProfile = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || 'Anonymous',
                displayNameLower: (user.displayName || 'anonymous').toLowerCase().trim(),
                photoURL: user.photoURL || null,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLoginAt: firebase.firestore.FieldValue.serverTimestamp(),
                levelCount: 0,
                totalPlays: 0,
                totalRatings: 0,
                levelsCreatedToday: 0,
                lastLevelDate: null,
                isAdmin: false
            };

            await db.collection('users').doc(user.uid).set(userProfile, { merge: true });
        } catch (error) {
            console.error('Error creating user profile:', error);
        }
    }

    /**
     * Update last login time
     */
    async updateLastLogin() {
        if (this.currentUser) {
            try {
                await db.collection('users').doc(this.currentUser.uid).update({
                    lastLoginAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            } catch (error) {
                console.error('Error updating last login:', error);
            }
        }
    }

    /**
     * Sign out with cleanup and optional redirect
     */
    async signOut(options = {}) {
        const {
            showConfirmation = true,
            redirectTo = null,
            clearLocalStorage = true,
            message = 'Are you sure you want to sign out?'
        } = options;

        try {
            // Show confirmation if requested
            if (showConfirmation && !confirm(message)) {
                return false;
            }

            // Notify listeners that sign-out is starting
            this.notifyAuthStateChanged(null);

            // Clear local storage if requested
            if (clearLocalStorage) {
                // Preserve important non-auth data
                const settingsToKeep = localStorage.getItem(STORAGE_KEYS.SETTINGS);
                const levelEditorData = localStorage.getItem('currentLevel');
                
                // Clear auth-related data
                localStorage.removeItem('lastSignedInUser');
                localStorage.removeItem('authToken');
                
                // Restore preserved data
                if (settingsToKeep) localStorage.setItem(STORAGE_KEYS.SETTINGS, settingsToKeep);
                if (levelEditorData) localStorage.setItem('currentLevel', levelEditorData);
            }

            // Sign out from Firebase
            await firebase.auth().signOut();

            // Handle redirect
            if (redirectTo) {
                window.location.href = redirectTo;
            } else if (window.location.pathname.includes('admin')) {
                // Redirect admin pages to login
                window.location.href = '/login.html';
            } else if (window.location.pathname !== '/index.html' && 
                       window.location.pathname !== '/' &&
                       !window.location.pathname.includes('level-editor')) {
                // Redirect other authenticated pages to home
                window.location.href = '/index.html';
            }

            return true;
        } catch (error) {
            console.error('Sign out error:', error);
            alert('Failed to sign out. Please try again.');
            throw error;
        }
    }

    /**
     * Get current user
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Check if user is signed in
     */
    isSignedIn() {
        return this.currentUser !== null;
    }

    /**
     * Get user display name
     */
    getUserDisplayName() {
        if (this.currentUser) {
            return this.currentUser.displayName || this.currentUser.email || 'Anonymous';
        }
        return 'Anonymous';
    }

    /**
     * Get user ID
     */
    getUserId() {
        return this.currentUser ? this.currentUser.uid : null;
    }

    /**
     * Add auth state listener
     */
    onAuthStateChanged(callback) {
        this.authStateListeners.push(callback);
        // Call immediately with current state
        if (this.initialized) {
            callback(this.currentUser);
        }
    }

    /**
     * Remove auth state listener
     */
    removeAuthStateListener(callback) {
        const index = this.authStateListeners.indexOf(callback);
        if (index > -1) {
            this.authStateListeners.splice(index, 1);
        }
    }

    /**
     * Notify all auth state listeners
     */
    notifyAuthStateChanged(user) {
        this.authStateListeners.forEach(callback => {
            try {
                callback(user);
            } catch (error) {
                console.error('Auth state listener error:', error);
            }
        });
    }

    /**
     * Link anonymous account to permanent account
     */
    async linkAnonymousAccount(email, password) {
        if (!this.currentUser || !this.currentUser.isAnonymous) {
            throw new Error('No anonymous account to link');
        }

        try {
            const credential = firebase.auth.EmailAuthProvider.credential(email, password);
            const result = await this.currentUser.linkWithCredential(credential);
            
            // Update user profile
            await this.createUserProfile(result.user);
            
            return result.user;
        } catch (error) {
            console.error('Account linking error:', error);
            throw error;
        }
    }

    /**
     * Update user profile
     */
    async updateProfile(updates) {
        if (!this.currentUser) {
            throw new Error('No user signed in');
        }

        try {
            // Check if trying to update display name
            if (updates.displayName !== undefined && updates.displayName !== this.currentUser.displayName) {
                // Check if new display name is already taken
                const isNameTaken = await this.checkDisplayNameExists(updates.displayName);
                if (isNameTaken) {
                    throw new Error('This username is already taken. Please choose another one.');
                }
            }

            // Update Firebase Auth profile
            const authUpdates = {};
            if (updates.displayName !== undefined) {
                authUpdates.displayName = updates.displayName;
            }
            if (updates.photoURL !== undefined) {
                authUpdates.photoURL = updates.photoURL;
            }

            if (Object.keys(authUpdates).length > 0) {
                await this.currentUser.updateProfile(authUpdates);
            }

            // Update Firestore profile
            const firestoreUpdates = { ...updates };
            delete firestoreUpdates.email; // Email can't be updated this way
            
            // Add normalized display name for uniqueness checking
            if (updates.displayName !== undefined) {
                firestoreUpdates.displayNameLower = updates.displayName.toLowerCase().trim();
            }
            
            if (Object.keys(firestoreUpdates).length > 0) {
                await db.collection('users').doc(this.currentUser.uid).update(firestoreUpdates);
            }

            return true;
        } catch (error) {
            console.error('Profile update error:', error);
            throw error;
        }
    }

    /**
     * Get user levels
     */
    async getUserLevels() {
        if (!this.currentUser) {
            return [];
        }

        try {
            const snapshot = await db.collection('levels')
                .where('authorId', '==', this.currentUser.uid)
                .orderBy('updatedAt', 'desc')
                .get();

            const levels = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                levels.push({
                    id: doc.id,
                    ...data,
                    grid: typeof data.grid === 'string' ? JSON.parse(data.grid) : data.grid
                });
            });

            return levels;
        } catch (error) {
            console.error('Error fetching user levels:', error);
            return [];
        }
    }

    /**
     * Check if current user is an admin
     */
    async isAdmin() {
        if (!this.currentUser) {
            return false;
        }

        try {
            const userDoc = await db.collection('users').doc(this.currentUser.uid).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                return userData.isAdmin === true;
            }
            return false;
        } catch (error) {
            console.error('Error checking admin status:', error);
            return false;
        }
    }
}

// Create singleton instance
const authManager = new AuthManager();

// Export for use
window.authManager = authManager;