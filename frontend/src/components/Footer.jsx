const Footer = () => {
  return (
    <footer className="bg-dark text-white py-3 mt-auto">
      <div className="container">
        <div className="row align-items-center">
          <div className="col-md-6 text-center text-md-start">
            <p className="mb-0 d-flex align-items-center justify-content-center justify-content-md-start">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="20" 
                height="20" 
                fill="currentColor" 
                className="bi bi-briefcase-fill me-2" 
                viewBox="0 0 16 16"
                style={{ color: 'var(--accent-color)' }}
              >
                <path d="M6.5 1A1.5 1.5 0 0 0 5 2.5V3H1.5A1.5 1.5 0 0 0 0 4.5v1.384l7.614 2.03a1.5 1.5 0 0 0 .772 0L16 5.884V4.5A1.5 1.5 0 0 0 14.5 3H11v-.5A1.5 1.5 0 0 0 9.5 1h-3zm0 1h3a.5.5 0 0 1 .5.5V3H6v-.5a.5.5 0 0 1 .5-.5z"/>
                <path d="M0 12.5A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5V6.85L8.129 8.947a.5.5 0 0 1-.258 0L0 6.85v5.65z"/>
              </svg>
              <span>HireMe &copy; {new Date().getFullYear()}</span>
            </p>
          </div>
          <div className="col-md-6 mt-3 mt-md-0">
            <ul className="list-inline text-center text-md-end mb-0">
              <li className="list-inline-item me-3">
                <a href="#" className="text-decoration-none">About</a>
              </li>
              <li className="list-inline-item me-3">
                <a href="#" className="text-decoration-none">Privacy</a>
              </li>
              <li className="list-inline-item">
                <a href="#" className="text-decoration-none">Terms</a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 