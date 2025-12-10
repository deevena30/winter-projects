import React from "react";
import styles from "./styles/Contact.module.css";
import { Link } from "react-router-dom";

// Import the images
import ArthImage from "../assets/Arth.jpeg";
import SiddhantImage from "../assets/Siddhant.jpg";
import VinayakImage from "../assets/Vinayak.jpeg";

const teamMembers = {
  "Projects and Policies Team @Sustainability Cell": [
    {
      name: "Arth Trivedy",
      role: "Manager",
      phone: "8368009080",
      email: "trivedyarth@gmail.com",
      linkedin: "https://www.linkedin.com/in/arth-trivedy-79875a224",
      whatsapp: "",
      image: ArthImage
    },
    {
      name: "Siddhant Gupta",
      role: "Manager",
      phone: "9167095841",
      email: "siddhant2804@gmail.com",
      linkedin: "https://www.linkedin.com/in/siddhantgupta-iit/",
      whatsapp: "",
      image: SiddhantImage
    },
    {
      name: "Vinayak Jalan",
      role: "Manager",
      phone: "7043772478",
      email: "vinayakjalan010@gmail.com",
      linkedin: "https://www.linkedin.com/in/vinayak-jalan-6218ba230",
      whatsapp: "",
      image: VinayakImage
    }
  ]
};

export default function Contact() {
  return (
    <div className={styles.container}>
      <nav className={styles.navbar}>
        <div className={styles.logo}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#1a6b4f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 17L12 22L22 17" stroke="#1a6b4f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="#1a6b4f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Winter Projects 2025</span>
        </div>
        <div className={styles.navLinks}>
          <Link to="/home" className={styles.navLink}>Home</Link>
          <Link to="/courses" className={styles.navLink}>Projects</Link>
        </div>
      </nav>

      <main className={styles.main}>
        {/* Hero Section */}
        <div className={styles.hero}>
          <h1 className={styles.heroTitle}>Contact Our Team</h1>
          <p className={styles.heroSubtitle}>
            Get in touch with our Projects and Policies Team for assistance with Winter Projects 2025
          </p>
        </div>

        {/* Team Section */}
        <section className={styles.teamSection}>
          <h2 className={styles.sectionTitle}>Projects and Policies Team</h2>
          <p className={styles.sectionSubtitle}>
            Sustainability Cell, IIT Bombay
          </p>
          
          <div className={styles.teamGrid}>
            {teamMembers["Projects and Policies Team @Sustainability Cell"].map((member, index) => (
              <div key={index} className={styles.teamCard}>
                <div className={styles.memberImage}>
                  <img 
                    src={member.image} 
                    alt={`${member.name} - ${member.role}`}
                    className={styles.profileImage}
                  />
                </div>
                
                <div className={styles.memberInfo}>
                  <h3 className={styles.memberName}>{member.name}</h3>
                  <p className={styles.memberRole}>{member.role}</p>
                  
                  <div className={styles.contactDetails}>
                    <div className={styles.contactItem}>
                      <span className={styles.contactIcon}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M22 16.92V19C22 19.5304 21.7893 20.0391 21.4142 20.4142C21.0391 20.7893 20.5304 21 20 21C15.49 21 12 17.51 12 13C12 8.49 15.49 5 20 5C20.5304 5 21.0391 5.21071 21.4142 5.58579C21.7893 5.96086 22 6.46957 22 7V9.07" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M22 15C20.3431 15 19 13.6569 19 12C19 10.3431 20.3431 9 22 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </span>
                      <a href={`tel:${member.phone}`} className={styles.contactLink}>
                        {member.phone}
                      </a>
                    </div>
                    
                    <div className={styles.contactItem}>
                      <span className={styles.contactIcon}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M22 6L12 13L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </span>
                      <a href={`mailto:${member.email}`} className={styles.contactLink}>
                        {member.email}
                      </a>
                    </div>
                    
                    {member.linkedin && (
                      <div className={styles.contactItem}>
                        <span className={styles.contactIcon}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M16 8C17.5913 8 19.1174 8.63214 20.2426 9.75736C21.3679 10.8826 22 12.4087 22 14V21H18V14C18 13.4696 17.7893 12.9609 17.4142 12.5858C17.0391 12.2107 16.5304 12 16 12C15.4696 12 14.9609 12.2107 14.5858 12.5858C14.2107 12.9609 14 13.4696 14 14V21H10V14C10 12.4087 10.6321 10.8826 11.7574 9.75736C12.8826 8.63214 14.4087 8 16 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M6 9H2V21H6V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M4 6C5.10457 6 6 5.10457 6 4C6 2.89543 5.10457 2 4 2C2.89543 2 2 2.89543 2 4C2 5.10457 2.89543 6 4 6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </span>
                        <a 
                          href={member.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.contactLink}
                        >
                          LinkedIn Profile
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Contact Form Section */}
        <section className={styles.formSection}>
          <div className={styles.formContainer}>
            <div className={styles.formHeader}>
              <h2 className={styles.formTitle}>Send Us a Message</h2>
              <p className={styles.formSubtitle}>
                Have questions about the projects? Reach out to us directly
              </p>
            </div>
            
            <form className={styles.contactForm}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="name" className={styles.formLabel}>Your Name</label>
                  <input 
                    type="text" 
                    id="name" 
                    className={styles.formInput}
                    placeholder="Enter your name"
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="email" className={styles.formLabel}>Email Address</label>
                  <input 
                    type="email" 
                    id="email" 
                    className={styles.formInput}
                    placeholder="Enter your email"
                  />
                </div>
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="subject" className={styles.formLabel}>Subject</label>
                <input 
                  type="text" 
                  id="subject" 
                  className={styles.formInput}
                  placeholder="What is this regarding?"
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="message" className={styles.formLabel}>Message</label>
                <textarea 
                  id="message" 
                  className={styles.formTextarea}
                  rows="5"
                  placeholder="Type your message here..."
                />
              </div>
              
              <button type="submit" className={styles.submitButton}>
                Send Message
              </button>
            </form>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <p>© {new Date().getFullYear()} IITB Winter Projects Initiative</p>
        <div>
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
          <Link to="/home">Home</Link>
        </div>
      </footer>
    </div>
  );
}