# API Key Security Setup

This project has been configured to keep API keys secure and prevent them from being accidentally committed to version control.

## Setup Instructions

1. **Copy the configuration template:**
   ```
   cp config.template.js config.js
   ```

2. **Add your actual API keys to config.js:**
   - Open `config.js`
   - Replace `'your-gemini-api-key-here'` with your actual Gemini API key

3. **The config.js file is automatically ignored by Git** (listed in `.gitignore`)

## Files Overview

- `config.template.js` - Template file with placeholder values (safe to commit)
- `config.js` - Your actual configuration with real API keys (DO NOT COMMIT)
- `.gitignore` - Contains `config.js` to prevent accidental commits

## Important Notes

- ⚠️ **Never commit config.js** - It contains your real API keys
- ✅ **Always commit config.template.js** - It helps other developers set up their environment
- 🔒 **Keep your API keys private** - Don't share them in chat, email, or public forums

## Verification

To verify the setup is working:
1. Check that `config.js` exists and contains your API key
2. Check that `config.js` is listed in `.gitignore`
3. Run `git status` - you should NOT see `config.js` in the list of files to be committed

## If You Accidentally Committed Your API Key

1. **Immediately revoke/regenerate** your API key in the service console
2. Update `config.js` with the new key
3. Remove the key from Git history (consider using tools like `git filter-branch` or BFG Repo-Cleaner)
