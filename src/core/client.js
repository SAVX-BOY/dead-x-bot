// src/core/client.js

const { Client, LocalAuth, NoAuth } = require('whatsapp-web.js');
const config = require('../config/menu.config');
const SessionManager = require('./sessionManager');

class WhatsAppClient {
  constructor() {
    this.client = null;
    this.sessionManager = new SessionManager(
      config.scannerUrl,
      config.sessionId
    );
  }

  async getClient() {
    if (!this.client) {
      // Check if we should use scanner session
      const useScanner = config.sessionId && config.scannerUrl;
      
      if (useScanner) {
        console.log('🔍 Checking for existing session in scanner...');
        const sessionData = await this.sessionManager.fetchSessionFromScanner();
        
        if (sessionData) {
          console.log('✅ Using session from scanner');
          await this.sessionManager.ensureSessionDirectory();
        } else {
          console.log('⚠️  Session not found or invalid. Will generate QR code.');
        }
      }

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
    const client = await this.getClient();
    
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
