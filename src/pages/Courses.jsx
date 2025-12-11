import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { projects } from "../data/projects";
import styles from "./styles/Courses.module.css";

const API_URL = 'https://winter-projects.onrender.com/api';

export default function Courses() {
  const navigate = useNavigate();
  const [opened, setOpened] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [registeredProjects, setRegisteredProjects] = useState(new Set());
  const [showSuccess, setShowSuccess] = useState(false);
  const [registeredProjectTitle, setRegisteredProjectTitle] = useState("");
  const [userData, setUserData] = useState(null);
  const [loadingProjectId, setLoadingProjectId] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Add loading state

  // Load user data and registered projects on mount
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    setIsLoading(true);
    const userDataStr = localStorage.getItem('user');
    
    if (!userDataStr) {
      // No user data, redirect to signin
      navigate('/signin');
      setIsLoading(false);
      return;
    }

    try {
      const localUserData = JSON.parse(userDataStr);
      setUserData(localUserData);
      
      // FIRST: Always load from localStorage immediately
      let projectIds = [];
      
      if (localUserData.projectIds && localUserData.projectIds.length > 0) {
        // Use projectIds array if available
        projectIds = localUserData.projectIds;
      } else if (localUserData.registeredProjects && localUserData.registeredProjects.length > 0) {
        // Fallback to registeredProjects array (legacy format)
        projectIds = localUserData.registeredProjects.map(p => p.projectId || p.id);
      }
      
      // Set registered projects from localStorage immediately
      setRegisteredProjects(new Set(projectIds));
      
      // SECOND: Try to sync with server in background
      try {
        const response = await axios.get(
          `${API_URL}/user/${encodeURIComponent(localUserData.identifier)}`,
          { timeout: 5000 } // Add timeout to prevent hanging
        );
        
        if (response.data.success && response.data.data) {
          const serverData = response.data.data;
          const serverProjectIds = serverData.projectIds || [];
          
          // Update local state with server data
          const updatedUserData = {
            ...localUserData,
            projectIds: serverProjectIds,
            phone: serverData.phone || localUserData.phone,
            registeredAt: serverData.registeredAt || localUserData.registeredAt
          };
          
          setUserData(updatedUserData);
          localStorage.setItem('user', JSON.stringify(updatedUserData));
          
          // Update registered projects set if server has different data
          if (serverProjectIds.length > 0) {
            setRegisteredProjects(new Set(serverProjectIds));
          }
        }
      } catch (err) {
        console.log('Server sync failed, using local data:', err.message);
        // We already have local data loaded, so continue
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      // Clear corrupted data and redirect to signin
      localStorage.removeItem('user');
      navigate('/signin');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (projectId, projectTitle) => {
    const userDataStr = localStorage.getItem('user');
    
    if (!userDataStr) {
      navigate(`/signin?projectId=${projectId}&projectTitle=${encodeURIComponent(projectTitle)}`);
      return;
    }

    // Check if already registered
    if (registeredProjects.has(projectId)) {
      alert("You're already registered for this project!");
      return;
    }

    setLoadingProjectId(projectId);

    try {
      const currentUserData = JSON.parse(userDataStr);
      
      // Send registration to backend
      const response = await axios.post(`${API_URL}/register`, {
        identifier: currentUserData.identifier,
        phone: currentUserData.phone,
        projectId: projectId,
        timestamp: new Date().toISOString()
      });

      if (response.data.success) {
        // Update local state
        const updatedProjectIds = [...registeredProjects, projectId];
        setRegisteredProjects(new Set(updatedProjectIds));
        
        // Update localStorage - ensure projectIds array exists
        const updatedUserData = {
          ...currentUserData,
          projectIds: updatedProjectIds
        };
        localStorage.setItem('user', JSON.stringify(updatedUserData));
        setUserData(updatedUserData);
        
        // Show success message
        setRegisteredProjectTitle(projectTitle);
        setShowSuccess(true);
        
        setTimeout(() => {
          setShowSuccess(false);
        }, 3000);
        
        console.log(`✅ Successfully registered for: ${projectTitle}`);
      } else {
        alert(response.data.message || 'Registration failed');
      }
    } catch (error) {
      console.error("Error registering for project:", error);
      
      // Fallback: Save locally if backend fails
      try {
        const currentUserData = JSON.parse(userDataStr);
        const updatedProjectIds = [...registeredProjects, projectId];
        
        setRegisteredProjects(new Set(updatedProjectIds));
        
        const updatedUserData = {
          ...currentUserData,
          projectIds: updatedProjectIds
        };
        localStorage.setItem('user', JSON.stringify(updatedUserData));
        setUserData(updatedUserData);
        
        setRegisteredProjectTitle(projectTitle);
        setShowSuccess(true);
        
        setTimeout(() => {
          setShowSuccess(false);
        }, 3000);
        
        console.log('⚠️ Registered locally (backend unavailable)');
      } catch (fallbackError) {
        console.error("Fallback registration failed:", fallbackError);
        alert("Registration failed. Please try again.");
      }
    } finally {
      setLoadingProjectId(null);
    }
  };

  const categories = ["all", ...new Set(projects.map(p => p.category))];
  const filteredProjects = activeFilter === "all" 
    ? projects 
    : projects.filter(p => p.category === activeFilter);

  // Show loading state
  if (isLoading) {
    return (
      <div className={styles.wrapper}>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          fontSize: '1.2rem',
          color: '#0a3d2c'
        }}>
          Loading your projects...
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      {/* Success Message */}
      {showSuccess && (
        <div className={styles.successMessage}>
          <div className={styles.successContent}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.709 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999" stroke="#2e7d32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M22 4L12 14.01L9 11.01" stroke="#2e7d32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div>
              <strong>Successfully registered!</strong>
              <p>You are now registered for "{registeredProjectTitle}"</p>
            </div>
            <button 
              className={styles.closeSuccess}
              onClick={() => setShowSuccess(false)}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* User Info Banner */}
      {userData && (
        <div className={styles.userBanner}>
          <div className={styles.userInfo}>
            <span className={styles.userLabel}>Logged in as:</span>
            <span className={styles.userName}>{userData.identifier}</span>
            {registeredProjects.size > 0 && (
              <span className={styles.projectCount}>
                {registeredProjects.size} {registeredProjects.size === 1 ? 'project' : 'projects'} registered
              </span>
            )}
          </div>
        </div>
      )}

      <div className={styles.heroSection}>
        <h1 className={styles.heading}>Winter Project Tracks</h1>
      </div>

      {/* Projects Grid */}
      <div className={styles.gridContainer}>
        <div className={styles.grid}>
          {filteredProjects.map((p) => {
            const isRegistered = registeredProjects.has(p.id);
            const isLoading = loadingProjectId === p.id;
            
            return (
              <div 
                key={p.id}
                className={`${styles.card} ${styles[p.difficulty.toLowerCase()]}`}
              >
                <div className={styles.cardHeader}>
                  <span className={styles.categoryTag}>
                    {p.category}
                  </span>
                  <span className={`${styles.difficultyTag} ${styles[p.difficulty.toLowerCase()]}`}>
                    {p.difficulty}
                  </span>
                </div>
                
                <h3 className={styles.cardTitle}>{p.title}</h3>
                <p className={styles.cardDescription}>{p.description}</p>
                
                <div className={styles.cardActions}>
                  <button 
                    className={styles.viewDetailsBtn}
                    onClick={() => setOpened(p)}
                  >
                    View Details
                  </button>
                  
                  {isRegistered ? (
                    <button className={styles.registeredBtn} disabled>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.709 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999" stroke="#2e7d32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M22 4L12 14.01L9 11.01" stroke="#2e7d32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Registered!
                    </button>
                  ) : (
                    <button 
                      className={styles.registerBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRegister(p.id, p.title);
                      }}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Processing...' : 'Register Now'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal - Same as before */}
      {opened && (
        <div className={styles.modalOverlay} onClick={() => setOpened(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <div className={styles.modalTags}>
                  <span className={styles.modalCategory}>{opened.category}</span>
                  <span className={`${styles.modalDifficulty} ${styles[opened.difficulty.toLowerCase()]}`}>
                    {opened.difficulty}
                  </span>
                </div>
                <h2 className={styles.modalTitle}>{opened.title}</h2>
              </div>
              <button className={styles.modalClose} onClick={() => setOpened(null)}>
                ×
              </button>
            </div>
            
            <div className={styles.modalBody}>
              {/* ... modal body content ... */}
            </div>
            
            <div className={styles.modalFooter}>
              {registeredProjects.has(opened.id) ? (
                <button className={styles.modalRegisteredBtn} disabled>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.709 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999" stroke="#2e7d32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M22 4L12 14.01L9 11.01" stroke="#2e7d32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  You're Registered!
                </button>
              ) : (
                <button 
                  className={styles.modalRegisterBtn}
                  onClick={() => {
                    handleRegister(opened.id, opened.title);
                    setOpened(null);
                  }}
                  disabled={loadingProjectId === opened.id}
                >
                  {loadingProjectId === opened.id ? 'Processing...' : 'Register for this Project'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}