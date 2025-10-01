const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');
const http = require('http');
const { pool } = require('./database');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:4200",
    methods: ["GET", "POST"]
  }
});


// Middleware
app.use(cors({
  origin: ['https://dalnokifishing.web.app', 'http://localhost:4200', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}));

// Handle preflight requests
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

app.use(express.json());

// Serve static files for uploads
app.use('/uploads', express.static('uploads'));

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Fishing Competition Server is running',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is healthy',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/competitions', require('./routes/competitions'));
app.use('/api/participants', require('./routes/participants'));
app.use('/api/weigh-ins', require('./routes/weigh-ins'));
app.use('/api/results', require('./routes/results'));
app.use('/api/registrations', require('./routes/registrations'));

// WebSocket connection
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('join-competition', (competitionId) => {
    socket.join(`competition-${competitionId}`);
    console.log(`Client ${socket.id} joined competition ${competitionId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Make io available to routes
app.set('io', io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, pool };
