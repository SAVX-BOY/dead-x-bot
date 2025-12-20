// src/services/functionService.js

const axios = require('axios');
const config = require('../config/menu.config');

class FunctionService {
  constructor() {
    this.apiUrl = config.apiUrl;
    this.apiKey = config.apiKey;
    this.timeout = config.apiTimeout;
  }

  async executeFunction(command, args, msg, settings) {
    try {
      // Build context for the function
      const context = await this.buildContext(msg, settings);

      // Make API call to Nethunter-fx
      const response = await axios.post(
        `${this.apiUrl}/execute`,
        {
          function: command,
          args: args,
          context: context
        },
        {
          headers: {
            'Content-Type': 'application/json',
            ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
          },
          timeout: this.timeout
        }
      );

      return response.data;

    } catch (error) {
      console.error(`Function execution error (${command}):`, error.message);
      
      if (error.response) {
        // API returned an error
        return {
          success: false,
          error: error.response.data.error || error.response.data.message || 'Function execution failed'
        };
      } else if (error.code === 'ECONNABORTED') {
        // Timeout
        return {
          success: false,
          error: 'Request timeout. Function took too long to execute.'
        };
      } else if (error.code === 'ECONNREFUSED') {
        // Connection refused
        return {
          success: false,
          error: 'Cannot connect to Nethunter-fx API. Please check if the service is running.'
        };
      }
      
      return {
        success: false,
        error: error.message || 'Unknown error occurred'
      };
    }
  }

  async buildContext(msg, settings) {
    const context = {
      // User info
      from: msg.from,
      author: msg.author || msg.from,
      sender: msg.author || msg.from,
      
      // Chat info
      isGroup: msg.from.includes('@g.us'),
      groupId: msg.from.includes('@g.us') ? msg.from : null,
      chatId: msg.from,
      
      // Message info
      messageId: msg.id._serialized,
      timestamp: msg.timestamp,
      hasMedia: msg.hasMedia,
      hasQuoted: msg.hasQuotedMsg,
      isForwarded: msg.isForwarded,
      
      // Permissions
      isOwner: await this.checkOwner(msg),
      isAdmin: await this.checkAdmin(msg),
      botIsAdmin: await this.checkBotAdmin(msg),
      
      // Settings
      settings: settings
    };

    // Add quoted message if exists
    if (msg.hasQuotedMsg) {
      try {
        const quoted = await msg.getQuotedMessage();
        context.quoted = {
          body: quoted.body,
          from: quoted.from,
          hasMedia: quoted.hasMedia
        };
      } catch (error) {
        // Ignore if can't get quoted message
      }
    }

    // Add contact info
    try {
      const contact = await msg.getContact();
      context.contact = {
        name: contact.pushname || contact.name,
        number: contact.number,
        isMyContact: contact.isMyContact
      };
    } catch (error) {
      // Ignore if can't get contact
    }

    // Add group metadata if group chat
    if (context.isGroup) {
      try {
        const chat = await msg.getChat();
        context.group = {
          name: chat.name,
          description: chat.description,
          participantsCount: chat.participants.length
        };
      } catch (error) {
        // Ignore if can't get group info
      }
    }

    return context;
  }

  async checkOwner(msg) {
    const sender = msg.author || msg.from;
    return sender === config.owner || config.mods.includes(sender);
  }

  async checkAdmin(msg) {
    if (!msg.from.includes('@g.us')) return false;
    
    try {
      const chat = await msg.getChat();
      const participant = chat.participants.find(p => 
        p.id._serialized === (msg.author || msg.from)
      );
      return participant ? (participant.isAdmin || participant.isSuperAdmin) : false;
    } catch (error) {
      return false;
    }
  }

  async checkBotAdmin(msg) {
    if (!msg.from.includes('@g.us')) return false;
    
    try {
      const chat = await msg.getChat();
      const botId = msg.to || chat.id._serialized;
      const botParticipant = chat.participants.find(p => 
        p.id._serialized === botId
      );
      return botParticipant ? (botParticipant.isAdmin || botParticipant.isSuperAdmin) : false;
    } catch (error) {
      return false;
    }
  }
}

module.exports = new FunctionService();
