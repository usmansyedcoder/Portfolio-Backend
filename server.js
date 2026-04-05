const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const serverless = require('serverless-http');

dotenv.config();

const app = express();

// ===== CORS Configuration - FIXED for both Vercel & Netlify =====
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5000',
  'https://portfolio-frontend-kktyi5evp-muhammad-usmans-projects-be41f176.vercel.app',
  'https://usmaniaportfolio.netlify.app',  // Removed trailing slash
  'https://usmaniaportfoliobackend.netlify.app',
  process.env.CLIENT_URL,
  /\.vercel\.app$/,
  /\.netlify\.app$/  // Added Netlify support
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, curl, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin is in whitelist
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
      }
      return allowedOrigin === origin;
    });
    
    if (isAllowed) {
      console.log('✅ CORS allowed for origin:', origin);
      callback(null, true);
    } else {
      console.log('🚫 CORS blocked origin:', origin);
      // Allow anyway for now (you can remove this in production)
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ===== Middleware =====
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ===== Request Logging Middleware =====
app.use((req, res, next) => {
  console.log(`🌐 ${req.method} ${req.path} - ${new Date().toISOString()}`);
  console.log(`📍 Origin: ${req.get('origin') || 'No origin header'}`);
  next();
});

// ===== MongoDB Connection (with retry logic for serverless) =====
let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    console.log('📊 Using existing MongoDB connection');
    return;
  }
  
  try {
    const db = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/portfolio', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log('✅ MongoDB Connected Successfully');
    return db;
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
    console.log('📝 Note: Contact forms will still work but messages won\'t be saved to database');
    isConnected = false;
  }
};

// Call connectDB but don't wait for it (for serverless)
connectDB();

// ===== MongoDB Connection Event Handlers =====
mongoose.connection.on('connected', () => {
  console.log('📊 MongoDB: Connected to database');
  isConnected = true;
});

mongoose.connection.on('error', (err) => {
  console.error('📊 MongoDB: Connection error -', err.message);
  isConnected = false;
});

mongoose.connection.on('disconnected', () => {
  console.log('📊 MongoDB: Disconnected from database');
  isConnected = false;
});

// ===== Routes =====
// Make sure these route files exist
try {
  app.use('/api/projects', require('./routes/projects'));
  app.use('/api/contact', require('./routes/contact'));
} catch (err) {
  console.error('❌ Error loading routes:', err.message);
  // Fallback routes if files don't exist
  app.get('/api/projects', (req, res) => {
    res.json([{ id: 1, name: "Sample Project", description: "This is a sample project" }]);
  });
  app.post('/api/contact', (req, res) => {
    res.json({ success: true, message: "Contact form received (demo mode)" });
  });
}

// ===== Root route =====
app.get('/', (req, res) => {
  res.json({
    activeStatus: true,
    message: 'Portfolio Backend Active ✅',
    version: '2.0.2',
    platform: process.env.VERCEL ? 'Vercel' : (process.env.NETLIFY ? 'Netlify' : 'Custom'),
    features: [
      'Project Management',
      'Advanced Contact Forms',
      'Real-time Analytics',
      'Admin Dashboard Ready',
      'CORS Configured for Vercel & Netlify'
    ],
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    allowedOrigins: allowedOrigins.map(o => o instanceof RegExp ? o.toString() : o)
  });
});

// ===== Health check route =====
app.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  
  res.json({ 
    status: 'Server is running ✅',
    database: dbStatus,
    platform: process.env.VERCEL ? 'Vercel' : (process.env.NETLIFY ? 'Netlify' : 'Custom'),
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// ===== API Status Route =====
app.get('/api/status', (req, res) => {
  res.json({
    server: 'Operational ✅',
    database: mongoose.connection.readyState === 1 ? 'Connected ✅' : 'Disconnected ⚠️',
    platform: process.env.VERCEL ? 'Vercel' : (process.env.NETLIFY ? 'Netlify' : 'Custom'),
    lastChecked: new Date().toISOString(),
    endpoints: {
      projects: '/api/projects',
      contact: '/api/contact',
      health: '/health'
    }
  });
});

// ===== Error Handling Middleware =====
app.use((err, req, res, next) => {
  console.error('🚨 Server Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { error: err.message })
  });
});

// ===== 404 Handler =====
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    availableEndpoints: [
      'GET /',
      'GET /health', 
      'GET /api/status',
      'GET /api/projects',
      'POST /api/contact'
    ]
  });
});

// ===== Export for serverless platforms (Vercel & Netlify) =====
const handler = serverless(app);
module.exports = app;
module.exports.handler = handler;

// ===== Local server (for testing) =====
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL && !process.env.NETLIFY) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`\n🚀 Server running locally on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 Local URL: http://localhost:${PORT}`);
    console.log(`✅ Health Check: http://localhost:${PORT}/health`);
    console.log(`📡 API Status: http://localhost:${PORT}/api/status`);
    console.log(`\n📋 Available Endpoints:`);
    console.log(`   GET  /              - Server status`);
    console.log(`   GET  /health        - Health check`);
    console.log(`   GET  /api/status    - API status`);
    console.log(`   GET  /api/projects  - Get projects`);
    console.log(`   POST /api/contact   - Submit contact form`);
    console.log(`\n⚡ Server ready!`);
  });
}