// Supabase Configuration
const SUPABASE_URL = 'https://qqmsfraosocolpslrfvq.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxbXNmcmFvc29jb2xwc2xyZnZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxNzcyOTEsImV4cCI6MjA2Nzc1MzI5MX0.ZGZIxxlCantVQ1WcA9j5VrYyk8PjgMjroX3h1-OQ8ko'; // Replace with your Supabase anon key

// Initialize Supabase client
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM Elements
const authContainer = document.querySelector('.auth-form-container');
const signInForm = document.getElementById('signInForm');
const signUpForm = document.getElementById('signUpForm');
const forgotPasswordForm = document.getElementById('forgotPasswordForm');
const authLoading = document.getElementById('authLoading');

// Form Elements
const signInFormContent = document.getElementById('signInFormContent');
const signUpFormContent = document.getElementById('signUpFormContent');
const forgotPasswordFormContent = document.getElementById('forgotPasswordFormContent');

// Navigation Elements
const showSignUpBtn = document.getElementById('showSignUp');
const showSignInBtn = document.getElementById('showSignIn');
const forgotPasswordBtn = document.getElementById('forgotPasswordBtn');
const backToSignInBtn = document.getElementById('backToSignIn');

// Social Auth Buttons
const googleSignInBtn = document.getElementById('googleSignIn');
const githubSignInBtn = document.getElementById('githubSignIn');
const googleSignUpBtn = document.getElementById('googleSignUp');
const githubSignUpBtn = document.getElementById('githubSignUp');

// Message Toast
const messageToast = document.getElementById('messageToast');
const toastMessage = messageToast.querySelector('.toast-message');

// State Management
let currentForm = 'signIn';
let isLoading = false;

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  initializeAuth();
  setupEventListeners();
  checkAuthState();
});

// Check if user is already authenticated
async function checkAuthState() {
  try {
    const { data: { user }, error } = await supabaseClient.auth.getUser();
    
    if (user && !error) {
      // User is authenticated, redirect to original page or main app
      const redirectUrl = sessionStorage.getItem('authRedirectUrl') || './index.html';
      sessionStorage.removeItem('authRedirectUrl'); // Clean up
      window.location.href = redirectUrl;
    }
  } catch (error) {
    console.error('Auth check error:', error);
  }
}

// Initialize Authentication
function initializeAuth() {
  // Listen for auth state changes
  supabaseClient.auth.onAuthStateChange((event, session) => {
    console.log('Auth state changed:', event, session);
    
    if (event === 'SIGNED_IN') {
      showMessage('Welcome back! Redirecting to your whiteboard...', 'success');
      setTimeout(() => {
        const redirectUrl = sessionStorage.getItem('authRedirectUrl') || './index.html';
        sessionStorage.removeItem('authRedirectUrl'); // Clean up
        window.location.href = redirectUrl;
      }, 1500);
    } else if (event === 'SIGNED_OUT') {
      console.log('User signed out');
    } else if (event === 'PASSWORD_RECOVERY') {
      showMessage('Check your email for password reset instructions', 'success');
    }
  });
}

// Setup Event Listeners
function setupEventListeners() {
  // Form Navigation
  showSignUpBtn.addEventListener('click', () => switchForm('signUp'));
  showSignInBtn.addEventListener('click', () => switchForm('signIn'));
  forgotPasswordBtn.addEventListener('click', () => switchForm('forgotPassword'));
  backToSignInBtn.addEventListener('click', () => switchForm('signIn'));

  // Form Submissions
  signInFormContent.addEventListener('submit', handleSignIn);
  signUpFormContent.addEventListener('submit', handleSignUp);
  forgotPasswordFormContent.addEventListener('submit', handleForgotPassword);

  // Social Authentication
  googleSignInBtn.addEventListener('click', () => handleSocialAuth('google'));
  githubSignInBtn.addEventListener('click', () => handleSocialAuth('github'));
  googleSignUpBtn.addEventListener('click', () => handleSocialAuth('google'));
  githubSignUpBtn.addEventListener('click', () => handleSocialAuth('github'));

  // Input Validation
  setupInputValidation();
}

// Switch Between Forms
function switchForm(formType) {
  if (isLoading) return;

  // Hide all forms
  document.querySelectorAll('.auth-form').forEach(form => {
    form.classList.remove('active');
  });

  // Show target form
  const targetForm = document.getElementById(`${formType}Form`);
  if (targetForm) {
    targetForm.classList.add('active');
    currentForm = formType;
    
    // Focus first input
    const firstInput = targetForm.querySelector('input');
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 100);
    }
  }
}

// Handle Sign In
async function handleSignIn(e) {
  e.preventDefault();
  if (isLoading) return;

  const formData = new FormData(e.target);
  const email = formData.get('email');
  const password = formData.get('password');

  if (!validateEmail(email) || !password) {
    showMessage('Please enter valid email and password', 'error');
    return;
  }

  setLoading(true);

  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      throw error;
    }

    showMessage('Signed in successfully!', 'success');
    
  } catch (error) {
    console.error('Sign in error:', error);
    showMessage(getErrorMessage(error), 'error');
  } finally {
    setLoading(false);
  }
}

