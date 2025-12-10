const express = require('express');
const cors = require('cors');
const axios = require('axios'); // Install with: npm install axios

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Google Sheets Web App URL (replace with your URL)
const GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/AKfycbz5G5PwPJIw-hRqaMeKKT0nzp_L1K0gAWsWJaaBAZoRG2f2T7_-NlMs71U3PD8yMAxj/exec';

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
    
    // Fallback: Save locally if Google Sheets fails
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
    }
    
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    data.push({
      ...sheetData,
      backup: true
    });
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    
    res.json({ 
      success: true, 
      message: 'Registration saved locally',
      data: sheetData 
    });
  }
});