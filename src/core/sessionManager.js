const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

class SessionManager {
  constructor(scannerUrl, sessionId) {
    this.scannerUrl = scannerUrl;
    this.sessionId = sessionId;
    this.authPath = path.join(process.cwd(), '.wwebjs_auth', `session-${sessionId}`);
  }

  /**
   * Fetch session from scanner API
   */
  async fetchFromScanner() {
    try {
      console.log('🔄 Fetching session from scanner:', this.sessionId);
      
      const response = await axios.get(
        `${this.scannerUrl}/session/${this.sessionId}`,
        { timeout: 10000 }
      );

      if (!response.data || !response.data.session) {
        throw new Error('No session data returned from scanner');
      }

      const { session } = response.data;
      
      console.log('✅ Session found in scanner!');
      console.log('   Phone:', session.phoneNumber);
      console.log('   Status:', session.status);
      console.log('   Expires:', session.expiresAt);

      return session;
      
    } catch (error) {
      if (error.response && error.response.status === 404) {
        throw new Error('Session not found in scanner. Please scan QR code first.');
      }
      console.error('❌ Failed to fetch session:', error.message);
      throw error;
    }
  }

  /**
   * Update session in scanner (after successful auth)
   */
  async updateSession(sessionData) {
    try {
      await axios.put(
        `${this.scannerUrl}/session/${this.sessionId}`,
        { data: sessionData },
        { timeout: 10000 }
      );
      return true;
    } catch (error) {
      throw new Error(`Failed to update session: ${error.message}`);
    }
  }

  /**
   * Validate session with scanner
   */
  async validate() {
    try {
      const response = await axios.get(
        `${this.scannerUrl}/session/validate/${this.sessionId}`,
        { timeout: 5000 }
      );

      return response.data.valid === true;
    } catch (error) {
      console.error('⚠️  Failed to validate session:', error.message);
      return false;
    }
  }

  /**
   * Delete local session files
   */
  async deleteLocal() {
    try {
      await fs.rm(this.authPath, { recursive: true, force: true });
      console.log('🗑️  Local session deleted');
    } catch (error) {
      // Ignore errors
    }
  }
}

module.exports = SessionManager;
