require('dotenv').config();
const express = require("express");
const http = require("http");
const path = require("path");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const mongoose = require('mongoose');
const { connectDB, isConnected } = require("./Config/Db");

// Initialize app
const app = express();
const server = http.createServer(app);

// Middlewares
app.use(cors({ origin: "*", methods: ["GET", "POST"] })); // 🔒 In production, specify allowed origins
app.use(cookieParser(process.env.JWT_SECRET));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.set("view cache", false); // Disable view caching (optional)

// Database Connection Middleware
app.use(async (req, res, next) => {
  if (!isConnected()) {
    try {
      await connectDB();
    } catch (err) {
      return res.status(503).json({ 
        success: false, 
        message: "Service unavailable - Database connection failed" 
      });
    }
  }
  next();
});

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(isConnected() ? 200 : 503).json({
    status: isConnected() ? 'healthy' : 'unhealthy',
    dbStatus: isConnected() ? 'connected' : 'disconnected',
    uptime: process.uptime(),
    timestamp: new Date()
  });
});

// Simple ping route
app.get('/pingping', (req, res) => {
  res.json({ message: 'pong' });
});

// Route imports
const routes = [
  './Routes/Auth',
  './Routes/Home',
  './Routes/Header',
  './Routes/Setting',
  './Routes/BingoPlay',
  './Routes/Status',
  './Routes/Games',
  './Routes/Profile',
  './Routes/AccountDelete',
  './Routes/AccountList',
  './Routes/AccountSignUp',
  './Routes/AccountUpdate',
  './Routes/SubAdminHystory',
];

// Register all routes
routes.forEach(routePath => {
  app.use("/", require(routePath));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("❌ Global Error:", err.stack || err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// Start server with DB connection verification
async function startServer() {
  try {
    await connectDB();
    
    if (!isConnected()) {
      throw new Error('Failed to establish database connection');
    }

    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📦 MongoDB status: ${isConnected() ? 'CONNECTED' : 'DISCONNECTED'}`);
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n🛑 Received SIGINT. Shutting down gracefully...');
      await mongoose.connection.close();
      console.log('MongoDB connection closed');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });

    process.on('SIGTERM', async () => {
      console.log('\n🛑 Received SIGTERM. Shutting down gracefully...');
      await mongoose.connection.close();
      console.log('MongoDB connection closed');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('🔥 Failed to start server:', error);
    process.exit(1);
  }
}

startServer();