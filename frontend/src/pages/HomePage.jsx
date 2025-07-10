import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FiArrowRight, 
  FiCheckCircle, 
  FiUsers, 
  FiDollarSign,
  FiSearch, 
  FiCalendar, 
  FiVideo, 
  FiFileText, 
  FiMessageSquare, 
  FiStar, 
  FiLayers,
  FiBriefcase
} from 'react-icons/fi';
import './HomePage.css';

const HomePage = () => {
  return (
    <div className="home-container homepage-container">
      <section className="hero-section homepage-hero">
        <div className="hero-background"></div>
        <div className="hero-content">
          <h1>
            <span className="gradient-text" style={{ color: '#FF8C42' }}>Find Your Dream Job</span>
            <br />
            <span className="white-text">With HireMe</span>
          </h1>
          <p className="hero-subtitle">
            Our intelligent platform connects talented candidates with top employers, streamlining the hiring process from application to interview. Experience a seamless job search journey tailored just for you.
          </p>
          <div className="hero-actions">
            <Link to="/register" className="hero-btn primary-btn">
              Get Started <FiArrowRight className="btn-icon" />
            </Link>
            <Link to="/login" className="hero-btn secondary-btn">
              Login
            </Link>
          </div>
        </div>
        <div className="wave-divider">
          <svg data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" className="shape-fill"></path>
          </svg>
        </div>
      </section>

      <section className="features-section homepage-features">
        <div className="container">
          <h2 className="section-title">Why Choose HireMe?</h2>
          <p className="section-subtitle">
            HireMe is a comprehensive platform designed to transform the recruitment process for both job seekers and employers.
          </p>
          <div className="features-grid">
            <div className="feature-card blue-card">
              <div className="feature-icon blue-icon homepage-feature-icon">
                <FiCheckCircle />
              </div>
              <h3>Easy to Use</h3>
              <p>Our intuitive platform makes job hunting simple and stress-free. Create your profile in minutes and start applying today.</p>
            </div>
            
            <div className="feature-card green-card">
              <div className="feature-icon green-icon homepage-feature-icon">
                <FiUsers />
              </div>
              <h3>Trusted by Companies</h3>
              <p>Companies from startups to enterprises use HireMe to find their ideal candidates efficiently through our advanced matching system.</p>
            </div>
            
            <div className="feature-card purple-card">
              <div className="feature-icon purple-icon homepage-feature-icon">
                <FiDollarSign />
              </div>
              <h3>Free for Job Seekers</h3>
              <p>No hidden fees or premium features locked behind paywalls. All tools you need to land your dream job are completely free.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="how-it-works">
        <div className="container">
          <h2 className="section-title">How HireMe Works</h2>
          <p className="section-subtitle">
            We've simplified the job search and hiring process to help you achieve your career or recruitment goals faster.
          </p>
          
          <div className="steps-container">
            <div className="step-row">
              <div className="step-content">
                <div className="step-number blue-number">01</div>
                <h3 className="step-title">Create Your Profile</h3>
                <p className="step-description">
                  Sign up as a job seeker or recruiter and create your personalized profile. Job seekers can upload their resumes, 
                  showcase skills, and set job preferences. Recruiters can establish their company profile and job requirements.
                </p>
              </div>
              <div className="step-image">
                <img src="https://images.unsplash.com/photo-1499750310107-5fef28a66643?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80" alt="Profile Creation" />
              </div>
            </div>
            
            <div className="step-row reverse">
              <div className="step-content">
                <div className="step-number green-number">02</div>
                <h3 className="step-title">Match & Connect</h3>
                <p className="step-description">
                  Our intelligent matching algorithm connects candidates with suitable job opportunities based on skills, 
                  experience, and preferences. Recruiters receive profiles of qualified candidates tailored to their requirements.
                </p>
              </div>
              <div className="step-image">
                <img src="https://images.unsplash.com/photo-1529119651565-dc15bd8c75fd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80" alt="Matching Process" />
              </div>
            </div>
            
            <div className="step-row">
              <div className="step-content">
                <div className="step-number purple-number">03</div>
                <h3 className="step-title">Schedule Interviews</h3>
                <p className="step-description">
                  When there's a match, recruiters can schedule interviews directly through our platform. Candidates 
                  receive notifications and can accept or reschedule based on their availability.
                </p>
              </div>
              <div className="step-image">
                <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80" alt="Interview Scheduling" />
              </div>
            </div>
            
            <div className="step-row reverse">
              <div className="step-content">
                <div className="step-number cyan-number">04</div>
                <h3 className="step-title">Conduct Video Interviews</h3>
                <p className="step-description">
                  HireMe's integrated video conferencing tool allows for seamless virtual interviews. No need for external 
                  applications - everything happens right on our platform for a smooth interview experience.
                </p>
              </div>
              <div className="step-image">
                <img src="https://images.unsplash.com/photo-1516387938699-a93567ec168e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80" alt="Video Interview" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="functionality-section">
        <div className="container">
          <h2 className="section-title">Comprehensive Features</h2>
          <p className="section-subtitle">
            HireMe offers a wide range of powerful tools to streamline the recruitment process from start to finish.
          </p>
          
          <div className="functionality-grid">
            <div className="functionality-card">
              <div className="functionality-icon blue-bg">
                <FiBriefcase />
              </div>
              <h3>For Job Seekers</h3>
              <p>Everything you need to find and secure your ideal position.</p>
              <ul className="functionality-list">
                <li><FiCheckCircle className="list-icon" />Personalized job recommendations</li>
                <li><FiCheckCircle className="list-icon" />Resume builder and management</li>
                <li><FiCheckCircle className="list-icon" />Application tracking system</li>
                <li><FiCheckCircle className="list-icon" />Interview preparation resources</li>
                <li><FiCheckCircle className="list-icon" />Skill assessment tools</li>
                <li><FiCheckCircle className="list-icon" />Career development advice</li>
              </ul>
            </div>
            
            <div className="functionality-card">
              <div className="functionality-icon green-bg">
                <FiUsers />
              </div>
              <h3>For Recruiters</h3>
              <p>Powerful tools to find and hire the best talent efficiently.</p>
              <ul className="functionality-list">
                <li><FiCheckCircle className="list-icon" />AI-powered candidate matching</li>
                <li><FiCheckCircle className="list-icon" />Automated screening process</li>
                <li><FiCheckCircle className="list-icon" />Advanced candidate search</li>
                <li><FiCheckCircle className="list-icon" />Interview scheduling system</li>
                <li><FiCheckCircle className="list-icon" />Collaborative hiring tools</li>
                <li><FiCheckCircle className="list-icon" />Analytics and reporting</li>
              </ul>
            </div>
            
            <div className="functionality-card">
              <div className="functionality-icon purple-bg">
                <FiVideo />
              </div>
              <h3>Interview Management</h3>
              <p>Our integrated interview system simplifies the meeting process.</p>
              <ul className="functionality-list">
                <li><FiCheckCircle className="list-icon" />Integrated video conferencing</li>
                <li><FiCheckCircle className="list-icon" />Calendar synchronization</li>
                <li><FiCheckCircle className="list-icon" />Automated reminders</li>
                <li><FiCheckCircle className="list-icon" />Interview feedback collection</li>
                <li><FiCheckCircle className="list-icon" />Recording capabilities</li>
                <li><FiCheckCircle className="list-icon" />Collaborative evaluation tools</li>
              </ul>
            </div>
            
            <div className="functionality-card">
              <div className="functionality-icon orange-bg">
                <FiFileText />
              </div>
              <h3>Profile Management</h3>
              <p>Comprehensive profile systems for both parties.</p>
              <ul className="functionality-list">
                <li><FiCheckCircle className="list-icon" />Detailed candidate profiles</li>
                <li><FiCheckCircle className="list-icon" />Company and job listings</li>
                <li><FiCheckCircle className="list-icon" />Portfolio showcasing</li>
                <li><FiCheckCircle className="list-icon" />Skill verification</li>
                <li><FiCheckCircle className="list-icon" />Privacy controls</li>
                <li><FiCheckCircle className="list-icon" />Profile analytics</li>
              </ul>
            </div>
            
            <div className="functionality-card">
              <div className="functionality-icon cyan-bg">
                <FiMessageSquare />
              </div>
              <h3>Communication Tools</h3>
              <p>Stay connected throughout the hiring process.</p>
              <ul className="functionality-list">
                <li><FiCheckCircle className="list-icon" />Real-time messaging</li>
                <li><FiCheckCircle className="list-icon" />Automated notifications</li>
                <li><FiCheckCircle className="list-icon" />Email integration</li>
                <li><FiCheckCircle className="list-icon" />Document sharing</li>
                <li><FiCheckCircle className="list-icon" />Discussion threads</li>
                <li><FiCheckCircle className="list-icon" />Mobile notifications</li>
              </ul>
            </div>
            
            <div className="functionality-card">
              <div className="functionality-icon indigo-bg">
                <FiLayers />
              </div>
              <h3>Secure Platform</h3>
              <p>We prioritize the security of your data and interactions.</p>
              <ul className="functionality-list">
                <li><FiCheckCircle className="list-icon" />End-to-end encryption</li>
                <li><FiCheckCircle className="list-icon" />Data privacy compliance</li>
                <li><FiCheckCircle className="list-icon" />Secure document handling</li>
                <li><FiCheckCircle className="list-icon" />Account protection</li>
                <li><FiCheckCircle className="list-icon" />Information control settings</li>
                <li><FiCheckCircle className="list-icon" />Regular security updates</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-content">
          <h2>Ready to Transform Your Hiring Experience?</h2>
          <p>Join HireMe today and discover a smarter way to connect with opportunities and talent.</p>
          <Link to="/register" className="cta-button">
            Create Your Free Account <FiArrowRight className="btn-icon" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;