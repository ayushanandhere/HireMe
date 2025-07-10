import React, { useState } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import api from '../services/api';
import { FaCloudUploadAlt, FaRegFilePdf } from 'react-icons/fa';

const ResumeUploader = ({ onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [skills, setSkills] = useState([]);
  const [experience, setExperience] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a file');
      return;
    }

    if (file.type !== 'application/pdf') {
      setError('Only PDF files are supported');
      return;
    }

    const formData = new FormData();
    formData.append('resume', file);

    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // Get token from localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('You must be logged in to upload a resume');
        setLoading(false);
        return;
      }

      const response = await api.post('/resume/parse', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        setSuccess('Resume parsed successfully!');
        setSkills(response.data.data.skills || []);
        setExperience(response.data.data.experience || '');
        
        // If toast is available, use it too
        if (typeof toast === 'function') {
          toast.success('Resume parsed successfully!');
        }
        
        // Call the onUploadSuccess callback if provided
        if (typeof onUploadSuccess === 'function') {
          onUploadSuccess(response.data.data);
        }
      }
    } catch (error) {
      console.error('Resume upload error:', error);
      setError(error.response?.data?.message || 'Error uploading resume');
      
      // If toast is available, use it too
      if (typeof toast === 'function') {
        toast.error(error.response?.data?.message || 'Error uploading resume');
      }
    } finally {
      setLoading(false);
    }
  };

  const cardStyle = {
    backgroundColor: '#0d3b2e',
    color: 'white',
    borderRadius: '10px',
    marginBottom: '20px',
    padding: '25px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
  };

  const uploadBoxStyle = {
    border: '2px dashed rgba(255, 255, 255, 0.3)',
    borderRadius: '8px',
    padding: '30px 20px',
    textAlign: 'center',
    marginBottom: '20px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  };

  const buttonStyle = {
    backgroundColor: '#2196f3',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '10px 20px',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    transition: 'all 0.2s ease'
  };

  const fileNameStyle = {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '4px',
    padding: '10px 15px',
    marginTop: '15px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  };

  return (
    <div style={cardStyle}>
      <h3 className="mb-4">Resume Parser</h3>
      
      {error && (
        <div className="alert alert-danger">{error}</div>
      )}
      
      {success && (
        <div className="alert alert-success">{success}</div>
      )}
      
      <form onSubmit={handleSubmit}>
        <label htmlFor="resume" style={uploadBoxStyle}>
          <div className="mb-3">
            <FaCloudUploadAlt size={50} style={{ opacity: 0.7 }} />
          </div>
          <h5>Drop your resume here</h5>
          <p className="text-light opacity-75 mb-0">or click to browse (PDF only)</p>
          <input
            type="file"
            id="resume"
            accept=".pdf"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </label>
        
        {file && (
          <div style={fileNameStyle}>
            <div className="d-flex align-items-center">
              <FaRegFilePdf className="me-2" style={{ color: '#f44336' }} />
              <span>{file.name}</span>
            </div>
            <span className="small opacity-75">{(file.size / 1024).toFixed(1)} KB</span>
          </div>
        )}
        
        <button 
          type="submit" 
          style={{...buttonStyle, marginTop: '20px'}}
          disabled={loading || !file}
        >
          {loading ? 'Uploading and Parsing...' : 'Upload & Parse'}
        </button>
      </form>

      {skills.length > 0 && (
        <div className="mt-4">
          <h5>Detected Skills</h5>
          <div className="d-flex flex-wrap gap-2 mt-3">
            {skills.map((skill, index) => (
              <span 
                key={index}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '4px',
                  padding: '5px 10px',
                  fontSize: '0.9rem'
                }}
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {experience && (
        <div className="mt-4">
          <h5>Detected Experience</h5>
          <p className="opacity-75 mt-2">{experience}</p>
        </div>
      )}
    </div>
  );
};

export default ResumeUploader; 