import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../AuthPages.css';
import { authService, candidateService } from '../../services/api';
import GoogleAuthButton from '../../components/GoogleAuthButton';

const CandidateRegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    skills: '',
    experience: '',
    resume: null
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'resume' && files && files[0]) {
      setFormData({
        ...formData,
        resume: files[0]
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all required fields');
      return;
    }
    
    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    
    // Clear any previous errors
    setError('');
    setLoading(true);
    
    // Create form data for file upload
    const submitFormData = new FormData();
    submitFormData.append('name', formData.name);
    submitFormData.append('email', formData.email);
    submitFormData.append('password', formData.password);
    submitFormData.append('skills', formData.skills);
    submitFormData.append('experience', formData.experience);
    if (formData.resume) {
      submitFormData.append('resume', formData.resume);
    }
    
    try {
      const response = await candidateService.register(submitFormData);
      
      if (response.success) {
        navigate(authService.getDefaultRoute(response.data));
      }
    } catch (error) {
      setError(error.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Candidate Registration</h2>
          <p className="auth-subtitle">Create your job seeker account</p>
        </div>
        
        {error && <div className="auth-error">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Full Name*</label>
            <input
              type="text"
              id="name"
              name="name"
              className="form-control"
              placeholder="John Doe"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Email Address*</label>
            <input
              type="email"
              id="email"
              name="email"
              className="form-control"
              placeholder="your@email.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password*</label>
            <input
              type="password"
              id="password"
              name="password"
              className="form-control"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password*</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              className="form-control"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="skills">Skills (comma-separated)</label>
            <input
              type="text"
              id="skills"
              name="skills"
              className="form-control"
              placeholder="React, JavaScript, Node.js"
              value={formData.skills}
              onChange={handleChange}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="experience">Years of Experience</label>
            <select
              id="experience"
              name="experience"
              className="form-control"
              value={formData.experience}
              onChange={handleChange}
            >
              <option value="">Select Experience</option>
              <option value="0-1">0-1 years</option>
              <option value="1-3">1-3 years</option>
              <option value="3-5">3-5 years</option>
              <option value="5-10">5-10 years</option>
              <option value="10+">10+ years</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="resume">Resume (PDF only)</label>
            <input
              type="file"
              id="resume"
              name="resume"
              className="form-control"
              accept=".pdf"
              onChange={handleChange}
            />
            <small className="text-muted">Max file size: 5MB</small>
          </div>
          
          <div className="form-action">
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Registering...' : 'Register'}
            </button>
          </div>
        </form>
        
        <div className="divider">
          <span>or</span>
        </div>
        
        <div className="social-login">
          <GoogleAuthButton
            role="candidate"
            mode="register"
            onError={setError}
            onSuccess={(user) => navigate(authService.getDefaultRoute(user))}
          />
        </div>
        
        <div className="auth-footer">
          Already have an account? <Link to="/login/candidate" className="auth-link">Sign In</Link>
        </div>
      </div>
    </div>
  );
};

export default CandidateRegisterPage; 
