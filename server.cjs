const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Allow all frontend origins (simpler)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true
}));

app.use(express.json());

// Your data file on Render server
const DATA_FILE = path.join(__dirname, 'registrations.json');
console.log('📁 Data file location:', DATA_FILE);

// ========== HELPER FUNCTIONS ==========
function initializeDataFile() {
  if (!fs.existsSync(DATA_FILE)) {
    console.log('📄 Creating new data file...');
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
  }
}

function readAllRegistrations() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return [];
    }
    const content = fs.readFileSync(DATA_FILE, 'utf8').trim();
    return content ? JSON.parse(content) : [];
  } catch (error) {
    console.error('❌ Error reading file:', error);
    return [];
  }
}

function saveRegistration(newData) {
  try {
    const allData = readAllRegistrations();
    allData.push(newData);
    fs.writeFileSync(DATA_FILE, JSON.stringify(allData, null, 2));
    console.log('✅ Saved registration #', allData.length);
    return true;
  } catch (error) {
    console.error('❌ Error saving:', error);
    return false;
  }
}

// Initialize on startup
initializeDataFile();

// ========== API ENDPOINTS ==========

// 🎯 1. MAIN REGISTRATION ENDPOINT
app.post('/api/register', (req, res) => {
  try {
    const { identifier, phone, projectId } = req.body;
    
    console.log('📝 New registration:', { identifier, phone, projectId });
    
    // Validation
    if (!identifier || !phone) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email/Roll number and phone are required' 
      });
    }
    
    // Create registration object
    const registration = {
      id: Date.now(),
      identifier: identifier.toLowerCase().trim(),
      phone: phone.trim(),
      projectId: projectId || null,
      timestamp: new Date().toISOString(),
      ip: req.ip || req.headers['x-forwarded-for'] || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown'
    };
    
    // Save to file
    const saved = saveRegistration(registration);
    
    if (!saved) {
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to save registration' 
      });
    }
    
    // Success response
    res.json({ 
      success: true, 
      message: 'Registration successful!',
      data: registration,
      registrationId: registration.id
    });
    
  } catch (error) {
    console.error('💥 Registration error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during registration' 
    });
  }
});

// 🔍 2. VIEW ALL REGISTRATIONS (Admin/Verify)
app.get('/api/registrations', (req, res) => {
  try {
    const data = readAllRegistrations();
    
    res.json({
      success: true,
      count: data.length,
      data: data
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error reading data' 
    });
  }
});

// 📊 3. GET STATISTICS
app.get('/api/stats', (req, res) => {
  try {
    const data = readAllRegistrations();
    
    const stats = {
      total: data.length,
      withProject: data.filter(d => d.projectId).length,
      withoutProject: data.filter(d => !d.projectId).length,
      uniqueUsers: new Set(data.map(d => d.identifier)).size,
      last24Hours: data.filter(d => {
        const regTime = new Date(d.timestamp);
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return regTime > oneDayAgo;
      }).length
    };
    
    res.json({
      success: true,
      stats: stats,
      lastUpdated: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error calculating stats' 
    });
  }
});

// 📥 4. DOWNLOAD AS CSV (For Excel)
app.get('/api/download', (req, res) => {
  try {
    const data = readAllRegistrations();
    
    if (data.length === 0) {
      return res.json({ 
        success: false, 
        message: 'No data available to download' 
      });
    }
    
    // Create CSV
    let csv = 'ID,Identifier,Phone,Project ID,Timestamp,IP Address\n';
    
    data.forEach(item => {
      csv += `"${item.id}","${item.identifier}","${item.phone}","${item.projectId || 'None'}","${item.timestamp}","${item.ip}"\n`;
    });
    
    res.header('Content-Type', 'text/csv');
    res.attachment('winter-projects-registrations.csv');
    res.send(csv);
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error generating download' 
    });
  }
});

// 🏥 5. HEALTH CHECK
app.get('/api/health', (req, res) => {
  const data = readAllRegistrations();
  
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    registrationsCount: data.length,
    serverTime: new Date().toLocaleString(),
    uptime: process.uptime()
  });
});

// 🌐 6. WEB VIEW (Nice HTML table)
app.get('/admin/view', (req, res) => {
  try {
    const data = readAllRegistrations();
    
    let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Winter Projects - Registrations</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { color: #1a6b4f; }
        table { border-collapse: collapse; width: 100%; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #f0f9f5; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .stats { background: #f0f9f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .download-btn { 
          background: #1a6b4f; color: white; padding: 10px 20px; 
          text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0;
        }
      </style>
    </head>
    <body>
      <h1>📋 Winter Projects Registrations</h1>
      
      <div class="stats">
        <strong>📊 Statistics:</strong><br>
        • Total Registrations: ${data.length}<br>
        • With Project: ${data.filter(d => d.projectId).length}<br>
        • Unique Users: ${new Set(data.map(d => d.identifier)).size}<br>
        • <a href="/api/download" class="download-btn">📥 Download CSV</a>
        • <a href="/api/registrations" class="download-btn">📊 View JSON</a>
      </div>
      
      <table>
        <tr>
          <th>ID</th><th>Identifier</th><th>Phone</th><th>Project</th><th>Timestamp</th>
        </tr>
    `;
    
    data.forEach(item => {
      html += `
        <tr>
          <td>${item.id}</td>
          <td>${item.identifier}</td>
          <td>${item.phone}</td>
          <td>${item.projectId || '—'}</td>
          <td>${new Date(item.timestamp).toLocaleString()}</td>
        </tr>
      `;
    });
    
    html += `
      </table>
      <p style="margin-top: 30px; color: #666;">
        Last updated: ${new Date().toLocaleString()}<br>
        <small>Total records: ${data.length}</small>
      </p>
    </body>
    </html>
    `;
    
    res.send(html);
    
  } catch (error) {
    res.send('<h2>Error loading data</h2><p>' + error.message + '</p>');
  }
});

// ========== START SERVER ==========
app.listen(PORT, '0.0.0.0', () => {
  const initialData = readAllRegistrations();
  console.log(`
  🚀 Winter Projects Backend Started!
  ==================================
  📍 Port: ${PORT}
  📁 Data file: ${DATA_FILE}
  📊 Existing registrations: ${initialData.length}
  
  🔗 API Endpoints:
  • Health: http://localhost:${PORT}/api/health
  • Register: http://localhost:${PORT}/api/register
  • View all: http://localhost:${PORT}/api/registrations
  • Web view: http://localhost:${PORT}/admin/view
  • Download CSV: http://localhost:${PORT}/api/download
  
  ✅ Ready to accept registrations!
  `);
});
// Add this to your existing server.cjs (anywhere before app.listen)
app.get('/admin/view', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8') || '[]');
    
    let html = `<h1>Winter Projects Registrations (${data.length})</h1>`;
    html += `<table border="1"><tr><th>ID</th><th>Identifier</th><th>Phone</th><th>Project</th><th>Time</th></tr>`;
    
    data.forEach(item => {
      html += `<tr>
        <td>${item.id}</td>
        <td>${item.identifier}</td>
        <td>${item.phone}</td>
        <td>${item.projectId || '—'}</td>
        <td>${new Date(item.timestamp).toLocaleString()}</td>
      </tr>`;
    });
    
    html += `</table>`;
    res.send(html);
    
  } catch (error) {
    res.send('Error: ' + error.message);
  }
});