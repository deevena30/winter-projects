const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 5000;

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection error:', err);
  } else {
    console.log('✅ Database connected:', res.rows[0].now);
  }
});

// Initialize database table
async function initializeDatabase() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS registrations (
      id SERIAL PRIMARY KEY,
      identifier VARCHAR(255) NOT NULL,
      email VARCHAR(255),
      roll_number VARCHAR(50),
      phone VARCHAR(15) NOT NULL,
      project_ids TEXT[],
      password_hash VARCHAR(255),
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      ip VARCHAR(100),
      user_agent TEXT,
      UNIQUE(identifier)
    );
    
    CREATE INDEX IF NOT EXISTS idx_identifier ON registrations(identifier);
    CREATE INDEX IF NOT EXISTS idx_email ON registrations(email);
    CREATE INDEX IF NOT EXISTS idx_roll_number ON registrations(roll_number);
  `;
  
  try {
    await pool.query(createTableQuery);
    console.log('✅ Database table ready');
  } catch (error) {
    console.error('❌ Error creating table:', error);
  }
}

initializeDatabase();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));

app.use(express.json());

// ========== API ENDPOINTS ==========

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Winter Projects API',
    status: 'running',
    endpoints: {
      health: '/api/health',
      register: 'POST /api/register',
      getUser: 'GET /api/user/:identifier',
      allRegistrations: '/api/registrations',
      stats: '/api/stats',
      download: '/api/download',
      adminView: '/admin/view'
    }
  });
});

// 🎯 1. REGISTER/UPDATE USER
app.post('/api/register', async (req, res) => {
  try {
    const { identifier, email, rollNumber, phone, projectId, password } = req.body;
    
    console.log('📝 Registration:', { identifier, email, rollNumber, phone, projectId });
    
    if (!identifier || !phone) {
      return res.status(400).json({ 
        success: false, 
        message: 'Identifier and phone are required' 
      });
    }
    
    const normalizedIdentifier = identifier.toLowerCase().trim();
    const normalizedEmail = email ? email.toLowerCase().trim() : null;
    const normalizedRollNumber = rollNumber ? rollNumber.trim() : null;
    
    // Validate that at least one of email or roll number is provided
    if (!normalizedEmail && !normalizedRollNumber) {
      return res.status(400).json({
        success: false,
        message: 'Please provide either email or roll number'
      });
    }
    
    // Validate IITB email if provided
    if (normalizedEmail && !normalizedEmail.endsWith('@iitb.ac.in') && 
        !normalizedEmail.endsWith('@iitbhu.ac.in') && !normalizedEmail.endsWith('@itbhu.ac.in')) {
      return res.status(400).json({
        success: false,
        message: 'Please use IITB/IITBHU email address'
      });
    }
    
    // Check if user exists
    const checkUser = await pool.query(
      'SELECT * FROM registrations WHERE identifier = $1 OR email = $2 OR roll_number = $3',
      [normalizedIdentifier, normalizedEmail, normalizedRollNumber]
    );
    
    if (checkUser.rows.length > 0) {
      // User exists - update project IDs and other info
      const existingUser = checkUser.rows[0];
      const existingProjects = existingUser.project_ids || [];
      const updatedProjects = projectId 
        ? [...new Set([...existingProjects, projectId])]
        : existingProjects;
      
      await pool.query(
        `UPDATE registrations 
         SET project_ids = $1, 
             phone = $2, 
             email = COALESCE($3, email),
             roll_number = COALESCE($4, roll_number)
         WHERE identifier = $5 OR email = $3 OR roll_number = $4`,
        [updatedProjects, phone.trim(), normalizedEmail, normalizedRollNumber, normalizedIdentifier]
      );
      
      return res.json({
        success: true,
        message: 'Registration updated!',
        data: {
          identifier: normalizedIdentifier,
          email: normalizedEmail,
          rollNumber: normalizedRollNumber,
          phone: phone.trim(),
          projectIds: updatedProjects
        }
      });
    }
    
    // New user - insert
    const projectIds = projectId ? [projectId] : [];
    
    await pool.query(
      `INSERT INTO registrations (identifier, email, roll_number, phone, project_ids, password_hash, ip, user_agent) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        normalizedIdentifier,
        normalizedEmail,
        normalizedRollNumber,
        phone.trim(),
        projectIds,
        password || null,
        req.ip || req.headers['x-forwarded-for'] || 'unknown',
        req.headers['user-agent'] || 'unknown'
      ]
    );
    
    res.json({
      success: true,
      message: 'Registration successful!',
      data: {
        identifier: normalizedIdentifier,
        email: normalizedEmail,
        rollNumber: normalizedRollNumber,
        phone: phone.trim(),
        projectIds
      }
    });
    
  } catch (error) {
    console.error('💥 Registration error:', error);
    
    // Handle duplicate key error
    if (error.code === '23505') { // unique_violation
      return res.status(400).json({
        success: false,
        message: 'Email or roll number already registered'
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Server error during registration',
      error: error.message
    });
  }
});

