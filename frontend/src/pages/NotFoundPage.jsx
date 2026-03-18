import { Link } from 'react-router-dom';
import { FiArrowLeft, FiCompass, FiSearch } from 'react-icons/fi';
import './NotFoundPage.css';

const NotFoundPage = () => {
  return (
    <div className="not-found-page page-shell">
      <div className="container">
        <div className="not-found-grid">
          <section className="not-found-panel instrument-card">
            <span className="eyebrow eyebrow-dark">
              <FiCompass />
              Route mismatch
            </span>
            <h1>404</h1>
            <p>
              This route does not map to a live HireMe surface. The page may have been moved,
              removed, or never existed in the current workflow.
            </p>
            <div className="not-found-actions">
              <Link to="/" className="action-link primary">
                <FiArrowLeft />
                Return home
              </Link>
            </div>
          </section>

          <aside className="not-found-brief surface-card">
            <span className="eyebrow">
              <FiSearch />
              Suggested recovery
            </span>
            <div className="not-found-steps">
              <div>
                <strong>Check the role route</strong>
                <span>Candidate and recruiter paths use different dashboards and detail screens.</span>
              </div>
              <div>
                <strong>Return to the last working surface</strong>
                <span>Use the app shell navigation or go back to the dashboard that matches your account.</span>
              </div>
              <div>
                <strong>Retry from the top-level flow</strong>
                <span>Start from home, login, or register if the route came from an expired bookmark.</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
