require('dotenv').config();
const express = require('express');
const { initializeWhatsApp } = require('./src/core/whatsappClient');
const connectDB = require('./src/config/database');

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    sessionId: process.env.SESSION_ID
  });
});

// Bot status endpoint
let whatsappClient = null;

app.get('/status', (req, res) => {
  if (!whatsappClient || !whatsappClient.info) {
    return res.json({
      botStatus: 'disconnected',
      message: 'Bot is not connected to WhatsApp'
    });
  }

  res.json({
    botStatus: 'connected',
    phone: whatsappClient.info.wid.user,
    platform: whatsappClient.info.platform,
    battery: whatsappClient.info.battery,
    sessionId: process.env.SESSION_ID,
    uptime: process.uptime()
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
    if (!process.env.SCANNER_URL) {
      throw new Error('SCANNER_URL not set in environment variables');
    }
    if (!process.env.SESSION_ID) {
      throw new Error('SESSION_ID not set in environment variables');
    }
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI not set in environment variables');
    }

    // 1. Connect to MongoDB
    console.log('🔄 Connecting to MongoDB...');
    await connectDB();

    // 2. Start HTTP server
    app.listen(PORT, () => {
      console.log(`✅ HTTP server running on port ${PORT}`);
      console.log(`✅ Health check: http://localhost:${PORT}/health`);
    });

    // 3. Initialize WhatsApp client (AFTER session restoration)
    whatsappClient = await initializeWhatsApp();

    // 4. Set up message handler
    whatsappClient.on('message', async (message) => {
      // Your message handling logic here
      if (message.body === '!ping') {
        await message.reply('🏓 Pong! Bot is online!');
      }
      
      if (message.body === '!status') {
        const info = whatsappClient.info;
        await message.reply(
          `📊 *Bot Status*\n\n` +
          `📱 Phone: ${info.wid.user}\n` +
          `📦 Platform: ${info.platform}\n` +
          `🔋 Battery: ${info.battery}%\n` +
          `⏱️ Uptime: ${Math.floor(process.uptime())}s`
        );
      }
    });

  } catch (error) {
    console.error('❌ Fatal error during startup:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  if (whatsappClient) {
    await whatsappClient.destroy();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 SIGTERM received, shutting down...');
  if (whatsappClient) {
    await whatsappClient.destroy();
  }
  process.exit(0);
});

// Start the bot
start();
