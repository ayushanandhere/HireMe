import React from 'react';
import { Link } from 'react-router-dom';
import {
  FiArrowRight,
  FiCheckCircle,
  FiCpu,
  FiFileText,
  FiLayers,
  FiMessageSquare,
  FiSearch,
  FiUsers,
  FiVideo
} from 'react-icons/fi';
import './HomePage.css';

const workflowSteps = [
  {
    title: 'Candidate context, not just a resume',
    copy: 'Upload once, extract skills, track applications, and prep from the exact role you applied for.',
    icon: FiFileText
  },
  {
    title: 'Recruiter screening with signal',
    copy: 'Move from raw applications to match scores, resume intelligence, and action-ready pipeline decisions.',
    icon: FiSearch
  },
  {
    title: 'Interview execution in one place',
    copy: 'Schedule, brief, practice, meet, and review feedback without leaving the platform.',
    icon: FiVideo
  }
];

const productAngles = [
  {
    title: 'Decision support over gimmicks',
    copy: 'AI is surfaced where decisions happen: screening, preparation, and interview follow-up.',
    icon: FiCpu
  },
  {
    title: 'Two-sided workflow',
    copy: 'Candidates and recruiters each get a tailored experience with a coherent shared pipeline.',
    icon: FiUsers
  },
  {
    title: 'Built for live demos',
    copy: 'The golden path is designed to be populated, credible, and easy to explain in minutes.',
    icon: FiLayers
  }
];

const HomePage = () => {
  return (
    <div className="home-page">
      <section className="home-hero">
        <div className="container home-hero-grid">
          <div className="home-hero-copy">
            <span className="eyebrow">Smart Realtime Hiring Portal</span>
            <h1>
              Resume to interview, with
              <span> real signal in the loop.</span>
            </h1>
            <p>
              HireMe is a full hiring workflow for candidates and recruiters: role-aware resume
              analysis, ranked screening, interview preparation, real-time coordination, and a
              cleaner path from application to feedback.
            </p>
            <div className="home-hero-actions">
              <Link to="/register" className="action-link primary">
                Launch the workflow <FiArrowRight />
              </Link>
              <Link to="/login" className="action-link secondary">
                Open existing account
              </Link>
            </div>
            <div className="home-proof-grid">
              <div className="home-proof-card">
                <strong>Candidate prep workspace</strong>
                <span>Role-fit cues, gaps, coaching, and mock interview flow</span>
              </div>
              <div className="home-proof-card">
                <strong>Recruiter screening cockpit</strong>
                <span>Application stage clarity, fit scores, and next-best actions</span>
              </div>
            </div>
          </div>

          <div className="home-hero-panel surface-card">
            <div className="home-signal-card">
              <p className="home-panel-label">Signature workflow</p>
              <h2>One believable hiring story</h2>
              <ul>
                <li><FiCheckCircle /> Candidate uploads a resume and applies to a live role</li>
                <li><FiCheckCircle /> Recruiter reviews structured fit signals and pipeline status</li>
                <li><FiCheckCircle /> Both sides prepare, meet, and close the loop with feedback</li>
              </ul>
            </div>

            <div className="home-mini-grid">
              <div>
                <span>AI resume intelligence</span>
                <strong>Role fit, strengths, red flags, keyword gaps</strong>
              </div>
              <div>
                <span>Interview support</span>
                <strong>Briefing room, training room, live conference flow</strong>
              </div>
              <div>
                <span>Pipeline clarity</span>
                <strong>Shared stages across recruiter and candidate surfaces</strong>
              </div>
              <div>
                <span>Fallback-aware</span>
                <strong>Graceful handling when AI services are unavailable</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="home-workflow">
        <div className="container">
          <div className="home-section-head">
            <span className="eyebrow">Golden Path</span>
            <h2 className="section-heading">Designed around a coherent end-to-end hiring flow.</h2>
            <p className="section-copy">
              The product is strongest when it guides one real hiring story instead of scattering
              attention across disconnected features.
            </p>
          </div>

          <div className="home-workflow-grid">
            {workflowSteps.map(({ title, copy, icon }) => (
              <article key={title} className="home-step surface-card">
                <div className="home-step-icon">
                  {React.createElement(icon)}
                </div>
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="home-split">
        <div className="container home-split-grid">
          <article className="home-audience-card surface-card candidate">
            <span className="eyebrow">For Candidates</span>
            <h3>Preparation that starts from the actual role.</h3>
            <p>
              Track your application pipeline, understand where your resume fits, and rehearse
              against the position you want instead of generic interview advice.
            </p>
            <Link to="/register/candidate" className="home-inline-link">
              Explore candidate flow <FiArrowRight />
            </Link>
          </article>

          <article className="home-audience-card surface-card recruiter">
            <span className="eyebrow">For Recruiters</span>
            <h3>Screening surfaces that explain the score.</h3>
            <p>
              Move from application volume to interpretable candidate signal with structured
              analysis, stage consistency, and clearer interview handoff.
            </p>
            <Link to="/register/recruiter" className="home-inline-link">
              Explore recruiter flow <FiArrowRight />
            </Link>
          </article>
        </div>
      </section>

      <section className="home-angle-strip">
        <div className="container home-angle-grid">
          {productAngles.map(({ title, copy, icon }) => (
            <article key={title} className="home-angle-card">
              {React.createElement(icon)}
              <h4>{title}</h4>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="home-cta">
        <div className="container home-cta-card surface-card">
          <div>
            <span className="eyebrow">Standout Demo</span>
            <h2 className="section-heading">A hiring product that feels tighter, smarter, and easier to trust.</h2>
          </div>
          <div className="home-cta-actions">
            <Link to="/register" className="action-link primary">
              Start with HireMe <FiArrowRight />
            </Link>
            <Link to="/login" className="action-link secondary">
              Sign in
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
