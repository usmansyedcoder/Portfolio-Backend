const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');

// Admin dashboard stats
router.get('/dashboard', async (req, res) => {
  try {
    const stats = await Contact.getStats();
    
    // Get recent messages
    const recentMessages = await Contact.find()
      .sort('-createdAt')
      .limit(5)
      .select('name email subject status createdAt');
    
    res.json({
      success: true,
      data: {
        stats,
        recentMessages
      }
    });
    
  } catch (error) {
    console.error('❌ Admin Dashboard Error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to load dashboard'
    });
  }
});

module.exports = router;