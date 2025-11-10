const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');
const sendEmail = require('../utils/sendEmail');

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

    // ✅ Send email notification
    // ✅ Send email notification
    try {
      const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #00d4ff 0%, #00a8cc 100%);
          color: white;
          padding: 30px;
          border-radius: 10px 10px 0 0;
          text-align: center;
        }
        .content {
          background: #f9f9f9;
          padding: 30px;
          border: 1px solid #ddd;
          border-radius: 0 0 10px 10px;
        }
        .info-row {
          margin-bottom: 15px;
          padding: 10px;
          background: white;
          border-left: 4px solid #00d4ff;
          border-radius: 5px;
        }
        .label {
          font-weight: bold;
          color: #00a8cc;
          display: inline-block;
          width: 100px;
        }
        .value {
          color: #333;
        }
        .message-box {
          background: white;
          padding: 20px;
          border-radius: 5px;
          margin-top: 20px;
          white-space: pre-wrap;
          border: 1px solid #ddd;
        }
        .footer {
          text-align: center;
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          color: #666;
          font-size: 12px;
        }
        .metadata {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          font-size: 12px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 style="margin: 0;">🎉 New Contact Message!</h1>
        <p style="margin: 10px 0 0 0;">Someone just contacted you through your portfolio</p>
      </div>
      <div class="content">
        <div class="info-row">
          <span class="label">👤 Name:</span>
          <span class="value">${name}</span>
        </div>
        <div class="info-row">
          <span class="label">📧 Email:</span>
          <span class="value"><a href="mailto:${email}">${email}</a></span>
        </div>
        <div class="info-row">
          <span class="label">📝 Subject:</span>
          <span class="value">${subject}</span>
        </div>
        <div class="info-row">
          <span class="label">⏰ Time:</span>
          <span class="value">${new Date().toLocaleString('en-PK', {
        timeZone: 'Asia/Karachi',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      })}</span>
        </div>
        
        <h3 style="color: #00a8cc; margin-top: 30px;">💬 Message:</h3>
        <div class="message-box">${message}</div>
        
        <div class="metadata">
          <strong>📊 Contact Details:</strong><br>
          🆔 ID: ${contact._id}<br>
          🌐 IP Address: ${clientIP}<br>
          🖥️ User Agent: ${userAgent}
        </div>
      </div>
      <div class="footer">
        <p>This email was sent from your portfolio contact form</p>
        <p>Reply directly to this email to respond to ${name}</p>
      </div>
    </body>
    </html>
  `;

      await sendEmail({
        subject: `📧 Portfolio Contact: ${subject}`,
        html: emailHtml,
        replyTo: email
      });

      console.log('✅ Email notification sent successfully');
    } catch (emailError) {
      console.error('⚠️ Email sending failed (contact saved to DB):', emailError.message);
      // Don't fail the request if email fails - contact is already saved
    }

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
