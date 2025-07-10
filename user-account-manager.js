// User Account Management Utility
class UserAccountManager {
  constructor() {
    this.supabaseUrl = 'https://qqmsfraosocolpslrfvq.supabase.co';
    this.supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxbXNmcmFvc29jb2xwc2xyZnZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxNzcyOTEsImV4cCI6MjA2Nzc1MzI5MX0.ZGZIxxlCantVQ1WcA9j5VrYyk8PjgMjroX3h1-OQ8ko';
    this.supabase = null;
    this.user = null;
    this.initialized = false;
  }

  // Initialize the account manager
  async init() {
    if (this.initialized) return;

    try {
      // Wait for Supabase to be available
      let attempts = 0;
      while (!window.supabase && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }

      if (!window.supabase) {
        throw new Error('Supabase not loaded');
      }

      const { createClient } = window.supabase;
      this.supabase = createClient(this.supabaseUrl, this.supabaseAnonKey);
      
      // Get current user
      const { data: { user }, error } = await this.supabase.auth.getUser();
      
      if (error || !user) {
        throw new Error('User not authenticated');
      }

      this.user = user;
      this.setupAuthListener();
      this.addUserMenu();
      this.initialized = true;
      
    } catch (error) {
      console.error('User account manager initialization error:', error);
    }
  }

