// src/core/client.js

const { Client, LocalAuth } = require('whatsapp-web.js');
const config = require('../config/menu.config');

class WhatsAppClient {
  constructor() {
    this.client = null;
  }

  getClient() {
    if (!this.client) {
      // Puppeteer configuration for Render
      const puppeteerConfig = {
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
          '--disable-software-rasterizer',
          '--disable-extensions'
        ]
      };

      // Only set executablePath if explicitly provided
      // On Render, Puppeteer will download and use its own Chromium
      if (process.env.PUPPETEER_EXECUTABLE_PATH) {
        puppeteerConfig.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
      }

      this.client = new Client({
        authStrategy: new LocalAuth({
          clientId: config.sessionId || 'dead-x-bot-default'
        }),
        puppeteer: puppeteerConfig,
        webVersionCache: {
          type: 'remote',
          remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html'
        }
      });
    }
    return this.client;
  }

  async initialize() {
    const client = this.getClient();
    
    try {
      await client.initialize();
      return client;
    } catch (error) {
      console.error('❌ Failed to initialize WhatsApp client:', error);
      throw error;
    }
  }

  async destroy() {
    if (this.client) {
      try {
        await this.client.destroy();
        this.client = null;
        console.log('✅ WhatsApp client destroyed successfully');
      } catch (error) {
        console.error('❌ Error destroying client:', error);
      }
    }
  }

  isReady() {
    return this.client && this.client.info;
  }
}

module.exports = WhatsAppClient;
