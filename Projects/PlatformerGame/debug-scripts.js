// Debug Scripts for Platformer Game Level Editor
// Copy and paste these into the browser console to diagnose issues

// ============================================
// 1. CHECK CURRENT STATE
// ============================================
console.log('=== CHECKING CURRENT STATE ===');

// Check authentication status
(async function checkAuth() {
    console.log('\n--- Authentication Status ---');
    const user = firebase.auth().currentUser;
    if (user) {
        console.log('Logged in as:', user.email);
        console.log('User ID:', user.uid);
        console.log('Display Name:', user.displayName);
        
        // Check if admin
        try {
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                console.log('Is Admin:', userData.isAdmin === true);
                console.log('Levels created today:', userData.levelsCreatedToday);
                console.log('Total levels:', userData.levelCount);
            } else {
                console.log('User profile not found in Firestore');
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    } else {
        console.log('Not logged in');
    }
})();

// Check level data
console.log('\n--- Level Data ---');
console.log('window.levels:', window.levels);
console.log('window.currentLevel:', window.currentLevel);
console.log('window.levelNames:', window.levelNames);
console.log('window.playerStartX:', window.playerStartX);
console.log('window.playerStartY:', window.playerStartY);
console.log('window.playerStartPositions:', window.playerStartPositions);
console.log('window.rotationData:', window.rotationData);

// Check online level IDs
console.log('\n--- Online Level IDs ---');
console.log('window.onlineLevelIds:', window.onlineLevelIds);
console.log('window.currentOnlineLevelId:', window.currentOnlineLevelId);
console.log('LocalStorage platformerOnlineLevelIds:', localStorage.getItem('platformerOnlineLevelIds'));

// Check current level grid
if (window.levels && window.levels[window.currentLevel || 0]) {
    const grid = window.levels[window.currentLevel || 0];
    console.log('\n--- Current Level Grid ---');
    console.log('Grid dimensions:', grid.length, 'x', (grid[0] ? grid[0].length : 0));
    console.log('Grid is valid array:', Array.isArray(grid));
    console.log('First row:', grid[0]);
} else {
    console.log('\n--- Current Level Grid ---');
    console.log('No level grid found!');
}

// ============================================
// 2. TEST LEVEL DATA EXTRACTION
// ============================================
console.log('\n=== TESTING LEVEL DATA EXTRACTION ===');

function testLevelDataExtraction() {
    // Simulate what saveSingleOnlineLevel does
    let gridData = null;
    
    // Try local levels array
    if (window.levels && window.levels[0]) {
        gridData = window.levels[0];
        console.log('Grid data from window.levels[0]:', gridData ? 'Found' : 'Not found');
    }
    
    // Try current level
    if (!gridData && window.levels && window.levels[window.currentLevel]) {
        gridData = window.levels[window.currentLevel];
        console.log('Grid data from window.levels[currentLevel]:', gridData ? 'Found' : 'Not found');
    }
    
    if (gridData) {
        console.log('Grid data found:', {
            isArray: Array.isArray(gridData),
            dimensions: gridData.length + 'x' + (gridData[0] ? gridData[0].length : 0),
            sample: gridData[0]
        });
    } else {
        console.log('NO GRID DATA FOUND!');
    }
    
    return gridData;
}

testLevelDataExtraction();

// ============================================
// 3. CHECK FIREBASE CONNECTION
// ============================================
console.log('\n=== CHECKING FIREBASE CONNECTION ===');

// Check if Firebase is initialized
console.log('Firebase app:', typeof firebase !== 'undefined' ? 'Loaded' : 'Not loaded');
console.log('Firestore db:', typeof db !== 'undefined' ? 'Loaded' : 'Not loaded');
console.log('Level API:', typeof window.levelAPI !== 'undefined' ? 'Loaded' : 'Not loaded');

// ============================================
// 4. TEST SAVING A LEVEL
// ============================================
console.log('\n=== TEST SAVE SIMULATION ===');

async function simulateSave() {
    if (!window.authManager || !window.authManager.isSignedIn()) {
        console.log('Cannot simulate save - not signed in');
        return;
    }
    
    const testLevelData = {
        name: 'Debug Test Level',
        author: window.authManager.getUserDisplayName(),
        authorId: window.authManager.getUserId(),
        grid: [[1,1,1], [0,0,0], [1,1,1]], // Simple 3x3 grid
        playerStart: { x: 1, y: 1 },
        spikeRotations: null,
        difficulty: 'medium',
        tags: ['debug', 'test'],
        isPublic: true
    };
    
    console.log('Test level data:', testLevelData);
    console.log('Would save with this data. Run simulateSave.actual() to actually save.');
    
    simulateSave.actual = async function() {
        try {
            console.log('Actually saving test level...');
            const result = await window.levelAPI.saveLevel(testLevelData);
            console.log('Save successful! Level ID:', result.id);
            return result;
        } catch (error) {
            console.error('Save failed:', error);
            return null;
        }
    };
}

simulateSave();

// ============================================
// 5. CHECK FOR DUPLICATE SAVE BUTTONS
// ============================================
console.log('\n=== CHECKING UI ELEMENTS ===');

const saveButtons = document.querySelectorAll('button[id*="save"], button:contains("Save"), button:contains("Post"), button:contains("Update")');
console.log('Found save-related buttons:', saveButtons.length);
saveButtons.forEach((btn, index) => {
    console.log(`Button ${index + 1}:`, {
        id: btn.id,
        text: btn.textContent,
        visible: btn.style.display !== 'none',
        onclick: btn.onclick ? 'Has onclick' : 'No onclick'
    });
});

// ============================================
// 6. MANUAL FIX FUNCTIONS
// ============================================
console.log('\n=== MANUAL FIX FUNCTIONS ===');

// Function to clear online level IDs
window.debugClearOnlineLevelIds = function() {
    window.onlineLevelIds = {};
    window.currentOnlineLevelId = null;
    localStorage.removeItem('platformerOnlineLevelIds');
    console.log('Cleared all online level IDs');
};

// Function to manually set admin status
window.debugSetAdmin = async function(isAdmin = true) {
    const user = firebase.auth().currentUser;
    if (!user) {
        console.log('Not logged in');
        return;
    }
    
    try {
        await db.collection('users').doc(user.uid).update({
            isAdmin: isAdmin
        });
        console.log('Admin status set to:', isAdmin);
    } catch (error) {
        console.error('Failed to set admin status:', error);
    }
};

// Function to check a specific level
window.debugCheckLevel = async function(levelId) {
    try {
        const doc = await db.collection('levels').doc(levelId).get();
        if (doc.exists) {
            const data = doc.data();
            console.log('Level found:', {
                id: doc.id,
                name: data.name,
                author: data.author,
                authorId: data.authorId,
                isPublic: data.isPublic,
                createdAt: data.createdAt?.toDate(),
                grid: data.grid ? 'Present' : 'Missing'
            });
        } else {
            console.log('Level not found');
        }
    } catch (error) {
        console.error('Error checking level:', error);
    }
};

// Function to list user's levels
window.debugListMyLevels = async function() {
    const user = firebase.auth().currentUser;
    if (!user) {
        console.log('Not logged in');
        return;
    }
    
    try {
        const snapshot = await db.collection('levels')
            .where('authorId', '==', user.uid)
            .orderBy('createdAt', 'desc')
            .limit(10)
            .get();
            
        console.log(`Found ${snapshot.size} levels by you:`);
        snapshot.forEach(doc => {
            const data = doc.data();
            console.log(`- ${doc.id}: "${data.name}" (${data.isPublic ? 'public' : 'private'})`);
        });
    } catch (error) {
        console.error('Error listing levels:', error);
    }
};

console.log('\n=== AVAILABLE DEBUG FUNCTIONS ===');
console.log('- debugClearOnlineLevelIds() - Clear all stored online level IDs');
console.log('- debugSetAdmin(true/false) - Set your admin status');
console.log('- debugCheckLevel("levelId") - Check if a level exists and who owns it');
console.log('- debugListMyLevels() - List your recent levels');
console.log('- simulateSave.actual() - Actually save a test level');

console.log('\n=== END OF DEBUG REPORT ===');