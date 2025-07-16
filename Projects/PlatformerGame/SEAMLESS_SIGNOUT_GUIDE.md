# Seamless Sign-Out System Documentation

## Overview
A centralized, consistent sign-out system has been implemented across all pages of the Platformer Game. The system provides a unified experience with proper cleanup, confirmation dialogs, and intelligent redirects.

## Key Features

### 1. Enhanced `signOut()` Method
The auth.js now includes an enhanced sign-out method with options:

```javascript
authManager.signOut({
    showConfirmation: true,      // Show confirmation dialog (default: true)
    redirectTo: '/index.html',   // Custom redirect URL (optional)
    clearLocalStorage: true,     // Clear auth data while preserving settings
    message: 'Custom message'    // Custom confirmation message
});
```

### 2. Intelligent Redirect Logic
- **Admin pages** → Redirect to `/login.html`
- **Authenticated pages** → Redirect to `/index.html`
- **Level Editor** → Stay on the same page (preserves work)
- **Custom redirect** → Use the `redirectTo` option

### 3. Data Preservation
During sign-out, the system:
- Clears authentication tokens
- Preserves game settings
- Preserves unsaved level editor data
- Removes sensitive user data

### 4. AuthUI Component
A new reusable authentication UI component provides:
- Consistent sign-in/sign-out buttons
- User profile display with avatar
- Dropdown menu with navigation options
- Auto-initialization on pages with `auth-container` element

## Implementation Details

### Pages Updated
1. **index.html** - Added auth container with AuthUI
2. **accounts.html** - Updated sign-out with confirmation
3. **my-levels.html** - Enhanced sign-out with redirect
4. **login.html** - Unified sign-out behavior
5. **level-editor.html** - Custom message for unsaved changes
6. **online-level-editor.js** - Warning about losing unsaved work

### Usage Examples

#### Basic Sign-Out
```javascript
// Simple sign-out with confirmation
authManager.signOut();
```

#### Custom Redirect
```javascript
// Sign out and redirect to specific page
authManager.signOut({
    redirectTo: '/login.html'
});
```

#### No Confirmation
```javascript
// Sign out without confirmation dialog
authManager.signOut({
    showConfirmation: false
});
```

#### Custom Message
```javascript
// Sign out with custom warning
authManager.signOut({
    message: 'Are you sure? You have unsaved changes.'
});
```

### Adding Auth UI to New Pages

#### Method 1: Auto-Initialize
Add an element with ID `auth-container` to your page:
```html
<div id="auth-container"></div>
<script src="js/utils/auth-ui.js"></script>
```

#### Method 2: Floating Widget
```javascript
// Create floating auth widget
AuthUI.createFloatingWidget('top-right');
```

#### Method 3: Manual Initialize
```javascript
const authUI = new AuthUI();
authUI.init('custom-container-id');
```

## Sign-Out Flow

1. User clicks sign-out button
2. Confirmation dialog appears (if enabled)
3. On confirmation:
   - Auth state listeners notified
   - Local storage cleaned (preserving settings)
   - Firebase sign-out executed
   - Redirect to appropriate page
4. UI updates across all components

## Error Handling

- Network failures show user-friendly error messages
- Failed sign-outs don't redirect
- Original UI state restored if cancelled
- All errors logged to console

## Security Considerations

- Authentication tokens cleared immediately
- Sensitive data removed from local storage
- Session invalidated on Firebase servers
- No auth data persists after sign-out

## Testing

To test the sign-out system:
1. Sign in on any page
2. Navigate between pages (state persists)
3. Click sign-out from any location
4. Verify proper redirect behavior
5. Check that settings are preserved
6. Confirm no auth data remains

## Future Enhancements

- Session timeout warnings
- Remember me functionality
- Multi-device sign-out
- Sign-out analytics
- Offline sign-out queue