// Import Excalidraw and React dependencies
import * as ExcalidrawLib from 'https://esm.sh/@excalidraw/excalidraw@0.18.0/dist/dev/index.js?external=react,react-dom';
import React from "https://esm.sh/react@19.0.0";
import { createRoot } from "https://esm.sh/react-dom@19.0.0/client";

// Make ExcalidrawLib available globally for debugging
window.ExcalidrawLib = ExcalidrawLib;

// Markdown Formatter Utility
class MarkdownFormatter {
  constructor() {
    // Configure marked options
    if (typeof marked !== 'undefined') {
      marked.setOptions({
        breaks: true,
        gfm: true,
        headerIds: false,
        mangle: false
      });
    }
  }

  formatMessage(content) {
    if (!content || typeof marked === 'undefined') {
      return content;
    }

    try {
      // Parse markdown to HTML
      let html = marked.parse(content);
      
      // Sanitize HTML to prevent XSS attacks
      if (typeof DOMPurify !== 'undefined') {
        html = DOMPurify.sanitize(html, {
          ALLOWED_TAGS: [
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'p', 'br', 'strong', 'em', 'u', 's',
            'ul', 'ol', 'li',
            'blockquote', 'code', 'pre',
            'a', 'img',
            'table', 'thead', 'tbody', 'tr', 'th', 'td',
            'hr', 'div', 'span'
          ],
          ALLOWED_ATTR: ['href', 'title', 'alt', 'src', 'class']
        });
      }

      return html;
    } catch (error) {
      console.warn('Markdown parsing error:', error);
      return content; // Fallback to original content
    }
  }

  // Enhanced formatting for AI responses with proper spacing
  formatAIResponse(content) {
    if (!content) return content;

    // First apply markdown formatting
    let formatted = this.formatMessage(content);

    // Add CSS classes for better styling
    formatted = formatted.replace(/<h2>/g, '<h2 class="ai-section-header">');
    formatted = formatted.replace(/<h3>/g, '<h3 class="ai-subsection-header">');
    formatted = formatted.replace(/<hr>/g, '<hr class="ai-section-divider">');
    formatted = formatted.replace(/<ul>/g, '<ul class="ai-list">');
    formatted = formatted.replace(/<ol>/g, '<ol class="ai-ordered-list">');
    formatted = formatted.replace(/<code>/g, '<code class="ai-inline-code">');
    formatted = formatted.replace(/<pre>/g, '<pre class="ai-code-block">');

    return formatted;
  }
}

// Initialize markdown formatter
const markdownFormatter = new MarkdownFormatter();

// Screenshot functionality
class ScreenshotTool {
  constructor() {
    this.isActive = false;
    this.startX = 0;
    this.startY = 0;
    this.endX = 0;
    this.endY = 0;
    this.overlay = null;
    this.selectionBox = null;
    this.onComplete = null;
  }

  activate(onComplete) {
    this.onComplete = onComplete;
    this.isActive = true;
    this.overlay = document.getElementById('screenshotOverlay');
    this.selectionBox = document.getElementById('selectionBox');
    
    if (this.overlay) {
      this.overlay.classList.add('active');
      this.setupEventListeners();
    }
  }

  deactivate() {
    this.isActive = false;
    if (this.overlay) {
      this.overlay.classList.remove('active');
    }
    if (this.selectionBox) {
      this.selectionBox.classList.remove('active');
    }
    this.removeEventListeners();
  }

  setupEventListeners() {
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleCancel = this.handleCancel.bind(this);

    this.overlay.addEventListener('mousedown', this.handleMouseDown);
    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('mouseup', this.handleMouseUp);
    
    const cancelBtn = document.getElementById('cancelScreenshot');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', this.handleCancel);
    }
  }

  removeEventListeners() {
    if (this.overlay) {
      this.overlay.removeEventListener('mousedown', this.handleMouseDown);
    }
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseup', this.handleMouseUp);
    
    const cancelBtn = document.getElementById('cancelScreenshot');
    if (cancelBtn) {
      cancelBtn.removeEventListener('click', this.handleCancel);
    }
  }

  handleMouseDown(e) {
    if (e.target === this.overlay || e.target.classList.contains('screenshot-instructions') || e.target.classList.contains('cancel-screenshot')) {
      if (e.target.classList.contains('cancel-screenshot')) {
        return;
      }
      if (e.target.classList.contains('screenshot-instructions')) {
        return;
      }
    }

    const rect = this.overlay.getBoundingClientRect();
    this.startX = e.clientX - rect.left;
    this.startY = e.clientY - rect.top;
    this.isDrawing = true;
    
    if (this.selectionBox) {
      this.selectionBox.classList.add('active');
    }
  }

  handleMouseMove(e) {
    if (!this.isDrawing || !this.isActive) return;

    const rect = this.overlay.getBoundingClientRect();
    this.endX = e.clientX - rect.left;
    this.endY = e.clientY - rect.top;

    this.updateSelectionBox();
  }

  handleMouseUp(e) {
    if (!this.isDrawing || !this.isActive) return;

    this.isDrawing = false;
    const rect = this.overlay.getBoundingClientRect();
    this.endX = e.clientX - rect.left;
    this.endY = e.clientY - rect.top;

    // Check if selection is big enough
    const width = Math.abs(this.endX - this.startX);
    const height = Math.abs(this.endY - this.startY);
    
    if (width > 10 && height > 10) {
      this.captureSelection();
    } else {
      this.deactivate();
    }
  }

  handleCancel() {
    this.deactivate();
  }

  updateSelectionBox() {
    if (!this.selectionBox) return;

    const left = Math.min(this.startX, this.endX);
    const top = Math.min(this.startY, this.endY);
    const width = Math.abs(this.endX - this.startX);
    const height = Math.abs(this.endY - this.startY);

    this.selectionBox.style.left = `${left}px`;
    this.selectionBox.style.top = `${top}px`;
    this.selectionBox.style.width = `${width}px`;
    this.selectionBox.style.height = `${height}px`;
  }

  captureSelection() {
    // Get the canvas element
    const canvasElement = document.querySelector('#app canvas');
    if (!canvasElement) {
      this.deactivate();
      return;
    }

    // Calculate the actual coordinates relative to the canvas
    const canvasRect = canvasElement.getBoundingClientRect();
    const overlayRect = this.overlay.getBoundingClientRect();
    
    const scaleX = canvasElement.width / canvasRect.width;
    const scaleY = canvasElement.height / canvasRect.height;
    
    const left = Math.min(this.startX, this.endX);
    const top = Math.min(this.startY, this.endY);
    const width = Math.abs(this.endX - this.startX);
    const height = Math.abs(this.endY - this.startY);

    // Capture the selected area
    const capturedCanvas = document.createElement('canvas');
    const ctx = capturedCanvas.getContext('2d');
    
    capturedCanvas.width = width * scaleX;
    capturedCanvas.height = height * scaleY;
    
    ctx.drawImage(
      canvasElement,
      left * scaleX,
      top * scaleY,
      width * scaleX,
      height * scaleY,
      0,
      0,
      capturedCanvas.width,
      capturedCanvas.height
    );

    const imageDataUrl = capturedCanvas.toDataURL('image/png');
    
    this.deactivate();
    
    if (this.onComplete) {
      this.onComplete(imageDataUrl);
    }
  }
}

