// server.js - DEAD-X-BOT Main Entry Point (FIXED VERSION)

require('dotenv').config();
const express = require('express');
const { Client } = require('whatsapp-web.js');
const connectDB = require('./src/config/database');
const WhatsAppClient = require('./src/core/client');
const MessageHandler = require('./src/handlers/messageHandler');
const EventHandler = require('./src/handlers/eventHandler');
const config = require('./src/config/menu.config');

// ASCII Banner
console.log(`
╔═══════════════════════════════════════╗
║                                       ║
║         💀 DEAD-X-BOT v1.0.0         ║
║                                       ║
║    WhatsApp Automation System         ║
║    Developer: D3AD_XMILE              ║
║                                       ║
╚═══════════════════════════════════════╝
`);

// Connect to MongoDB
console.log('🔄 Connecting to MongoDB...');
connectDB();

// Async initialization function
async function initializeBot() {
  try {
    // Initialize WhatsApp Client
    console.log('🔄 Initializing WhatsApp client...');
    const whatsappClient = new WhatsAppClient();
    const client = await whatsappClient.getClient(); // AWAIT HERE!

    // Initialize Handlers
    const messageHandler = new MessageHandler(client, config);
    const eventHandler = new EventHandler(client);

    // Setup event listeners
    eventHandler.setupEvents();

    // Handle incoming messages
    client.on('message', async (msg) => {
      try {
        await messageHandler.handleMessage(msg);
      } catch (error) {
        console.error('Error handling message:', error);
      }
    });

    // Initialize bot
    await whatsappClient.initialize();
    console.log('✅ DEAD-X-BOT initialized successfully!');

    return client;

  } catch (error) {
    console.error('❌ Failed to initialize bot:', error);
    process.exit(1);
  }
}

// Start bot initialization
let client = null;
initializeBot().then(c => {
  client = c;
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

// ============================================
// HTTP SERVER FOR RENDER (REQUIRED!)
// ============================================

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
  const botStatus = client && client.info ? {
    connected: true,
    phone: client.info.wid.user,
    platform: client.info.platform
  } : {
    connected: false,
    status: 'Initializing...'
  };

  res.json({
    status: 'running',
    bot: 'DEAD-X-BOT',
    version: '1.0.0',
    developer: 'D3AD_XMILE',
    uptime: Math.floor(process.uptime()),
    whatsapp: botStatus,
    timestamp: new Date().toISOString()
  });
});

// Health endpoint for Render
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK',
    uptime: process.uptime()
  });
});

// Bot status endpoint
app.get('/status', (req, res) => {
  res.json({
    bot: 'DEAD-X-BOT',
    connected: client && client.info ? true : false,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
});

// Start HTTP server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ HTTP server running on port ${PORT}`);
  console.log(`✅ Health check: http://localhost:${PORT}/health`);
});

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

process.on('SIGINT', async () => {
  console.log('\n⚠️  Shutting down gracefully...');
  try {
    if (client) {
      await client.destroy();
    }
    console.log('✅ Bot shut down successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  console.log('\n⚠️  Received SIGTERM, shutting down...');
  try {
    if (client) {
      await client.destroy();
    }
    console.log('✅ Bot shut down successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
