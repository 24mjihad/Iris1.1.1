// Authentication utility for main app
class AuthManager {
  constructor() {
    this.supabaseUrl = 'https://qqmsfraosocolpslrfvq.supabase.co';
    this.supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxbXNmcmFvc29jb2xwc2xyZnZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxNzcyOTEsImV4cCI6MjA2Nzc1MzI5MX0.ZGZIxxlCantVQ1WcA9j5VrYyk8PjgMjroX3h1-OQ8ko';
    this.supabase = null;
    this.user = null;
    this.initialized = false;
  }

  // Initialize Supabase client
  async init() {
    if (this.initialized) return;

    try {
      const { createClient } = supabase;
      this.supabase = createClient(this.supabaseUrl, this.supabaseAnonKey);
      
      // Check current auth state
      const { data: { user }, error } = await this.supabase.auth.getUser();
      
      if (error) {
        console.error('Auth check error:', error);
        this.redirectToAuth();
        return;
      }

      if (!user) {
        this.redirectToAuth();
        return;
      }

      this.user = user;
      this.setupAuthListener();
      this.updateUI();
      this.initialized = true;
      
      console.log('Auth initialized for user:', user.email);
      
    } catch (error) {
      console.error('Auth initialization error:', error);
      this.redirectToAuth();
    }
  }

  // Set up auth state listener
  setupAuthListener() {
    this.supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event);
      
