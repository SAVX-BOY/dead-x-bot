// src/models/User.js

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  settings: {
    autotyping: { type: Boolean, default: false },
    autorecording: { type: Boolean, default: false },
    alwaysonline: { type: Boolean, default: false },
    antilink: { type: Boolean, default: false },
    antibot: { type: Boolean, default: false },
    autorespond: { type: Boolean, default: false },
    autoRespondTriggers: { type: Map, of: String, default: {} },
    bannedWords: { type: [String], default: [] }
  },
  commandCount: {
    type: Number,
    default: 0
  },
  lastCommand: {
    type: Date,
    default: Date.now
  },
  blocked: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for faster queries
userSchema.index({ userId: 1 });
userSchema.index({ lastCommand: -1 });

// Methods
userSchema.methods.incrementCommandCount = function() {
  this.commandCount += 1;
  this.lastCommand = new Date();
  return this.save();
};

module.exports = mongoose.model('User', userSchema);
