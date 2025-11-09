const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// ===== Middleware =====
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== MongoDB Connection =====
// (clean, no deprecated options)
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Error:', err));

// ===== Routes =====
app.use('/api/projects', require('./routes/projects'));
app.use('/api/contact', require('./routes/contact'));

// ===== Root route =====
app.get('/', (req, res) => {
  res.json({
    activeStatus: true,
    message: 'Portfolio Backend Active ✅',
  });
});

// ===== Health check route =====
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running ✅' });
});

// ===== Export app (for Vercel) =====
module.exports = app;

// ===== Local server (optional for local testing) =====
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`🚀 Server running locally on port ${PORT}`));
}
