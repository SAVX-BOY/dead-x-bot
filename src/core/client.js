const { Client, LocalAuth } = require('whatsapp-web.js');
const SessionManager = require('../services/sessionManager');

async function initializeWhatsApp() {
  try {
    console.log('\n╔═══════════════════════════════════════╗');
    console.log('║   🔄 Initializing WhatsApp Client    ║');
    console.log('╚═══════════════════════════════════════╝\n');

    // 1. Initialize session manager
    const sessionManager = new SessionManager(
      process.env.SCANNER_URL,
      process.env.SESSION_ID
    );

    // 2. Restore session from scanner (CRITICAL STEP)
    await sessionManager.initialize();

    // 3. Create WhatsApp client with LocalAuth
    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: process.env.SESSION_ID,
        dataPath: './.wwebjs_auth'
      }),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      }
    });

    // 4. Set up event listeners
    client.on('qr', (qr) => {
      console.log('⚠️ QR Code generated - session may have expired');
      console.log('🔄 Please rescan using the scanner');
    });

    client.on('authenticated', () => {
      console.log('✅ WhatsApp client authenticated');
    });

    client.on('auth_failure', (msg) => {
      console.error('❌ Authentication failed:', msg);
      console.log('🔄 Please generate a new session using the scanner');
    });

    client.on('ready', () => {
      console.log('\n╔═══════════════════════════════════════╗');
      console.log('║   ✅ Bot is Online and Ready!        ║');
      console.log('╚═══════════════════════════════════════╝\n');
      console.log('📱 Phone:', client.info.wid.user);
      console.log('📦 Platform:', client.info.platform);
      console.log('🔋 Battery:', client.info.battery + '%');
    });

    client.on('disconnected', (reason) => {
      console.error('❌ Client disconnected:', reason);
      console.log('🔄 Attempting to reconnect...');
      // Delete local session and reinitialize
      sessionManager.deleteLocal().then(() => {
        client.initialize();
      });
    });

    client.on('loading_screen', (percent, message) => {
      console.log('⏳ Loading:', percent + '%', message);
    });

    // 5. Initialize the client
    console.log('🚀 Starting WhatsApp client...');
    await client.initialize();

    // 6. Set timeout for initialization
    const initTimeout = setTimeout(() => {
      if (!client.info) {
        console.error('❌ Client initialization timeout (60s)');
        console.log('ℹ️ Possible issues:');
        console.log('   - Session expired (rescan QR code)');
        console.log('   - Network issues');
        console.log('   - WhatsApp servers down');
        process.exit(1);
      }
    }, 60000);

    // Clear timeout once ready
    client.once('ready', () => clearTimeout(initTimeout));

    return client;

  } catch (error) {
    console.error('❌ Failed to initialize WhatsApp client:', error);
    throw error;
  }
}

module.exports = { initializeWhatsApp };
