// src/handlers/menuHandler.js

const { MessageMedia } = require('whatsapp-web.js');
const axios = require('axios');
const config = require('../config/menu.config');

class MenuHandler {
  constructor() {
    this.botName = config.botName;
    this.prefix = config.prefix;
    this.developer = config.developer;
    this.version = config.version;
    this.menuImages = config.menuImages;
    this.greetings = config.greetings;
  }

  // Get current time-based image
  getCurrentMenuImage() {
    const hour = new Date().getHours();
    
    if (hour >= 6 && hour < 12) {
      return { 
        url: this.menuImages.morning, 
        period: 'Morning',
        greeting: this.greetings.morning,
        emoji: '🌅'
      };
    } else if (hour >= 12 && hour < 18) {
      return { 
        url: this.menuImages.afternoon, 
        period: 'Afternoon',
        greeting: this.greetings.afternoon,
        emoji: '☀️'
      };
    } else {
      return { 
        url: this.menuImages.evening, 
        period: 'Evening',
        greeting: this.greetings.evening,
        emoji: '🌙'
      };
    }
  }

  // Get mode (based on settings or default)
  async getMode(userId) {
    return 'Public';
  }

  // Generate main menu
  async generateMainMenu(userId) {
    const mode = await this.getMode(userId);
    const { period, greeting, emoji } = this.getCurrentMenuImage();
    
    return `${greeting}! ${emoji}

╔═══════════════════════════╗
║   💀 ${this.botName}
╠═══════════════════════════╣
║ 📌 Prefix: ${this.prefix}
║ 🌓 Time: ${period}
║ 🤖 Mode: ${mode}
║ 👨‍💻 Developer: ${this.developer}
╠═══════════════════════════╣
║        📋 MENU CATEGORIES
╠═══════════════════════════╣
║
║ 1️⃣  ${this.prefix}godmenu
║     ⤷ Bible verses & devotionals
║
║ 2️⃣  ${this.prefix}generalmenu
║     ⤷ Basic bot commands
║
║ 3️⃣  ${this.prefix}aimenu
║     ⤷ AI & search features
║
║ 4️⃣  ${this.prefix}groupmenu
║     ⤷ Group management
║
║ 5️⃣  ${this.prefix}downloadmenu
║     ⤷ Media downloads
║
║ 6️⃣  ${this.prefix}funmenu
║     ⤷ Games & entertainment
║
║ 7️⃣  ${this.prefix}toolsmenu
║     ⤷ Utility tools
║
║ 8️⃣  ${this.prefix}settingsmenu
║     ⤷ Bot settings & automation
║
╠═══════════════════════════╣
║ 💡 Tip: Use ${this.prefix}help <command>
║     for detailed info
╠═══════════════════════════╣
║ 🔥 Developed by ${this.developer}
╚═══════════════════════════╝`;
  }

  // God Menu
  async generateGodMenu() {
    return `
╔═══════════════════════════╗
║   ✝️  GOD MENU
╠═══════════════════════════╣
║
║ ${this.prefix}verse
║  ⤷ Random Bible verse
║
║ ${this.prefix}bible <reference>
║  ⤷ Get specific verse
║  ⤷ Example: ${this.prefix}bible John 3:16
║
║ ${this.prefix}devotional
║  ⤷ Daily devotional message
║
╠═══════════════════════════╣
║ 🔥 Developed by ${this.developer}
╚═══════════════════════════╝`;
  }

  // General Menu
  async generateGeneralMenu() {
    return `
╔═══════════════════════════╗
║   📱 GENERAL MENU
╠═══════════════════════════╣
║
║ ${this.prefix}ping
║  ⤷ Check bot speed
║
║ ${this.prefix}view <status>
║  ⤷ View someone's status
║
║ ${this.prefix}vv
║  ⤷ View once media
║
║ ${this.prefix}say <text>
║  ⤷ Make bot speak
║
║ ${this.prefix}save <reply>
║  ⤷ Save media to bot
║
║ ${this.prefix}profile [@user]
║  ⤷ Get user profile info
║
║ ${this.prefix}menu
║  ⤷ Show main menu
║
╠═══════════════════════════╣
║ 🔥 Developed by ${this.developer}
╚═══════════════════════════╝`;
  }

  // AI Menu
  async generateAIMenu() {
    return `
╔═══════════════════════════╗
║   🤖 AI MENU
╠═══════════════════════════╣
║
║ ${this.prefix}myai <prompt>
║  ⤷ Chat with AI
║
║ ${this.prefix}gpt <prompt>
║  ⤷ ChatGPT response
║
║ ${this.prefix}meta <prompt>
║  ⤷ Meta AI
║
║ ${this.prefix}google <query>
║  ⤷ Google search
║
║ ${this.prefix}search <query>
║  ⤷ Web search
║
║ ${this.prefix}stickersearch <query>
║  ⤷ Search stickers
║
╠═══════════════════════════╣
║ 🔥 Developed by ${this.developer}
╚═══════════════════════════╝`;
  }

  // Group Menu
  async generateGroupMenu() {
    return `
╔═══════════════════════════╗
║   👥 GROUP MENU
╠═══════════════════════════╣
║
║ ${this.prefix}tagall
║  ⤷ Tag all members
║
║ ${this.prefix}tagadm
║  ⤷ Tag admins only
║
║ ${this.prefix}online
║  ⤷ Show online members
║
║ ${this.prefix}promote [@user]
║  ⤷ Make admin
║
║ ${this.prefix}demote [@user]
║  ⤷ Remove admin
║
║ ${this.prefix}join <link>
║  ⤷ Join group via link
║
║ ${this.prefix}leave
║  ⤷ Leave current group
║
╠═══════════════════════════╣
║ 🔥 Developed by ${this.developer}
╚═══════════════════════════╝`;
  }

