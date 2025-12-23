const { Client, NoAuth } = require('whatsapp-web.js');
const SessionManager = require('../services/sessionManager');
const fs = require('fs');
const path = require('path');

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

    // 2. Fetch session from scanner
    console.log('⏳ Fetching session from scanner...');
    const sessionData = await sessionManager.fetchFromScanner();
    
    if (!sessionData || sessionData.status !== 'active') {
      throw new Error('Session is not active. Please scan QR code again.');
    }

    console.log('✅ Active session found!');
    console.log('');

    // 3. Check if session has authentication data
    if (!sessionData.data || !sessionData.data.WABrowserId) {
      console.log('⚠️  Session exists but has no authentication data');
      console.log('🔄 You need to scan QR code using the scanner first');
      console.log('🔗 Go to:', process.env.SCANNER_URL);
      throw new Error('No authentication data in session');
    }

    // 4. Set up authentication directory
    const authPath = path.join(process.cwd(), '.wwebjs_auth', `session-${process.env.SESSION_ID}`);
    
    // Create directory structure that whatsapp-web.js expects
    console.log('💾 Setting up authentication directory...');
    const defaultPath = path.join(authPath, 'Default');
    fs.mkdirSync(defaultPath, { recursive: true });

    // Write session data in the format whatsapp-web.js expects
    const sessionString = JSON.stringify(sessionData.data);
    
    // Write to multiple locations for compatibility
    fs.writeFileSync(path.join(authPath, 'session.json'), sessionString);
    fs.writeFileSync(path.join(defaultPath, 'session.json'), sessionString);

    console.log('✅ Authentication files prepared');
    console.log('');

    // 5. Create WhatsApp client with the session data injected
    console.log('⏳ Creating WhatsApp client instance...');
    
    // Use a custom auth strategy that loads our session
    const { LocalAuth } = require('whatsapp-web.js');
    
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
          '--disable-gpu',
          '--disable-extensions',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding'
        ],
        timeout: 0
      },
      webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html'
      }
    });

    // 6. Inject session before initialization
    client.on('qr', async (qr) => {
      console.log('\n⚠️  QR Code generated!');
      console.log('');
      console.log('This means the session from scanner is not working.');
      console.log('Possible reasons:');
      console.log('  1. Session has expired (older than 7 days)');
      console.log('  2. You logged out from this device in WhatsApp');
      console.log('  3. Session data is corrupted');
      console.log('');
      console.log('🔧 SOLUTION:');
      console.log('  1. Go to scanner:', process.env.SCANNER_URL);
      console.log('  2. Start a new scan');
      console.log('  3. Get the new SESSION_ID');
      console.log('  4. Update SESSION_ID in Render environment variables');
      console.log('  5. Redeploy the bot');
      console.log('');
      
      // Try to update session in scanner with new QR
      // This won't work automatically but logs for debugging
    });

    client.on('authenticated', async (session) => {
      console.log('✅ WhatsApp client authenticated successfully');
      
      // Update scanner with fresh session data
      try {
        console.log('📤 Updating session in scanner...');
        await sessionManager.updateSession(session);
        console.log('✅ Session updated in scanner');
      } catch (error) {
        console.error('⚠️  Failed to update session:', error.message);
      }
    });

    client.on('auth_failure', (msg) => {
      console.error('\n❌ Authentication failed:', msg);
      console.log('');
      console.log('🔧 SOLUTION:');
      console.log('  1. Delete current session from scanner');
      console.log('  2. Create fresh session at:', process.env.SCANNER_URL);
      console.log('  3. Update SESSION_ID in environment');
      console.log('  4. Redeploy');
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
      console.log('');
      console.log('🎉 Bot is ready to receive messages!');
      console.log('💬 Try sending: !ping');
      console.log('');
    });

    client.on('disconnected', async (reason) => {
      console.error('\n❌ Client disconnected:', reason);
      console.log('🔄 Cleaning up...');
      
      // Clean up auth files
      try {
        fs.rmSync(authPath, { recursive: true, force: true });
      } catch (e) {
        // Ignore cleanup errors
      }
    });

    client.on('loading_screen', (percent, message) => {
      console.log(`⏳ Loading: ${percent}% - ${message}`);
    });

    // 7. Initialize the client
    console.log('🚀 Starting WhatsApp client connection...\n');
    await client.initialize();

    // 8. Timeout handler
    setTimeout(() => {
      if (!client.info) {
        console.error('\n❌ Initialization timeout');
        console.log('\nThe bot took too long to connect.');
        console.log('This usually means the session is expired or invalid.');
        console.log('\n🔧 Please create a fresh session at:', process.env.SCANNER_URL);
      }
    }, 90000); // 90 seconds

    return client;

  } catch (error) {
    console.error('\n❌ Failed to initialize WhatsApp client');
    console.error('Error:', error.message);
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
