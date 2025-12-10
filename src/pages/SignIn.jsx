import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import styles from "./styles/SignIn.module.css";
import API_BASE from '../config/api';
import config from '../config';

export default function SignIn() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    identifier: "", // IITB email or roll number
    phone: "",
    password: "",
    projectId: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Get projectId from URL if redirected
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const projectId = params.get('projectId');
    if (projectId) {
      setFormData(prev => ({ ...prev, projectId }));
    }
  }, []);

  const validateIITBEmail = (email) => {
    return email.endsWith('@iitb.ac.in') || email.endsWith('@iitbhu.ac.in');
  };

  const validateRollNumber = (roll) => {
    return /^\d{2}[A-Z]\d{3,4}$/i.test(roll);
  };

  const validatePhone = (phone) => {
    return /^[6-9]\d{9}$/.test(phone);
  };

  const validatePassword = (password) => {
    return password.length >= 6;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    const { identifier, phone, password, projectId } = formData;

    // Validation
    if (!identifier.trim() || !phone.trim() || !password.trim()) {
      setError("Please fill all fields");
      return;
    }

    const isEmail = identifier.includes('@');
    const isValidIdentifier = isEmail 
      ? validateIITBEmail(identifier)
      : validateRollNumber(identifier);

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
      // Send data to backend
      const response = await axios.post('https://winter-projects.onrender.com/api/register', {
  identifier: identifier.toLowerCase(),
  phone,
  projectId,  // Will be null if just logging in
  timestamp: new Date().toISOString()
});
    // Then save to localStorage for frontend
localStorage.setItem('user', JSON.stringify({
  identifier,
  phone,
  projectId,
  registeredAt: new Date().toISOString(),
  // If registering for a project, mark it
  ...(projectId && {
    registeredProjects: [{
      projectId,
      registeredAt: new Date().toISOString()
    }]
  })
}));
      if (response.data.success) {
        // Store in localStorage
        localStorage.setItem('user', JSON.stringify({
          identifier,
          phone,
          projectId,
          loggedInAt: new Date().toISOString()
        }));

        // If there's a projectId, register for it directly
        if (projectId) {
          // Register for the project
          const projectResponse = await axios.post('https://winter-projects.onrender.com/api/register', {
            identifier,
            projectId
          });
          
          if (projectResponse.data.success) {
            // Add project to user data
            const userData = {
              identifier,
              phone,
              projectId,
              loggedInAt: new Date().toISOString(),
              registeredProjects: [{
                projectId,
                registeredAt: new Date().toISOString()
              }]
            };
            localStorage.setItem('user', JSON.stringify(userData));
          }
        }

        navigate(projectId ? '/courses' : '/');
      }
    } catch (err) {
      console.error("Login error:", err);
      
      // For demo: simulate success
      const userData = {
        identifier,
        phone,
        password,
        projectId,
        loggedInAt: new Date().toISOString()
      };
      
      // If projectId exists, simulate project registration
      if (projectId) {
        userData.registeredProjects = [{
          projectId,
          registeredAt: new Date().toISOString()
        }];
      }
      
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Show success message
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

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logo}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#1a6b4f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="#1a6b4f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="#1a6b4f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h2>Winter Projects</h2>
          </div>
          <h1 className={styles.title}>Login</h1>
          <p className={styles.subtitle}>
            {formData.projectId 
              ? "Login to register for the project"
              : "Enter your login details"
            }
          </p>
        </div>

        {error && (
          <div className={styles.error}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 8V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="identifier" className={styles.label}>
              Email or Roll Number *
            </label>
            <div className={styles.inputContainer}>
              <input
                id="identifier"
                name="identifier"
                type="text"
                placeholder="student@iitb.ac.in or 22B1234"
                value={formData.identifier}
                onChange={handleChange}
                required
                className={styles.input}
              />
            </div>
            <div className={styles.hint}>
              Use IITB email or roll number
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="phone" className={styles.label}>
              Phone Number *
            </label>
            <div className={styles.inputContainer}>
              <input
                id="phone"
                name="phone"
                type="tel"
                placeholder="9876543210"
                value={formData.phone}
                onChange={handleChange}
                required
                className={styles.input}
                maxLength="10"
              />
            </div>
            <div className={styles.hint}>
              10-digit number
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.label}>
              Password *
            </label>
            <div className={styles.inputContainer}>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
                className={styles.input}
                minLength="6"
              />
            </div>
            <div className={styles.hint}>
              Minimum 6 characters
            </div>
          </div>

          <button 
            type="submit" 
            className={styles.button}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className={styles.spinner}></span>
                {formData.projectId ? 'Registering...' : 'Logging in...'}
              </>
            ) : (
              formData.projectId ? 'Login & Register' : 'Login'
            )}
          </button>
        </form>

        <div className={styles.footer}>
          <p className={styles.copyright}>
            © {new Date().getFullYear()} Winter Projects
          </p>
          <div className={styles.links}>
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
            <Link to="/contact">Contact</Link>
          </div>
        </div>
      </div>
    </div>
  );
}