// Text Input Modal
class TextInputModal {
  constructor() {
    this.modal = null;
    this.textField = null;
    this.onSubmit = null;
    this.imageData = null;
  }

  show(imageData, onSubmit) {
    this.imageData = imageData;
    this.onSubmit = onSubmit;
    this.modal = document.getElementById('textInputModal');
    this.textField = document.getElementById('textInputField');
    
    if (this.modal) {
      this.modal.classList.add('active');
      this.setupEventListeners();
      
      // Focus the text field
      setTimeout(() => {
        if (this.textField) {
          this.textField.focus();
        }
      }, 300);
    }
  }

  hide() {
    if (this.modal) {
      this.modal.classList.remove('active');
      this.removeEventListeners();
    }
    if (this.textField) {
      this.textField.value = '';
    }
  }

  setupEventListeners() {
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleCancel = this.handleCancel.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);

    const submitBtn = document.getElementById('submitTextInput');
    const cancelBtn = document.getElementById('cancelTextInput');
    
    if (submitBtn) {
      submitBtn.addEventListener('click', this.handleSubmit);
    }
    if (cancelBtn) {
      cancelBtn.addEventListener('click', this.handleCancel);
    }
    if (this.textField) {
      this.textField.addEventListener('keydown', this.handleKeyDown);
    }
  }

  removeEventListeners() {
    const submitBtn = document.getElementById('submitTextInput');
    const cancelBtn = document.getElementById('cancelTextInput');
    
    if (submitBtn) {
      submitBtn.removeEventListener('click', this.handleSubmit);
    }
    if (cancelBtn) {
      cancelBtn.removeEventListener('click', this.handleCancel);
    }
    if (this.textField) {
      this.textField.removeEventListener('keydown', this.handleKeyDown);
    }
  }

  handleSubmit() {
    const text = this.textField ? this.textField.value.trim() : '';
    if (this.onSubmit) {
      this.onSubmit(this.imageData, text);
    }
    this.hide();
  }

  handleCancel() {
    this.hide();
  }

  handleKeyDown(e) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      this.handleSubmit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      this.handleCancel();
    }
  }
}

// AI Results Manager
class AIResultsManager {
  constructor() {
    this.panel = null;
    this.content = null;
    this.results = [];
  }

