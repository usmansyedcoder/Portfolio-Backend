const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');
const sendEmail = require('../utils/sendEmail');

// Submit contact form
router.post('/', async (req, res) => {
  const { name, email, message } = req.body;
  
  try {
    // Save to database
    const contact = new Contact({ name, email, message });
    await contact.save();

    // Prepare email content
    const emailHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .header {
            background-color: #1a1a2e;
            color: #00d4ff;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
          }
          .content {
            background-color: white;
            padding: 30px;
            border-radius: 0 0 5px 5px;
          }
          .info-row {
            margin: 15px 0;
            padding: 10px;
            background-color: #f9f9f9;
            border-left: 4px solid #00d4ff;
          }
          .label {
            font-weight: bold;
            color: #1a1a2e;
          }
          .message-box {
            background-color: #f9f9f9;
            padding: 20px;
            border-radius: 5px;
            margin-top: 20px;
            border: 1px solid #ddd;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            color: #666;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>New Contact Form Submission</h2>
          </div>
          <div class="content">
            <p>You have received a new message from your portfolio contact form:</p>
            
            <div class="info-row">
              <span class="label">Name:</span> ${name}
            </div>
            
            <div class="info-row">
              <span class="label">Email:</span> ${email}
            </div>
            
            <div class="info-row">
              <span class="label">Date:</span> ${new Date().toLocaleString()}
            </div>
            
            <div class="message-box">
              <p class="label">Message:</p>
              <p>${message}</p>
            </div>
            
            <p style="margin-top: 20px;">
              <strong>Reply to this message by emailing:</strong> 
              <a href="mailto:${email}">${email}</a>
            </p>
          </div>
          <div class="footer">
            <p>This email was sent from your portfolio contact form</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email notification
    await sendEmail({
      subject: `Portfolio Contact: Message from ${name}`,
      html: emailHTML,
      replyTo: email,
    });

    res.status(201).json({ 
      success: true,
      message: 'Message sent successfully! We will get back to you soon.' 
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to send message. Please try again later.' 
    });
  }
});

// Get all messages (for admin)
router.get('/', async (req, res) => {
  try {
    const messages = await Contact.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
