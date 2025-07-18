// Gemini AI Service for Iris Whiteboard
// Integrates with Google's Gemini API using gemini-2.0-flash for image and text analysis

class GeminiService {
  constructor() {
    // Get API key from config file (config.js must be loaded first)
    this.apiKey = window.CONFIG?.GEMINI_API_KEY || null;
    this.baseURL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
    
    if (!this.apiKey) {
      console.error('Gemini API key not found. Please ensure config.js is loaded and contains GEMINI_API_KEY.');
    }
  }

  // Create text-only completion
  async createTextCompletion(userMessage, conversationHistory = []) {
    if (!this.apiKey) {
      throw new Error('Gemini API key not configured. Please check your config.js file.');
    }

    const systemPrompt = `You are an AI assistant for Iris Whiteboard, a digital drawing and diagramming tool. You help users analyze their canvas drawings, provide design feedback, suggest improvements, and answer questions about visual design, workflows, diagrams, and creative processes. Be helpful, encouraging, and provide actionable advice. Keep responses conversational and focused on visual design and creativity.

FORMATTING GUIDELINES FOR LONG OUTPUTS:
1. **Use Emojis & Visual Structure**: Start major sections with emojis (🧩, 💡, 🔄) and use headings (##, ###) to divide content
2. **Add Visual Breaks**: Use horizontal rules (---) between major sections for clear separation
3. **Proper Spacing**: Always add empty lines between different ideas and content blocks
4. **Structured Lists**: Use bullet points (-) with sub-bullets for nested information, numbered lists for sequences
5. **Code & Math**: Use \`\`\`language for code (never for math), $formula$ for inline math, $$formula$$ for display math
6. **Clean Hierarchy**: Break content into digestible chunks:
   - ## Major Section (with emoji)
   - ### Subsection
   - **Bold items** with descriptions
   - Regular text with proper spacing
7. **Horizontal Separators**: Use --- between major sections to create visual breaks
8. **Engagement Footer**: End with "## 🔄 Next Steps" or similar with actionable suggestions

Example structure:
## 🧩 Analysis
[Content with spacing]

### 📦 Main Element
- **Item 1**: Description
- **Item 2**: Description

---

## 💡 Suggestions
[Content with spacing]

---

## 🔄 Next Steps
[Questions/suggestions]

Always use proper spacing with empty lines between sections, lists, and different content types.`;

    // Build conversation context
    const parts = [];
    
    // Add system context
    parts.push({ text: systemPrompt });
    
    // Add conversation history
    conversationHistory.forEach(msg => {
      if (msg.role === 'user') {
        parts.push({ text: `User: ${msg.content}` });
      } else if (msg.role === 'assistant') {
        parts.push({ text: `Assistant: ${msg.content}` });
      }
    });
    
    // Add current user message
    parts.push({ text: `User: ${userMessage}` });

    const requestBody = {
      contents: [{
        parts: parts
      }]
    };

    try {
      const response = await fetch(`${this.baseURL}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error?.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || 'I apologize, but I couldn\'t generate a response. Please try again.';
    } catch (error) {
      console.error('Gemini Text API Error:', error);
      throw this.handleApiError(error);
    }
  }

  // Create vision completion for image + text analysis
  async createVisionCompletion(userMessage, imageDataUrl, conversationHistory = []) {
    if (!this.apiKey) {
      throw new Error('Gemini API key not configured. Please check your config.js file.');
    }

    const systemPrompt = `You are an AI assistant for Iris Whiteboard, a digital drawing and diagramming tool. You help users analyze their canvas drawings, provide design feedback, suggest improvements, and answer questions about visual design, workflows, diagrams, and creative processes. When analyzing images, focus on:
    
    1. Visual structure and layout
    2. Design principles (balance, hierarchy, flow)
    3. Content organization and clarity
    4. Suggestions for improvement
    5. Recognition of diagram types (flowcharts, mind maps, wireframes, etc.)
    
    Be specific about what you see and provide actionable feedback. Keep responses helpful and encouraging.

FORMATTING GUIDELINES FOR LONG OUTPUTS:
1. **Use Emojis & Visual Structure**: Start major sections with emojis (🧩, 💡, 🔄) and use headings (##, ###) to divide content
2. **Add Visual Breaks**: Use horizontal rules (---) between major sections for clear separation
3. **Proper Spacing**: Always add empty lines between different ideas and content blocks
4. **Structured Lists**: Use bullet points (-) with sub-bullets for nested information, numbered lists for sequences
5. **Code & Math**: Use \`\`\`language for code (never for math), $formula$ for inline math, $$formula$$ for display math
6. **Clean Hierarchy**: Break content into digestible chunks:
   - ## Major Section (with emoji)
   - ### Subsection
   - **Bold items** with descriptions
   - Regular text with proper spacing
7. **Horizontal Separators**: Use --- between major sections to create visual breaks
8. **Engagement Footer**: End with "## 🔄 Next Steps" or similar with actionable suggestions

Example structure:
## 🧩 Analysis
[Content with spacing]

### 📦 Main Element
- **Item 1**: Description
- **Item 2**: Description

---

## 💡 Suggestions
[Content with spacing]

---

## 🔄 Next Steps
[Questions/suggestions]

Always use proper spacing with empty lines between sections, lists, and different content types.`;

    // Convert data URL to base64 (remove data:image/png;base64, prefix)
    const base64Image = imageDataUrl.split(',')[1];
    const mimeType = imageDataUrl.split(';')[0].split(':')[1];

    const parts = [];
    
    // Add system context
    parts.push({ text: systemPrompt });
    
    // Add conversation history
    conversationHistory.forEach(msg => {
      if (msg.role === 'user') {
        parts.push({ text: `User: ${msg.content}` });
      } else if (msg.role === 'assistant') {
        parts.push({ text: `Assistant: ${msg.content}` });
      }
    });
    
    // Add current user message with image
    parts.push({ text: `User: ${userMessage}` });
    parts.push({
      inline_data: {
        mime_type: mimeType,
        data: base64Image
      }
    });

    const requestBody = {
      contents: [{
        parts: parts
      }]
    };

    try {
      const response = await fetch(`${this.baseURL}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error?.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || 'I apologize, but I couldn\'t analyze the image. Please try again.';
    } catch (error) {
      console.error('Gemini Vision API Error:', error);
      throw this.handleApiError(error);
    }
  }

  // Format conversation history for context
  formatConversationHistory(messages) {
    return messages.map(msg => ({
      role: msg.type === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));
  }

  // Handle API errors with fallback responses
  handleApiError(error) {
    const fallbackResponses = [
      "I'm having trouble connecting to AI services right now. Your diagram looks interesting though! Could you tell me more about what you're working on?",
      "There seems to be a temporary issue with the AI service. In the meantime, I'd love to help if you can describe what specific feedback you're looking for.",
      "I'm experiencing some technical difficulties. While I work on that, feel free to ask me any specific questions about design principles or visual organization."
    ];
    
    const fallback = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    console.warn('Using fallback response due to API error:', error.message);
    return fallback;
  }
}

// Create global instance
window.GeminiService = new GeminiService();