// 🔍 2. GET USER DATA
app.get('/api/user/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    const normalizedIdentifier = identifier.toLowerCase().trim();
    
    const result = await pool.query(
      `SELECT identifier, email, roll_number, phone, project_ids, timestamp 
       FROM registrations 
       WHERE identifier = $1 OR email = $1 OR roll_number = $1`,
      [normalizedIdentifier]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const user = result.rows[0];
    
    res.json({
      success: true,
      data: {
        identifier: user.identifier,
        email: user.email,
        rollNumber: user.roll_number,
        phone: user.phone,
        projectIds: user.project_ids || [],
        registeredAt: user.timestamp
      }
    });
    
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user data'
    });
  }
});

// 📊 3. GET ALL REGISTRATIONS (Admin)
app.get('/api/registrations', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, identifier, email, roll_number, phone, project_ids, timestamp 
       FROM registrations 
       ORDER BY timestamp DESC`
    );
    
    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
    
  } catch (error) {
    console.error('Error fetching registrations:', error);
    res.status(500).json({
      success: false,
      message: 'Error reading data'
    });
  }
});

// 📈 4. GET STATISTICS
app.get('/api/stats', async (req, res) => {
  try {
    const totalResult = await pool.query('SELECT COUNT(*) as count FROM registrations');
    const withProjectResult = await pool.query(
      'SELECT COUNT(*) as count FROM registrations WHERE array_length(project_ids, 1) > 0'
    );
    const last24Result = await pool.query(
      "SELECT COUNT(*) as count FROM registrations WHERE timestamp > NOW() - INTERVAL '24 hours'"
    );
    
    // Get project distribution
    const projectDistribution = await pool.query(`
      SELECT unnest(project_ids) as project_id, COUNT(*) as count 
      FROM registrations 
      WHERE array_length(project_ids, 1) > 0
      GROUP BY project_id
      ORDER BY count DESC
    `);
    
    // Get registration by identifier type
    const emailCount = await pool.query(
      "SELECT COUNT(*) as count FROM registrations WHERE email IS NOT NULL"
    );
    
    const rollNumberCount = await pool.query(
      "SELECT COUNT(*) as count FROM registrations WHERE roll_number IS NOT NULL"
    );
    
    res.json({
      success: true,
      stats: {
        total: parseInt(totalResult.rows[0].count),
        withProject: parseInt(withProjectResult.rows[0].count),
        withoutProject: parseInt(totalResult.rows[0].count) - parseInt(withProjectResult.rows[0].count),
        last24Hours: parseInt(last24Result.rows[0].count),
        emailUsers: parseInt(emailCount.rows[0].count),
        rollNumberUsers: parseInt(rollNumberCount.rows[0].count),
        projectDistribution: projectDistribution.rows
      },
      lastUpdated: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error calculating stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating stats'
    });
  }
});

// 📥 5. DOWNLOAD CSV
app.get('/api/download', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, identifier, email, roll_number, phone, project_ids, timestamp, ip, user_agent
       FROM registrations 
       ORDER BY timestamp DESC`
    );
    
    if (result.rows.length === 0) {
      return res.json({ 
        success: false, 
        message: 'No data available' 
      });
    }
    
    let csv = 'ID,Identifier,Email,Roll Number,Phone,Project IDs,Timestamp,IP Address,User Agent\n';
    
    result.rows.forEach(item => {
      const projectIds = (item.project_ids || []).join(';');
      csv += `"${item.id}","${item.identifier}","${item.email || ''}","${item.roll_number || ''}","${item.phone}","${projectIds}","${item.timestamp}","${item.ip || 'N/A'}","${item.user_agent || 'N/A'}"\n`;
    });
    
    res.header('Content-Type', 'text/csv');
    res.attachment('winter-projects-registrations.csv');
    res.send(csv);
    
  } catch (error) {
    console.error('Error generating CSV:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating download'
    });
  }
});

// 🏥 6. HEALTH CHECK
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT COUNT(*) as count FROM registrations');
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      registrationsCount: parseInt(result.rows[0].count),
      database: 'connected',
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