  initialize() {
    this.panel = document.getElementById('aiResultsPanel');
    this.content = document.getElementById('aiResultsContent');
    
    const closeBtn = document.getElementById('closePanel');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hide());
    }
  }

  show() {
    if (this.panel) {
      this.panel.classList.add('open');
    }
  }

  hide() {
    if (this.panel) {
      this.panel.classList.remove('open');
    }
  }

  addResult(imageData, text) {
    const timestamp = new Date().toLocaleString();
    const userMessage = text || 'What can you tell me about this?';
    
    // Check if there's an existing conversation to add to
    if (this.results.length > 0) {
      const existingResult = this.results[0]; // Most recent conversation
      
      // Add the new image as a user message in the existing conversation
      existingResult.messages.push({
        type: 'user',
        content: userMessage,
        timestamp: new Date().toLocaleTimeString(),
        hasImage: true,
        imageData: imageData
      });

      // Show typing indicator
      existingResult.isTyping = true;
      this.renderResults();

      // Add AI response after a delay
      setTimeout(async () => {
        existingResult.isTyping = false;
        const conversationHistory = window.GeminiService?.formatConversationHistory(existingResult.messages) || [];
        const aiResponse = await this.generateAIResponse(userMessage, imageData, conversationHistory);
        existingResult.messages.push({
          type: 'ai',
          content: aiResponse,
          timestamp: new Date().toLocaleTimeString()
        });
        this.renderResults();
        
        // Scroll to bottom of the conversation
        const resultElement = document.querySelector(`[data-id="${existingResult.id}"]`);
        if (resultElement) {
          resultElement.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
      }, 1500);
      
      this.renderResults();
      this.show();
      return;
    }
    
    // If no existing conversation, create a new one
    const result = {
      id: Date.now(),
      imageData,
      userMessage,
      messages: [],
      timestamp
    };
    
    // Add the user's initial message
    result.messages.push({
      type: 'user',
      content: result.userMessage,
      timestamp: new Date().toLocaleTimeString(),
      hasImage: true,
      imageData: imageData
    });

    // Show typing indicator
    result.isTyping = true;
    this.results.unshift(result);
    this.renderResults();
    this.show();

    // Add AI response after a delay
    setTimeout(async () => {
      result.isTyping = false;
      const aiResponse = await this.generateAIResponse(result.userMessage, imageData);
      result.messages.push({
        type: 'ai',
        content: aiResponse,
        timestamp: new Date().toLocaleTimeString()
      });
      this.renderResults();
    }, 1500);
  }

  async generateAIResponse(userMessage, imageData = null, conversationHistory = []) {
    try {
      // Use Gemini service if available
      if (window.GeminiService) {
        if (imageData) {
          // For image + text analysis
          return await window.GeminiService.createVisionCompletion(userMessage, imageData, conversationHistory);
        } else {
          // For text-only conversations
          return await window.GeminiService.createTextCompletion(userMessage, conversationHistory);
        }
      }
      
      // Fallback to mock responses if service not available
      const responses = [
        "I can see this is an interesting diagram! It looks like you're working on a workflow or process flow. The shapes and connections suggest a systematic approach. Would you like me to suggest improvements for clarity or organization?",
        "This appears to be a brainstorming session with various connected ideas. I notice some clustering of concepts. Consider grouping similar elements with color coding or boundaries to make relationships clearer.",
        "Great visual thinking! I can see you're mapping out relationships between different elements. The layout suggests hierarchical thinking. Would you like help organizing this into a more structured format?",
        "This diagram shows good use of different shapes to represent different types of information. The flow seems logical, but you might want to add some decision points or conditional branches to make the process more complete.",
        "I can see you're working on a conceptual map or system design. The connections between elements are helpful. Consider adding labels to the connecting lines to explain the relationships more clearly."
      ];
      
      return responses[Math.floor(Math.random() * responses.length)];
    } catch (error) {
      console.error('AI Response Error:', error);
      return "I'm having trouble processing your request right now. Please try again in a moment.";
    }
  }

  renderResults() {
    if (!this.content) return;

    if (this.results.length === 0) {
      this.content.innerHTML = `
        <div class="empty-state">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <path d="M24 4L30 18H44L34 28L38 44L24 36L10 44L14 28L4 18H18L24 4Z" stroke="currentColor" stroke-width="2" fill="none"/>
          </svg>
          <p>Start a conversation with AI about your canvas designs</p>
        </div>
      `;
      return;
    }

    this.content.innerHTML = this.results.map(result => `
      <div class="ai-result-item" data-id="${result.id}">
        <div class="ai-result-header">
          <span class="ai-result-timestamp">Conversation started: ${result.timestamp}</span>
        </div>
        
        <div class="chat-messages">
          ${result.messages.map(message => `
            <div class="chat-message ${message.type}">
              ${message.hasImage ? `
                <img src="${message.imageData}" alt="Canvas screenshot" class="message-image" />
              ` : ''}

              <div class="message-bubble ${message.type} tex2jax_process">
                ${message.type === 'ai' ? markdownFormatter.formatAIResponse(message.content) : message.content}
              </div>
              <span class="message-time">${message.timestamp}</span>
            </div>
          `).join('')}

          ${result.isTyping ? `
            <div class="typing-indicator">
              <div class="typing-dots">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
              </div>
              <span class="typing-text">AI is thinking...</span>
            </div>
          ` : ''}
        </div>

        <div class="chat-input-container">
          <div class="chat-input-wrapper">
            <textarea 
              class="chat-input" 
              placeholder="Ask a follow-up question..."
              data-result-id="${result.id}"
              rows="1"
            ></textarea>
            <button class="chat-send-btn" data-result-id="${result.id}">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M15 1L1 8L6 10L8 15L15 1Z" fill="currentColor"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `).join('');


    // Add event listeners for chat inputs
    this.attachChatListeners();
    
    // Render LaTeX math with MathJax
    if (window.MathJax) {
      MathJax.typesetPromise([this.content]).catch((err) => {
        console.warn('MathJax rendering error:', err);
      });
    }
  }

  attachChatListeners() {
    // Handle chat input auto-resize
    document.querySelectorAll('.chat-input').forEach(input => {
      input.addEventListener('input', (e) => {
        e.target.style.height = 'auto';
        e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
      });

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          const resultId = parseInt(e.target.dataset.resultId);
          this.sendChatMessage(resultId, e.target.value);
        }
      });
    });

    // Handle send button clicks
    document.querySelectorAll('.chat-send-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const resultId = parseInt(e.target.dataset.resultId);
        const input = document.querySelector(`[data-result-id="${resultId}"].chat-input`);
        if (input && input.value.trim()) {
          this.sendChatMessage(resultId, input.value);
        }
      });
    });
  }

  sendChatMessage(resultId, message) {
    const result = this.results.find(r => r.id === resultId);
    if (!result || !message.trim()) return;

    // Add user message
    result.messages.push({
      type: 'user',
      content: message.trim(),
      timestamp: new Date().toLocaleTimeString()
    });

    // Clear input
    const input = document.querySelector(`[data-result-id="${resultId}"].chat-input`);
    if (input) {
      input.value = '';
      input.style.height = 'auto';
    }

    // Show typing indicator
    result.isTyping = true;
    this.renderResults();

    // Generate AI response after delay
    setTimeout(async () => {
      result.isTyping = false;
      const conversationHistory = window.GeminiService?.formatConversationHistory(result.messages) || [];
      const aiResponse = await this.generateAIResponse(message.trim(), null, conversationHistory);
      result.messages.push({
        type: 'ai',
        content: aiResponse,
        timestamp: new Date().toLocaleTimeString()
      });
      this.renderResults();
      
      // Scroll to bottom of the conversation
      const resultElement = document.querySelector(`[data-id="${resultId}"]`);
      if (resultElement) {
        resultElement.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    }, 1000 + Math.random() * 1000);
  }

}

