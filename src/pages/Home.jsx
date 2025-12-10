import React from "react";
import { useNavigate, Link } from "react-router-dom";
import styles from "./styles/Home.module.css";

export default function Home() {
  const navigate = useNavigate();
  
  // Check if user is signed in
  React.useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/signin');
    }
  }, [navigate]);

  const handleGetStarted = () => {
    navigate('/courses');
  };

  // Timeline dates
  const timeline = [
    { date: "December 14, 2025", event: "Registration Deadline" },
    { date: "December 15, 2025", event: "Project Starts" },
    { date: "January 5, 2026", event: "Submission Deadline" },
    { date: "January, 2026", event: "Grand Finale for Selected Projects" },
  ];

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
          <Link to="/courses" className={styles.navLink}>Projects</Link>
          <button 
            onClick={() => {
              localStorage.removeItem('user');
              navigate('/signin');
            }}
            className={styles.signOutBtn}
          >
            Sign Out
          </button>
        </div>
      </nav>

      <main className={styles.main}>
        {/* Hero Section */}
        <div className={styles.hero}>
          <h1 className={styles.heroTitle}>
            IITB Winter Projects 2025: Sustainability & Finance
          </h1>
          <p className={styles.heroSubtitle}>
            sustainability and quantitative analysis through hands-on projects 
            focused on ESG integration, carbon accounting, and sustainable finance.
          </p>
          <button onClick={handleGetStarted} className={styles.ctaButton}>
            View Projects
          </button>
        </div>

        {/* Project Overview Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Project Focus Areas</h2>
          <p className={styles.sectionIntro}>
            Our Winter Projects bridge the gap between academic theory and practical application in the 
            rapidly evolving fields of sustainable finance and corporate sustainability. Each project is 
            designed to provide hands-on experience with real-world tools and methodologies.
          </p>
          
          <div className={styles.projectsOverview}>
            <div className={styles.projectFocus}>
              <h3>Sustainable Investing</h3>
              <p>
                Learn to integrate ESG principles across investment vehicles including Venture Capital, 
                Private Equity, Real Estate, and bond markets. Master frameworks like GRI, SASB, and 
                Morningstar Sustainability Ratings to construct sustainable portfolios.
              </p>
            </div>
            
            <div className={styles.projectFocus}>
              <h3>Climate Data Analytics</h3>
              <p>
                Develop quantitative skills in GHG accounting, carbon modeling, and strategic decarbonization. 
                Work with real corporate data to create comprehensive carbon reduction strategies and 
                Science-Based Targets.
              </p>
            </div>
            
            <div className={styles.projectFocus}>
              <h3>Corporate Sustainability</h3>
              <p>
                Understand global ESG reporting frameworks including DJSI, MSCI, Sustainalytics, and CDP, 
                along with India's BRSR requirements. Learn materiality assessment and sustainability reporting.
              </p>
            </div>
          </div>
        </section>

        {/* Learning Outcomes Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Learning Outcomes</h2>
          
          <div className={styles.outcomesGrid}>
            <div className={styles.outcomeCard}>
              <h4>Technical Proficiency</h4>
              <ul>
                <li>ESG framework analysis and implementation</li>
                <li>GHG Protocol application and carbon accounting</li>
                <li>Financial modeling for sustainable investments</li>
                <li>Data analysis and visualization for sustainability metrics</li>
              </ul>
            </div>
            
            <div className={styles.outcomeCard}>
              <h4>Strategic Thinking</h4>
              <ul>
                <li>Develop sustainable investment theses</li>
                <li>Create decarbonization roadmaps</li>
                <li>Design ESG reporting frameworks</li>
                <li>Assess sustainability risks and opportunities</li>
              </ul>
            </div>
            
            <div className={styles.outcomeCard}>
              <h4>Professional Development</h4>
              <ul>
                <li>Build comprehensive project portfolios</li>
                <li>Master industry-standard methodologies</li>
                <li>Develop presentation and reporting skills</li>
                <li>Gain experience with real-world case studies</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Project Timeline Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Project Timeline</h2>
          <p className={styles.timelineDescription}>
            Each project requires a commitment of <strong>10-12 hours per week</strong> over a period of 
            <strong> 4-5 weeks</strong>. The structured timeline ensures steady progress with built-in 
            review points for feedback and guidance.
          </p>
          
          <div className={styles.timelineContainer}>
            {timeline.map((item, index) => (
              <div key={index} className={styles.timelineItem}>
                <div className={styles.timelineMarker}>
                  <div className={styles.markerNumber}>{index + 1}</div>
                  {index < timeline.length - 1 && <div className={styles.timelineLine}></div>}
                </div>
                <div className={styles.timelineContent}>
                  <div className={styles.timelineDate}>{item.date}</div>
                  <h4 className={styles.timelineEvent}>{item.event}</h4>
                  <p className={styles.timelineDetail}>
                    {index === 0 && "Final date to register for Winter Projects"}
                    {index === 1 && "Projects begin"}
                    {index === 2 && "Submit final project deliverables"}
                    {index === 3 && "All projects have been submitted and certificates will be issued to all participants; the top entries will now be shortlisted for offline presentation before a panel for final prizes"}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.commitmentInfo}>
            <div className={styles.commitmentCard}>
              <h4>Project Duration</h4>
              <p>4-5 weeks per project</p>
            </div>
            <div className={styles.commitmentCard}>
              <h4>Commitment</h4>
              <p>10-12 hours</p>
            </div>
            <div className={styles.commitmentCard}>
              <h4>Delivery Format</h4>
              <p>Online</p>
            </div>
          </div>
        </section>

        {/* Target Audience Section */}
        {/* <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Ideal For</h2>
          <div className={styles.audienceGrid}>
            <div className={styles.audienceItem}>
              <h4>Finance & Economics Students</h4>
              <p>Interested in sustainable finance, ESG investing, and impact measurement</p>
            </div>
            <div className={styles.audienceItem}>
              <h4>Engineering & Technology Students</h4>
              <p>Looking to apply quantitative skills to sustainability challenges</p>
            </div>
            <div className={styles.audienceItem}>
              <h4>Management & Strategy Students</h4>
              <p>Focused on corporate sustainability and ESG reporting</p>
            </div>
            <div className={styles.audienceItem}>
              <h4>Environmental Studies Students</h4>
              <p>Seeking practical applications of sustainability principles</p>
            </div>
          </div>
        </section> */}

        {/* CTA Section */}
        {/* <div className={styles.ctaSection}>
          <h2>Ready to Develop Professional Sustainability Skills?</h2>
          <p>Select from our specialized projects and begin your journey in sustainable finance and ESG integration.</p>
          <button onClick={handleGetStarted} className={styles.ctaButton}>
            View Project Details
          </button>
        </div> */}
      </main>

      <footer className={styles.footer}>
        <p>© {new Date().getFullYear()} IITB Winter Projects Initiative</p>
        <div>
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
          <Link to="/contact">Contact</Link>
        </div>
      </footer>
    </div>
  );
}