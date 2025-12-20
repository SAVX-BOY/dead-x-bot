// src/services/settingsService.js

const mongoose = require('mongoose');
const config = require('../config/menu.config');

// Simple in-memory fallback if MongoDB not available
const inMemorySettings = new Map();

class SettingsService {
  constructor() {
    this.useDatabase = false;
    this.User = null;
    this.Group = null;
    
    // Check if MongoDB is connected
    if (mongoose.connection.readyState === 1) {
      this.useDatabase = true;
      this.loadModels();
    }
  }

  loadModels() {
    try {
      this.User = require('../models/User');
      this.Group = require('../models/Group');
    } catch (error) {
      console.warn('⚠️  Models not loaded. Using in-memory settings.');
      this.useDatabase = false;
    }
  }

  async getSettings(userId) {
    if (this.useDatabase && this.User && this.Group) {
      return await this.getFromDatabase(userId);
    } else {
      return this.getFromMemory(userId);
    }
  }

  async getFromDatabase(userId) {
    try {
      const isGroup = userId.includes('@g.us');
      
      if (isGroup) {
        let group = await this.Group.findOne({ groupId: userId });
        if (!group) {
          group = await this.Group.create({
            groupId: userId,
            settings: this.getDefaultSettings()
          });
        }
        return group.settings;
      } else {
        let user = await this.User.findOne({ userId });
        if (!user) {
          user = await this.User.create({
            userId,
            settings: this.getDefaultSettings()
          });
        }
        return user.settings;
      }
    } catch (error) {
      console.error('Error fetching settings from database:', error.message);
      return this.getDefaultSettings();
    }
  }

  getFromMemory(userId) {
    if (!inMemorySettings.has(userId)) {
      inMemorySettings.set(userId, this.getDefaultSettings());
    }
    return inMemorySettings.get(userId);
  }

  async updateSettings(userId, newSettings) {
    if (this.useDatabase && this.User && this.Group) {
      return await this.updateInDatabase(userId, newSettings);
    } else {
      return this.updateInMemory(userId, newSettings);
    }
  }

  async updateInDatabase(userId, newSettings) {
    try {
      const isGroup = userId.includes('@g.us');
      
      if (isGroup) {
        await this.Group.findOneAndUpdate(
          { groupId: userId },
          { $set: { settings: newSettings } },
          { upsert: true }
        );
      } else {
        await this.User.findOneAndUpdate(
          { userId },
          { $set: { settings: newSettings } },
          { upsert: true }
        );
      }
      
      return true;
    } catch (error) {
      console.error('Error updating settings in database:', error.message);
      return false;
    }
  }

  updateInMemory(userId, newSettings) {
    inMemorySettings.set(userId, newSettings);
    return true;
  }

  getDefaultSettings() {
    return {
      autotyping: config.features.autoTyping || false,
      autorecording: config.features.autoRecording || false,
      alwaysonline: config.features.alwaysOnline || false,
      antilink: config.features.antiLink || false,
      antibot: config.features.antiBot || false,
      autorespond: config.features.autoRespond || false,
      autoRespondTriggers: {},
      bannedWords: []
    };
  }

  async toggleSetting(userId, settingName, value) {
    const settings = await this.getSettings(userId);
    settings[settingName] = value;
    await this.updateSettings(userId, settings);
    return settings;
  }

  async addAutoRespondTrigger(userId, trigger, response) {
    const settings = await this.getSettings(userId);
    if (!settings.autoRespondTriggers) {
      settings.autoRespondTriggers = {};
    }
    settings.autoRespondTriggers[trigger] = response;
    await this.updateSettings(userId, settings);
    return settings;
  }

  async removeAutoRespondTrigger(userId, trigger) {
    const settings = await this.getSettings(userId);
    if (settings.autoRespondTriggers) {
      delete settings.autoRespondTriggers[trigger];
      await this.updateSettings(userId, settings);
    }
    return settings;
  }

  async addBannedWord(userId, word) {
    const settings = await this.getSettings(userId);
    if (!settings.bannedWords) {
      settings.bannedWords = [];
    }
    if (!settings.bannedWords.includes(word.toLowerCase())) {
      settings.bannedWords.push(word.toLowerCase());
      await this.updateSettings(userId, settings);
    }
    return settings;
  }

  async removeBannedWord(userId, word) {
    const settings = await this.getSettings(userId);
    if (settings.bannedWords) {
      settings.bannedWords = settings.bannedWords.filter(w => w !== word.toLowerCase());
      await this.updateSettings(userId, settings);
    }
    return settings;
  }
}

module.exports = new SettingsService();
