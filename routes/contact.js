const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');

// Utility function to get client IP
const getClientIP = (req) => {
  return req.ip || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         'Unknown';
};

// Submit contact form
router.post('/', async (req, res) => {
  const { name, email, subject, message } = req.body;
  
  try {
    // ✅ Validate required fields
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // ✅ Validate email format
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address'
      });
    }

    // ✅ Validate field lengths
    if (name.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Name cannot exceed 100 characters'
      });
    }

    if (subject.length > 200) {
      return res.status(400).json({
        success: false,
        message: 'Subject cannot exceed 200 characters'
      });
    }

    if (message.length > 2000) {
      return res.status(400).json({
        success: false,
        message: 'Message cannot exceed 2000 characters'
      });
    }

    // ✅ Get client information
    const clientIP = getClientIP(req);
    const userAgent = req.get('User-Agent') || 'Unknown';

    // ✅ Save to database
    const contact = new Contact({ 
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject.trim(),
      message: message.trim(),
      ipAddress: clientIP,
      userAgent: userAgent
    });

    await contact.save();

    // ✅ Log the message (for debugging)
    console.log('📧 New Contact Message Received:');
    console.log('👤 Name:', name);
    console.log('📨 Email:', email);
    console.log('📝 Subject:', subject);
    console.log('💬 Message:', message.length > 100 ? message.substring(0, 100) + '...' : message);
    console.log('🌐 IP:', clientIP);
    console.log('🆔 Contact ID:', contact._id);
    console.log('⏰ Time:', new Date().toLocaleString());

    // ✅ Success response
    res.status(201).json({ 
      success: true,
      message: 'Thank you! Your message has been sent successfully. I\'ll get back to you soon.',
      data: {
        id: contact._id,
        timestamp: contact.createdAt
      }
    });

  } catch (error) {
    console.error('❌ Contact Form Error:', error);
    
    // ✅ Handle different types of errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: errors.join(', ')
      });
    }
    
    if (error.name === 'MongoError' || error.name === 'MongoServerError') {
      console.log('📧 Contact form received (DB error):', { name, email, subject, message });
      return res.status(201).json({ 
        success: true,
        message: 'Thank you! Your message has been received (database temporarily unavailable).'
      });
    }
    
    // ✅ Generic error response
    res.status(500).json({ 
      success: false,
      message: 'Failed to send message. Please try again later or contact me directly at usmansyedcoder@gmail.com'
    });
  }
});

// Get all messages (for admin dashboard)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, sort = '-createdAt' } = req.query;
    
    // Build filter
    const filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    // Get messages with pagination
    const messages = await Contact.find(filter)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-__v');
    
    // Get total count for pagination
    const total = await Contact.countDocuments(filter);
    
    res.json({
      success: true,
      data: messages,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
    
  } catch (error) {
    console.error('❌ Get Messages Error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch messages'
    });
  }
});

// Get message statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await Contact.getStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('❌ Get Stats Error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
});

// Get single message by ID
router.get('/:id', async (req, res) => {
  try {
    const message = await Contact.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }
    
    res.json({
      success: true,
      data: message
    });
    
  } catch (error) {
    console.error('❌ Get Message Error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch message'
    });
  }
});

// Update message status (mark as read, replied, etc.)
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['new', 'read', 'replied', 'archived'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }
    
    const message = await Contact.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }
    
    res.json({
      success: true,
      data: message,
      message: `Message marked as ${status}`
    });
    
  } catch (error) {
    console.error('❌ Update Status Error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update message status'
    });
  }
});

// Delete message
router.delete('/:id', async (req, res) => {
  try {
    const message = await Contact.findByIdAndDelete(req.params.id);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
    
  } catch (error) {
    console.error('❌ Delete Message Error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to delete message'
    });
  }
});

module.exports = router;