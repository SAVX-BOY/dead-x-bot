// src/core/sessionManager.js

const axios = require('axios');
const fs = require('fs');
const path = require('path');

class SessionManager {
  constructor(scannerUrl, sessionId) {
    this.scannerUrl = scannerUrl;
    this.sessionId = sessionId;
    this.sessionPath = path.join(process.cwd(), '.wwebjs_auth', 'session-' + sessionId);
  }

  async fetchSessionFromScanner() {
    if (!this.sessionId) {
      console.log('⚠️  No SESSION_ID provided. Bot will generate QR code.');
      return null;
    }

    try {
      console.log(`🔄 Fetching session from scanner: ${this.sessionId}`);
      
      const response = await axios.get(
        `${this.scannerUrl}/session/${this.sessionId}`,
        { timeout: 10000 }
      );

      if (response.data.success && response.data.session) {
        const session = response.data.session;
        
        console.log(`✅ Session found in scanner!`);
        console.log(`   Phone: ${session.phoneNumber || 'Unknown'}`);
        console.log(`   Status: ${session.status}`);
        console.log(`   Expires: ${session.expiresAt}`);

        // Check if session is still valid
        if (session.status !== 'active') {
          console.log(`⚠️  Session status is '${session.status}'. May need to rescan.`);
          return null;
        }

        const expiresAt = new Date(session.expiresAt);
        if (expiresAt < new Date()) {
          console.log('⚠️  Session has expired. Please generate a new one.');
          return null;
        }

        return session;
      } else {
        console.log('❌ Session not found in scanner database');
        return null;
      }

    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log('❌ Session ID not found in scanner. Please generate a new session.');
      } else if (error.code === 'ECONNREFUSED') {
        console.log('❌ Cannot connect to scanner API. Please check SCANNER_URL.');
      } else {
        console.log('❌ Error fetching session:', error.message);
      }
      return null;
    }
  }

  async validateSession() {
    if (!this.sessionId) {
      return false;
    }

    try {
      const response = await axios.get(
        `${this.scannerUrl}/session/validate/${this.sessionId}`,
        { timeout: 5000 }
      );

      return response.data.valid === true;
    } catch (error) {
      return false;
    }
  }

  getSessionPath() {
    return this.sessionPath;
  }

  sessionExists() {
    return fs.existsSync(this.sessionPath);
  }

  async ensureSessionDirectory() {
    const authDir = path.join(process.cwd(), '.wwebjs_auth');
    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true });
    }
  }
}

module.exports = SessionManager;
