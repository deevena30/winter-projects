const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Configure CORS for your frontend domains
const corsOptions = {
  origin: [
    'http://localhost:3000',  // React dev server
    'http://localhost:5173',  // Vite dev server
    'https://winter-projects.vercel.app',  // Your Vercel frontend
    // Add other production URLs as needed
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// Google Sheets Web App URL
const GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/AKfycbxNVnbDryws5ZwOJFqw9EUhk2YNOiXKBsLPB1v0lfvD26Il2iLzNCTwrRs-Y9VkYHf6/exec';

// Define DATA_FILE for fallback storage
const DATA_FILE = path.join(__dirname, 'registrations.json');

// Initialize data file if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
}

// Helper function to read data
const readDataFile = () => {
  try {
    const content = fs.readFileSync(DATA_FILE, 'utf8').trim();
    return content ? JSON.parse(content) : [];
  } catch (error) {
    console.error('Error reading data file:', error);
    return [];
  }
};

// Helper function to write data
const writeDataFile = (data) => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing data file:', error);
    return false;
  }
};

// Custom axios instance with redirect handling
const axiosWithRedirects = axios.create({
  maxRedirects: 5,
  timeout: 30000,
  headers: {
    'User-Agent': 'WinterProjects-Backend/1.0'
  },
  // Handle redirects properly
  maxContentLength: Infinity,
  maxBodyLength: Infinity
});

// Main registration endpoint - FIXED VERSION
app.post('/api/register', async (req, res) => {
  try {
    const { identifier, phone, projectId } = req.body;
    
    console.log('📝 Registration attempt:', { identifier, phone, projectId });
    
    // Basic validation
    if (!identifier || !phone) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }
    
    // Prepare data for Google Sheets
    const sheetData = {
      id: Date.now(),
      identifier: identifier.toLowerCase(),
      phone,
      projectId: projectId || 'none',
      timestamp: new Date().toISOString(),
      ip: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown'
    };
    
    console.log('📤 Sending to Google Sheets:', sheetData);
    
    try {
      // FIX: Send to Google Sheets with proper redirect handling
      const response = await axiosWithRedirects.post(GOOGLE_SHEET_URL, sheetData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Google Sheets response status:', response.status);
      console.log('✅ Google Sheets response data:', response.data);
      
      // Also save locally as backup
      const localData = readDataFile();
      localData.push({
        ...sheetData,
        savedToGoogle: true,
        googleResponse: response.data,
        googleStatus: response.status
      });
      writeDataFile(localData);
      
      res.json({ 
        success: true, 
        message: 'Registration successful',
        data: sheetData,
        googleSheetsStatus: 'sent'
      });
      
    } catch (googleError) {
      console.error('❌ Google Sheets error:', googleError.message);
      console.error('❌ Error details:', {
        code: googleError.code,
        status: googleError.response?.status,
        data: googleError.response?.data,
        headers: googleError.response?.headers
      });
      
      // Save locally as fallback
      const localData = readDataFile();
      localData.push({
        ...sheetData,
        savedToGoogle: false,
        googleError: googleError.message,
        backup: true
      });
      writeDataFile(localData);
      
      res.json({ 
        success: true, 
        message: 'Registration saved locally',
        data: sheetData,
        warning: 'Google Sheets may not have received data',
        errorDetails: googleError.message
      });
    }
    
  } catch (error) {
    console.error('💥 General registration error:', error);
    
    // Last resort: try to save something
    try {
      const { identifier = 'unknown', phone = 'unknown', projectId = 'none' } = req.body || {};
      const localData = readDataFile();
      localData.push({
        id: Date.now(),
        identifier: identifier.toLowerCase(),
        phone,
        projectId,
        timestamp: new Date().toISOString(),
        ip: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
        error: error.message,
        emergencyBackup: true
      });
      writeDataFile(localData);
    } catch (fsError) {
      console.error('💀 Failed to save even locally:', fsError);
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'Winter Projects Registration API',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    googleSheetsUrl: GOOGLE_SHEET_URL
  });
});

// View all registrations
app.get('/api/registrations', (req, res) => {
  try {
    const data = readDataFile();
    res.json({ 
      success: true, 
      count: data.length, 
      data 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error reading data',
      error: error.message 
    });
  }
});

// Download registrations as CSV
app.get('/api/download', (req, res) => {
  try {
    const data = readDataFile();
    
    if (data.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'No data available' 
      });
    }
    
    // Create CSV header
    let csv = 'ID,Identifier,Phone,Project ID,Timestamp,IP Address,User Agent,Saved to Google,Google Status\n';
    
    // Add data rows
    data.forEach(item => {
      const savedStatus = item.savedToGoogle ? 'Yes' : 'No';
      const googleStatus = item.googleStatus || item.googleError || 'Unknown';
      csv += `"${item.id}","${item.identifier}","${item.phone}","${item.projectId}","${item.timestamp}","${item.ip}","${item.userAgent}","${savedStatus}","${googleStatus}"\n`;
    });
    
    res.header('Content-Type', 'text/csv');
    res.attachment('winter-projects-registrations.csv');
    res.send(csv);
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error generating CSV',
      error: error.message 
    });
  }
});

