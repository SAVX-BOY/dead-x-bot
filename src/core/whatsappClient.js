const { Client, LocalAuth } = require('whatsapp-web.js');
const SessionManager = require('../services/sessionManager');

let client = null;

async function initializeWhatsApp() {
  try {
    console.log('\n╔═══════════════════════════════════════╗');
    console.log('║   🔄 Initializing WhatsApp Client    ║');
    console.log('╚═══════════════════════════════════════╝\n');

    // Validate required environment variables
    if (!process.env.SCANNER_URL) {
      throw new Error('SCANNER_URL environment variable is not set');
    }
    if (!process.env.SESSION_ID) {
      throw new Error('SESSION_ID environment variable is not set');
    }

    console.log('📋 Configuration:');
    console.log('   Scanner URL:', process.env.SCANNER_URL);
    console.log('   Session ID:', process.env.SESSION_ID);
    console.log('');

    // 1. Initialize session manager
    const sessionManager = new SessionManager(
      process.env.SCANNER_URL,
      process.env.SESSION_ID
    );

    // 2. Restore session from scanner (CRITICAL STEP - This was missing!)
    console.log('⏳ Restoring session from scanner...');
    await sessionManager.initialize();

    // 3. Create WhatsApp client with LocalAuth
    console.log('⏳ Creating WhatsApp client instance...');
    client = new Client({
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
          '--single-process',
          '--disable-gpu'
        ]
      },
      webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html'
      }
    });

    // 4. Set up event listeners
    client.on('qr', (qr) => {
      console.log('\n⚠️  QR Code generated - Session may have expired!');
      console.log('📱 Please rescan QR code using the scanner');
      console.log('🔗 Scanner URL:', process.env.SCANNER_URL);
      console.log('');
    });

    client.on('authenticated', () => {
      console.log('✅ WhatsApp client authenticated successfully');
    });

    client.on('auth_failure', (msg) => {
      console.error('\n❌ Authentication failed:', msg);
      console.log('🔄 Please generate a new session using the scanner');
      console.log('🔗 Scanner URL:', process.env.SCANNER_URL);
      console.log('');
    });

    client.on('ready', () => {
      console.log('\n╔═══════════════════════════════════════╗');
      console.log('║   ✅ Bot is Online and Ready!        ║');
      console.log('╚═══════════════════════════════════════╝\n');
      console.log('📱 Phone Number:', client.info.wid.user);
      console.log('👤 Push Name:', client.info.pushname);
      console.log('📦 Platform:', client.info.platform);
      console.log('🔋 Battery Level:', client.info.battery + '%');
      console.log('🔌 Plugged:', client.info.plugged ? 'Yes' : 'No');
      console.log('📍 Locale:', client.info.locales);
      console.log('');
      console.log('🎉 Bot is ready to receive messages!');
      console.log('💬 Try sending: !ping');
      console.log('');
    });

    client.on('disconnected', async (reason) => {
      console.error('\n❌ Client disconnected:', reason);
      console.log('🔄 Attempting to reconnect...');
      
      // Delete local session and reinitialize
      await sessionManager.deleteLocal();
      
      setTimeout(async () => {
        try {
          await client.initialize();
        } catch (error) {
          console.error('❌ Reconnection failed:', error.message);
        }
      }, 5000);
    });

    client.on('loading_screen', (percent, message) => {
      console.log(`⏳ Loading: ${percent}% - ${message}`);
    });

    client.on('change_state', (state) => {
      console.log('🔄 Connection state changed:', state);
    });

    // 5. Initialize the client
    console.log('🚀 Starting WhatsApp client connection...\n');
    await client.initialize();

    // 6. Set timeout for initialization
    const initTimeout = setTimeout(() => {
      if (!client.info) {
        console.error('\n❌ Client initialization timeout (60 seconds)');
        console.log('');
        console.log('ℹ️  Possible issues:');
        console.log('   1. Session expired - rescan QR code');
        console.log('   2. Network connectivity issues');
        console.log('   3. WhatsApp servers temporarily down');
        console.log('   4. Session data corrupted');
        console.log('');
        console.log('🔧 Solutions:');
        console.log('   - Generate new session at:', process.env.SCANNER_URL);
        console.log('   - Check network connectivity');
        console.log('   - Wait a few minutes and redeploy');
        console.log('');
        process.exit(1);
      }
    }, 60000);

    // Clear timeout once ready
    client.once('ready', () => {
      clearTimeout(initTimeout);
    });

    return client;

  } catch (error) {
    console.error('\n❌ Failed to initialize WhatsApp client');
    console.error('Error:', error.message);
    console.error('');
    console.error('🔧 Troubleshooting:');
    console.error('   1. Verify SCANNER_URL is correct');
    console.error('   2. Verify SESSION_ID is valid');
    console.error('   3. Check scanner is deployed and running');
    console.error('   4. Generate fresh session if needed');
    console.error('');
    throw error;
  }
}

function getClient() {
  return client;
}

module.exports = { 
  initializeWhatsApp,
  getClient
};
