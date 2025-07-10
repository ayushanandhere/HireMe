import { Link } from 'react-router-dom';

const ThemeShowcase = () => {
  return (
    <div className="theme-showcase">
      <div className="text-center mb-5">
        <h1 className="mb-4">Theme Showcase</h1>
        <p className="lead">This page demonstrates the styling elements used throughout the application</p>
      </div>
      
      <div className="row mb-5">
        <div className="col-md-6 mb-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Typography</h5>
              <h1>Heading 1</h1>
              <h2>Heading 2</h2>
              <h3>Heading 3</h3>
              <p>This is a paragraph with <a href="#">a link</a> included.</p>
              <p>Text with <span style={{ color: 'var(--accent-color)' }}>accent color</span> applied.</p>
              <p className="lead">This is lead text, used for introductory paragraphs.</p>
              <p className="text-muted">This is muted text, typically used for secondary information.</p>
            </div>
          </div>
        </div>
        
        <div className="col-md-6 mb-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Buttons</h5>
              <p className="mb-3">Primary and secondary button styles:</p>
              <div className="d-flex flex-wrap gap-2 mb-4">
                <button className="btn btn-primary">Primary Button</button>
                <button className="btn btn-outline-secondary">Secondary Button</button>
              </div>
              
              <p className="mb-3">Large button variants:</p>
              <div className="d-flex flex-wrap gap-2 mb-4">
                <button className="btn btn-primary btn-lg">Large Primary</button>
                <button className="btn btn-outline-secondary btn-lg">Large Secondary</button>
              </div>
              
              <p className="mb-3">Button links:</p>
              <div className="d-flex flex-wrap gap-2">
                <Link to="/" className="btn btn-primary">Primary Link</Link>
                <Link to="/" className="btn btn-outline-secondary">Secondary Link</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="row">
        <div className="col-md-6 mb-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Form Elements</h5>
              <form>
                <div className="mb-3">
                  <label htmlFor="exampleInput" className="form-label">Text Input</label>
                  <input type="text" className="form-control" id="exampleInput" placeholder="Enter text" />
                  <div className="form-text">Helper text appears in muted color.</div>
                </div>
                
                <div className="mb-3">
                  <label htmlFor="exampleSelect" className="form-label">Select Input</label>
                  <select className="form-control" id="exampleSelect">
                    <option>Option 1</option>
                    <option>Option 2</option>
                    <option>Option 3</option>
                  </select>
                </div>
                
                <div className="mb-3">
                  <label htmlFor="exampleTextarea" className="form-label">Textarea</label>
                  <textarea className="form-control" id="exampleTextarea" rows="3" placeholder="Enter multiple lines of text"></textarea>
                </div>
                
                <div className="mb-3 form-check">
                  <input type="checkbox" className="form-check-input" id="exampleCheck" />
                  <label className="form-check-label" htmlFor="exampleCheck">Checkbox example</label>
                </div>
                
                <button type="submit" className="btn btn-primary">Submit Form</button>
              </form>
            </div>
          </div>
        </div>
        
        <div className="col-md-6 mb-4">
          <div className="card mb-4">
            <div className="card-body">
              <h5 className="card-title">Alerts</h5>
              <div className="alert alert-success mb-3" role="alert">
                <strong>Success!</strong> This is a success alert with the new theme colors!
              </div>
              <div className="alert alert-danger mb-3" role="alert">
                <strong>Error!</strong> This is a danger alert with the new theme colors!
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Card Styling</h5>
              <p>Cards have the following features:</p>
              <ul>
                <li>Subtle gradient highlight on hover</li>
                <li>Elevation effect with shadow</li>
                <li>Smooth transition animations</li>
                <li>Proper spacing for content</li>
              </ul>
              <div className="d-grid gap-2 mt-3">
                <button className="btn btn-primary">Card Action</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeShowcase; 