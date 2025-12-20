// src/handlers/messageHandler.js

const MenuHandler = require('./menuHandler');
const functionService = require('../services/functionService');
const settingsService = require('../services/settingsService');
const rateLimitService = require('../services/rateLimitService');

class MessageHandler {
  constructor(client, config) {
    this.client = client;
    this.config = config;
    this.menuHandler = new MenuHandler();
    this.prefix = config.prefix;
  }

  async handleMessage(msg) {
    try {
      // Skip if message is from bot itself (unless self mode)
      if (msg.fromMe && !this.config.selfMode) return;

      // Skip if no body
      if (!msg.body) return;

      // Load user/group settings
      const settings = await settingsService.getSettings(msg.from);

      // ============================================
      // INSTANT AUTOMATIONS (Before command processing)
      // ============================================

      // 1. AUTO-TYPING (for commands only)
      if (settings.autotyping && msg.body.startsWith(this.prefix)) {
        await this.sendTyping(msg);
      }

      // 2. AUTO-RECORDING (for voice/media commands)
      if (settings.autorecording && msg.hasMedia && msg.body.startsWith(this.prefix)) {
        await this.sendRecording(msg);
      }

      // 3. ANTI-LINK CHECK
      if (settings.antilink && this.containsLink(msg.body)) {
        if (!msg.fromMe && msg.from.includes('@g.us')) {
          try {
            await msg.delete(true);
            await msg.reply('❌ Links are not allowed in this group!');
            await this.clearState(msg, settings);
            return;
          } catch (error) {
            console.error('Failed to delete link:', error.message);
          }
        }
      }

      // 4. ANTI-BOT CHECK (detect other bots in groups)
      if (settings.antibot && msg.from.includes('@g.us') && msg.author) {
        if (msg.author.includes('@lid')) {
          try {
            await msg.getChat().then(chat => chat.removeParticipant(msg.author));
            await msg.reply('🤖 Bot detected and removed!');
            return;
          } catch (error) {
            console.error('Failed to remove bot:', error.message);
          }
        }
      }

      // 5. BANNED WORDS CHECK
      if (settings.bannedWords && settings.bannedWords.length > 0) {
        const hasBannedWord = settings.bannedWords.some(word => 
          msg.body.toLowerCase().includes(word.toLowerCase())
        );
        if (hasBannedWord && !msg.fromMe) {
          try {
            await msg.delete(true);
            await msg.reply('⚠️ Your message contains banned words!');
            await this.clearState(msg, settings);
            return;
          } catch (error) {
            console.error('Failed to delete banned word:', error.message);
          }
        }
      }

      // 6. AUTO-RESPOND
      if (settings.autorespond && settings.autoRespondTriggers) {
        const response = this.checkAutoRespond(msg.body, settings.autoRespondTriggers);
        if (response) {
          await msg.reply(response);
          await this.clearState(msg, settings);
          return;
        }
      }

      // ============================================
      // COMMAND PROCESSING
      // ============================================

      if (!msg.body.startsWith(this.prefix)) {
        await this.clearState(msg, settings);
        return;
      }

      // Parse command
      const args = msg.body.slice(this.prefix.length).trim().split(/ +/);
      const command = args.shift().toLowerCase();

      // Check rate limit
      if (this.config.rateLimit.enabled) {
        const limited = await rateLimitService.checkLimit(msg.from);
        if (limited) {
          await msg.reply(this.config.rateLimit.message);
          await this.clearState(msg, settings);
          return;
        }
      }

      // Check permissions for owner-only commands
      if (this.isOwnerOnly(command) && !this.isOwner(msg)) {
        await msg.reply('❌ This command is owner-only!');
        await this.clearState(msg, settings);
        return;
      }

      // Log command
      console.log(`📝 Command: ${command} | From: ${msg.from} | Args: ${args.join(' ')}`);

      // Handle menu commands
      if (this.isMenuCommand(command)) {
        await this.handleMenuCommand(msg, command);
        await this.clearState(msg, settings);
        return;
      }

      // ============================================
      // EXECUTE FUNCTION FROM NETHUNTER-FX
      // ============================================

      try {
        const result = await functionService.executeFunction(command, args, msg, settings);

        // Stop typing/recording
        await this.clearState(msg, settings);

        // Send response
        if (result.success) {
          if (result.media) {
            await this.sendMediaResponse(msg, result);
          } else if (result.message) {
            await msg.reply(result.message);
          }
        } else {
          await msg.reply(`❌ ${result.error || 'Command failed'}`);
        }

      } catch (error) {
        console.error(`❌ Error executing ${command}:`, error.message);
        
        await this.clearState(msg, settings);
        
        await msg.reply(`❌ Error: ${error.message}`);
      }

    } catch (error) {
      console.error('💥 Message handler error:', error);
    }
  }

