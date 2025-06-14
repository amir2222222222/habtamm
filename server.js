require('dotenv').config();


const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const { Server } = require("socket.io");
const initSocketListeners = require("./socket");
const jwt = require("jsonwebtoken");



// Initialize environment variables
dotenv.config();

// Create the Express app instance
const app = express();

// Enable CORS for Express
app.use(cors({
  origin: "*", // Allow all origins (for development only)
  methods: ["GET", "POST"]
}));

const server = http.createServer(app);

// Enable CORS for Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Connect to DB
connectDB();
app.set('view cache', false);


// Middleware
app.use(cookieParser(process.env.JWT_SECRET));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));


app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});



// Routes
const authRoutes = require("./routes/auth");
const homeRoutes = require("./routes/home");
const headerRoutes = require("./routes/header");
const settingRoutes = require("./routes/setting");
const bingoRoutes = require("./routes/bingo_play");
const adminRoutes = require("./routes/admin");
const statusRoutes = require("./routes/status");
const gamesRoutes = require("./routes/games");
const profileRouter = require('./routes/profile');

app.use('/', profileRouter);
app.use("/", statusRoutes);
app.use("/", gamesRoutes);
app.use("/", authRoutes);
app.use("/", homeRoutes);
app.use("/", headerRoutes);
app.use("/", settingRoutes);
app.use("/", adminRoutes);
app.use("/", bingoRoutes(io));


// Global error handler (last middleware)
app.use((err, req, res, next) => {
  console.error('Global error:', err.stack || err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});



initSocketListeners(io);  // Use the separated Socket.IO logic

// Start server
const PORT = process.env.PORT;
server.listen(PORT, () => {
  console.log(` fuck yea u make me complete `);
});