s# Voice to Text - Deployment Guide

## 🚨 Critical Requirements

### 1. **HTTPS is MANDATORY**
The Web Speech API **requires HTTPS** to function. Your application will NOT work over HTTP (except on localhost).

## 🚀 Quick Deployment Options

### Option 1: GitHub Pages (Recommended for Quick Testing)
1. Push your code to a GitHub repository
2. Go to Settings → Pages
3. Select source branch and folder
4. GitHub Pages provides HTTPS automatically
5. Access at: `https://[username].github.io/[repository]/`

### Option 2: Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow prompts - Vercel provides HTTPS automatically
```

### Option 3: Netlify
1. Drag and drop your project folder to [netlify.com](https://netlify.com)
2. Netlify provides HTTPS automatically
3. Get instant live URL

### Option 4: Traditional Web Hosting
If using traditional hosting (Apache/Nginx), you MUST:
1. Obtain an SSL certificate (Let's Encrypt is free)
2. Configure HTTPS on your server
3. Redirect all HTTP traffic to HTTPS

## 📁 Required Files

Ensure these files are in your deployment:
```
/
├── index.html
├── script.js        (or use script-enhanced.js for debugging)
├── styles.css
└── (optional) favicon.ico
```

## 🔧 Pre-Deployment Checklist

1. **Test Locally First**
   ```bash
   # In your project directory
   python3 server.py
   # Visit http://localhost:8000
   ```

2. **Enable Debug Mode** (for troubleshooting)
   - Replace `script.js` with `script-enhanced.js` in index.html:
   ```html
   <script src="script-enhanced.js"></script>
   ```

3. **Check Browser Console**
   - Open Developer Tools (F12)
   - Look for any errors in Console tab
   - Check Network tab for failed requests

## 🐛 Common Issues & Solutions

### Issue 1: "Speech recognition not working online"
**Cause**: Not using HTTPS
**Solution**: Deploy to a service that provides HTTPS (see options above)

### Issue 2: "Microphone permission denied"
**Solution**: 
- Clear site permissions in browser settings
- Ensure site has microphone access permission
- Try in incognito/private mode

### Issue 3: "No transcription appears"
**Debug Steps**:
1. Open browser console (F12)
2. Look for error messages
3. Check debug panel (if using enhanced script)
4. Verify HTTPS in address bar

### Issue 4: "Works in Chrome but not other browsers"
**Note**: Full Web Speech API support varies:
- ✅ Chrome/Edge: Full support
- ✅ Safari: Partial support
- ❌ Firefox: Limited/No support
- ❌ Mobile browsers: Varies

## 🔍 Debugging Tips

1. **Use Enhanced Script** for detailed logging:
   ```javascript
   // In script-enhanced.js, ensure debug mode is on:
   this.debugMode = true;
   ```

2. **Check Console Output**:
   - Look for "🚀 Voice to Text Application Starting..."
   - Check protocol warnings
   - Monitor transcription events

3. **Test Step by Step**:
   - First test if microphone access works
   - Then test if recording indicator shows
   - Finally check if transcription appears

## 📱 Mobile Deployment Notes

- iOS Safari requires user interaction to start recording
- Android Chrome works best with Web Speech API
- Some mobile browsers may have limited support

## 🔐 Security Considerations

1. **Always use HTTPS** in production
2. **Handle permissions gracefully** - provide clear instructions
3. **Respect user privacy** - don't store recordings without consent

## 💡 Quick Test URLs

After deployment, test these scenarios:
1. Visit site and check for HTTPS padlock
2. Click record button - should prompt for mic permission
3. Speak clearly - text should appear in real-time
4. Check browser console for any errors

## 📞 Need Help?

If transcription still doesn't work after following this guide:
1. Check browser console for specific error messages
2. Ensure you're using a supported browser
3. Verify HTTPS is active (look for padlock icon)
4. Try the debug version (script-enhanced.js) for more details