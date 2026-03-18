import React from 'react';
import { Link } from 'react-router-dom';

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Route render error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="app-shell-main">
          <div className="container">
            <section className="app-error-boundary surface-card">
              <span className="eyebrow">Route failure</span>
              <h1>That page failed while rendering.</h1>
              <p>
                The app shell is still live, but this specific screen hit a runtime error. Use the
                navigation to move elsewhere while the issue is fixed.
              </p>
              {import.meta.env.DEV && this.state.error?.message ? (
                <pre className="app-error-boundary-log">{this.state.error.message}</pre>
              ) : null}
              <div className="app-error-boundary-actions">
                <Link to="/" className="action-link ghost">Home</Link>
                <Link to="/dashboard/candidate" className="action-link primary">Candidate dashboard</Link>
                <Link to="/dashboard/recruiter" className="action-link secondary">Recruiter dashboard</Link>
              </div>
            </section>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}

export default AppErrorBoundary;
