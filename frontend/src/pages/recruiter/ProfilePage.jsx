import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaArrowLeft,
  FaBuilding,
  FaCamera,
  FaCheckCircle,
  FaGlobe,
  FaMapMarkerAlt,
  FaPhone,
  FaSave,
  FaSpinner,
  FaUsers,
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

        if (!active) {
          return;
        }

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

        if (summaryResponse.success) {
          setSummary(summaryResponse.data);
        }

        setError('');
      } catch (err) {
        if (!active) {
          return;
        }

        setError(err.message || 'Unable to load recruiter profile.');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => () => {
    if (profilePicturePreview.startsWith('blob:')) {
      URL.revokeObjectURL(profilePicturePreview);
    }
  }, [profilePicturePreview]);

  const handleChange = (event) => {
    const { name, value, files } = event.target;

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
      payload.append('title', formData.title);
      payload.append('company', formData.company);
      payload.append('companyWebsite', formData.companyWebsite);
      payload.append('companySize', formData.companySize);
      payload.append('industry', formData.industry);
      payload.append('location', formData.location);
      payload.append('phone', formData.phone);
      payload.append('bio', formData.bio);

      if (formData.profilePicture) {
        payload.append('profilePicture', formData.profilePicture);
      }

      const response = await recruiterService.updateProfile(payload);

      if (!response.success) {
        throw new Error(response.message || 'Unable to save recruiter profile.');
      }

      setProfile(response.data);
      setFormData((current) => ({
        ...current,
        ...response.data,
        profilePicture: null,
      }));
      if (profilePicturePreview.startsWith('blob:')) {
        URL.revokeObjectURL(profilePicturePreview);
      }
      setProfilePicturePreview('');
      setSuccess('Recruiter profile updated. Candidate-facing recruiter identity now reads from the new profile data.');
    } catch (err) {
      setError(err.message || 'Unable to save recruiter profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="identity-loading">
        <div className="identity-loading-card surface-card">
          <div className="identity-loading-spinner" />
          <p>Loading recruiter identity...</p>
        </div>
      </div>
    );
  }

  const avatarSrc = profilePicturePreview || (profile?.profilePictureUrl ? buildAssetUrl(profile.profilePictureUrl) : '');
  const liveRoles = summary?.jobs?.active || 0;
  const totalApplications = summary?.pipeline?.totalApplications || 0;
  const upcomingInterviews = summary?.interviews?.upcoming || 0;
  const profileStateLabel = profile?.profileComplete ? 'Complete' : 'Needs attention';
  const pictureStateLabel = profile?.profilePictureUrl || profilePicturePreview ? 'Photo visible' : 'Initials only';

  return (
    <div className="identity-page page-shell">
      <div className="identity-shell">
        <section className="identity-top">
          <article className="identity-masthead">
            <div className="identity-masthead-copy">
              <span className="identity-kicker">Recruiter Profile</span>
              <h1>Run a polished hiring identity.</h1>
              <p>
                Candidate trust, role presentation, and interview context all depend on this profile.
                Keep the recruiter and company signal consistent across the funnel.
              </p>
            </div>

            <div className="identity-masthead-actions">
              <Link to="/dashboard/recruiter" className="identity-button identity-button-secondary">
                <FaArrowLeft /> Back to dashboard
              </Link>
              <Link to="/dashboard/recruiter/jobs/create" className="identity-button identity-button-primary">
                Publish a role
              </Link>
            </div>

            <div className="identity-metric-strip">
              <article className="identity-metric">
                <span>Live roles</span>
                <strong>{liveRoles}</strong>
              </article>
              <article className="identity-metric">
                <span>Total applications</span>
                <strong>{totalApplications}</strong>
              </article>
              <article className="identity-metric">
                <span>Upcoming interviews</span>
                <strong>{upcomingInterviews}</strong>
              </article>
            </div>
          </article>

          <aside className="identity-preview-panel">
            <span className="identity-kicker">Candidate Preview</span>
            <div className="identity-preview-head">
              {avatarSrc ? (
                <div className="identity-avatar">
                  <img src={avatarSrc} alt={formData.name || 'Recruiter'} />
                </div>
              ) : (
                <div className="identity-avatar-placeholder">
                  {(formData.name || 'R').charAt(0).toUpperCase()}
                </div>
              )}

              <div className="identity-preview-copy">
                <strong>{formData.name || 'Your recruiter name'}</strong>
                <span>{formData.title || 'Add the role candidates should recognize immediately.'}</span>
              </div>
            </div>

            <div className="identity-preview-meta">
              {formData.company && (
                <span>
                  <FaBuilding /> {formData.company}
                </span>
              )}
              {formData.location && (
                <span>
                  <FaMapMarkerAlt /> {formData.location}
                </span>
              )}
              {formData.companyWebsite && (
                <span>
                  <FaGlobe /> {formData.companyWebsite.replace(/^https?:\/\//, '')}
                </span>
              )}
            </div>

            <div className="identity-preview-stats">
              <article>
                <span>Profile state</span>
                <strong>{profileStateLabel}</strong>
              </article>
              <article>
                <span>Linked roles</span>
                <strong>{liveRoles}</strong>
              </article>
              <article>
                <span>Profile image</span>
                <strong>{pictureStateLabel}</strong>
              </article>
            </div>
          </aside>
        </section>

        <section className="identity-layout">
          <aside className="identity-rail">
            <article className="identity-card">
              <div className="identity-card-head">
                <div>
                  <span className="identity-kicker">Company Signal</span>
                  <h3>What candidates infer</h3>
                </div>
                <span className={`signal-chip ${profile?.profileComplete ? 'positive' : 'review'}`}>
                  {profileStateLabel}
                </span>
              </div>

              <div className="identity-rail-list">
                <div className="identity-rail-row">
                  <span>Company</span>
                  <strong>{formData.company || 'Add company name'}</strong>
                </div>
                <div className="identity-rail-row">
                  <span>Industry</span>
                  <strong>{formData.industry || 'Not specified'}</strong>
                </div>
                <div className="identity-rail-row">
                  <span>Company size</span>
                  <strong>{formData.companySize || 'Not specified'}</strong>
                </div>
              </div>
            </article>

            <article className="identity-card">
              <div className="identity-card-head">
                <div>
                  <span className="identity-kicker">Funnel Effect</span>
                  <h3>Shared recruiter signal</h3>
                </div>
              </div>

              <div className="identity-rail-list">
                <div className="identity-rail-row">
                  <span>Jobs linked</span>
                  <strong>{liveRoles} live roles reflect this recruiter profile</strong>
                </div>
                <div className="identity-rail-row">
                  <span>Profile image</span>
                  <strong>{pictureStateLabel}</strong>
                </div>
              </div>

              <p className="identity-note">
                Updating the company name here also updates recruiter-owned jobs so candidate job views
                stay aligned with the latest company identity.
              </p>
            </article>
          </aside>

          <main className="identity-main">
            <article className="identity-card identity-editor">
              <form onSubmit={handleSubmit}>
                <section className="identity-section">
                  <div className="identity-section-head">
                    <div>
                      <span className="identity-kicker">Core Identity</span>
                      <h2>Recruiter details</h2>
                      <p>The recruiter and company details candidates rely on when deciding whether to engage.</p>
                    </div>
                    <span className="signal-chip active">Live to candidates</span>
                  </div>

                  <div className="identity-form-grid">
                    <div className="identity-form-field">
                      <label htmlFor="recruiter-name">Full name</label>
                      <input id="recruiter-name" name="name" value={formData.name} onChange={handleChange} />
                    </div>
                    <div className="identity-form-field">
                      <label htmlFor="recruiter-title">Title</label>
                      <input
                        id="recruiter-title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="Lead recruiter"
                      />
                    </div>
                    <div className="identity-form-field">
                      <label htmlFor="recruiter-company">Company</label>
                      <input
                        id="recruiter-company"
                        name="company"
                        value={formData.company}
                        onChange={handleChange}
                        placeholder="Acme Labs"
                      />
                    </div>
                    <div className="identity-form-field">
                      <label htmlFor="recruiter-website">Company website</label>
                      <input
                        id="recruiter-website"
                        name="companyWebsite"
                        value={formData.companyWebsite}
                        onChange={handleChange}
                        placeholder="https://www.company.com"
                      />
                    </div>
                    <div className="identity-form-field">
                      <label htmlFor="recruiter-location">Location</label>
                      <input
                        id="recruiter-location"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        placeholder="Bengaluru, India"
                      />
                    </div>
                    <div className="identity-form-field">
                      <label htmlFor="recruiter-phone">Phone</label>
                      <input
                        id="recruiter-phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+91 90000 00000"
                      />
                    </div>
                  </div>
                </section>

                <section className="identity-section">
                  <div className="identity-section-head">
                    <div>
                      <span className="identity-kicker">Company Context</span>
                      <h2>Team and brand details</h2>
                      <p>Frame the company clearly so the public-facing recruiter profile feels credible and complete.</p>
                    </div>
                  </div>

                  <div className="identity-evidence-grid">
                    <div className="identity-form-field identity-form-field-compact">
                      <label htmlFor="recruiter-size">Company size</label>
                      <select
                        id="recruiter-size"
                        name="companySize"
                        value={formData.companySize}
                        onChange={handleChange}
                      >
                        <option value="">Select size</option>
                        {companySizeOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="identity-upload-card">
                      <div className="identity-upload-head">
                        <div>
                          <span className="identity-upload-label-text">Profile picture</span>
                          <strong>{formData.profilePicture ? formData.profilePicture.name : 'PNG, JPG, or WEBP'}</strong>
                        </div>
                        <label className="identity-file-button" htmlFor="recruiter-picture">
                          <FaCamera /> Upload image
                          <input
                            id="recruiter-picture"
                            type="file"
                            name="profilePicture"
                            accept="image/png,image/jpeg,image/webp"
                            onChange={handleChange}
                          />
                        </label>
                      </div>
                      <p>Shown as the recruiter identity across recruiter and candidate-facing surfaces.</p>
                    </div>
                  </div>

                  <div className="identity-form-grid">
                    <div className="identity-form-field">
                      <label htmlFor="recruiter-industry">Industry</label>
                      <input
                        id="recruiter-industry"
                        name="industry"
                        value={formData.industry}
                        onChange={handleChange}
                        placeholder="Technology"
                      />
                    </div>
                  </div>

                  <div className="identity-form-field identity-form-field-wide">
                    <label htmlFor="recruiter-bio">Recruiter / company summary</label>
                    <textarea
                      id="recruiter-bio"
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      placeholder="Summarize what kind of teams you hire for, what candidates can expect, and how your company tends to operate."
                    />
                  </div>
                </section>

                <div className="identity-savebar">
                  <p>
                    This profile is the recruiter source of truth for candidate-facing job and interview context.
                  </p>
                  <button type="submit" className="identity-save-button" disabled={saving}>
                    {saving ? <><FaSpinner className="identity-inline-spin" /> Saving...</> : <><FaSave /> Save recruiter profile</>}
                  </button>
                </div>

                {success && (
                  <div className="identity-feedback success">
                    <FaCheckCircle /> {success}
                  </div>
                )}
                {error && (
                  <div className="identity-feedback error">
                    <FaUsers /> {error}
                  </div>
                )}
              </form>
            </article>
          </main>
        </section>
      </div>
    </div>
  );
};

export default RecruiterProfilePage;