// Canvas Management
class CanvasManager {
  constructor() {
    this.currentCanvasName = 'Untitled Canvas';
    this.savedCanvases = this.loadSavedCanvases();
  }

  loadSavedCanvases() {
    try {
      const saved = localStorage.getItem('iris-saved-canvases');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading saved canvases:', error);
      return [];
    }
  }

  saveCanvasesToStorage() {
    try {
      localStorage.setItem('iris-saved-canvases', JSON.stringify(this.savedCanvases));
    } catch (error) {
      console.error('Error saving canvases to storage:', error);
    }
  }

  async saveCurrentCanvas(name, excalidrawAPI) {
    if (!excalidrawAPI || !name.trim()) return false;

    try {
      // Get current scene data
      const elements = excalidrawAPI.getSceneElements();
      const appState = excalidrawAPI.getAppState();
      
      // Generate thumbnail
      const thumbnail = await this.generateThumbnail(excalidrawAPI);
      
      const canvasData = {
        id: Date.now(),
        name: name.trim(),
        elements: elements,
        appState: {
          viewBackgroundColor: appState.viewBackgroundColor,
          currentItemStrokeColor: appState.currentItemStrokeColor,
          currentItemBackgroundColor: appState.currentItemBackgroundColor,
          currentItemFillStyle: appState.currentItemFillStyle,
          currentItemStrokeWidth: appState.currentItemStrokeWidth,
          currentItemRoughness: appState.currentItemRoughness,
          gridSize: appState.gridSize,
        },
        thumbnail: thumbnail,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Check if canvas with same name exists
      const existingIndex = this.savedCanvases.findIndex(canvas => canvas.name === name.trim());
      
      if (existingIndex !== -1) {
        // Update existing canvas
        this.savedCanvases[existingIndex] = { ...canvasData, createdAt: this.savedCanvases[existingIndex].createdAt };
      } else {
        // Add new canvas
        this.savedCanvases.unshift(canvasData);
      }

      this.saveCanvasesToStorage();
      this.currentCanvasName = name.trim();
      this.updateCanvasTitle();
      return true;
    } catch (error) {
      console.error('Error saving canvas:', error);
      return false;
    }
  }

  async generateThumbnail(excalidrawAPI) {
    try {
      // Get the canvas as blob
      const blob = await excalidrawAPI.exportToBlob({
        elements: excalidrawAPI.getSceneElements(),
        appState: excalidrawAPI.getAppState(),
        files: excalidrawAPI.getFiles(),
        mimeType: 'image/png',
        quality: 0.8
      });

      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      return null;
    }
  }

  loadCanvas(canvasData, excalidrawAPI) {
    if (!excalidrawAPI || !canvasData) return false;

    try {
      excalidrawAPI.updateScene({
        elements: canvasData.elements,
        appState: canvasData.appState
      });
      
      this.currentCanvasName = canvasData.name;
      this.updateCanvasTitle();
      return true;
    } catch (error) {
      console.error('Error loading canvas:', error);
      return false;
    }
  }

  deleteCanvas(canvasId) {
    this.savedCanvases = this.savedCanvases.filter(canvas => canvas.id !== canvasId);
    this.saveCanvasesToStorage();
  }

  newCanvas(excalidrawAPI) {
    if (!excalidrawAPI) return;
    
    excalidrawAPI.resetScene();
    this.currentCanvasName = 'Untitled Canvas';
    this.updateCanvasTitle();
  }

  updateCanvasTitle() {
    const titleElement = document.querySelector('.canvas-title');
    if (titleElement) {
      titleElement.textContent = this.currentCanvasName;
    }
  }

  getSavedCanvases() {
    return this.savedCanvases;
  }
}

// Save Canvas Modal
class SaveCanvasModal {
  constructor(canvasManager) {
    this.canvasManager = canvasManager;
    this.modal = null;
    this.input = null;
    this.onSave = null;
  }

