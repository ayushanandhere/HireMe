const Footer = () => {
  return (
    <footer className="app-shell-footer">
      <div className="container app-shell-footer-inner">
        <p>HireMe © {new Date().getFullYear()}.</p>
        <p>Command-center UI for candidates, recruiters, and AI-assisted hiring evidence.</p>
      </div>
    </footer>
  );
};

export default Footer; 
