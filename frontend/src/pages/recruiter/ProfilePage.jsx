import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaBuilding,
  FaCamera,
  FaCheckCircle,
  FaExclamationTriangle,
  FaGlobe,
  FaMapMarkerAlt,
  FaPhone,
  FaSave,
  FaSpinner,
} from 'react-icons/fa';
import { buildAssetUrl, recruiterService } from '../../services/api';
import '../ProfilePages.css';

const companySizeOptions = ['1-10', '11-50', '51-200', '201-500', '501+'];

const RecruiterProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [summary, setSummary] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    company: '',
    companyWebsite: '',
    companySize: '',
    industry: '',
    location: '',
    phone: '',
    bio: '',
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
          recruiterService.getProfile(),
          recruiterService.getDashboardSummary(),
        ]);

        if (!active) return;

        if (!profileResponse.success) {
          throw new Error(profileResponse.message || 'Failed to load recruiter profile.');
        }

        setProfile(profileResponse.data);
        setFormData((current) => ({
          ...current,
          name: profileResponse.data.name || '',
          title: profileResponse.data.title || '',
          company: profileResponse.data.company || '',
          companyWebsite: profileResponse.data.companyWebsite || '',
          companySize: profileResponse.data.companySize || '',
          industry: profileResponse.data.industry || '',
          location: profileResponse.data.location || '',
          phone: profileResponse.data.phone || '',
          bio: profileResponse.data.bio || '',
          profilePicture: null,
        }));

        if (summaryResponse.success) setSummary(summaryResponse.data);
        setError('');
      } catch (err) {
        if (!active) return;
        setError(err.message || 'Unable to load recruiter profile.');
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

    if (name === 'profilePicture') {
      if (profilePicturePreview.startsWith('blob:')) URL.revokeObjectURL(profilePicturePreview);
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
      payload.append('title', formData.title);
      payload.append('company', formData.company);
      payload.append('companyWebsite', formData.companyWebsite);
      payload.append('companySize', formData.companySize);
      payload.append('industry', formData.industry);
      payload.append('location', formData.location);
      payload.append('phone', formData.phone);
      payload.append('bio', formData.bio);

      if (formData.profilePicture) payload.append('profilePicture', formData.profilePicture);

      const response = await recruiterService.updateProfile(payload);

      if (!response.success) {
        throw new Error(response.message || 'Unable to save recruiter profile.');
      }

      setProfile(response.data);
      setFormData((current) => ({ ...current, ...response.data, profilePicture: null }));
      if (profilePicturePreview.startsWith('blob:')) URL.revokeObjectURL(profilePicturePreview);
      setProfilePicturePreview('');
      setSuccess('Profile saved.');
    } catch (err) {
      setError(err.message || 'Unable to save recruiter profile.');
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
  const liveRoles = summary?.jobs?.active || 0;
  const totalApplications = summary?.pipeline?.totalApplications || 0;
  const upcomingInterviews = summary?.interviews?.upcoming || 0;

  return (
    <div className="pf-page page-shell">
      {/* Header */}
      <header className="pf-header">
        <div className="pf-header-left">
          <h1>Profile</h1>
        </div>
        <div className="pf-header-actions">
          <Link to="/dashboard/recruiter/jobs/create" className="action-link primary">Publish role</Link>
        </div>
      </header>

      <div className="pf-layout">
        {/* Sidebar */}
        <aside className="pf-sidebar">
          <article className="pf-card">
            <div className="pf-preview">
              {avatarSrc ? (
                <div className="pf-avatar"><img src={avatarSrc} alt={formData.name || 'Recruiter'} /></div>
              ) : (
                <div className="pf-avatar pf-avatar-placeholder">{(formData.name || 'R').charAt(0).toUpperCase()}</div>
              )}
              <div className="pf-preview-info">
                <strong>{formData.name || 'Your name'}</strong>
                <span>{formData.title || 'Add a title'}</span>
              </div>
            </div>

            <div className="pf-preview-meta">
              {formData.company && <span><FaBuilding /> {formData.company}</span>}
              {formData.location && <span><FaMapMarkerAlt /> {formData.location}</span>}
              {formData.phone && <span><FaPhone /> {formData.phone}</span>}
              {formData.companyWebsite && (
                <a href={formData.companyWebsite} target="_blank" rel="noreferrer">
                  <FaGlobe /> {formData.companyWebsite.replace(/^https?:\/\//, '')}
                </a>
              )}
            </div>
          </article>

          <article className="pf-card">
            <h3 className="pf-card-title">Overview</h3>
            <div className="pf-stats">
              <div className="pf-stat-row"><span>Live roles</span><strong>{liveRoles}</strong></div>
              <div className="pf-stat-row"><span>Total applications</span><strong>{totalApplications}</strong></div>
              <div className="pf-stat-row"><span>Upcoming interviews</span><strong>{upcomingInterviews}</strong></div>
            </div>
          </article>

          {(formData.company || formData.industry) && (
            <article className="pf-card">
              <h3 className="pf-card-title">Company</h3>
              <div className="pf-stats">
                {formData.company && <div className="pf-stat-row"><span>Company</span><strong>{formData.company}</strong></div>}
                {formData.industry && <div className="pf-stat-row"><span>Industry</span><strong>{formData.industry}</strong></div>}
                {formData.companySize && <div className="pf-stat-row"><span>Size</span><strong>{formData.companySize}</strong></div>}
              </div>
            </article>
          )}
        </aside>

        {/* Form */}
        <main>
          <div className="pf-form-card">
            <form onSubmit={handleSubmit}>
              {/* Recruiter details */}
              <section className="pf-section">
                <h2 className="pf-section-title">Recruiter details</h2>
                <div className="pf-fields">
                  <div className="pf-field">
                    <label htmlFor="recruiter-name">Full name</label>
                    <input id="recruiter-name" name="name" value={formData.name} onChange={handleChange} />
                  </div>
                  <div className="pf-field">
                    <label htmlFor="recruiter-title">Title</label>
                    <input id="recruiter-title" name="title" value={formData.title} onChange={handleChange} placeholder="Lead recruiter" />
                  </div>
                  <div className="pf-field">
                    <label htmlFor="recruiter-company">Company</label>
                    <input id="recruiter-company" name="company" value={formData.company} onChange={handleChange} placeholder="Acme Labs" />
                  </div>
                  <div className="pf-field">
                    <label htmlFor="recruiter-website">Company website</label>
                    <input id="recruiter-website" name="companyWebsite" value={formData.companyWebsite} onChange={handleChange} placeholder="https://www.company.com" />
                  </div>
                  <div className="pf-field">
                    <label htmlFor="recruiter-location">Location</label>
                    <input id="recruiter-location" name="location" value={formData.location} onChange={handleChange} placeholder="Bengaluru, India" />
                  </div>
                  <div className="pf-field">
                    <label htmlFor="recruiter-phone">Phone</label>
                    <input id="recruiter-phone" name="phone" value={formData.phone} onChange={handleChange} placeholder="+91 90000 00000" />
                  </div>
                </div>
              </section>

              {/* Company details */}
              <section className="pf-section">
                <h2 className="pf-section-title">Company details</h2>

                <div className="pf-evidence-grid">
                  <div className="pf-field">
                    <label htmlFor="recruiter-size">Company size</label>
                    <select id="recruiter-size" name="companySize" value={formData.companySize} onChange={handleChange}>
                      <option value="">Select size</option>
                      {companySizeOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>

                  <div className="pf-upload">
                    <div className="pf-upload-info">
                      <span className="pf-upload-label">Profile picture</span>
                      <strong>{formData.profilePicture ? formData.profilePicture.name : 'PNG, JPG, or WEBP'}</strong>
                    </div>
                    <label className="pf-file-btn" htmlFor="recruiter-picture">
                      <FaCamera /> Upload
                      <input id="recruiter-picture" type="file" name="profilePicture" accept="image/png,image/jpeg,image/webp" onChange={handleChange} />
                    </label>
                  </div>
                </div>

                <div className="pf-field">
                  <label htmlFor="recruiter-industry">Industry</label>
                  <input id="recruiter-industry" name="industry" value={formData.industry} onChange={handleChange} placeholder="Technology" />
                </div>

                <div className="pf-field pf-field-wide">
                  <label htmlFor="recruiter-bio">Company summary</label>
                  <textarea id="recruiter-bio" name="bio" value={formData.bio} onChange={handleChange} placeholder="What your company does and what candidates can expect." />
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

export default RecruiterProfilePage;
