const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs'); // Add this import
const path = require('path'); // Add this import

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Google Sheets Web App URL
const GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/AKfycbz5G5PwPJIw-hRqaMeKKT0nzp_L1K0gAWsWJaaBAZoRG2f2T7_-NlMs71U3PD8yMAxj/exec';

// Define DATA_FILE for fallback storage
const DATA_FILE = path.join(__dirname, 'registrations.json');

// Initialize data file if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
}

app.post('/api/register', async (req, res) => {
  try {
    const { identifier, phone, projectId } = req.body;
    
    console.log('Registration attempt:', { identifier, phone, projectId });
    
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
      ip: req.ip || req.headers['x-forwarded-for'] || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown'
    };
    
    // Send to Google Sheets
    const response = await axios.post(GOOGLE_SHEET_URL, sheetData);
    
    console.log('Data sent to Google Sheets:', response.data);
    
    res.json({ 
      success: true, 
      message: 'Registration successful',
      data: sheetData 
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    
    // IMPORTANT: sheetData needs to be defined in the catch block scope
    // Let's reconstruct it here since it's not available in catch scope
    const { identifier, phone, projectId } = req.body || {};
    const sheetData = {
      id: Date.now(),
      identifier: identifier ? identifier.toLowerCase() : 'unknown',
      phone: phone || 'unknown',
      projectId: projectId || 'none',
      timestamp: new Date().toISOString(),
      ip: req.ip || req.headers['x-forwarded-for'] || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
      backup: true
    };
    
    // Fallback: Save locally if Google Sheets fails
    try {
      const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8') || '[]');
      data.push(sheetData);
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
      console.log('Data saved to local file as fallback');
    } catch (fsError) {
      console.error('Failed to save locally:', fsError);
    }
    
    res.json({ 
      success: true, 
      message: 'Registration saved locally (Google Sheets failed)',
      data: sheetData 
    });
  }
});

// Add health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'Winter Projects Registration API'
  });
});

// Add endpoint to view local registrations
app.get('/api/registrations', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8') || '[]');
    res.json({ success: true, count: data.length, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error reading data' });
  }
});

// CRITICAL: Start the server - This was missing!
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});

// Add error handlers for uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});