require('dotenv').config();
const express = require('express');
const { initializeWhatsApp, getClient } = require('./src/core/whatsappClient');
const connectDB = require('./src/config/database');

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  const client = getClient();
  res.json({
    status: 'ok',
    service: 'DEAD-X-BOT',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    whatsappConnected: client && client.info ? true : false,
    sessionId: process.env.SESSION_ID
  });
});

// Bot status endpoint
app.get('/status', (req, res) => {
  const client = getClient();
  
  if (!client || !client.info) {
    return res.json({
      botStatus: 'disconnected',
      message: 'Bot is not connected to WhatsApp',
      hint: 'Check logs or wait for initialization to complete'
    });
  }

  res.json({
    botStatus: 'connected',
    phone: client.info.wid.user,
    pushName: client.info.pushname,
    platform: client.info.platform,
    battery: client.info.battery + '%',
    plugged: client.info.plugged,
    sessionId: process.env.SESSION_ID,
    uptime: Math.floor(process.uptime()) + 's',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'DEAD-X-BOT',
    version: '1.0.0',
    developer: 'D3AD_XMILE',
    status: 'running',
    endpoints: {
      health: '/health',
      status: '/status'
    }
  });
});

// Start function
async function start() {
  try {
    console.log('\n╔═══════════════════════════════════════╗');
    console.log('║                                       ║');
    console.log('║         💀 DEAD-X-BOT v1.0.0         ║');
    console.log('║                                       ║');
    console.log('║    WhatsApp Automation System         ║');
    console.log('║    Developer: D3AD_XMILE              ║');
    console.log('║                                       ║');
    console.log('╚═══════════════════════════════════════╝\n');

    // Validate environment variables
    const requiredEnvVars = [
      'SCANNER_URL',
      'SESSION_ID',
      'MONGODB_URI'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.error('❌ Missing required environment variables:');
      missingVars.forEach(varName => {
        console.error(`   - ${varName}`);
      });
      console.error('\nPlease set these in your Render environment variables.');
      process.exit(1);
    }

    console.log('✅ Environment variables validated\n');

    // 1. Connect to MongoDB
    console.log('🔄 Connecting to MongoDB...');
    await connectDB();

    // 2. Start HTTP server FIRST (Render needs this to consider service "live")
    app.listen(PORT, () => {
      console.log(`✅ HTTP server running on port ${PORT}`);
      console.log(`✅ Health check: http://localhost:${PORT}/health`);
      console.log(`✅ Status check: http://localhost:${PORT}/status`);
      console.log('');
    });

    // 3. Initialize WhatsApp client (with session restoration)
    const whatsappClient = await initializeWhatsApp();

    // 4. Set up message handler
    whatsappClient.on('message', async (message) => {
      try {
        // Ignore status broadcast messages
        if (message.from === 'status@broadcast') return;

        // Log received message
        console.log(`📨 Message from ${message.from}: ${message.body}`);

        // Basic commands for testing
        if (message.body === '!ping') {
          const startTime = Date.now();
          await message.reply('🏓 Pong! Bot is online and working!');
          const latency = Date.now() - startTime;
          console.log(`✅ Responded to !ping in ${latency}ms`);
        }

        if (message.body === '!status') {
          const info = whatsappClient.info;
          const statusMsg = 
            `📊 *DEAD-X-BOT Status*\n\n` +
            `📱 Phone: ${info.wid.user}\n` +
            `👤 Name: ${info.pushname}\n` +
            `📦 Platform: ${info.platform}\n` +
            `🔋 Battery: ${info.battery}%\n` +
            `🔌 Charging: ${info.plugged ? 'Yes' : 'No'}\n` +
            `⏱️ Uptime: ${Math.floor(process.uptime())}s\n` +
            `🆔 Session: ${process.env.SESSION_ID}\n\n` +
            `✅ Bot is fully operational!`;
          
          await message.reply(statusMsg);
        }

        if (message.body === '!help') {
          const helpMsg = 
            `💀 *DEAD-X-BOT Commands*\n\n` +
            `!ping - Test bot response\n` +
            `!status - Show bot status\n` +
            `!help - Show this message\n\n` +
            `🔥 Developed by D3AD_XMILE`;
          
          await message.reply(helpMsg);
        }

        // Add your other command handlers here
        // if (message.body.startsWith('!menu')) { ... }
        // etc.

      } catch (error) {
        console.error('❌ Error handling message:', error);
      }
    });

    // 5. Handle message creation (for logging sent messages)
    whatsappClient.on('message_create', (message) => {
      if (message.fromMe) {
        console.log(`📤 Sent message to ${message.to}: ${message.body}`);
      }
    });

    console.log('\n✅ All systems operational!\n');

  } catch (error) {
    console.error('\n❌ Fatal error during startup:', error);
    console.error('Stack trace:', error.stack);
    console.log('\n🔄 Service will restart automatically...\n');
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  const client = getClient();
  if (client) {
    await client.destroy();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  const client = getClient();
  if (client) {
    await client.destroy();
  }
  process.exit(0);
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the bot
start();