// Handle Sign Up
async function handleSignUp(e) {
  e.preventDefault();
  if (isLoading) return;

  const formData = new FormData(e.target);
  const name = formData.get('name');
  const email = formData.get('email');
  const password = formData.get('password');
  const confirmPassword = formData.get('confirmPassword');

  // Validation
  if (!name || name.length < 2) {
    showMessage('Please enter your full name', 'error');
    return;
  }

  if (!validateEmail(email)) {
    showMessage('Please enter a valid email address', 'error');
    return;
  }

  if (!validatePassword(password)) {
    showMessage('Password must be at least 8 characters long', 'error');
    return;
  }

  if (password !== confirmPassword) {
    showMessage('Passwords do not match', 'error');
    return;
  }

  setLoading(true);

  try {
    const { data, error } = await supabaseClient.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          full_name: name,
        }
      }
    });

    if (error) {
      throw error;
    }

    if (data.user && !data.session) {
      showMessage('Please check your email to confirm your account', 'success');
      switchForm('signIn');
    } else {
      showMessage('Account created successfully!', 'success');
    }
    
  } catch (error) {
    console.error('Sign up error:', error);
    showMessage(getErrorMessage(error), 'error');
  } finally {
    setLoading(false);
  }
}

// Handle Forgot Password
async function handleForgotPassword(e) {
  e.preventDefault();
  if (isLoading) return;

  const formData = new FormData(e.target);
  const email = formData.get('email');

  if (!validateEmail(email)) {
    showMessage('Please enter a valid email address', 'error');
    return;
  }

  setLoading(true);

  try {
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth.html?type=recovery`,
    });

    if (error) {
      throw error;
    }

    showMessage('Password reset email sent! Check your inbox.', 'success');
    switchForm('signIn');
    
  } catch (error) {
    console.error('Password reset error:', error);
    showMessage(getErrorMessage(error), 'error');
  } finally {
    setLoading(false);
  }
}

// Handle Social Authentication
async function handleSocialAuth(provider) {
  if (isLoading) return;

  setLoading(true);

  try {
    const { data, error } = await supabaseClient.auth.signInWithOAuth({
      provider: provider,
      options: {
        redirectTo: `${window.location.origin}/index.html`,
      }
    });

    if (error) {
      throw error;
    }

    // OAuth redirect will handle the rest
    
  } catch (error) {
    console.error(`${provider} auth error:`, error);
    showMessage(getErrorMessage(error), 'error');
    setLoading(false);
  }
}

// Input Validation Setup
function setupInputValidation() {
  // Real-time email validation
  const emailInputs = document.querySelectorAll('input[type="email"]');
  emailInputs.forEach(input => {
    input.addEventListener('blur', (e) => {
      const email = e.target.value;
      if (email && !validateEmail(email)) {
        e.target.style.borderColor = 'var(--rose-500)';
      } else {
        e.target.style.borderColor = '';
      }
    });
  });

  // Real-time password validation
  const passwordInputs = document.querySelectorAll('input[type="password"]');
  passwordInputs.forEach(input => {
    if (input.name === 'password') {
      input.addEventListener('input', (e) => {
        const password = e.target.value;
        if (password && !validatePassword(password)) {
          e.target.style.borderColor = 'var(--rose-500)';
        } else {
          e.target.style.borderColor = '';
        }
      });
    }
  });

  // Confirm password validation
  const confirmPasswordInput = document.getElementById('confirmPassword');
  const signUpPasswordInput = document.getElementById('signUpPassword');
  
  if (confirmPasswordInput && signUpPasswordInput) {
    confirmPasswordInput.addEventListener('input', () => {
      const password = signUpPasswordInput.value;
      const confirmPassword = confirmPasswordInput.value;
      
      if (confirmPassword && password !== confirmPassword) {
        confirmPasswordInput.style.borderColor = 'var(--rose-500)';
      } else {
        confirmPasswordInput.style.borderColor = '';
      }
    });
  }
}

// Validation Functions
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePassword(password) {
  return password && password.length >= 8;
}

// Loading State Management
function setLoading(loading) {
  isLoading = loading;
  
  if (loading) {
    authLoading.classList.add('active');
    document.querySelectorAll('.auth-form').forEach(form => {
      form.style.display = 'none';
    });
  } else {
    authLoading.classList.remove('active');
    document.querySelectorAll('.auth-form').forEach(form => {
      form.style.display = '';
    });
    switchForm(currentForm);
  }

  // Disable all buttons and inputs
  const buttons = document.querySelectorAll('button');
  const inputs = document.querySelectorAll('input');
  
  buttons.forEach(btn => btn.disabled = loading);
  inputs.forEach(input => input.disabled = loading);
}

// Message Display
function showMessage(message, type = 'info') {
  toastMessage.textContent = message;
  messageToast.className = `message-toast ${type}`;
  messageToast.classList.add('show');

  // Auto hide after 5 seconds
  setTimeout(() => {
    messageToast.classList.remove('show');
  }, 5000);
}

// Error Message Helper
function getErrorMessage(error) {
  switch (error.message) {
    case 'Invalid login credentials':
      return 'Invalid email or password. Please try again.';
    case 'User already registered':
      return 'An account with this email already exists.';
    case 'Email not confirmed':
      return 'Please check your email and confirm your account.';
    case 'Signup not allowed for this instance':
      return 'New registrations are currently disabled.';
    default:
      return error.message || 'An unexpected error occurred. Please try again.';
  }
}

// Handle URL parameters (for password recovery, etc.)
function handleUrlParameters() {
  const urlParams = new URLSearchParams(window.location.search);
  const type = urlParams.get('type');
  const accessToken = urlParams.get('access_token');
  const refreshToken = urlParams.get('refresh_token');

  if (type === 'recovery' && accessToken && refreshToken) {
    // Handle password recovery
    supabaseClient.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    }).then(({ data, error }) => {
      if (error) {
        showMessage('Invalid recovery link', 'error');
      } else {
        showMessage('You can now update your password', 'success');
        // Redirect to password update page or show password update form
      }
    });
  }
}

// Initialize URL parameter handling
handleUrlParameters();

// Export for testing (if needed)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    validateEmail,
    validatePassword,
    getErrorMessage
  };
}