  // Send typing indicator
  async sendTyping(msg) {
    try {
      const chat = await msg.getChat();
      await chat.sendStateTyping();
    } catch (error) {
      // Silent fail
    }
  }

  // Send recording indicator
  async sendRecording(msg) {
    try {
      const chat = await msg.getChat();
      await chat.sendStateRecording();
    } catch (error) {
      // Silent fail
    }
  }

  // Clear state (stop typing/recording)
  async clearState(msg, settings) {
    if (settings.autotyping || settings.autorecording) {
      try {
        const chat = await msg.getChat();
        await chat.clearState();
      } catch (error) {
        // Silent fail
      }
    }
  }

  // Check if command is a menu command
  isMenuCommand(cmd) {
    const menuCommands = [
      'menu', 'help',
      'godmenu', 'generalmenu', 'aimenu',
      'groupmenu', 'downloadmenu', 'funmenu',
      'toolsmenu', 'settingsmenu'
    ];
    return menuCommands.includes(cmd);
  }

  // Handle menu commands
  async handleMenuCommand(msg, cmd) {
    const menuMap = {
      'menu': 'main',
      'help': 'main',
      'godmenu': 'god',
      'generalmenu': 'general',
      'aimenu': 'ai',
      'groupmenu': 'group',
      'downloadmenu': 'download',
      'funmenu': 'fun',
      'toolsmenu': 'tools',
      'settingsmenu': 'settings'
    };

    const menuType = menuMap[cmd] || 'main';
    await this.menuHandler.sendMenu(msg, menuType);
  }

  // Check for links in message
  containsLink(text) {
    const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|\w+\.(com|net|org|io|co|app|gg|xyz|me|tv|cc)[^\s]*)/gi;
    return urlRegex.test(text);
  }

  // Check auto-respond triggers
  checkAutoRespond(text, triggers) {
    if (!triggers || typeof triggers !== 'object') return null;
    
    const lowerText = text.toLowerCase().trim();
    
    // Convert Map to Object if needed
    const triggerObj = triggers instanceof Map ? Object.fromEntries(triggers) : triggers;
    
    for (const [trigger, response] of Object.entries(triggerObj)) {
      if (lowerText === trigger.toLowerCase() || lowerText.includes(trigger.toLowerCase())) {
        return response;
      }
    }
    
    return null;
  }

  // Send media response
  async sendMediaResponse(msg, result) {
    const { MessageMedia } = require('whatsapp-web.js');
    const axios = require('axios');
    
    try {
      if (result.mediaUrl) {
        // Download from URL
        const response = await axios.get(result.mediaUrl, { 
          responseType: 'arraybuffer',
          timeout: 30000
        });
        
        const media = new MessageMedia(
          result.mediaType || 'image/jpeg',
          Buffer.from(response.data).toString('base64'),
          result.filename || 'media'
        );
        
        await msg.reply(media, undefined, { 
          caption: result.caption || result.message || '' 
        });
        
      } else if (result.mediaBase64) {
        // Direct base64
        const media = new MessageMedia(
          result.mediaType || 'image/jpeg',
          result.mediaBase64,
          result.filename || 'media'
        );
        
        await msg.reply(media, undefined, { 
          caption: result.caption || result.message || '' 
        });
      }
    } catch (error) {
      console.error('❌ Error sending media:', error.message);
      await msg.reply(`✅ ${result.message}\n\n❌ Failed to send media: ${error.message}`);
    }
  }

  // Check if user is owner
  isOwner(msg) {
    const sender = msg.author || msg.from;
    return sender === this.config.owner || this.config.mods.includes(sender);
  }

  // Owner-only commands
  isOwnerOnly(command) {
    const ownerCommands = ['broadcast', 'ban', 'unban', 'eval', 'exec'];
    return ownerCommands.includes(command);
  }
}

module.exports = MessageHandler;
