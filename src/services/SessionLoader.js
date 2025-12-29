const { default: makeWASocket, DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const pino = require('pino');

class SessionLoader {
  constructor(scannerUrl, sessionId) {
    this.scannerUrl = scannerUrl;
    this.sessionId = sessionId;
    this.authPath = path.join(process.cwd(), '.auth', sessionId);
    this.logger = pino({ level: 'silent' });
    this.sock = null;
  }

  async fetchSession() {
    try {
      console.log(`🔄 Fetching session from scanner: ${this.sessionId}`);
      
      const response = await axios.get(
        `${this.scannerUrl}/session/${this.sessionId}`,
        { timeout: 10000 }
      );

      if (!response.data || !response.data.session) {
        throw new Error('No session data returned');
      }

      const { session } = response.data;
      
      if (session.status !== 'active') {
        throw new Error(`Session status is ${session.status}`);
      }

      console.log(`✅ Session found!`);
      console.log(`   Phone: ${session.phoneNumber}`);

      return session;
      
    } catch (error) {
      console.error('❌ Failed to fetch session:', error.message);
      throw error;
    }
  }

  async restoreSession(sessionData) {
    try {
      console.log('💾 Restoring session to filesystem...');
      
      await fs.mkdir(this.authPath, { recursive: true });

      for (const [filename, content] of Object.entries(sessionData)) {
        const filePath = path.join(this.authPath, filename);
        await fs.writeFile(filePath, JSON.stringify(content, null, 2));
      }

      console.log(`✅ Session restored`);
      return true;
      
    } catch (error) {
      console.error('❌ Failed to restore session:', error.message);
      throw error;
    }
  }

  async connect() {
    try {
      const session = await this.fetchSession();
      await this.restoreSession(session.data);

      const { version } = await fetchLatestBaileysVersion();
      console.log(`📱 Using WhatsApp version: ${version.join('.')}`);

      const { state, saveCreds } = await useMultiFileAuthState(this.authPath);

      this.sock = makeWASocket({
        version,
        logger: this.logger,
        printQRInTerminal: false,
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, this.logger),
        },
        browser: ['DEAD-X-BOT', 'Chrome', '110.0.0'],
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 0,
        keepAliveIntervalMs: 30000,
        emitOwnEvents: true,
        markOnlineOnConnect: true,      // ACTIVE MODE - Bot marks itself online
        syncFullHistory: true,           // ACTIVE MODE - Bot syncs all messages
        getMessage: async () => ({ conversation: '' }),
        generateHighQualityLinkPreview: true,
        shouldIgnoreJid: () => false,    // ACTIVE MODE - Process all messages
        retryRequestDelayMs: 250,
      });

      this.sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          console.log('⚠️  QR generated - session expired!');
          console.log('🔄 Generate new session from scanner');
        }

        if (connection === 'connecting') {
          console.log('🔄 Connecting to WhatsApp...');
        }

        if (connection === 'open') {
          console.log('\n✅ Bot Connected Successfully!\n');
          console.log('📱 Phone:', this.sock.user.id.split(':')[0]);
          console.log('👤 Name:', this.sock.user.name);
          console.log('📦 Platform:', this.sock.user.platform);
          console.log('\n🎉 Bot is ACTIVE and processing messages!\n');
        }

        if (connection === 'close') {
          const statusCode = lastDisconnect?.error?.output?.statusCode;
          const reason = lastDisconnect?.error?.output?.payload?.message || 'Unknown';
          
          console.log('🔌 Disconnected:', reason);

          if (statusCode === DisconnectReason.loggedOut) {
            console.log('❌ Logged out - need new session');
            process.exit(1);
          } else if (statusCode === DisconnectReason.restartRequired) {
            console.log('♻️  Restart required, reconnecting...');
            setTimeout(() => this.connect(), 5000);
          } else if (statusCode === DisconnectReason.connectionClosed) {
            console.log('🔄 Connection closed, reconnecting in 10s...');
            setTimeout(() => this.connect(), 10000);
          } else if (statusCode === DisconnectReason.timedOut) {
            console.log('⏱️  Timed out, reconnecting in 5s...');
            setTimeout(() => this.connect(), 5000);
          } else {
            console.log('🔄 Reconnecting in 5s...');
            setTimeout(() => this.connect(), 5000);
          }
        }
      });

      this.sock.ev.on('creds.update', saveCreds);

      return this.sock;

    } catch (error) {
      console.error('\n❌ Failed to connect:', error.message);
      throw error;
    }
  }

  getSocket() {
    return this.sock;
  }

  async disconnect() {
    if (this.sock) {
      await this.sock.logout();
      console.log('👋 Bot disconnected');
    }
  }
}

module.exports = SessionLoader;
