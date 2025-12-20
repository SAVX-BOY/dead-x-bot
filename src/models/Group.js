// src/models/Group.js

const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  groupId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  groupName: {
    type: String,
    default: ''
  },
  settings: {
    autotyping: { type: Boolean, default: false },
    autorecording: { type: Boolean, default: false },
    alwaysonline: { type: Boolean, default: false },
    antilink: { type: Boolean, default: true },
    antibot: { type: Boolean, default: true },
    autorespond: { type: Boolean, default: false },
    autoRespondTriggers: { type: Map, of: String, default: {} },
    bannedWords: { type: [String], default: [] }
  },
  commandCount: {
    type: Number,
    default: 0
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  welcomeMessage: {
    type: String,
    default: ''
  },
  goodbyeMessage: {
    type: String,
    default: ''
  },
  botActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for faster queries
groupSchema.index({ groupId: 1 });
groupSchema.index({ lastActive: -1 });

// Methods
groupSchema.methods.incrementCommandCount = function() {
  this.commandCount += 1;
  this.lastActive = new Date();
  return this.save();
};

module.exports = mongoose.model('Group', groupSchema);