// 🌐 7. WEB VIEW (Admin) - Updated to show email and roll number
app.get('/admin/view', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, identifier, email, roll_number, phone, project_ids, timestamp 
       FROM registrations 
       ORDER BY timestamp DESC`
    );
    
    const data = result.rows;
    
    let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Winter Projects - Registrations</title>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
          background: #f5f7fa;
          padding: 20px;
        }
        .container { max-width: 1400px; margin: 0 auto; }
        h1 { 
          color: #1a6b4f; 
          margin-bottom: 30px;
          font-size: 2.5em;
        }
        .stats-grid { 
          display: grid; 
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
        .stat-card {
          background: white;
          padding: 20px;
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .stat-number {
          font-size: 2em;
          font-weight: bold;
          color: #1a6b4f;
        }
        .stat-label {
          color: #666;
          margin-top: 5px;
        }
        .actions {
          margin-bottom: 20px;
        }
        .btn { 
          background: #1a6b4f; 
          color: white; 
          padding: 12px 24px; 
          text-decoration: none; 
          border-radius: 6px; 
          display: inline-block; 
          margin-right: 10px;
          font-weight: 600;
          transition: background 0.3s;
        }
        .btn:hover { background: #145a40; }
        .btn-secondary {
          background: #4a90e2;
        }
        .btn-secondary:hover {
          background: #357abd;
        }
        table { 
          width: 100%; 
          background: white;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        th, td { 
          padding: 15px; 
          text-align: left; 
          border-bottom: 1px solid #e0e0e0;
        }
        th { 
          background: #1a6b4f; 
          color: white;
          font-weight: 600;
        }
        tr:hover { background: #f9f9f9; }
        .project-badge {
          display: inline-block;
          background: #e3f2fd;
          color: #1976d2;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.85em;
          margin: 2px;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          color: #666;
          font-size: 0.9em;
        }
        .email-cell { font-family: monospace; font-size: 0.9em; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>📋 Winter Projects Registrations</h1>
        
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-number">${data.length}</div>
            <div class="stat-label">Total Registrations</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${data.filter(d => d.project_ids && d.project_ids.length > 0).length}</div>
            <div class="stat-label">With Projects</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${new Set(data.map(d => d.identifier)).size}</div>
            <div class="stat-label">Unique Users</div>
          </div>
        </div>
        
        <div class="actions">
          <a href="/api/download" class="btn">📥 Download CSV</a>
          <a href="/api/registrations" class="btn btn-secondary">📊 View JSON</a>
          <a href="/api/stats" class="btn btn-secondary">📈 Statistics</a>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Identifier</th>
              <th>Email</th>
              <th>Roll Number</th>
              <th>Phone</th>
              <th>Project IDs</th>
              <th>Registered At</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    data.forEach(item => {
      const projectBadges = (item.project_ids || [])
        .map(pid => `<span class="project-badge">${pid}</span>`)
        .join('');
      
      html += `
        <tr>
          <td>${item.id}</td>
          <td>${item.identifier}</td>
          <td class="email-cell">${item.email || '—'}</td>
          <td>${item.roll_number || '—'}</td>
          <td>${item.phone}</td>
          <td>${projectBadges || '—'}</td>
          <td>${new Date(item.timestamp).toLocaleString()}</td>
        </tr>
      `;
    });
    
    html += `
          </tbody>
        </table>
        
        <div class="footer">
          <p>Last updated: ${new Date().toLocaleString()}</p>
          <p><small>Total records: ${data.length}</small></p>
        </div>
      </div>
    </body>
    </html>
    `;
    
    res.send(html);
    
  } catch (error) {
    res.status(500).send(`
      <h2>Error loading data</h2>
      <p>${error.message}</p>
    `);
  }
});

// ========== START SERVER ==========
app.listen(PORT, '0.0.0.0', async () => {
  try {
    const result = await pool.query('SELECT COUNT(*) as count FROM registrations');
    console.log(`
  🚀 Winter Projects Backend Started!
  ==================================
  📍 Port: ${PORT}
  💾 Database: PostgreSQL
  📊 Existing registrations: ${result.rows[0].count}
  
  🔗 Endpoints Available:
  • Root: /
  • Health: /api/health
  • Register: POST /api/register
  • Get user: GET /api/user/:identifier
  • View all: /api/registrations
  • Stats: /api/stats
  • Admin view: /admin/view
  • Download: /api/download
  
  ✅ Ready!
    `);
  } catch (error) {
    console.error('❌ Startup error:', error);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  pool.end();
  process.exit(0);
});

module.exports = app;