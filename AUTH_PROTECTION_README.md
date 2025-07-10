# Iris Whiteboard Authentication Protection

## 🔐 How It Works

The authentication system automatically protects **ALL** pages of your website. Users can only access any page if they are signed in.

## 📁 Files Involved

1. **`auth-protection.js`** - The main protection script
2. **`auth.html`** - Login/signup page (not protected)
3. **`auth.js`** - Handles login/signup logic
4. **`index.html`** - Main app (protected)
5. **`dashboard.html`** - Example protected page

## 🚀 Quick Start

### To Protect Any Page:
1. Add Supabase script to `<head>`:
   ```html
   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
   ```

2. Add the protection script:
   ```html
   <script src="./auth-protection.js"></script>
   ```

That's it! The page is now protected.

## 🎯 What Happens

1. **User visits any protected page** → Authentication check runs immediately
2. **If not logged in** → Automatically redirected to `auth.html` (login page)
3. **If logged in** → Page loads normally
4. **After successful login** → Redirected back to the original page they wanted to visit
5. **If user signs out** → Automatically redirected to login page

## ✅ Testing the Protection

### Method 1: Incognito Window
1. Open any protected page in an incognito/private window
2. You should be immediately redirected to the login page
3. After logging in, you'll be redirected back to the original page

### Method 2: Sign Out Test
1. Visit `dashboard.html` while logged in
2. Click the "Sign Out" button
3. You'll be redirected to the login page
4. The protection is working!

### Method 3: Direct URL Test
1. While logged out, try to visit `index.html` directly
2. You should be redirected to `auth.html`
3. After logging in, you'll be taken to `index.html`

## 🔧 Customization

### Change Login Page
Edit `auth-protection.js` and change this line:
```javascript
window.location.href = './auth.html';
```

### Add More Protected Pages
Just include the protection script in any HTML page:
```html
<script src="./auth-protection.js"></script>
```

### Exclude Pages from Protection
The auth page (`auth.html`) is automatically excluded. To exclude other pages, edit `auth-protection.js`:
```javascript
if (window.location.pathname.includes('auth.html') || 
    window.location.pathname.includes('public-page.html')) {
  return;
}
```

## 🎨 Features

- ✅ **Automatic Protection** - Just include one script
- ✅ **Smart Redirects** - Takes users back to where they wanted to go
- ✅ **Session Management** - Handles login/logout automatically
- ✅ **Loading States** - Shows authentication status to users
- ✅ **Error Handling** - Gracefully handles authentication errors
- ✅ **No Configuration** - Works out of the box with your Supabase setup

## 🔒 Security Features

1. **Client-side Protection** - Immediate redirect before page content loads
2. **Session Monitoring** - Automatically signs out when session expires
3. **Secure Tokens** - Uses Supabase's secure JWT tokens
4. **State Management** - Properly handles authentication state changes

## 📱 Browser Support

Works on all modern browsers that support:
- ES6+ JavaScript
- Local Storage / Session Storage
- Fetch API
- Promises/Async-Await

## 🚨 Important Notes

- The protection runs **immediately** when any page loads
- Users cannot access protected content without authentication
- The system automatically handles session expiration
- All authentication is managed through Supabase
- The login page (`auth.html`) is the only unprotected page

Your entire Iris Whiteboard application is now **fully secured**! 🎉
