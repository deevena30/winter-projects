import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import styles from "./styles/SignIn.module.css";

const API_URL = 'https://winter-projects.onrender.com/api';

export default function SignIn() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);
  const [formData, setFormData] = useState({
    identifier: "", 
    phone: "",
    password: "",
    projectId: null,
    projectTitle: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Check if user is already logged in
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setIsLoggedIn(true);
      setUserData(user);
      // Fetch latest data from server
      fetchUserData(user.identifier);
    }
  }, []);

  // Get projectId from URL if redirected
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const projectId = params.get('projectId');
    const projectTitle = params.get('projectTitle');
    if (projectId) {
      setFormData(prev => ({ ...prev, projectId, projectTitle }));
    }
  }, []);

  const fetchUserData = async (identifier) => {
    try {
      const response = await axios.get(`${API_URL}/user/${encodeURIComponent(identifier)}`);
      if (response.data.success) {
        const serverData = response.data.data;
        const updatedUser = {
          identifier: serverData.identifier,
          phone: serverData.phone,
          projectIds: serverData.projectIds || [],
          registeredAt: serverData.registeredAt
        };
        setUserData(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
    }
  };

  const validateIITBEmail = (email) => email.endsWith('@iitb.ac.in') || email.endsWith('@iitbhu.ac.in');
  const validateRollNumber = (roll) => /^\d{2}[A-Z]\d{3,4}$/i.test(roll);
  const validatePhone = (phone) => /^[6-9]\d{9}$/.test(phone);
  const validatePassword = (password) => password.length >= 6;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const { identifier, phone, password, projectId } = formData;

    if (!identifier.trim() || !phone.trim() || !password.trim()) {
      setError("Please fill all fields");
      return;
    }

    const isEmail = identifier.includes('@');
    const isValidIdentifier = isEmail ? validateIITBEmail(identifier) : validateRollNumber(identifier);

    if (!isValidIdentifier) {
      setError(isEmail ? "Please use IITB email" : "Invalid roll number format");
      return;
    }

    if (!validatePhone(phone)) {
      setError("Enter valid 10-digit phone number");
      return;
    }

    if (!validatePassword(password)) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      // Register/update user on backend
      const response = await axios.post(`${API_URL}/register`, {
        identifier: identifier.toLowerCase(),
        phone,
        projectId,
        password,
        timestamp: new Date().toISOString()
      });

      if (response.data.success) {
        // Fetch complete user data
        await fetchUserData(identifier.toLowerCase());
        
        setIsLoggedIn(true);
        
        if (projectId) {
          alert(`Successfully registered for project!`);
          navigate('/courses');
        } else {
          navigate('/');
        }
      } else {
        setError(response.data.message || 'Registration failed');
      }
    } catch (err) {
      console.error("Login error:", err);
      
      // Fallback: Store locally if server fails
      const userData = {
        identifier: identifier.toLowerCase(),
        phone,
        projectIds: projectId ? [projectId] : [],
        loggedInAt: new Date().toISOString()
      };

      localStorage.setItem('user', JSON.stringify(userData));
      setUserData(userData);
      setIsLoggedIn(true);

      if (projectId) {
        alert(`Successfully registered for project!`);
        navigate('/courses');
      } else {
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setUserData(null);
    setFormData({
      identifier: "",
      phone: "",
      password: "",
      projectId: null,
      projectTitle: null
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      const numericValue = value.replace(/\D/g, '').slice(0, 10);
      setFormData(prev => ({ ...prev, [name]: numericValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    if (error) setError("");
  };

  // If user is logged in, show their profile
  if (isLoggedIn && userData) {
    return (
      <div className={styles.container}>
        <div className={styles.signInBox}>
          <h2 className={styles.title}>Your Profile</h2>
          
          <div className={styles.profileInfo}>
            <div className={styles.infoItem}>
              <strong>Email/Roll Number:</strong>
              <span>{userData.identifier}</span>
            </div>
            
            <div className={styles.infoItem}>
              <strong>Phone:</strong>
              <span>{userData.phone}</span>
            </div>
            
            <div className={styles.infoItem}>
              <strong>Registered Projects:</strong>
              <div className={styles.projectsList}>
                {userData.projectIds && userData.projectIds.length > 0 ? (
                  userData.projectIds.map((projectId, index) => (
                    <span key={index} className={styles.projectBadge}>
                      {projectId}
                    </span>
                  ))
                ) : (
                  <span className={styles.noProjects}>No projects registered yet</span>
                )}
              </div>
            </div>
            
            {userData.registeredAt && (
              <div className={styles.infoItem}>
                <strong>Member Since:</strong>
                <span>{new Date(userData.registeredAt).toLocaleDateString()}</span>
              </div>
            )}
          </div>
          
          <div className={styles.buttonGroup}>
            <button 
              onClick={() => navigate('/courses')}
              className={styles.submitButton}
            >
              View All Projects
            </button>
            
            <button 
              onClick={handleSignOut}
              className={`${styles.submitButton} ${styles.signOutButton}`}
            >
              Sign Out
            </button>
          </div>
          
          <div className={styles.footer}>
            <Link to="/" className={styles.link}>← Back to Home</Link>
          </div>
        </div>
      </div>
    );
  }

  // Login form
  return (
    <div className={styles.container}>
      <div className={styles.signInBox}>
        <h2 className={styles.title}>
          {formData.projectId ? `Register for Project` : 'Sign In to Winter Projects'}
        </h2>
        
        {formData.projectId && formData.projectTitle && (
          <div style={{
            background: '#e3f2fd',
            padding: '12px 16px',
            borderRadius: '10px',
            marginBottom: '20px',
            textAlign: 'center',
            color: '#1565c0',
            fontWeight: '600'
          }}>
            📚 {formData.projectTitle}
          </div>
        )}
        
        {error && (
          <div className={styles.error}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="identifier">Email or Roll Number</label>
            <input
              type="text"
              id="identifier"
              name="identifier"
              value={formData.identifier}
              onChange={handleChange}
              placeholder="example@iitb.ac.in or 22B1234"
              className={styles.input}
              disabled={loading}
              autoComplete="username"
            />
          </div>
          
          <div className={styles.inputGroup}>
            <label htmlFor="phone">Phone Number</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="10-digit mobile number"
              className={styles.input}
              disabled={loading}
              autoComplete="tel"
            />
          </div>
          
          <div className={styles.inputGroup}>
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="At least 6 characters"
              className={styles.input}
              disabled={loading}
              autoComplete="current-password"
            />
          </div>
          
          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? 'Processing...' : (formData.projectId ? 'Register for Project' : 'Sign In')}
          </button>
        </form>
        
        <div className={styles.footer}>
          <p>Don't have an account? Sign up above!</p>
          <Link to="/" className={styles.link}>← Back to Home</Link>
        </div>
      </div>
    </div>
  );
}