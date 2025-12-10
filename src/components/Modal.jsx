// Modal.jsx
import React, { useState, useEffect } from "react";
import styles from "./styles/Modal.module.css";

export default function Modal({ project, onClose, onRegister }) {
  const [isRegistered, setIsRegistered] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const modalContentRef = React.useRef(null);
  
  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  // Check if user already registered for this project
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const { projectId } = JSON.parse(userData);
      if (projectId === project.id) {
        setIsRegistered(true);
      }
    }
  }, [project.id]);

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // Prevent background scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  // Scroll to top when modal opens
  useEffect(() => {
    if (modalContentRef.current) {
      modalContentRef.current.scrollTop = 0;
    }
  }, [project]);

// Modal.jsx - Update the handleRegister function:
const handleRegister = async () => {
  setIsRegistering(true);
  
  // Get user data from localStorage
  const userDataStr = localStorage.getItem('user');
  if (!userDataStr) {
    // If no user data, redirect to sign-in
    setIsRegistering(false);
    window.location.href = `/signin?projectId=${project.id}`;
    return;
  }

  try {
    const userData = JSON.parse(userDataStr);
    
    // Update user data with project registration
    const updatedUserData = {
      ...userData,
      registeredProjects: [...(userData.registeredProjects || []), {
        projectId: project.id,
        projectTitle: project.title,
        registeredAt: new Date().toISOString(),
        status: 'registered'
      }],
      lastProjectId: project.id
    };

    // Save updated user data
    localStorage.setItem('user', JSON.stringify(updatedUserData));

    // Optional: Send to backend if available
    try {
      await fetch('https://winter-projects.onrender.com/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: userData.identifier || 'unknown',
          phone: userData.phone || 'unknown',
          projectId: project.id
        })
      });
    } catch (backendError) {
      console.log('Backend registration failed, but local registration succeeded');
    }
    
    // Show success state
    setIsRegistered(true);
    setIsRegistering(false);
    
    // Call the parent's onRegister function if provided
    if (onRegister) {
      onRegister(project.id, project.title);
    }

    // Auto-close modal after 2 seconds
    setTimeout(() => {
      onClose();
    }, 2000);

  } catch (error) {
    console.error("Registration error:", error);
    setIsRegistering(false);
  }
};

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div 
        ref={modalContentRef}
        className={styles.modalContent} 
        onClick={handleModalClick}
      >
        {/* Close button */}
        <button className={styles.closeButton} onClick={onClose}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>

        {/* Success message overlay */}
        {isRegistered && (
          <div className={styles.successOverlay}>
            <div className={styles.successContent}>
              <div className={styles.successIcon}>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                  <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.709 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M22 4L12 14.01L9 11.01" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className={styles.successTitle}>Successfully Registered!</h3>
              <p className={styles.successMessage}>
                You are now registered for "{project.title}"
              </p>
              <p className={styles.successSubMessage}>
                Closing in 2 seconds...
              </p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerContent}>
            <div className={styles.projectMeta}>
              <span className={`${styles.difficultyTag} ${styles[project.difficulty.toLowerCase()]}`}>
                {project.difficulty}
              </span>
              <span className={styles.durationTag}>
                {project.duration}
              </span>
            </div>
            
            <h1 className={styles.projectTitle}>{project.title}</h1>
            
            <div className={styles.categorySection}>
              <span className={styles.categoryTag}>
                {project.category}
              </span>
              <div className={styles.projectDate}>
                <span className={styles.dateIcon}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M8 2V5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M16 2V5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                    <path d="M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </span>
                <span>Starts: <strong>{project.startDate}</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className={styles.modalBody}>
          {/* Overview */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 16V12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 8H12.01" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2>Project Overview</h2>
            </div>
            <div className={styles.sectionContent}>
              <p className={styles.overviewText}>{project.detailedDescription || project.description}</p>
            </div>
          </section>

          {/* Objectives */}
          {project.objectives && (
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIcon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.709 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M22 4L12 14.01L9 11.01" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h2>Learning Objectives</h2>
              </div>
              <div className={styles.sectionContent}>
                <div className={styles.objectivesCard}>
                  <p>{project.objectives}</p>
                </div>
              </div>
            </section>
          )}

          {/* Key Activities */}
          {project.keypoints && (
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIcon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5C15 6.10457 14.1046 7 13 7H11C9.89543 7 9 6.10457 9 5Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9 12H15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9 16H15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h2>Key Activities</h2>
              </div>
              <div className={styles.sectionContent}>
                <div className={styles.keypointsList}>
                  {project.keypoints.map((point, index) => (
                    <div key={index} className={styles.keypointItem}>
                      <div className={styles.keypointNumber}>{index + 1}</div>
                      <p>{point}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Time Commitment */}
          <div className={styles.infoPanel}>
            <div className={styles.infoItem}>
              <span className={styles.infoIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#0a3d2c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 6V12L16 14" stroke="#0a3d2c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              <div>
                <div className={styles.infoLabel}>Time Commitment</div>
                <div className={styles.infoValue}>{project.timeCommitment}</div>
              </div>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z" stroke="#0a3d2c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M16 2V6" stroke="#0a3d2c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8 2V6" stroke="#0a3d2c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M3 10H21" stroke="#0a3d2c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              <div>
                <div className={styles.infoLabel}>Project Duration</div>
                <div className={styles.infoValue}>{project.duration}</div>
              </div>
            </div>
          </div>

          {/* Footer with Registration Button */}
          <div className={styles.modalFooter}>
            <div className={styles.ctaContainer}>
              {isRegistered ? (
                <div className={styles.alreadyRegistered}>
                  <div className={styles.registeredIcon}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.709 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999" stroke="#2ecc71" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M22 4L12 14.01L9 11.01" stroke="#2ecc71" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className={styles.registeredTitle}>Already Registered</h3>
                    <p className={styles.registeredMessage}>
                      You are registered for this project
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className={styles.projectSummary}>
                    <h3>Ready to Register?</h3>
                    <p>
                      Secure your spot for this {project.duration} project starting {project.startDate}
                    </p>
                  </div>
                  <div className={styles.ctaButtons}>
                    <button 
                      className={styles.viewAllBtn}
                      onClick={onClose}
                    >
                      View Other Projects
                    </button>
                    <button 
                      className={styles.registerButton}
                      onClick={handleRegister}
                      disabled={isRegistering}
                    >
                      {isRegistering ? (
                        <>
                          <span className={styles.registerSpinner}></span>
                          Registering...
                        </>
                      ) : (
                        <>
                          Register for Project
                          <span className={styles.registerIcon}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M12 5L19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}