  // Download Menu
  async generateDownloadMenu() {
    return `
╔═══════════════════════════╗
║   📥 DOWNLOAD MENU
╠═══════════════════════════╣
║
║ ${this.prefix}play <song name>
║  ⤷ Play/download music
║
║ ${this.prefix}mp3 <url>
║  ⤷ Download audio
║
║ ${this.prefix}mp4 <url>
║  ⤷ Download video
║
║ ${this.prefix}img <query>
║  ⤷ Search & download image
║
║ ${this.prefix}insta <url>
║  ⤷ Instagram downloader
║
║ ${this.prefix}tiktok <url>
║  ⤷ TikTok downloader
║
║ ${this.prefix}download <url>
║  ⤷ Universal downloader
║
║ ${this.prefix}trailer <movie>
║  ⤷ Movie trailer
║
║ ${this.prefix}aura <query>
║  ⤷ Aura media search
║
╠═══════════════════════════╣
║ 🔥 Developed by ${this.developer}
╚═══════════════════════════╝`;
  }

  // Fun Menu
  async generateFunMenu() {
    return `
╔═══════════════════════════╗
║   🎮 FUN MENU
╠═══════════════════════════╣
║
║ ${this.prefix}rps <choice>
║  ⤷ Rock Paper Scissors
║  ⤷ Example: ${this.prefix}rps rock
║
║ ${this.prefix}chifumi
║  ⤷ Japanese RPS game
║
║ ${this.prefix}dice
║  ⤷ Roll a dice
║
║ ${this.prefix}joke
║  ⤷ Random joke
║
║ ${this.prefix}advice
║  ⤷ Get life advice
║
║ ${this.prefix}quote
║  ⤷ Inspirational quote
║
╠═══════════════════════════╣
║ 🔥 Developed by ${this.developer}
╚═══════════════════════════╝`;
  }

  // Tools Menu
  async generateToolsMenu() {
    return `
╔═══════════════════════════╗
║   🛠️ TOOLS MENU
╠═══════════════════════════╣
║
║ ${this.prefix}qr <text>
║  ⤷ Generate QR code
║
║ ${this.prefix}scanqr <image>
║  ⤷ Scan QR code
║
║ ${this.prefix}shortlink <url>
║  ⤷ Shorten URL
║
║ ${this.prefix}translate <text>
║  ⤷ Translate text
║
║ ${this.prefix}dictionary <word>
║  ⤷ Word definition
║
║ ${this.prefix}weather <city>
║  ⤷ Weather info
║
║ ${this.prefix}currency <amount> <from> <to>
║  ⤷ Currency converter
║
║ ${this.prefix}toimg <sticker>
║  ⤷ Convert to image
║
║ ${this.prefix}tosticker <image>
║  ⤷ Convert to sticker
║
║ ${this.prefix}zip <files>
║  ⤷ Zip files
║
║ ${this.prefix}unzip <file>
║  ⤷ Unzip archive
║
╠═══════════════════════════╣
║ 🔥 Developed by ${this.developer}
╚═══════════════════════════╝`;
  }

  // Settings Menu
  async generateSettingsMenu() {
    return `
╔═══════════════════════════╗
║   ⚙️ SETTINGS MENU
╠═══════════════════════════╣
║
║ ${this.prefix}autotyping <on/off>
║  ⤷ Auto typing indicator
║
║ ${this.prefix}autorecording <on/off>
║  ⤷ Auto recording indicator
║
║ ${this.prefix}alwaysonline <on/off>
║  ⤷ Stay online 24/7
║
║ ${this.prefix}autorespond <on/off>
║  ⤷ Auto-reply messages
║
║ ${this.prefix}antilink <on/off>
║  ⤷ Delete links in groups
║
║ ${this.prefix}antibot <on/off>
║  ⤷ Kick other bots
║
║ ${this.prefix}banwords <add/remove> <word>
║  ⤷ Manage banned words
║
╠═══════════════════════════╣
║ 🔥 Developed by ${this.developer}
╚═══════════════════════════╝`;
  }

  // Send menu with image
  async sendMenu(msg, menuType = 'main') {
    const { url, period } = this.getCurrentMenuImage();
    
    let menuText = '';
    
    switch(menuType) {
      case 'main':
        menuText = await this.generateMainMenu(msg.from);
        break;
      case 'god':
        menuText = await this.generateGodMenu();
        break;
      case 'general':
        menuText = await this.generateGeneralMenu();
        break;
      case 'ai':
        menuText = await this.generateAIMenu();
        break;
      case 'group':
        menuText = await this.generateGroupMenu();
        break;
      case 'download':
        menuText = await this.generateDownloadMenu();
        break;
      case 'fun':
        menuText = await this.generateFunMenu();
        break;
      case 'tools':
        menuText = await this.generateToolsMenu();
        break;
      case 'settings':
        menuText = await this.generateSettingsMenu();
        break;
      default:
        menuText = await this.generateMainMenu(msg.from);
    }

    try {
      // Download image
      const response = await axios.get(url, { 
        responseType: 'arraybuffer',
        timeout: 15000
      });
      
      const media = new MessageMedia(
        'image/jpeg', 
        Buffer.from(response.data).toString('base64')
      );
      
      // Send image with caption
      await msg.reply(media, undefined, { caption: menuText });
      
    } catch (error) {
      console.error('Error sending menu image:', error.message);
      // Fallback: send text only
      await msg.reply(menuText);
    }
  }
}

module.exports = MenuHandler;