      if (event === 'SIGNED_OUT' || !session) {
        this.user = null;
        this.redirectToAuth();
      } else if (event === 'SIGNED_IN' && session) {
        this.user = session.user;
        this.updateUI();
      }
    });
  }

  // Update UI with user information
  updateUI() {
    if (!this.user) return;

    // Update user name in header if element exists
    const userNameElement = document.querySelector('.user-name');
    if (userNameElement) {
      const displayName = this.user.user_metadata?.full_name || 
                         this.user.email?.split('@')[0] || 
                         'User';
      userNameElement.textContent = displayName;
    }

    // Update avatar if element exists
    const avatarElement = document.querySelector('.user-avatar');
    if (avatarElement && this.user.user_metadata?.avatar_url) {
      avatarElement.src = this.user.user_metadata.avatar_url;
    }

    // Show authenticated UI elements
    document.querySelectorAll('.auth-required').forEach(el => {
      el.style.display = '';
    });

    // Hide guest UI elements
    document.querySelectorAll('.guest-only').forEach(el => {
      el.style.display = 'none';
    });
  }

  // Add user menu to header
  addUserMenu() {
    const headerActions = document.querySelector('.header-actions');
    if (!headerActions || document.querySelector('.user-menu')) return;

    const userMenu = document.createElement('div');
    userMenu.className = 'user-menu';
    userMenu.innerHTML = `
      <button class="user-menu-trigger" id="userMenuTrigger">
        <img class="user-avatar" src="${this.getUserAvatar()}" alt="User" width="32" height="32">
        <span class="user-name">${this.getUserDisplayName()}</span>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <div class="user-menu-dropdown" id="userMenuDropdown">
        <div class="user-menu-header">
          <img class="user-avatar-large" src="${this.getUserAvatar()}" alt="User" width="40" height="40">
          <div class="user-info">
            <div class="user-name-large">${this.getUserDisplayName()}</div>
            <div class="user-email">${this.user.email}</div>
          </div>
        </div>
        <div class="user-menu-divider"></div>
        <button class="user-menu-item" onclick="authManager.showProfile()">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 8C10.2091 8 12 6.20914 12 4C12 1.79086 10.2091 0 8 0C5.79086 0 4 1.79086 4 4C4 6.20914 5.79086 8 8 8Z" fill="currentColor"/>
            <path d="M8 10C3.58172 10 0 12.2386 0 15C0 15.5523 0.447715 16 1 16H15C15.5523 16 16 15.5523 16 15C16 12.2386 12.4183 10 8 10Z" fill="currentColor"/>
          </svg>
          Profile Settings
        </button>
        <button class="user-menu-item" onclick="authManager.showHelp()">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5" fill="none"/>
            <path d="M8 12V8M8 4H8.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          Help & Support
        </button>
        <div class="user-menu-divider"></div>
        <button class="user-menu-item danger" onclick="authManager.signOut()">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 14H3C2.44772 14 2 13.5523 2 13V3C2 2.44772 2.44772 2 3 2H6M11 11L14 8L11 5M14 8H6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Sign Out
        </button>
      </div>
    `;

    headerActions.appendChild(userMenu);

    // Add event listeners
    this.setupUserMenuEvents();
  }

  // Setup user menu event listeners
  setupUserMenuEvents() {
    const trigger = document.getElementById('userMenuTrigger');
    const dropdown = document.getElementById('userMenuDropdown');

    if (!trigger || !dropdown) return;

    trigger.addEventListener('click', () => {
      dropdown.classList.toggle('show');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!trigger.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.classList.remove('show');
      }
    });
  }

  // Get user display name
  getUserDisplayName() {
    if (!this.user) return 'User';
    return this.user.user_metadata?.full_name || 
           this.user.email?.split('@')[0] || 
           'User';
  }

  // Get user avatar URL
  getUserAvatar() {
    if (this.user?.user_metadata?.avatar_url) {
      return this.user.user_metadata.avatar_url;
    }
    
    // Generate a default avatar based on user email
    const email = this.user?.email || 'user@example.com';
    const hash = this.simpleHash(email);
    const colors = ['8B5CF6', '3B82F6', '22D3EE', '10B981', 'F59E0B', 'F43F5E'];
    const color = colors[hash % colors.length];
    const initial = (this.getUserDisplayName()[0] || 'U').toUpperCase();
    
    return `data:image/svg+xml,${encodeURIComponent(`
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="32" height="32" rx="16" fill="#${color}"/>
        <text x="16" y="21" font-family="Inter, sans-serif" font-size="14" font-weight="600" fill="white" text-anchor="middle">${initial}</text>
      </svg>
    `)}`;
  }

  // Simple hash function for generating consistent avatar colors
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  // Show profile modal (placeholder)
  showProfile() {
    alert('Profile settings coming soon!');
    document.getElementById('userMenuDropdown')?.classList.remove('show');
  }

  // Show help modal (placeholder)
  showHelp() {
    alert('Help & support coming soon!');
    document.getElementById('userMenuDropdown')?.classList.remove('show');
  }

  // Sign out user
  async signOut() {
    try {
      const { error } = await this.supabase.auth.signOut();
      if (error) throw error;
      
      console.log('User signed out');
      // Redirect will happen automatically via auth state listener
      
    } catch (error) {
      console.error('Sign out error:', error);
      alert('Error signing out. Please try again.');
    }
  }

  // Redirect to auth page
  redirectToAuth() {
    console.log('Redirecting to auth page...');
    window.location.href = './auth.html';
  }

  // Get current user
  getUser() {
    return this.user;
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.user;
  }

  // Save canvas with user association
  async saveCanvas(canvasName, canvasData) {
    if (!this.isAuthenticated()) {
      throw new Error('User not authenticated');
    }

    try {
      const { data, error } = await this.supabase
        .from('canvases')
        .insert({
          name: canvasName,
          data: canvasData,
          user_id: this.user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      return data;
      
    } catch (error) {
      console.error('Save canvas error:', error);
      throw error;
    }
  }

  // Load user's canvases
  async loadCanvases() {
    if (!this.isAuthenticated()) {
      return [];
    }

    try {
      const { data, error } = await this.supabase
        .from('canvases')
        .select('*')
        .eq('user_id', this.user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data || [];
      
    } catch (error) {
      console.error('Load canvases error:', error);
      return [];
    }
  }
}

// Initialize auth manager
const authManager = new AuthManager();

// Auto-initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  authManager.init().then(() => {
    // Auth is ready, add user menu
    authManager.addUserMenu();
  });
});

// Export for global use
window.authManager = authManager;
