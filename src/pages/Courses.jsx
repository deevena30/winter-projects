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
  
  // Initialize registeredProjects from localStorage immediately
  const [registeredProjects, setRegisteredProjects] = useState(() => {
    // This function runs only once when the component first mounts
    try {
      const userDataStr = localStorage.getItem('user');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        console.log("🔄 Initializing state from localStorage:", userData);
        
        // Check for projectIds first
        if (userData.projectIds && Array.isArray(userData.projectIds)) {
          return new Set(userData.projectIds);
        }
        // Check for registeredProjects (legacy format)
        else if (userData.registeredProjects && Array.isArray(userData.registeredProjects)) {
          const ids = userData.registeredProjects.map(p => {
            if (typeof p === 'string') return p;
            if (p && typeof p === 'object') return p.projectId || p.id;
            return '';
          }).filter(Boolean);
          return new Set(ids);
        }
      }
    } catch (error) {
      console.error("Error initializing from localStorage:", error);
    }
    return new Set(); // Default empty set
  });
  
  const [showSuccess, setShowSuccess] = useState(false);
  const [registeredProjectTitle, setRegisteredProjectTitle] = useState("");
  const [userData, setUserData] = useState(null);
  const [loadingProjectId, setLoadingProjectId] = useState(null);

  // Load user data and sync with server
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    const userDataStr = localStorage.getItem('user');
    
    if (!userDataStr) {
      navigate('/signin');
      return;
    }

    try {
      const localUserData = JSON.parse(userDataStr);
      setUserData(localUserData);
      
      console.log("📋 Current localStorage data:", localUserData);
      console.log("📊 Current registeredProjects state:", Array.from(registeredProjects));
      
      // Sync with server in background
      try {
        const response = await axios.get(
          `${API_URL}/user/${encodeURIComponent(localUserData.identifier)}`,
          { timeout: 5000 }
        );
        
        if (response.data.success && response.data.data) {
          const serverData = response.data.data;
          const serverProjectIds = serverData.projectIds || [];
          
          // If server has different data, update both state and localStorage
          if (serverProjectIds.length > 0) {
            const serverSet = new Set(serverProjectIds);
            const currentSet = registeredProjects;
            
            // Check if we need to update
            let needsUpdate = false;
            if (serverSet.size !== currentSet.size) {
              needsUpdate = true;
            } else {
              for (const id of serverSet) {
                if (!currentSet.has(id)) {
                  needsUpdate = true;
                  break;
                }
              }
            }
            
            if (needsUpdate) {
              console.log("🔄 Updating from server data:", serverProjectIds);
              setRegisteredProjects(serverSet);
              
              // Update localStorage
              const updatedUserData = {
                ...localUserData,
                projectIds: serverProjectIds
              };
              localStorage.setItem('user', JSON.stringify(updatedUserData));
              setUserData(updatedUserData);
            }
          }
        }
      } catch (err) {
        console.log('Server sync failed:', err.message);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
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
        // Update state
        const updatedSet = new Set(registeredProjects);
        updatedSet.add(projectId);
        setRegisteredProjects(updatedSet);
        
        // Update localStorage
        const updatedProjectIds = Array.from(updatedSet);
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
        
        console.log(`✅ Registered for: ${projectTitle}, IDs: ${updatedProjectIds}`);
      } else {
        alert(response.data.message || 'Registration failed');
      }
    } catch (error) {
      console.error("Error registering:", error);
      
      // Fallback: Save locally
      try {
        const currentUserData = JSON.parse(userDataStr);
        const updatedSet = new Set(registeredProjects);
        updatedSet.add(projectId);
        setRegisteredProjects(updatedSet);
        
        const updatedProjectIds = Array.from(updatedSet);
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
        
        console.log('⚠️ Registered locally');
      } catch (fallbackError) {
        console.error("Fallback failed:", fallbackError);
        alert("Registration failed.");
      }
    } finally {
      setLoadingProjectId(null);
    }
  };

  const categories = ["all", ...new Set(projects.map(p => p.category))];
  const filteredProjects = activeFilter === "all" 
    ? projects 
    : projects.filter(p => p.category === activeFilter);

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
            
            console.log(`Project ${p.id} (${p.title}): isRegistered = ${isRegistered}`); // Debug
            
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
      {/* Modal */}
      {opened && (
        <div className={styles.modalOverlay} onClick={() => setOpened(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <div className={styles.modalTags}>
                  <span className={styles.modalCategory}>{opened.category}</span>
                  <span className={`${styles.modalDifficulty} ${styles[opened.difficulty.toLowerCase()]}`}></span>
                </div>
                <h2 className={styles.modalTitle}>{opened.title}</h2>
              </div>
              <button className={styles.modalClose} onClick={() => setOpened(null)}>
                ×
              </button>
            </div>
            
            <div className={styles.modalBody}>
              {/* Description */}
              <div className={styles.modalSection}>
                <h3 className={styles.modalSectionTitle}>Project Description</h3>
                <p className={styles.modalText}>{opened.detailedDescription || opened.description}</p>
              </div>
              
              {/* Objectives */}
              {opened.objectives && (
                <div className={styles.modalSection}>
                  <h3 className={styles.modalSectionTitle}>Learning Objectives</h3>
                  <p className={styles.modalText}>{opened.objectives}</p>
                </div>
              )}
              
              {/* Key Points */}
              {opened.keypoints && opened.keypoints.length > 0 && (
                <div className={styles.modalSection}>
                  <h3 className={styles.modalSectionTitle}>Key Learning Areas</h3>
                  <ul className={styles.modalList}>
                    {opened.keypoints.map((point, index) => (
                      <li key={index} className={styles.modalListItem}>
                        <span className={styles.listBullet}>•</span>
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Prerequisites */}
              {opened.prerequisites && opened.prerequisites.length > 0 && (
                <div className={styles.modalSection}>
                  <h3 className={styles.modalSectionTitle}>Prerequisites</h3>
                  <ul className={styles.modalList}>
                    {opened.prerequisites.map((req, index) => (
                      <li key={index} className={styles.modalListItem}>
                        <span className={styles.listBullet}>•</span>
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Deliverables */}
              {opened.deliverables && opened.deliverables.length > 0 && (
                <div className={styles.modalSection}>
                  <h3 className={styles.modalSectionTitle}>Project Deliverables</h3>
                  <ul className={styles.modalList}>
                    {opened.deliverables.map((deliverable, index) => (
                      <li key={index} className={styles.modalListItem}>
                        <span className={styles.listBullet}>✓</span>
                        {deliverable}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Outcomes */}
              {opened.outcomes && (
                <div className={styles.modalSection}>
                  <h3 className={styles.modalSectionTitle}>Learning Outcomes</h3>
                  <p className={styles.modalText}>{opened.outcomes}</p>
                </div>
              )}
              
              {/* Technologies */}
              {opened.technologies && opened.technologies.length > 0 && (
                <div className={styles.modalSection}>
                  <h3 className={styles.modalSectionTitle}>Technologies & Tools</h3>
                  <div className={styles.techTags}>
                    {opened.technologies.map((tech, index) => (
                      <span key={index} className={styles.techTag}>
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Special Note */}
              {opened.specialNote && (
                <div className={styles.specialNote}>
                  <h4 className={styles.specialNoteTitle}>Special Note</h4>
                  <p className={styles.specialNoteText}>{opened.specialNote}</p>
                </div>
              )}
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