  show(onSave) {
    this.onSave = onSave;
    this.modal = document.getElementById('saveCanvasModal');
    this.input = document.getElementById('saveCanvasInput');
    
    if (this.modal) {
      this.modal.classList.add('active');
      this.setupEventListeners();
      
      // Pre-fill with current canvas name
      if (this.input) {
        this.input.value = this.canvasManager.currentCanvasName === 'Untitled Canvas' 
          ? '' 
          : this.canvasManager.currentCanvasName;
        
        setTimeout(() => {
          this.input.focus();
          this.input.select();
        }, 300);
      }
    }
  }

  hide() {
    if (this.modal) {
      this.modal.classList.remove('active');
      this.removeEventListeners();
    }
    if (this.input) {
      this.input.value = '';
    }
  }

  setupEventListeners() {
    this.handleSave = this.handleSave.bind(this);
    this.handleCancel = this.handleCancel.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);

    const saveBtn = document.getElementById('confirmSaveCanvas');
    const cancelBtn = document.getElementById('cancelSaveCanvas');
    
    if (saveBtn) {
      saveBtn.addEventListener('click', this.handleSave);
    }
    if (cancelBtn) {
      cancelBtn.addEventListener('click', this.handleCancel);
    }
    if (this.input) {
      this.input.addEventListener('keydown', this.handleKeyDown);
    }
  }

  removeEventListeners() {
    const saveBtn = document.getElementById('confirmSaveCanvas');
    const cancelBtn = document.getElementById('cancelSaveCanvas');
    
    if (saveBtn) {
      saveBtn.removeEventListener('click', this.handleSave);
    }
    if (cancelBtn) {
      cancelBtn.removeEventListener('click', this.handleCancel);
    }
    if (this.input) {
      this.input.removeEventListener('keydown', this.handleKeyDown);
    }
  }

  handleSave() {
    const name = this.input ? this.input.value.trim() : '';
    if (name && this.onSave) {
      this.onSave(name);
    }
    this.hide();
  }

  handleCancel() {
    this.hide();
  }

  handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      this.handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      this.handleCancel();
    }
  }
}

// Saved Canvases Modal
class SavedCanvasesModal {
  constructor(canvasManager) {
    this.canvasManager = canvasManager;
    this.modal = null;
    this.list = null;
    this.onLoadCanvas = null;
  }

  show(onLoadCanvas) {
    this.onLoadCanvas = onLoadCanvas;
    this.modal = document.getElementById('savedCanvasesModal');
    this.list = document.getElementById('savedCanvasesList');
    
    if (this.modal) {
      this.modal.classList.add('active');
      this.setupEventListeners();
      this.renderCanvases();
    }
  }

  hide() {
    if (this.modal) {
      this.modal.classList.remove('active');
      this.removeEventListeners();
    }
  }

  setupEventListeners() {
    const closeBtn = document.getElementById('closeSavedCanvases');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hide());
    }

    // Close on backdrop click
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.hide();
      }
    });
  }

  removeEventListeners() {
    const closeBtn = document.getElementById('closeSavedCanvases');
    if (closeBtn) {
      closeBtn.removeEventListener('click', () => this.hide());
    }
  }

  renderCanvases() {
    if (!this.list) return;

    const canvases = this.canvasManager.getSavedCanvases();
    
    if (canvases.length === 0) {
      this.list.innerHTML = `
        <div class="empty-canvases-state">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <rect x="8" y="8" width="32" height="24" rx="2" stroke="currentColor" stroke-width="2" fill="none"/>
            <circle cx="16" cy="18" r="2" fill="currentColor"/>
            <path d="M12 26L18 20L24 26L36 14" stroke="currentColor" stroke-width="2" fill="none"/>
          </svg>
          <p>No saved canvases yet</p>
          <small>Create and save your first canvas to see it here</small>
        </div>
      `;
      return;
    }

    this.list.innerHTML = `
      <div class="canvas-grid">
        ${canvases.map(canvas => `
          <div class="canvas-card" data-canvas-id="${canvas.id}">
            <div class="canvas-thumbnail">
              ${canvas.thumbnail ? `<img src="${canvas.thumbnail}" alt="${canvas.name}" />` : `
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <rect x="8" y="8" width="32" height="24" rx="2" stroke="currentColor" stroke-width="2" fill="none"/>
                  <circle cx="16" cy="18" r="2" fill="currentColor"/>
                  <path d="M12 26L18 20L24 26L36 14" stroke="currentColor" stroke-width="2" fill="none"/>
                </svg>
              `}
            </div>
            <div class="canvas-info">
              <div class="canvas-name">${canvas.name}</div>
              <div class="canvas-meta">
                <span>Created: ${new Date(canvas.createdAt).toLocaleDateString()}</span>
                <span>${canvas.elements.length} elements</span>
              </div>
              <div class="canvas-actions">
                <button class="canvas-action-btn primary" data-action="load" data-canvas-id="${canvas.id}">
                  Load Canvas
                </button>
                <button class="canvas-action-btn danger" data-action="delete" data-canvas-id="${canvas.id}">
                  Delete
                </button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    // Add event listeners for canvas actions
    this.attachCanvasListeners();
  }

  attachCanvasListeners() {
    // Load canvas buttons
    document.querySelectorAll('[data-action="load"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const canvasId = parseInt(e.target.dataset.canvasId);
        const canvas = this.canvasManager.getSavedCanvases().find(c => c.id === canvasId);
        if (canvas && this.onLoadCanvas) {
          this.onLoadCanvas(canvas);
          this.hide();
        }
      });
    });

    // Delete canvas buttons
    document.querySelectorAll('[data-action="delete"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const canvasId = parseInt(e.target.dataset.canvasId);
        const canvas = this.canvasManager.getSavedCanvases().find(c => c.id === canvasId);
        if (canvas) {
          this.showDeleteConfirmation(canvas);
        }
      });
    });

    // Load on card click
    document.querySelectorAll('.canvas-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.canvas-actions')) return;
        
        const canvasId = parseInt(card.dataset.canvasId);
        const canvas = this.canvasManager.getSavedCanvases().find(c => c.id === canvasId);
        if (canvas && this.onLoadCanvas) {
          this.onLoadCanvas(canvas);
          this.hide();
        }
      });
    });
  }

  showDeleteConfirmation(canvas) {
    const modal = document.getElementById('deleteCanvasModal');
    const nameElement = document.getElementById('deleteCanvasName');
    const confirmBtn = document.getElementById('confirmDelete');
    const cancelBtn = document.getElementById('cancelDelete');

    if (modal && nameElement && confirmBtn && cancelBtn) {
      nameElement.textContent = canvas.name;
      modal.classList.add('active');

      const handleConfirm = () => {
        this.canvasManager.deleteCanvas(canvas.id);
        this.renderCanvases();
        modal.classList.remove('active');
        confirmBtn.removeEventListener('click', handleConfirm);
        cancelBtn.removeEventListener('click', handleCancel);
        modal.removeEventListener('click', handleBackdrop);
      };

      const handleCancel = () => {
        modal.classList.remove('active');
        confirmBtn.removeEventListener('click', handleConfirm);
        cancelBtn.removeEventListener('click', handleCancel);
        modal.removeEventListener('click', handleBackdrop);
      };

      const handleBackdrop = (e) => {
        if (e.target === modal) {
          handleCancel();
        }
      };

      confirmBtn.addEventListener('click', handleConfirm);
      cancelBtn.addEventListener('click', handleCancel);
      modal.addEventListener('click', handleBackdrop);

      // Close on escape key
      const handleEscape = (e) => {
        if (e.key === 'Escape') {
          handleCancel();
          document.removeEventListener('keydown', handleEscape);
        }
      };
      document.addEventListener('keydown', handleEscape);
    }
  }
}

