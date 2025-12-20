// src/config/database.js

const mongoose = require('mongoose');
const config = require('./menu.config');

const connectDB = async () => {
  try {
    if (!config.mongoUri) {
      console.warn('⚠️  MongoDB URI not provided. Running without database.');
      return null;
    }

    const conn = await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️  MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        console.log('✅ MongoDB connection closed through app termination');
      } catch (error) {
        console.error('❌ Error closing MongoDB connection:', error);
      }
    });

    return conn;

  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.warn('⚠️  Bot will run without database features');
    return null;
  }
};

module.exports = connectDB;