// Clear all data (use with caution - for admin purposes)
app.delete('/api/clear', (req, res) => {
  try {
    // Optional: Add authentication here
    const { adminKey } = req.query;
    
    if (adminKey !== 'winter2025') { // Change this to a secure key
      return res.status(401).json({ 
        success: false, 
        message: 'Unauthorized' 
      });
    }
    
    writeDataFile([]);
    
    res.json({ 
      success: true, 
      message: 'All data cleared',
      count: 0 
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error clearing data',
      error: error.message 
    });
  }
});

// Stats endpoint
app.get('/api/stats', (req, res) => {
  try {
    const data = readDataFile();
    
    const stats = {
      totalRegistrations: data.length,
      withProjectId: data.filter(item => item.projectId && item.projectId !== 'none').length,
      withoutProjectId: data.filter(item => !item.projectId || item.projectId === 'none').length,
      savedToGoogle: data.filter(item => item.savedToGoogle === true).length,
      localOnly: data.filter(item => item.savedToGoogle === false).length,
      uniqueIdentifiers: new Set(data.map(item => item.identifier)).size,
      byProject: {}
    };
    
    // Count by project
    data.forEach(item => {
      const project = item.projectId || 'none';
      stats.byProject[project] = (stats.byProject[project] || 0) + 1;
    });
    
    // Recent registrations (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    stats.recent24h = data.filter(item => new Date(item.timestamp) > oneDayAgo).length;
    
    res.json({ 
      success: true, 
      stats 
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error calculating stats',
      error: error.message 
    });
  }
});

// Test Google Sheets connection with detailed logging
app.get('/api/test-google', async (req, res) => {
  try {
    const testData = {
      id: Date.now(),
      identifier: 'test@iitb.ac.in',
      phone: '9999999999',
      projectId: 'test',
      timestamp: new Date().toISOString(),
      ip: 'test',
      userAgent: 'API Test',
      test: true
    };
    
    console.log('🧪 Testing Google Sheets connection...');
    console.log('📤 Sending test data:', testData);
    
    const response = await axiosWithRedirects.post(GOOGLE_SHEET_URL, testData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Test response:', {
      status: response.status,
      data: response.data,
      headers: response.headers
    });
    
    res.json({ 
      success: true, 
      message: 'Google Sheets connection successful',
      response: {
        status: response.status,
        data: response.data
      },
      testData 
    });
    
  } catch (error) {
    console.error('❌ Google Sheets test failed:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      data: error.response?.data
    });
    
    res.status(500).json({ 
      success: false, 
      message: 'Google Sheets connection failed',
      error: {
        message: error.message,
        code: error.code,
        status: error.response?.status
      },
      googleSheetUrl: GOOGLE_SHEET_URL,
      suggestion: 'Check if script is deployed with "Anyone" access'
    });
  }
});

// NEW: Direct test endpoint that simulates what curl did
app.get('/api/test-google-direct', async (req, res) => {
  try {
    // Simulate the exact curl command that showed 302 redirect
    const testData = {
      test: "data",
      timestamp: "2024-01-15T10:30:00Z"
    };
    
    console.log('🔗 Testing Google Sheets with exact curl data...');
    
    const response = await axiosWithRedirects.post(GOOGLE_SHEET_URL, testData, {
      headers: {
        'Content-Type': 'application/json'
      },
      maxRedirects: 5,
      validateStatus: function (status) {
        // Accept all status codes including 302
        return status >= 200 && status < 600;
      }
    });
    
    console.log('📋 Response details:', {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data
    });
    
    res.json({
      success: true,
      message: 'Test completed',
      result: {
        status: response.status,
        statusText: response.statusText,
        redirected: response.request?.res?.responseUrl !== GOOGLE_SHEET_URL,
        finalUrl: response.request?.res?.responseUrl,
        data: response.data
      }
    });
    
  } catch (error) {
    console.error('Test failed:', error.message);
    res.json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// CRITICAL: Start the server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📝 Register endpoint: http://localhost:${PORT}/api/register`);
  console.log(`🧪 Test Google Sheets: http://localhost:${PORT}/api/test-google`);
  console.log(`🔗 Test direct: http://localhost:${PORT}/api/test-google-direct`);
  console.log(`📁 Local data file: ${DATA_FILE}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Google Sheets URL: ${GOOGLE_SHEET_URL}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🔄 SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('👋 Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🔄 SIGINT received, shutting down...');
  server.close(() => {
    console.log('👋 Server closed');
    process.exit(0);
  });
});

// Error handlers
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
  // Don't exit in production, let it recover
  if (process.env.NODE_ENV === 'production') {
    console.log('🔄 Continuing in production mode...');
  } else {
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
});