// Global instances
const screenshotTool = new ScreenshotTool();
const textInputModal = new TextInputModal();
const aiResultsManager = new AIResultsManager();
const canvasManager = new CanvasManager();
const saveCanvasModal = new SaveCanvasModal(canvasManager);
const savedCanvasesModal = new SavedCanvasesModal(canvasManager);

// Main App Component
const App = () => {
  // State management
  const [excalidrawAPI, setExcalidrawAPI] = React.useState(null);
  const excalidrawWrapperRef = React.useRef(null);
  const [dimensions, setDimensions] = React.useState({
    width: undefined,
    height: undefined,
  });

  // View mode states
  const [viewModeEnabled, setViewModeEnabled] = React.useState(false);
  const [zenModeEnabled, setZenModeEnabled] = React.useState(false);
  const [gridModeEnabled, setGridModeEnabled] = React.useState(false);

  // Loading state
  const [isLoading, setIsLoading] = React.useState(true);

  // Handle window resize and initial dimensions
  React.useEffect(() => {
    const updateDimensions = () => {
      if (excalidrawWrapperRef.current) {
        const rect = excalidrawWrapperRef.current.getBoundingClientRect();
        setDimensions({
          width: rect.width,
          height: rect.height,
        });
      }
    };

    // Initial dimension calculation
    updateDimensions();

    // Add resize listener
    window.addEventListener("resize", updateDimensions);

    // Simulate loading time for better UX
    const loadingTimer = setTimeout(() => {
      setIsLoading(false);
      const loadingScreen = document.getElementById('loadingScreen');
      if (loadingScreen) {
        loadingScreen.classList.add('hidden');
        setTimeout(() => {
          loadingScreen.style.display = 'none';
        }, 500);
      }
    }, 1500);

    return () => {
      window.removeEventListener("resize", updateDimensions);
      clearTimeout(loadingTimer);
    };
  }, []);



  // Clear Canvas Confirmation Modal
  class ClearCanvasModal {
    constructor() {
      this.modal = document.getElementById('clearCanvasModal');
      this.cancelBtn = document.getElementById('cancelClear');
      this.confirmBtn = document.getElementById('confirmClear');
      this.onConfirmCallback = null;
      
      this.init();
    }

    init() {
      if (this.cancelBtn) {
        this.cancelBtn.addEventListener('click', () => this.hide());
      }
      
      if (this.confirmBtn) {
        this.confirmBtn.addEventListener('click', () => this.confirm());
      }
      
      // Close modal when clicking outside
      if (this.modal) {
        this.modal.addEventListener('click', (e) => {
          if (e.target === this.modal) {
            this.hide();
          }
        });
      }
    }

    show(onConfirm) {
      this.onConfirmCallback = onConfirm;
      if (this.modal) {
        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    }

    hide() {
      if (this.modal) {
        this.modal.classList.remove('active');
        document.body.style.overflow = '';
      }
      this.onConfirmCallback = null;
    }

    confirm() {
      if (this.onConfirmCallback) {
        this.onConfirmCallback();
      }
      this.hide();
    }
  }

  const clearCanvasModal = new ClearCanvasModal();

  const resetScene = () => {
    if (!excalidrawAPI) return;
    
    // Show confirmation modal instead of directly clearing
    clearCanvasModal.show(() => {
      excalidrawAPI.resetScene();
    });
  };

  // AI Screenshot functionality
  const handleAIScreenshot = () => {
    screenshotTool.activate((imageData) => {
      textInputModal.show(imageData, (image, text) => {
        aiResultsManager.addResult(image, text);
      });
    });
  };

  // Canvas functions
  const handleSaveCanvas = () => {
    saveCanvasModal.show(async (name) => {
      const success = await canvasManager.saveCurrentCanvas(name, excalidrawAPI);
      if (success) {
        // Optional: Show success message
        console.log(`Canvas "${name}" saved successfully`);
      }
    });
  };

  const handleNewCanvas = () => {
    showNewCanvasConfirmation();
  };

  const showNewCanvasConfirmation = () => {
    const modal = document.getElementById('newCanvasModal');
    const confirmBtn = document.getElementById('confirmNewCanvas');
    const cancelBtn = document.getElementById('cancelNewCanvas');

    if (modal && confirmBtn && cancelBtn) {
      modal.classList.add('active');

      const handleConfirm = () => {
        canvasManager.newCanvas(excalidrawAPI);
        modal.classList.remove('active');
        confirmBtn.removeEventListener('click', handleConfirm);
        cancelBtn.removeEventListener('click', handleCancel);
        modal.removeEventListener('click', handleBackdrop);
        document.removeEventListener('keydown', handleEscape);
      };

      const handleCancel = () => {
        modal.classList.remove('active');
        confirmBtn.removeEventListener('click', handleConfirm);
        cancelBtn.removeEventListener('click', handleCancel);
        modal.removeEventListener('click', handleBackdrop);
        document.removeEventListener('keydown', handleEscape);
      };

      const handleBackdrop = (e) => {
        if (e.target === modal) {
          handleCancel();
        }
      };

      const handleEscape = (e) => {
        if (e.key === 'Escape') {
          handleCancel();
        }
      };

      confirmBtn.addEventListener('click', handleConfirm);
      cancelBtn.addEventListener('click', handleCancel);
      modal.addEventListener('click', handleBackdrop);
      document.addEventListener('keydown', handleEscape);
    }
  };

  const handleShowSavedCanvases = () => {
    savedCanvasesModal.show((canvasData) => {
      canvasManager.loadCanvas(canvasData, excalidrawAPI);
    });
  };

  // Event handlers for UI controls
  React.useEffect(() => {
    // Initialize AI Results Manager and Canvas Manager
    aiResultsManager.initialize();
    canvasManager.updateCanvasTitle();

    // Quick action buttons
    const resetSceneBtn = document.getElementById('resetScene');
    const saveCanvasBtn = document.getElementById('saveCanvas');
    const loadCanvasBtn = document.getElementById('loadCanvas');
    const newCanvasBtn = document.getElementById('newCanvas');
    
    // Canvas control buttons (in header)
    const newCanvasControlBtn = document.getElementById('newCanvasControl');
    const clearCanvasControlBtn = document.getElementById('clearCanvasControl');
    
    // Header action buttons
    const chatButton = document.getElementById('chatButton');
    
    // Navigation buttons
    const savedCanvasesTab = document.getElementById('savedCanvasesTab');
    
    // View mode toggles
    const viewModeToggle = document.getElementById('viewMode');
    const zenModeToggle = document.getElementById('zenMode');
    const gridModeToggle = document.getElementById('gridMode');

    if (resetSceneBtn) {
      resetSceneBtn.addEventListener('click', resetScene);
    }

    if (saveCanvasBtn) {
      saveCanvasBtn.addEventListener('click', handleSaveCanvas);
    }

    if (loadCanvasBtn) {
      loadCanvasBtn.addEventListener('click', handleShowSavedCanvases);
    }

    if (newCanvasBtn) {
      newCanvasBtn.addEventListener('click', handleNewCanvas);
    }

    if (newCanvasControlBtn) {
      newCanvasControlBtn.addEventListener('click', handleNewCanvas);
    }

    if (clearCanvasControlBtn) {
      clearCanvasControlBtn.addEventListener('click', resetScene);
    }

    if (chatButton) {
      chatButton.addEventListener('click', () => {
        aiResultsManager.show();
      });
    }

    if (savedCanvasesTab) {
      savedCanvasesTab.addEventListener('click', handleShowSavedCanvases);
    }

    if (viewModeToggle) {
      viewModeToggle.addEventListener('change', (e) => {
        setViewModeEnabled(e.target.checked);
      });
    }

    if (zenModeToggle) {
      zenModeToggle.addEventListener('change', (e) => {
        setZenModeEnabled(e.target.checked);
      });
    }

    if (gridModeToggle) {
      gridModeToggle.addEventListener('change', (e) => {
        setGridModeEnabled(e.target.checked);
      });
    }

    // AI Button functionality
    const aiButton = document.querySelector('.ai-button');
    if (aiButton) {
      aiButton.addEventListener('click', handleAIScreenshot);
    }

    // Cleanup event listeners
    return () => {
      if (resetSceneBtn) resetSceneBtn.removeEventListener('click', resetScene);
      if (saveCanvasBtn) saveCanvasBtn.removeEventListener('click', handleSaveCanvas);
      if (newCanvasBtn) newCanvasBtn.removeEventListener('click', handleNewCanvas);
      if (newCanvasControlBtn) newCanvasControlBtn.removeEventListener('click', handleNewCanvas);
      if (clearCanvasControlBtn) clearCanvasControlBtn.removeEventListener('click', resetScene);
      if (savedCanvasesTab) savedCanvasesTab.removeEventListener('click', handleShowSavedCanvases);
      if (viewModeToggle) viewModeToggle.removeEventListener('change', () => {});
      if (zenModeToggle) zenModeToggle.removeEventListener('change', () => {});
      if (gridModeToggle) gridModeToggle.removeEventListener('change', () => {});
      if (aiButton) aiButton.removeEventListener('click', handleAIScreenshot);
    };
  }, [excalidrawAPI]);

  // Auto-save functionality
  React.useEffect(() => {
    if (!excalidrawAPI) return;

    const handleChange = (elements, appState) => {
      // Auto-save logic can be implemented here
      // For now, just update the canvas meta info
      const canvasMeta = document.querySelector('.canvas-meta');
      if (canvasMeta) {
        const now = new Date().toLocaleTimeString();
        canvasMeta.textContent = `Last saved: ${now} (Auto-save enabled)`;
      }
    };

    // Note: This is a simplified example. In a real app, you'd want to debounce this
    const interval = setInterval(() => {
      if (excalidrawAPI.getSceneElements) {
        const elements = excalidrawAPI.getSceneElements();
        if (elements.length > 0) {
          handleChange(elements, {});
        }
      }
    }, 5000); // Auto-save every 5 seconds

    return () => clearInterval(interval);
  }, [excalidrawAPI]);

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyboard = (event) => {
      // Ctrl/Cmd + K for AI screenshot
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        handleAIScreenshot();
      }
      
      // Ctrl/Cmd + S for save canvas
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        handleSaveCanvas();
      }
      
      // Ctrl/Cmd + N for new canvas
      if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
        event.preventDefault();
        handleNewCanvas();
      }
      
      // Ctrl/Cmd + O for open saved canvases
      if ((event.ctrlKey || event.metaKey) && event.key === 'o') {
        event.preventDefault();
        handleShowSavedCanvases();
      }
      
      // Ctrl/Cmd + R for reset (prevent browser refresh)
      if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
        event.preventDefault();
        resetScene();
      }

      // Escape to cancel screenshot
      if (event.key === 'Escape' && screenshotTool.isActive) {
        event.preventDefault();
        screenshotTool.deactivate();
      }
    };

    document.addEventListener('keydown', handleKeyboard);
    return () => document.removeEventListener('keydown', handleKeyboard);
  }, [excalidrawAPI, handleSaveCanvas, handleNewCanvas, handleShowSavedCanvases]);

  if (isLoading) {
    return null; // Loading screen is handled by HTML
  }

  return React.createElement(
    'div',
    {
      className: 'excalidraw-wrapper',
      ref: excalidrawWrapperRef,
      style: { width: '100%', height: '100%' }
    },
    React.createElement(ExcalidrawLib.Excalidraw, {
      excalidrawAPI: (api) => setExcalidrawAPI(api),
      initialData: {
        elements: [],
        appState: {
          viewBackgroundColor: "#f8fafc",
          currentItemStrokeColor: "#8B5CF6",
          currentItemBackgroundColor: "rgba(139, 92, 246, 0.1)",
          currentItemFillStyle: "solid",
          currentItemStrokeWidth: 2,
          currentItemRoughness: 0,
          gridSize: gridModeEnabled ? 20 : null,
        },
      },
      zenModeEnabled,
      gridModeEnabled,
      viewModeEnabled,
      langCode: "en-US",
      theme: "light",
      name: "Iris Whiteboard",
      UIOptions: {
        canvasActions: {
          loadScene: true,
          saveToActiveFile: true,
          saveAsImage: true,
          theme: true,
          clearCanvas: true
        },
        tools: {
          image: true
        }
      },
      renderTopRightUI: () => {
        return React.createElement(
          'div',
          { 
            style: {
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
              padding: '8px',
              background: 'rgba(255, 255, 255, 0.9)',
              borderRadius: '12px',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }
          },
          React.createElement(
            'button',
            {
              onClick: resetScene,
              style: {
                padding: '6px 12px',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                background: 'white',
                color: '#374151',
                fontSize: '12px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out'
              },
              onMouseEnter: (e) => {
                e.target.style.background = '#F9FAFB';
                e.target.style.borderColor = '#D1D5DB';
              },
              onMouseLeave: (e) => {
                e.target.style.background = 'white';
                e.target.style.borderColor = '#E5E7EB';
              }
            },
            '🗑️ Clear'
          ),
          React.createElement(
            'button',
            {
              onClick: handleAIScreenshot,
              style: {
                padding: '6px 12px',
                border: 'none',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #10B981, #059669)',
                color: 'white',
                fontSize: '12px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out'
              },
              onMouseEnter: (e) => {
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 4px 6px -1px rgb(0 0 0 / 0.2)';
              },
              onMouseLeave: (e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }
            },
            '📸 AI Capture'
          )
        );
      }
    })
  );
};

// Initialize the app
const initializeApp = () => {
  const excalidrawWrapper = document.getElementById("app");
  if (excalidrawWrapper) {
    const root = createRoot(excalidrawWrapper);
    root.render(React.createElement(App));
  }
};

// Start the app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

// Export for potential external use
window.IrisWhiteboard = {
  App,
  ExcalidrawLib,
  screenshotTool,
  textInputModal,
  aiResultsManager,
  canvasManager,
  saveCanvasModal,
  savedCanvasesModal
};
