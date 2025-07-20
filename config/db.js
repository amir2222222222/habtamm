const mongoose = require('mongoose');

// Configuration constants
const CONNECTION_OPTIONS = {
  connectTimeoutMS: 30000,  // 30 seconds connection timeout
  socketTimeoutMS: 45000,    // 45 seconds socket timeout
  serverSelectionTimeoutMS: 5000, // 5 seconds to select server
  maxPoolSize: 10,          // Maximum number of sockets in the connection pool
  minPoolSize: 2,           // Minimum number of sockets in the connection pool
  retryWrites: true,
  retryReads: true
};

// Connection state tracking
let isConnected = false;
let connectionRetries = 0;
const MAX_RETRIES = 3;

async function connectDB() {
  if (isConnected) {
    console.log('✅ Using existing MongoDB connection');
    return;
  }

  try {
    console.log('Attempting MongoDB connection...');
    
    await mongoose.connect(process.env.MONGO_URI, CONNECTION_OPTIONS);
    isConnected = true;
    connectionRetries = 0;
    
    console.log("✅ MongoDB connected successfully");
    
    // Event handlers for connection monitoring
    mongoose.connection.on('connected', () => {
      isConnected = true;
      console.log('MongoDB connection established');
    });

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB connection lost');
      isConnected = false;
      handleDisconnection();
    });

    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
      isConnected = true;
    });

  } catch (error) {
    connectionRetries++;
    
    if (connectionRetries < MAX_RETRIES) {
      console.warn(`Retrying connection (${connectionRetries}/${MAX_RETRIES})...`);
      await new Promise(resolve => setTimeout(resolve, 5000));
      return connectDB();
    }

    console.error("❌ MongoDB connection failed after retries:", error.message);
    
    // Enhanced error diagnostics
    if (error.message.includes('queryTxt ETIMEOUT')) {
      console.error('\n💡 DNS Resolution Failed:');
      console.error('- Try using IP address instead of hostname');
      console.error('- Check your network connection');
      console.error('- Verify MongoDB URI format');
    } else if (error.message.includes('ENOTFOUND')) {
      console.error('\n💡 Hostname Resolution Failed:');
      console.error('- Verify your MongoDB URI');
      console.error('- Check your DNS settings');
    } else if (error.message.includes('unauthorized')) {
      console.error('\n💡 Authentication Failed:');
      console.error('- Verify your username/password');
      console.error('- Check database user permissions');
    }

    process.exit(1);
  }
}

function handleDisconnection() {
  if (!isConnected && connectionRetries < MAX_RETRIES) {
    console.log('Attempting to reconnect...');
    setTimeout(() => connectDB(), 5000);
  }
}

// Export both the connect function and the connection status
module.exports = {
  connectDB,
  isConnected: () => isConnected
};