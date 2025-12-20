// src/services/rateLimitService.js

const config = require('../config/menu.config');

class RateLimitService {
  constructor() {
    this.userCommands = new Map();
    this.maxCommands = config.rateLimit.maxCommands;
    this.windowMs = config.rateLimit.windowMs;
    
    // Cleanup old entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  async checkLimit(userId) {
    if (!config.rateLimit.enabled) {
      return false; // No rate limiting
    }

    const now = Date.now();
    const userKey = userId;

    if (!this.userCommands.has(userKey)) {
      this.userCommands.set(userKey, []);
    }

    const timestamps = this.userCommands.get(userKey);
    
    // Remove timestamps outside the window
    const validTimestamps = timestamps.filter(
      timestamp => now - timestamp < this.windowMs
    );

    // Check if limit exceeded
    if (validTimestamps.length >= this.maxCommands) {
      return true; // Rate limited
    }

    // Add current timestamp
    validTimestamps.push(now);
    this.userCommands.set(userKey, validTimestamps);

    return false; // Not rate limited
  }

  cleanup() {
    const now = Date.now();
    for (const [userId, timestamps] of this.userCommands.entries()) {
      const validTimestamps = timestamps.filter(
        timestamp => now - timestamp < this.windowMs
      );
      
      if (validTimestamps.length === 0) {
        this.userCommands.delete(userId);
      } else {
        this.userCommands.set(userId, validTimestamps);
      }
    }
  }

  reset(userId) {
    this.userCommands.delete(userId);
  }

  getRemainingCommands(userId) {
    if (!this.userCommands.has(userId)) {
      return this.maxCommands;
    }

    const now = Date.now();
    const timestamps = this.userCommands.get(userId);
    const validTimestamps = timestamps.filter(
      timestamp => now - timestamp < this.windowMs
    );

    return Math.max(0, this.maxCommands - validTimestamps.length);
  }
}

module.exports = new RateLimitService();
