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
    email: "",
    rollNumber: "",
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
          email: serverData.email,
          rollNumber: serverData.rollNumber,
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

  const validateIITBEmail = (email) => {
    if (!email) return false;
    const domains = ['@iitb.ac.in'];
    return domains.some(domain => email.toLowerCase().endsWith(domain));
  };

  const validateRollNumber = (roll) => {
    if (!roll) return false;
    // Format: 2 digits, 1 letter, 3-4 digits (e.g., 22B1234, 23ME10001)
    return /^\d{2}[A-Z]\d{3,5}$/i.test(roll.trim());
  };

  const validatePhone = (phone) => /^[6-9]\d{9}$/.test(phone);
  const validatePassword = (password) => password.length >= 6;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const { email, rollNumber, phone, password, projectId } = formData;

    // Check if at least one identifier is provided
    if ((!email.trim() && !rollNumber.trim()) || !phone.trim() || !password.trim()) {
      setError("Please fill all required fields");
      return;
    }

    // Validate email if provided
    if (email.trim() && !validateIITBEmail(email)) {
      setError("Please use a valid IITB email");
      return;
    }

    // Validate roll number if provided
    if (rollNumber.trim() && !validateRollNumber(rollNumber)) {
      setError("Invalid roll number format (e.g., 22B1234)");
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
      // Create identifier: email if provided, otherwise roll number
      const identifier = email.trim() || rollNumber.trim();
      
      // Register/update user on backend
      const response = await axios.post(`${API_URL}/register`, {
        identifier: identifier.toLowerCase(),
        email: email.trim() || null,
        rollNumber: rollNumber.trim() || null,
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
      const identifier = email.trim() || rollNumber.trim();
      const userData = {
        identifier: identifier.toLowerCase(),
        email: email.trim() || null,
        rollNumber: rollNumber.trim() || null,
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
      email: "",
      rollNumber: "",
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
    } else if (name === 'rollNumber') {
      // Convert to uppercase for roll number
      setFormData(prev => ({ ...prev, [name]: value.toUpperCase() }));
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
            {userData.email && (
              <div className={styles.infoItem}>
                <strong>Email:</strong>
                <span>{userData.email}</span>
              </div>
            )}
            
            {userData.rollNumber && (
              <div className={styles.infoItem}>
                <strong>Roll Number:</strong>
                <span>{userData.rollNumber}</span>
              </div>
            )}
            
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
          <div className={styles.projectNotice}>
            <span>📚</span> {formData.projectTitle}
          </div>
        )}
        
        {error && (
          <div className={styles.error}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="email">IITB Email<span className={styles.required}>*</span></label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="example@iitb.ac.in"
              className={styles.input}
              disabled={loading}
              autoComplete="email"
            />
          </div>
          
          <div className={styles.inputGroup}>
            <label htmlFor="rollNumber">Roll Number<span className={styles.required}>*</span></label>
            <input
              type="text"
              id="rollNumber"
              name="rollNumber"
              value={formData.rollNumber}
              onChange={handleChange}
              placeholder="22B1234 or 23ME10001"
              className={styles.input}
              disabled={loading}
              autoComplete="off"
            />
          </div>
          
          <div className={styles.inputGroup}>
            <label htmlFor="phone">Phone Number<span className={styles.required}>*</span></label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Preferably whatsapp number"
              className={styles.input}
              disabled={loading}
              required
              autoComplete="tel"
            />
          </div>
          
          <div className={styles.inputGroup}>
            <label htmlFor="password">Password <span className={styles.required}>*</span></label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              className={styles.input}
              disabled={loading}
              required
              autoComplete="current-password"
            />
            <small className={styles.helperText}>Minimum 6 characters</small>
          </div>
          
          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={loading || (!formData.email.trim() && !formData.rollNumber.trim())}
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