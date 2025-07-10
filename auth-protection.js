// Authentication protection utility
// Include this script on any page that needs authentication protection

(function() {
  'use strict';
  
  // Check if we're on the auth page - if so, don't run protection
  if (window.location.pathname.includes('auth.html')) {
    return;
  }
  
  // Show loading screen immediately
  function showAuthLoading() {
    // Create or show loading screen
    let loadingScreen = document.getElementById('loadingScreen');
    if (!loadingScreen) {
      // Create loading screen if it doesn't exist
      loadingScreen = document.createElement('div');
      loadingScreen.id = 'loadingScreen';
      loadingScreen.className = 'loading-screen';
      loadingScreen.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 25%, #16213e 50%, #0f3460 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        font-family: 'Inter', sans-serif;
      `;
      
      loadingScreen.innerHTML = `
        <div class="loading-content" style="text-align: center; color: white;">
          <div class="loading-spinner" style="
            width: 50px;
            height: 50px;
            border: 3px solid rgba(255,255,255,0.3);
            border-top: 3px solid #8B5CF6;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
          "></div>
          <h3 style="margin: 0 0 10px 0; color: #8B5CF6;">Verifying Authentication</h3>
          <p style="margin: 0; color: rgba(255,255,255,0.7);">Checking your access...</p>
        </div>
        <style>
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      `;
      
      document.body.appendChild(loadingScreen);
    } else {
      loadingScreen.style.display = 'flex';
    }
  }
  
  // Redirect to auth page
  function redirectToAuth() {
    // Store the current page to redirect back after login
    sessionStorage.setItem('authRedirectUrl', window.location.href);
    window.location.href = './auth.html';
  }
  
  // Initialize authentication check
  async function initAuthCheck() {
    // Show loading immediately
    showAuthLoading();
    
    try {
      // Wait for Supabase to be available
      let attempts = 0;
      while (!window.supabase && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
      
      if (!window.supabase) {
        console.error('Supabase not loaded');
        redirectToAuth();
        return;
      }
      
      // Initialize Supabase client
      const { createClient } = window.supabase;
      const supabaseClient = createClient(
        'https://qqmsfraosocolpslrfvq.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxbXNmcmFvc29jb2xwc2xyZnZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxNzcyOTEsImV4cCI6MjA2Nzc1MzI5MX0.ZGZIxxlCantVQ1WcA9j5VrYyk8PjgMjroX3h1-OQ8ko'
      );
      
      // Check authentication
      const { data: { user }, error } = await supabaseClient.auth.getUser();
      
      if (error || !user) {
        console.log('User not authenticated, redirecting to login...');
        redirectToAuth();
        return;
      }
      
      // User is authenticated, hide loading and allow page to show
      console.log('User authenticated:', user.email);
      
      // Update loading text
      const loadingScreen = document.getElementById('loadingScreen');
      if (loadingScreen) {
        const title = loadingScreen.querySelector('h3');
        const message = loadingScreen.querySelector('p');
        if (title) title.textContent = 'Welcome back!';
        if (message) message.textContent = 'Loading your workspace...';
        
        // Hide loading screen
        setTimeout(() => {
          loadingScreen.style.display = 'none';
        }, 800);
      }
      
      // Set up auth listener for sign out
      supabaseClient.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          redirectToAuth();
        }
      });
      
    } catch (error) {
      console.error('Auth check error:', error);
      redirectToAuth();
    }
  }
  
  // Start auth check when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuthCheck);
  } else {
    initAuthCheck();
  }
})();
