// server.js - DEAD-X-BOT Main Entry Point

require('dotenv').config();
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

// Initialize WhatsApp Client
console.log('🔄 Initializing WhatsApp client...');
const whatsappClient = new WhatsAppClient();
const client = whatsappClient.getClient();

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
whatsappClient.initialize().then(() => {
  console.log('✅ DEAD-X-BOT initialized successfully!');
}).catch((error) => {
  console.error('❌ Failed to initialize bot:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⚠️  Shutting down gracefully...');
  try {
    await whatsappClient.destroy();
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
    await whatsappClient.destroy();
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
