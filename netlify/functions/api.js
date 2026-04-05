const serverless = require('serverless-http');
const app = require('../../server');

// Export the handler for Netlify
exports.handler = serverless(app);