// services/geminiService.js
const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../utils/logger');

class GeminiService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Use environment variable for model, fallback to gemini-2.0-flash if not set
    this.modelName = process.env.GEMINI_MODEL || "gemini-2.0-flash";
    this.model = this.genAI.getGenerativeModel({ model: this.modelName });
    this.chatModel = this.genAI.getGenerativeModel({ model: this.modelName });
  }

  async generateResponse(messages, userId) {
    try {
      // Convert message history to Gemini format
      const chatHistory = this.formatChatHistory(messages);
      
      // Get the latest user message
      const userMessage = messages[messages.length - 1];
      
      if (userMessage.role !== 'user') {
        throw new Error('Last message must be from user');
      }

      // Start chat with history
      const chat = this.chatModel.startChat({
        history: chatHistory.slice(0, -1), // Exclude the last message
        generationConfig: {
          maxOutputTokens: 2048,
          temperature: 0.7,
          topP: 0.8,
          topK: 40,
        },
      });

      // Send the current message
      const result = await chat.sendMessage(userMessage.content);
      const response = result.response;
      const text = response.text();

      // Calculate tokens (approximate)
      const tokens = this.estimateTokens(text);

      logger.info(`Gemini API call successful for user ${userId}`, {
        userId,
        responseLength: text.length,
        estimatedTokens: tokens
      });

      return {
        content: text,
        tokens,
        metadata: {
          model: this.modelName,
          timestamp: new Date(),
          finishReason: 'stop'
        }
      };

    } catch (error) {
      logger.error('Gemini API error', { 
        userId, 
        error: error.message,
        stack: error.stack 
      });
      
      // Return fallback response
      return {
        content: "I apologize, but I'm having trouble processing your request right now. Please try again in a moment.",
        tokens: 0,
        metadata: {
          model: 'fallback',
          error: true,
          timestamp: new Date()
        }
      };
    }
  }

  formatChatHistory(messages) {
    return messages.map(msg => {
      // Skip system messages for Gemini
      if (msg.role === 'system') return null;
      
      return {
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      };
    }).filter(msg => msg !== null);
  }

  estimateTokens(text) {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  async generateTitle(messages) {
    try {
      const userMessages = messages
        .filter(m => m.role === 'user')
        .slice(0, 3)
        .map(m => m.content)
        .join(' ');

      const prompt = `Generate a short, descriptive title (max 6 words) for a chat conversation that starts with: "${userMessages.substring(0, 200)}"`;

      const result = await this.model.generateContent(prompt);
      const response = result.response;
      return response.text().trim().replace(/"/g, '');
    } catch (error) {
      logger.error('Title generation error', { error: error.message });
      return 'New Chat';
    }
  }
}

module.exports = new GeminiService();