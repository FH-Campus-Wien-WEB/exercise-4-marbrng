// Load .env file into process.env
require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });

// Load configuration from environment variables
module.exports = {
  port: Number.parseInt(process.env.PORT || '3000', 10),
  omdbApiKey: process.env.OMDB_API_KEY || '',
  sessionSecret: process.env.SESSION_SECRET || 'your-secret-key',
  omdbTimeoutMs: 5000 // 5 second timeout for external API calls
};
