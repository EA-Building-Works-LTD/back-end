require('dotenv').config();

/**
 * Server configuration
 * Centralizes all environment variables and configuration settings
 */
const config = {
  // Server settings
  server: {
    port: process.env.PORT || 5000,
    env: process.env.NODE_ENV || 'development',
    corsOrigin: process.env.CORS_ORIGIN || '*',
  },
  
  // Database settings
  database: {
    mongoUri: process.env.MONGODB_URI || 'mongodb+srv://gabuildersltd24:Ehsaan123123@cluster0.ttcdr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  },
  
  // Authentication settings
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
    jwtExpiration: process.env.JWT_EXPIRATION || '1d',
    saltRounds: 10,
  },
  
  // Google API settings
  google: {
    spreadsheetId: process.env.SPREADSHEET_ID,
    serviceAccountKey: process.env.GOOGLE_SERVICE_ACCOUNT_KEY,
  },
  
  // Firebase settings
  firebase: {
    serviceAccountKey: process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
    databaseUrl: process.env.FIREBASE_DATABASE_URL,
  },
  
  // File upload settings
  upload: {
    maxFileSize: process.env.MAX_FILE_SIZE || 5 * 1024 * 1024, // 5MB
    allowedFileTypes: ['image/jpeg', 'image/png', 'application/pdf'],
    uploadDir: process.env.UPLOAD_DIR || 'uploads/',
  },
  
  // Logging settings
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'combined',
  },
};

// Validate required configuration
const validateConfig = () => {
  const requiredVars = [
    'database.mongoUri',
    'auth.jwtSecret',
    'google.spreadsheetId',
    'google.serviceAccountKey',
  ];
  
  const missingVars = requiredVars.filter(path => {
    const keys = path.split('.');
    let current = config;
    for (const key of keys) {
      if (current[key] === undefined || current[key] === null || current[key] === '') {
        return true;
      }
      current = current[key];
    }
    return false;
  });
  
  if (missingVars.length > 0) {
    console.warn(`Missing required configuration variables: ${missingVars.join(', ')}`);
    if (config.server.env === 'production') {
      throw new Error('Missing required configuration for production environment');
    }
  }
};

// Only validate in production to allow development without all variables
if (config.server.env === 'production') {
  validateConfig();
}

module.exports = config; 