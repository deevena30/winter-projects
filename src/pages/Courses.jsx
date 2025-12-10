import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { projects } from "../data/projects";
import styles from "./styles/Courses.module.css";

export default function Courses() {
  const navigate = useNavigate();
  const [opened, setOpened] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [registeredProjects, setRegisteredProjects] = useState(new Set());
  const [showSuccess, setShowSuccess] = useState(false);
  const [registeredProjectTitle, setRegisteredProjectTitle] = useState("");

  // Load registered projects from localStorage on component mount
  useEffect(() => {
    const userDataStr = localStorage.getItem('user');
    if (userDataStr) {
      try {
        const userData = JSON.parse(userDataStr);
        if (userData.registeredProjects) {
          const registeredIds = userData.registeredProjects.map(p => p.projectId);
          setRegisteredProjects(new Set(registeredIds));
        }
      } catch (error) {
        console.error("Error loading registered projects:", error);
      }
    }
  }, []);

  const handleRegister = async (projectId, projectTitle) => {
    const userDataStr = localStorage.getItem('user');
    
    if (!userDataStr) {
      // User not logged in, redirect to login page with projectId
      navigate(`/signin?projectId=${projectId}`);
      return;
    }

    // User is logged in, register directly
    try {
      const userData = JSON.parse(userDataStr);
      
      // Update registered projects
      setRegisteredProjects(prev => new Set([...prev, projectId]));
      
      // Update localStorage
      const updatedUserData = {
        ...userData,
        registeredProjects: [
          ...(userData.registeredProjects || []),
          {
            projectId,
            projectTitle,
            registeredAt: new Date().toISOString()
          }
        ]
      };
      localStorage.setItem('user', JSON.stringify(updatedUserData));
      
      // Show success message
      setRegisteredProjectTitle(projectTitle);
      setShowSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
      
      console.log(`User registered for project ${projectId}: ${projectTitle}`);
    } catch (error) {
      console.error("Error registering for project:", error);
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

      <div className={styles.heroSection}>
        <h1 className={styles.heading}>Winter Project Tracks</h1>
        {/* <p className={styles.subtitle}>Master sustainability skills through hands-on projects</p> */}
      </div>

      {/* Filter Tabs */}
      {/* <div className={styles.filterContainer}>
        {categories.map(category => (
          <button
            key={category}
            className={`${styles.filterButton} ${activeFilter === category ? styles.activeFilter : ''}`}
            onClick={() => setActiveFilter(category)}
          >
            {category === "all" ? "All Projects" : category}
          </button>
        ))}
      </div> */}

      {/* Projects Grid with proper spacing */}
      <div className={styles.gridContainer}>
        <div className={styles.grid}>
          {filteredProjects.map((p) => {
            const isRegistered = registeredProjects.has(p.id);
            
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
                
                {/* <div className={styles.cardMeta}>
                  <div className={styles.metaRow}>
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Duration:</span>
                      <span className={styles.metaValue}>{p.duration}</span>
                    </div>
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Time:</span>
                      <span className={styles.metaValue}>{p.timeCommitment}</span>
                    </div>
                  </div>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Starts:</span>
                    <span className={styles.metaValue}>{p.startDate}</span>
                  </div>
                </div> */}
                
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
                    >
                      Register Now
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
        
        {/* Key Points/Features */}
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
        
        {/* Project Details Grid */}
        {/* <div className={styles.modalDetailsGrid}>
          {opened.instructor && (
            <div className={styles.detailCard}>
              <span className={styles.detailLabel}>Instructor</span>
              <span className={styles.detailValue}>{opened.instructor}</span>
            </div>
          )}
          
          {opened.startDate && (
            <div className={styles.detailCard}>
              <span className={styles.detailLabel}>Start Date</span>
              <span className={styles.detailValue}>{opened.startDate}</span>
            </div>
          )}
          
          <div className={styles.detailCard}>
            <span className={styles.detailLabel}>Duration</span>
            <span className={styles.detailValue}>{opened.duration}</span>
          </div>
          
          <div className={styles.detailCard}>
            <span className={styles.detailLabel}>Time Commitment</span>
            <span className={styles.detailValue}>{opened.timeCommitment}</span>
          </div>
        </div> */}
        
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
          >
            Register for this Project
          </button>
        )}
      </div>
    </div>
  </div>
)}
    </div>
  );
}