  // Set up auth state listener
  setupAuthListener() {
    this.supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        this.user = null;
        this.removeUserMenu();
        // Redirect handled by auth-protection.js
      } else if (event === 'SIGNED_IN' && session) {
        this.user = session.user;
        this.addUserMenu();
      }
    });
  }

  // Get user display name
  getUserDisplayName() {
    if (!this.user) return 'User';
    
    return this.user.user_metadata?.full_name || 
           this.user.user_metadata?.name ||
           this.user.email?.split('@')[0] || 
           'User';
  }

  // Get user avatar URL
  getUserAvatar() {
    if (!this.user) return this.generateAvatarUrl('User');
    
    return this.user.user_metadata?.avatar_url || 
           this.generateAvatarUrl(this.getUserDisplayName());
  }

  // Generate avatar URL using UI Avatars
  generateAvatarUrl(name) {
    const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=8B5CF6&color=fff&size=128&rounded=true&bold=true`;
  }

  // Add user menu to header
  addUserMenu() {
    // Remove existing menu if any
    this.removeUserMenu();

    const headerActions = document.querySelector('.header-actions');
    if (!headerActions) return;

    const userMenu = document.createElement('div');
    userMenu.className = 'user-menu';
    userMenu.innerHTML = `
      <button class="user-menu-trigger" id="userMenuTrigger">
        <img class="user-avatar" src="${this.getUserAvatar()}" alt="User Avatar" width="24" height="24">
        <span class="user-name">${this.getUserDisplayName()}</span>
        <svg class="user-menu-arrow" width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      
      <div class="user-menu-dropdown" id="userMenuDropdown">
        <div class="user-menu-header">
          <img class="user-avatar-large" src="${this.getUserAvatar()}" alt="User Avatar" width="48" height="48">
          <div class="user-info">
            <div class="user-name-large">${this.getUserDisplayName()}</div>
            <div class="user-email">${this.user.email}</div>
          </div>
        </div>
        
        <div class="user-menu-separator"></div>
        
        <button class="user-menu-item" onclick="userAccountManager.showAccountInfo()">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M8 8C10.2091 8 12 6.20914 12 4C12 1.79086 10.2091 0 8 0C5.79086 0 4 1.79086 4 4C4 6.20914 5.79086 8 8 8Z"/>
            <path d="M8 10C3.58172 10 0 11.7909 0 14V16H16V14C16 11.7909 12.4183 10 8 10Z"/>
          </svg>
          Account Information
        </button>
        
        <button class="user-menu-item" onclick="userAccountManager.showSettings()">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="8" cy="8" r="3"/>
            <path d="M8 1V3M8 13V15M15 8H13M3 8H1M12.3 3.7L10.9 5.1M5.1 10.9L3.7 12.3M12.3 12.3L10.9 10.9M5.1 5.1L3.7 3.7"/>
          </svg>
          Settings
        </button>
        
        <div class="user-menu-separator"></div>
        
        <button class="user-menu-item danger" onclick="userAccountManager.signOut()">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M6 16V14C6 13.4477 6.44772 13 7 13H9C9.55228 13 10 12.5523 10 12V4C10 3.44772 9.55228 3 9 3H7C6.44772 3 6 3.44772 6 4V2"/>
            <path d="M11 5L14 8L11 11"/>
            <path d="M14 8H6"/>
          </svg>
          Sign Out
        </button>
      </div>
    `;

    // Insert before any existing buttons
    headerActions.insertBefore(userMenu, headerActions.firstChild);

    // Add click handlers
    this.setupMenuHandlers();
    this.addUserMenuStyles();
  }

  // Remove user menu
  removeUserMenu() {
    const existingMenu = document.querySelector('.user-menu');
    if (existingMenu) {
      existingMenu.remove();
    }
  }

  // Setup menu click handlers
  setupMenuHandlers() {
    const trigger = document.getElementById('userMenuTrigger');
    const dropdown = document.getElementById('userMenuDropdown');
    
    if (!trigger || !dropdown) return;

    // Toggle dropdown
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('open');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!trigger.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.classList.remove('open');
      }
    });

    // Close dropdown when pressing escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        dropdown.classList.remove('open');
      }
    });
  }

  // Add user menu styles
  addUserMenuStyles() {
    if (document.getElementById('userMenuStyles')) return;

    const styles = document.createElement('style');
    styles.id = 'userMenuStyles';
    styles.textContent = `
      .user-menu {
        position: relative;
        display: inline-block;
        margin-right: 1rem;
      }

      .user-menu-trigger {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.25rem 0.75rem;
        border: none;
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(8px);
        border-radius: 12px;
        cursor: pointer;
        transition: all 300ms ease;
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: rgba(255, 255, 255, 0.9);
        height: 32px;
        font-size: 0.8rem;
      }

      .user-menu-trigger:hover {
        background: rgba(255, 255, 255, 0.15);
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        border-color: rgba(139, 92, 246, 0.3);
      }

      .user-avatar {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 2px solid rgba(255, 255, 255, 0.3);
        transition: all 300ms ease;
      }

      .user-menu-trigger:hover .user-avatar {
        border-color: rgba(139, 92, 246, 0.5);
        box-shadow: 0 0 12px rgba(139, 92, 246, 0.3);
      }

      .user-name {
        font-weight: 500;
        font-size: 0.8rem;
        white-space: nowrap;
      }

      .user-menu-arrow {
        transition: transform 300ms ease;
      }

      .user-menu-trigger:hover .user-menu-arrow {
        transform: translateY(1px);
      }

      .user-menu-dropdown {
        position: absolute;
        top: calc(100% + 0.5rem);
        right: 0;
        background: #1a1a1a;
        backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 16px;
        box-shadow: 
          0 25px 50px rgba(0, 0, 0, 0.5),
          0 1px 0 rgba(255, 255, 255, 0.1) inset;
        padding: 1rem;
        min-width: 280px;
        z-index: 1000;
        opacity: 0;
        visibility: hidden;
        transform: translateY(-10px);
        transition: all 300ms ease;
      }

      .user-menu-dropdown.open {
        opacity: 1;
        visibility: visible;
        transform: translateY(0);
      }

      .user-menu-header {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1rem;
      }

      .user-avatar-large {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        border: 2px solid rgba(255, 255, 255, 0.3);
      }

      .user-info {
        flex: 1;
      }

      .user-name-large {
        font-weight: 600;
        font-size: 1rem;
        color: rgba(255, 255, 255, 0.95);
        margin-bottom: 0.25rem;
      }

      .user-email {
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.6);
        word-break: break-word;
      }

      .user-menu-separator {
        height: 1px;
        background: rgba(255, 255, 255, 0.1);
        margin: 0.75rem 0;
      }

      .user-menu-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1rem;
        border: none;
        background: transparent;
        color: rgba(255, 255, 255, 0.8);
        border-radius: 12px;
        cursor: pointer;
        transition: all 300ms ease;
        width: 100%;
        text-align: left;
        font-size: 0.875rem;
        font-weight: 500;
        margin-bottom: 0.25rem;
      }

      .user-menu-item:hover {
        background: rgba(255, 255, 255, 0.1);
        color: rgba(255, 255, 255, 0.95);
        transform: translateX(4px);
      }

      .user-menu-item.danger:hover {
        background: rgba(239, 68, 68, 0.2);
        color: #FCA5A5;
      }

      .user-menu-item svg {
        flex-shrink: 0;
      }

      /* Responsive */
      @media (max-width: 768px) {
        .user-menu-trigger .user-name {
          display: none;
        }
        
        .user-menu-dropdown {
          right: -1rem;
          min-width: 250px;
        }
      }
    `;

    document.head.appendChild(styles);
  }

  // Show account information modal
  showAccountInfo() {
    // Close dropdown
    document.getElementById('userMenuDropdown')?.classList.remove('open');

    const modal = document.createElement('div');
    modal.className = 'account-modal';
    modal.innerHTML = `
      <div class="account-modal-overlay" onclick="this.parentElement.remove()"></div>
      <div class="account-modal-content">
        <div class="account-modal-header">
          <h2>Account Information</h2>
          <button class="account-modal-close" onclick="this.closest('.account-modal').remove()">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M15 5L5 15M5 5L15 15"/>
            </svg>
          </button>
        </div>
        
        <div class="account-modal-body">
          <div class="account-info-section">
            <div class="account-avatar-section">
              <img src="${this.getUserAvatar()}" alt="User Avatar" class="account-avatar">
              <div class="account-basic-info">
                <h3>${this.getUserDisplayName()}</h3>
                <p>${this.user.email}</p>
              </div>
            </div>
          </div>
          
          <div class="account-details">
            <div class="account-detail-item">
              <label>Email</label>
              <span>${this.user.email}</span>
            </div>
            
            <div class="account-detail-item">
              <label>User ID</label>
              <span class="monospace">${this.user.id}</span>
            </div>
            
            <div class="account-detail-item">
              <label>Account Created</label>
              <span>${new Date(this.user.created_at).toLocaleDateString()}</span>
            </div>
            
            <div class="account-detail-item">
              <label>Last Sign In</label>
              <span>${this.user.last_sign_in_at ? new Date(this.user.last_sign_in_at).toLocaleDateString() : 'N/A'}</span>
            </div>
            
            <div class="account-detail-item">
              <label>Email Confirmed</label>
              <span class="status ${this.user.email_confirmed_at ? 'confirmed' : 'pending'}">
                ${this.user.email_confirmed_at ? '✓ Confirmed' : '⚠ Pending'}
              </span>
            </div>
          </div>
          
          <div class="account-actions">
            <button class="account-action-btn secondary" onclick="this.closest('.account-modal').remove()">
              Close
            </button>
            <button class="account-action-btn danger" onclick="userAccountManager.signOut()">
              Sign Out
            </button>
          </div>
        </div>
      </div>
    `;

    // Add modal styles
    this.addAccountModalStyles();
    
    document.body.appendChild(modal);
    
    // Animate in
    setTimeout(() => modal.classList.add('open'), 10);
  }

  // Show settings (placeholder)
  showSettings() {
    // Close dropdown
    document.getElementById('userMenuDropdown')?.classList.remove('open');
    
    alert('Settings functionality coming soon! For now, you can manage your account through the Account Information section.');
  }

  // Add account modal styles
  addAccountModalStyles() {
    if (document.getElementById('accountModalStyles')) return;

    const styles = document.createElement('style');
    styles.id = 'accountModalStyles';
    styles.textContent = `
      .account-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 2000;
        opacity: 0;
        transition: opacity 300ms ease;
      }

      .account-modal.open {
        opacity: 1;
      }

      .account-modal-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(10px);
      }

      .account-modal-content {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 20px;
        box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
        width: 90%;
        max-width: 500px;
        max-height: 80vh;
        overflow: hidden;
      }

      .account-modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1.5rem 2rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }

      .account-modal-header h2 {
        margin: 0;
        color: rgba(255, 255, 255, 0.95);
        font-size: 1.5rem;
        font-weight: 600;
      }

      .account-modal-close {
        background: none;
        border: none;
        color: rgba(255, 255, 255, 0.7);
        cursor: pointer;
        padding: 0.5rem;
        border-radius: 8px;
        transition: all 200ms ease;
      }

      .account-modal-close:hover {
        background: rgba(255, 255, 255, 0.1);
        color: rgba(255, 255, 255, 0.9);
      }

      .account-modal-body {
        padding: 2rem;
        overflow-y: auto;
        max-height: calc(80vh - 140px);
      }

      .account-avatar-section {
        display: flex;
        align-items: center;
        gap: 1.5rem;
        margin-bottom: 2rem;
        padding: 1.5rem;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 16px;
        border: 1px solid rgba(255, 255, 255, 0.1);
      }

      .account-avatar {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        border: 3px solid rgba(255, 255, 255, 0.3);
      }

      .account-basic-info h3 {
        margin: 0 0 0.5rem 0;
        color: rgba(255, 255, 255, 0.95);
        font-size: 1.25rem;
        font-weight: 600;
      }

      .account-basic-info p {
        margin: 0;
        color: rgba(255, 255, 255, 0.7);
        font-size: 0.875rem;
      }

      .account-details {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        margin-bottom: 2rem;
      }

      .account-detail-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.1);
      }

      .account-detail-item label {
        font-weight: 500;
        color: rgba(255, 255, 255, 0.8);
        font-size: 0.875rem;
      }

      .account-detail-item span {
        color: rgba(255, 255, 255, 0.95);
        font-size: 0.875rem;
        text-align: right;
        max-width: 60%;
        word-break: break-word;
      }

      .account-detail-item .monospace {
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        font-size: 0.75rem;
        background: rgba(0, 0, 0, 0.2);
        padding: 0.25rem 0.5rem;
        border-radius: 6px;
      }

      .status.confirmed {
        color: #10B981;
      }

      .status.pending {
        color: #F59E0B;
      }

      .account-actions {
        display: flex;
        gap: 1rem;
        justify-content: flex-end;
      }

      .account-action-btn {
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: all 200ms ease;
        font-size: 0.875rem;
      }

      .account-action-btn.secondary {
        background: rgba(255, 255, 255, 0.1);
        color: rgba(255, 255, 255, 0.8);
        border: 1px solid rgba(255, 255, 255, 0.2);
      }

      .account-action-btn.secondary:hover {
        background: rgba(255, 255, 255, 0.15);
        color: rgba(255, 255, 255, 0.95);
      }

      .account-action-btn.danger {
        background: rgba(239, 68, 68, 0.8);
        color: white;
        border: 1px solid rgba(239, 68, 68, 0.3);
      }

      .account-action-btn.danger:hover {
        background: rgba(239, 68, 68, 1);
        transform: translateY(-1px);
      }

      /* Responsive */
      @media (max-width: 768px) {
        .account-modal-content {
          width: 95%;
          max-height: 90vh;
        }
        
        .account-modal-header,
        .account-modal-body {
          padding: 1rem 1.5rem;
        }
        
        .account-avatar-section {
          flex-direction: column;
          text-align: center;
          gap: 1rem;
        }
        
        .account-detail-item {
          flex-direction: column;
          align-items: flex-start;
          gap: 0.5rem;
        }
        
        .account-detail-item span {
          max-width: 100%;
          text-align: left;
        }
        
        .account-actions {
          flex-direction: column;
        }
      }
    `;

    document.head.appendChild(styles);
  }

  // Sign out function
  async signOut() {
    try {
      if (!this.supabase) {
        throw new Error('Supabase not initialized');
      }

      // Close any open dropdowns or modals
      document.getElementById('userMenuDropdown')?.classList.remove('open');
      document.querySelector('.account-modal')?.remove();

      // Show loading state
      const existingMenu = document.querySelector('.user-menu-trigger');
      if (existingMenu) {
        existingMenu.style.opacity = '0.5';
        existingMenu.style.pointerEvents = 'none';
      }

      await this.supabase.auth.signOut();
      // The auth protection script will handle the redirect
      
    } catch (error) {
      console.error('Sign out error:', error);
      
      // Restore UI state
      const existingMenu = document.querySelector('.user-menu-trigger');
      if (existingMenu) {
        existingMenu.style.opacity = '1';
        existingMenu.style.pointerEvents = 'auto';
      }
      
      alert('Error signing out. Please try again.');
    }
  }
}

// Global instance
let userAccountManager = null;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  // Wait a bit for auth protection to complete
  setTimeout(async () => {
    try {
      userAccountManager = new UserAccountManager();
      await userAccountManager.init();
    } catch (error) {
      console.log('User account manager initialization skipped:', error.message);
    }
  }, 1500);
});
