# Google Authentication Troubleshooting Guide

## Overview
This guide helps resolve common issues with Google sign-in functionality in the Platformer Game.

## Common Issues and Solutions

### 1. Popup Blocked Error
**Symptom**: Browser blocks the Google sign-in popup
**Solution**: 
- Allow popups for your domain in browser settings
- The code now automatically falls back to redirect method if popup is blocked

### 2. Unauthorized Domain Error
**Symptom**: Error message "This domain is not authorized for Google sign-in"
**Solution**:
1. Go to Firebase Console → Authentication → Settings → Authorized domains
2. Add your domain (e.g., gervilausnir.com, localhost)
3. Save changes

### 3. Google Sign-in Not Enabled
**Symptom**: Error message "Google sign-in is not enabled"
**Solution**:
1. Go to Firebase Console → Authentication → Sign-in method
2. Enable Google provider
3. Configure OAuth consent screen if prompted
4. Save changes

### 4. Network Request Failed
**Symptom**: Network error during sign-in
**Solution**:
- Check internet connection
- Verify Firebase configuration is correct
- Check browser console for CORS errors

## Firebase Console Setup

### Step 1: Enable Google Authentication
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project (platformer1-71780)
3. Navigate to Authentication → Sign-in method
4. Click on Google provider
5. Toggle "Enable" switch
6. Add your project support email
7. Click "Save"

### Step 2: Configure Authorized Domains
1. In Authentication → Settings → Authorized domains
2. Add these domains:
   - localhost
   - 127.0.0.1
   - gervilausnir.com
   - Your deployment domain

### Step 3: Configure OAuth Consent Screen
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project
3. Navigate to APIs & Services → OAuth consent screen
4. Configure:
   - App name: Pixel Platformer
   - User support email: Your email
   - Authorized domains: Same as Firebase
5. Save changes

## Testing Google Sign-in

### Local Testing
```bash
# Start local server
python3 server.py
# Visit http://localhost:8000/accounts.html
```

### Production Testing
1. Deploy to your domain
2. Clear browser cache
3. Try signing in from accounts.html

## Implementation Details

The Google sign-in implementation includes:
1. **Popup Method**: Primary sign-in method
2. **Redirect Fallback**: Automatic fallback if popup blocked
3. **Error Handling**: User-friendly error messages
4. **Loading States**: Disabled buttons during sign-in
5. **Unique Username**: Automatic handling of duplicate usernames

## Error Codes Reference

- `auth/popup-blocked`: Popup was blocked by browser
- `auth/unauthorized-domain`: Domain not in authorized list
- `auth/operation-not-allowed`: Provider not enabled
- `auth/network-request-failed`: Network connectivity issue
- `auth/user-cancelled`: User cancelled the sign-in flow

## Additional Notes

- API key in firebase-config.js is safe to expose (it's restricted by domain)
- Always test in incognito/private mode to avoid cache issues
- Check browser console for detailed error messages
- Ensure HTTPS is used in production (required for Google OAuth)