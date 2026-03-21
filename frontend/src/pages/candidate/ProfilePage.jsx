import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaCamera,
  FaCheckCircle,
  FaExclamationTriangle,
  FaFileUpload,
  FaLinkedin,
  FaMapMarkerAlt,
  FaPhone,
  FaSave,
  FaSpinner,
} from 'react-icons/fa';
import { buildAssetUrl, candidateService } from '../../services/api';
import '../ProfilePages.css';

const experienceOptions = ['0-1', '1-3', '3-5', '5-10', '10+'];

const CandidateProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [summary, setSummary] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    headline: '',
    location: '',
    phone: '',
    linkedin: '',
    skills: '',
    experience: '',
    bio: '',
    resume: null,
    profilePicture: null,
  });
  const [profilePicturePreview, setProfilePicturePreview] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setLoading(true);
        const [profileResponse, summaryResponse] = await Promise.all([
          candidateService.getProfile(),
          candidateService.getDashboardSummary(),
        ]);

        if (!active) return;

        if (!profileResponse.success) {
          throw new Error(profileResponse.message || 'Failed to load profile.');
        }

        setProfile(profileResponse.data);
        setFormData((current) => ({
          ...current,
          name: profileResponse.data.name || '',
          headline: profileResponse.data.headline || '',
          location: profileResponse.data.location || '',
          phone: profileResponse.data.phone || '',
          linkedin: profileResponse.data.linkedin || '',
          skills: profileResponse.data.skills || '',
          experience: profileResponse.data.experience || '',
          bio: profileResponse.data.bio || '',
          resume: null,
          profilePicture: null,
        }));

        if (summaryResponse.success) {
          setSummary(summaryResponse.data);
        }

        setError('');
      } catch (err) {
        if (!active) return;
        setError(err.message || 'Unable to load candidate profile.');
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => { active = false; };
  }, []);

  useEffect(() => () => {
    if (profilePicturePreview.startsWith('blob:')) {
      URL.revokeObjectURL(profilePicturePreview);
    }
  }, [profilePicturePreview]);

  const handleChange = (event) => {
    const { name, value, files } = event.target;

    if (name === 'resume') {
      setFormData((current) => ({ ...current, resume: files?.[0] || null }));
      return;
    }

    if (name === 'profilePicture') {
      if (profilePicturePreview.startsWith('blob:')) {
        URL.revokeObjectURL(profilePicturePreview);
      }
      const file = files?.[0] || null;
      setFormData((current) => ({ ...current, profilePicture: file }));
      setProfilePicturePreview(file ? URL.createObjectURL(file) : '');
      return;
    }

    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const payload = new FormData();
      payload.append('name', formData.name);
      payload.append('headline', formData.headline);
      payload.append('location', formData.location);
      payload.append('phone', formData.phone);
      payload.append('linkedin', formData.linkedin);
      payload.append('skills', formData.skills);
      payload.append('experience', formData.experience);
      payload.append('bio', formData.bio);

      if (formData.resume) payload.append('resume', formData.resume);
      if (formData.profilePicture) payload.append('profilePicture', formData.profilePicture);

      const response = await candidateService.updateProfile(payload);

      if (!response.success) {
        throw new Error(response.message || 'Unable to save candidate profile.');
      }

      setProfile(response.data);
      setFormData((current) => ({ ...current, ...response.data, resume: null, profilePicture: null }));
      if (profilePicturePreview.startsWith('blob:')) URL.revokeObjectURL(profilePicturePreview);
      setProfilePicturePreview('');
      setSuccess('Profile saved.');
    } catch (err) {
      setError(err.message || 'Unable to save candidate profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="pf-loading">
        <div className="pf-spinner" />
      </div>
    );
  }

  const avatarSrc = profilePicturePreview || (profile?.profilePictureUrl ? buildAssetUrl(profile.profilePictureUrl) : '');
  const applicationsCount = summary?.applicationSummary?.total || 0;
  const interviewsCount = summary?.interviewSummary?.upcoming || 0;
  const recommendationCount = summary?.recommendedJobs?.length || 0;
  const skillList = (formData.skills || '').split(',').map((s) => s.trim()).filter(Boolean);
  const parsingStatusLabel = (profile?.resumeParsingStatus || 'not started').replace(/_/g, ' ');

  return (
    <div className="pf-page page-shell">
      {/* Header */}
      <header className="pf-header">
        <div className="pf-header-left">
          <h1>Profile</h1>
        </div>
        <div className="pf-header-actions">
          <Link to="/dashboard/candidate/jobs" className="action-link primary">Browse jobs</Link>
        </div>
      </header>

      <div className="pf-layout">
        {/* Sidebar */}
        <aside className="pf-sidebar">
          <article className="pf-card">
            <div className="pf-preview">
              {avatarSrc ? (
                <div className="pf-avatar"><img src={avatarSrc} alt={formData.name || 'Candidate'} /></div>
              ) : (
                <div className="pf-avatar pf-avatar-placeholder">{(formData.name || 'C').charAt(0).toUpperCase()}</div>
              )}
              <div className="pf-preview-info">
                <strong>{formData.name || 'Your name'}</strong>
                <span>{formData.headline || 'Add a headline'}</span>
              </div>
            </div>

            <div className="pf-preview-meta">
              {formData.location && <span><FaMapMarkerAlt /> {formData.location}</span>}
              {formData.phone && <span><FaPhone /> {formData.phone}</span>}
              {formData.linkedin && (
                <a href={formData.linkedin} target="_blank" rel="noreferrer">
                  <FaLinkedin /> {formData.linkedin.replace(/^https?:\/\//, '')}
                </a>
              )}
            </div>
          </article>

          <article className="pf-card">
            <h3 className="pf-card-title">Overview</h3>
            <div className="pf-stats">
              <div className="pf-stat-row"><span>Applications</span><strong>{applicationsCount}</strong></div>
              <div className="pf-stat-row"><span>Upcoming interviews</span><strong>{interviewsCount}</strong></div>
              <div className="pf-stat-row"><span>Recommended roles</span><strong>{recommendationCount}</strong></div>
              <div className="pf-stat-row"><span>Resume parsing</span><strong>{parsingStatusLabel}</strong></div>
            </div>
          </article>

          {skillList.length > 0 && (
            <article className="pf-card">
              <h3 className="pf-card-title">Skills</h3>
              <div className="pf-skills">
                {skillList.slice(0, 10).map((skill) => <span key={skill}>{skill}</span>)}
              </div>
            </article>
          )}
        </aside>

        {/* Form */}
        <main>
          <div className="pf-form-card">
            <form onSubmit={handleSubmit}>
              {/* Basic details */}
              <section className="pf-section">
                <h2 className="pf-section-title">Basic details</h2>
                <div className="pf-fields">
                  <div className="pf-field">
                    <label htmlFor="candidate-name">Full name</label>
                    <input id="candidate-name" name="name" value={formData.name} onChange={handleChange} />
                  </div>
                  <div className="pf-field">
                    <label htmlFor="candidate-headline">Headline</label>
                    <input id="candidate-headline" name="headline" value={formData.headline} onChange={handleChange} placeholder="Full-stack engineer focused on product quality" />
                  </div>
                  <div className="pf-field">
                    <label htmlFor="candidate-location">Location</label>
                    <input id="candidate-location" name="location" value={formData.location} onChange={handleChange} placeholder="Bengaluru, India" />
                  </div>
                  <div className="pf-field">
                    <label htmlFor="candidate-phone">Phone</label>
                    <input id="candidate-phone" name="phone" value={formData.phone} onChange={handleChange} placeholder="+91 90000 00000" />
                  </div>
                  <div className="pf-field pf-field-wide">
                    <label htmlFor="candidate-linkedin">LinkedIn</label>
                    <input id="candidate-linkedin" name="linkedin" value={formData.linkedin} onChange={handleChange} placeholder="https://www.linkedin.com/in/your-profile" />
                  </div>
                </div>
              </section>

              {/* About */}
              <section className="pf-section">
                <h2 className="pf-section-title">About</h2>
                <div className="pf-field pf-field-wide">
                  <label htmlFor="candidate-bio">Professional summary</label>
                  <textarea id="candidate-bio" name="bio" value={formData.bio} onChange={handleChange} placeholder="Describe your focus, strengths, and the kind of work you want." />
                </div>
              </section>

              {/* Skills & files */}
              <section className="pf-section">
                <h2 className="pf-section-title">Skills & files</h2>

                <div className="pf-evidence-grid">
                  <div className="pf-field">
                    <label htmlFor="candidate-experience">Experience</label>
                    <select id="candidate-experience" name="experience" value={formData.experience} onChange={handleChange}>
                      <option value="">Select range</option>
                      {experienceOptions.map((opt) => <option key={opt} value={opt}>{opt} years</option>)}
                    </select>
                  </div>

                  <div className="pf-upload">
                    <div className="pf-upload-info">
                      <span className="pf-upload-label">Profile picture</span>
                      <strong>{formData.profilePicture ? formData.profilePicture.name : 'PNG, JPG, or WEBP'}</strong>
                    </div>
                    <label className="pf-file-btn" htmlFor="candidate-picture">
                      <FaCamera /> Upload
                      <input id="candidate-picture" type="file" name="profilePicture" accept="image/png,image/jpeg,image/webp" onChange={handleChange} />
                    </label>
                  </div>
                </div>

                <div className="pf-field pf-field-wide">
                  <label htmlFor="candidate-skills">Skills</label>
                  <textarea id="candidate-skills" name="skills" value={formData.skills} onChange={handleChange} placeholder="React, TypeScript, Node.js, API design" />
                  <small>Comma-separated for accurate matching.</small>
                </div>

                <div className="pf-upload">
                  <div className="pf-upload-info">
                    <span className="pf-upload-label">Resume</span>
                    <strong>{formData.resume ? formData.resume.name : 'PDF only'}</strong>
                    <p>{profile?.hasResume ? 'Replacing updates access immediately.' : 'Upload to improve matching.'}</p>
                  </div>
                  <label className="pf-file-btn" htmlFor="candidate-resume">
                    <FaFileUpload /> {profile?.hasResume ? 'Replace' : 'Upload'}
                    <input id="candidate-resume" type="file" name="resume" accept="application/pdf" onChange={handleChange} />
                  </label>
                </div>
              </section>

              {/* Save */}
              <div className="pf-savebar">
                <button type="submit" className="pf-save-btn" disabled={saving}>
                  {saving ? <><FaSpinner className="pf-inline-spin" /> Saving...</> : <><FaSave /> Save profile</>}
                </button>
              </div>

              {success && <div className="pf-feedback success"><FaCheckCircle /> {success}</div>}
              {error && <div className="pf-feedback error"><FaExclamationTriangle /> {error}</div>}
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CandidateProfilePage;
