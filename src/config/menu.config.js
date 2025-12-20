// src/config/menu.config.js

module.exports = {
  // Bot Information
  botName: process.env.BOT_NAME || 'DEAD-X-BOT',
  prefix: process.env.BOT_PREFIX || '!',
  developer: process.env.DEVELOPER || 'D3AD_XMILE',
  version: '1.0.0',
  
  // Menu Images (Your catbox.moe URLs)
  menuImages: {
    morning: 'https://files.catbox.moe/mf03mj.jpeg',    // Red hacker world map
    afternoon: 'https://files.catbox.moe/iaeurm.jpg',   // Dual screen hacker
    evening: 'https://files.catbox.moe/kv5h9k.jpg'      // Red anime character
  },
  
  // Time Ranges (24-hour format)
  timeRanges: {
    morning: { start: 6, end: 12 },      // 06:00 - 11:59
    afternoon: { start: 12, end: 18 },   // 12:00 - 17:59
    evening: { start: 18, end: 6 }       // 18:00 - 05:59
  },
  
  // Greetings
  greetings: {
    morning: '🌅 Good Morning',
    afternoon: '☀️ Good Afternoon',
    evening: '🌙 Good Evening'
  },
  
  // Nethunter-fx API (Set in Render environment variables)
  apiUrl: process.env.NETHUNTER_FX_URL || 'https://your-nethunter-fx.onrender.com',
  apiKey: process.env.API_KEY || '',
  apiTimeout: 60000, // 60 seconds
  
  // Scanner API
  scannerUrl: process.env.SCANNER_URL || 'https://dead-x-bot-scanner.onrender.com',
  sessionId: process.env.SESSION_ID,
  
  // Default Features (can be changed per user/group)
  features: {
    autoTyping: true,
    autoRecording: true,
    alwaysOnline: true,
    antiLink: false,
    antiBot: false,
    autoRespond: false
  },
  
  // Permissions
  owner: process.env.OWNER_NUMBER || '',
  mods: (process.env.MODS || '').split(',').filter(Boolean),
  
  // Rate Limiting
  rateLimit: {
    enabled: true,
    maxCommands: 10,
    windowMs: 60000, // 1 minute
    message: '⚠️ Too many commands! Please wait a moment.'
  },
  
  // MongoDB
  mongoUri: process.env.MONGODB_URI,
  
  // Logging
  logLevel: process.env.LOG_LEVEL || 'info'
};
