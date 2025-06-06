const mongoose = require('mongoose');
const config = require('../config/config');

const connect = async () => {
  try {
    console.log('Attempting to connect to MongoDB...');
    console.log('MongoDB URI provided:', config.mongodb.uri ? 'Yes' : 'No');
    console.log('URI starts with mongodb+srv:', config.mongodb.uri?.startsWith('mongodb+srv://') ? 'Yes' : 'No');
    
    const conn = await mongoose.connect(config.mongodb.uri, config.mongodb.options);
    
    console.log(`MongoDB connected: ${conn.connection.host}`);
    console.log(`Database name: ${conn.connection.db.databaseName}`);
    
    return conn;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
};

const disconnect = async () => {
  try {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  } catch (error) {
    console.error('Error disconnecting from MongoDB:', error);
  }
};

module.exports = {
  connect,
  disconnect
};