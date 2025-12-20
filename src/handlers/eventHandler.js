// src/handlers/eventHandler.js

const qrcode = require('qrcode-terminal');
const config = require('../config/menu.config');

class EventHandler {
  constructor(client) {
    this.client = client;
    this.alwaysOnlineInterval = null;
  }

  setupEvents() {
    // QR Code event
    this.client.on('qr', (qr) => {
      console.log('📱 QR Code received! Scan with WhatsApp:');
      qrcode.generate(qr, { small: true });
      console.log('\n⚠️  If you have a session ID, make sure SESSION_ID is set in .env');
    });

    // Authenticated event
    this.client.on('authenticated', () => {
      console.log('✅ Authentication successful!');
    });

    // Ready event
    this.client.on('ready', () => {
      const info = this.client.info;
      console.log(`
╔═══════════════════════════════════════╗
║   💀 DEAD-X-BOT IS READY!            ║
║                                       ║
║   Phone: ${info.wid.user}            
║   Platform: ${info.platform}         
║   Developer: ${config.developer}     
║                                       ║
║   Status: ✅ Online                  ║
╚═══════════════════════════════════════╝
      `);
      
      // Set always online if enabled
      if (config.features.alwaysOnline) {
        this.setupAlwaysOnline();
      }
    });

    // Auth failure event
    this.client.on('auth_failure', (msg) => {
      console.error('❌ Authentication failed:', msg);
      console.error('💡 Tip: Delete .wwebjs_auth folder and scan QR code again');
    });

    // Disconnected event
    this.client.on('disconnected', (reason) => {
      console.log('⚠️  Bot disconnected:', reason);
      if (this.alwaysOnlineInterval) {
        clearInterval(this.alwaysOnlineInterval);
        this.alwaysOnlineInterval = null;
      }
    });

    // Loading screen
    this.client.on('loading_screen', (percent, message) => {
      if (percent < 100) {
        console.log(`⏳ Loading: ${percent}% - ${message}`);
      }
    });

    // Message create (for logging)
    this.client.on('message_create', async (msg) => {
      if (msg.fromMe && config.logLevel === 'debug') {
        console.log(`📤 Sent: ${msg.body.substring(0, 50)}...`);
      }
    });

    // Group join
    this.client.on('group_join', async (notification) => {
      console.log(`👥 Bot added to group: ${notification.chatId}`);
    });

    // Group leave
    this.client.on('group_leave', async (notification) => {
      console.log(`👋 Bot removed from group: ${notification.chatId}`);
    });
  }

  setupAlwaysOnline() {
    console.log('🟢 Always Online mode activated');
    
    // Send presence immediately
    this.sendPresence();
    
    // Then every 30 seconds
    this.alwaysOnlineInterval = setInterval(() => {
      this.sendPresence();
    }, 30000);
  }

  async sendPresence() {
    try {
      await this.client.sendPresenceAvailable();
    } catch (error) {
      if (config.logLevel === 'debug') {
        console.error('Error sending presence:', error.message);
      }
    }
  }
}

module.exports = EventHandler;
