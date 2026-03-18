import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaArrowLeft,
  FaCamera,
  FaCheckCircle,
  FaFileUpload,
  FaLinkedin,
  FaMapMarkerAlt,
  FaPhone,
  FaSave,
  FaSpinner,
  FaUserAstronaut,
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

        if (!active) {
          return;
        }

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
        if (!active) {
          return;
        }

        setError(err.message || 'Unable to load candidate profile.');
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

      if (formData.resume) {
        payload.append('resume', formData.resume);
      }

      if (formData.profilePicture) {
        payload.append('profilePicture', formData.profilePicture);
      }

      const response = await candidateService.updateProfile(payload);

      if (!response.success) {
        throw new Error(response.message || 'Unable to save candidate profile.');
      }

      setProfile(response.data);
      setFormData((current) => ({
        ...current,
        ...response.data,
        resume: null,
        profilePicture: null,
      }));
      if (profilePicturePreview.startsWith('blob:')) {
        URL.revokeObjectURL(profilePicturePreview);
      }
      setProfilePicturePreview('');
      setSuccess('Candidate profile updated. Recruiter views now read the new data directly.');
    } catch (err) {
      setError(err.message || 'Unable to save candidate profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="identity-loading">
        <div className="identity-loading-card surface-card">
          <div className="identity-loading-spinner" />
          <p>Loading candidate identity...</p>
        </div>
      </div>
    );
  }

  const avatarSrc = profilePicturePreview || (profile?.profilePictureUrl ? buildAssetUrl(profile.profilePictureUrl) : '');
  const applicationsCount = summary?.applicationSummary?.total || 0;
  const interviewsCount = summary?.interviewSummary?.upcoming || 0;
  const recommendationCount = summary?.recommendedJobs?.length || 0;
  const skillList = (formData.skills || '')
    .split(',')
    .map((skill) => skill.trim())
    .filter(Boolean);
  const parsingStatusLabel = (profile?.resumeParsingStatus || 'not_started').replace(/_/g, ' ');
  const profileStateLabel = profile?.profileComplete ? 'Complete' : 'Needs attention';
  const profileAssetLabel = profile?.profilePictureUrl || profilePicturePreview ? 'Photo visible' : 'Initials only';

  return (
    <div className="identity-page page-shell">
      <div className="identity-shell">
        <section className="identity-top">
          <article className="identity-masthead">
            <div className="identity-masthead-copy">
              <span className="identity-kicker">Candidate Profile</span>
              <h1>Present a clear, credible profile.</h1>
              <p>
                This page is your source of truth for recruiter review, job matching, and resume-led
                screening. Keep it precise, current, and easy to scan.
              </p>
            </div>

            <div className="identity-masthead-actions">
              <Link to="/dashboard/candidate" className="identity-button identity-button-secondary">
                <FaArrowLeft /> Back to dashboard
              </Link>
              <Link to="/dashboard/candidate/jobs" className="identity-button identity-button-primary">
                Browse jobs
              </Link>
            </div>

            <div className="identity-metric-strip">
              <article className="identity-metric">
                <span>Applications</span>
                <strong>{applicationsCount}</strong>
              </article>
              <article className="identity-metric">
                <span>Upcoming interviews</span>
                <strong>{interviewsCount}</strong>
              </article>
              <article className="identity-metric">
                <span>Best-fit roles</span>
                <strong>{recommendationCount}</strong>
              </article>
            </div>
          </article>

          <aside className="identity-preview-panel">
            <span className="identity-kicker">Recruiter Preview</span>
            <div className="identity-preview-head">
              {avatarSrc ? (
                <div className="identity-avatar">
                  <img src={avatarSrc} alt={formData.name || 'Candidate'} />
                </div>
              ) : (
                <div className="identity-avatar-placeholder">
                  {(formData.name || 'C').charAt(0).toUpperCase()}
                </div>
              )}

              <div className="identity-preview-copy">
                <strong>{formData.name || 'Your name'}</strong>
                <span>{formData.headline || 'Add a concise headline that communicates your focus clearly.'}</span>
              </div>
            </div>

            <div className="identity-preview-meta">
              {formData.location && (
                <span>
                  <FaMapMarkerAlt /> {formData.location}
                </span>
              )}
              {formData.phone && (
                <span>
                  <FaPhone /> {formData.phone}
                </span>
              )}
              {formData.linkedin && (
                <span>
                  <FaLinkedin /> {formData.linkedin.replace(/^https?:\/\//, '')}
                </span>
              )}
            </div>

            <div className="identity-preview-stats">
              <article>
                <span>Profile state</span>
                <strong>{profileStateLabel}</strong>
              </article>
              <article>
                <span>Resume state</span>
                <strong>{profile?.hasResume ? 'On file' : 'Missing'}</strong>
              </article>
              <article>
                <span>ATS state</span>
                <strong>{parsingStatusLabel}</strong>
              </article>
            </div>
          </aside>
        </section>

        <section className="identity-layout">
          <aside className="identity-rail">
            <article className="identity-card">
              <div className="identity-card-head">
                <div>
                  <span className="identity-kicker">Profile Health</span>
                  <h3>Current readout</h3>
                </div>
                <span className={`signal-chip ${profile?.profileComplete ? 'positive' : 'review'}`}>
                  {profileStateLabel}
                </span>
              </div>

              <div className="identity-rail-list">
                <div className="identity-rail-row">
                  <span>Email</span>
                  <strong>{profile?.email}</strong>
                </div>
                <div className="identity-rail-row">
                  <span>Experience band</span>
                  <strong>{formData.experience ? `${formData.experience} years` : 'Not added yet'}</strong>
                </div>
                <div className="identity-rail-row">
                  <span>ATS score</span>
                  <strong>{profile?.atsScore ? `${profile.atsScore}/100` : 'Not parsed yet'}</strong>
                </div>
              </div>
            </article>

            <article className="identity-card">
              <div className="identity-card-head">
                <div>
                  <span className="identity-kicker">Assets</span>
                  <h3>Files on record</h3>
                </div>
              </div>

              <div className="identity-rail-list">
                <div className="identity-rail-row">
                  <span>Resume</span>
                  <strong>{profile?.hasResume ? 'Uploaded and visible to recruiters' : 'No resume uploaded'}</strong>
                </div>
                <div className="identity-rail-row">
                  <span>Profile image</span>
                  <strong>{profileAssetLabel}</strong>
                </div>
              </div>

              <p className="identity-note">
                Updating files here changes the live candidate record immediately, so recruiter list
                and detail views see the same source of truth.
              </p>
            </article>

            <article className="identity-card">
              <div className="identity-card-head">
                <div>
                  <span className="identity-kicker">Visible Skills</span>
                  <h3>Recruiter scan points</h3>
                </div>
              </div>

              {skillList.length > 0 ? (
                <div className="identity-chip-group">
                  {skillList.slice(0, 10).map((skill) => (
                    <span key={skill}>{skill}</span>
                  ))}
                </div>
              ) : (
                <p className="identity-note">Add clear, role-relevant skills so matching and recruiter filtering work properly.</p>
              )}
            </article>
          </aside>

          <main className="identity-main">
            <article className="identity-card identity-editor">
              <form onSubmit={handleSubmit}>
                <section className="identity-section">
                  <div className="identity-section-head">
                    <div>
                      <span className="identity-kicker">Core Identity</span>
                      <h2>Personal details</h2>
                      <p>The essentials recruiters see first when they open your profile.</p>
                    </div>
                    <span className={`signal-chip ${profile?.hasResume ? 'positive' : 'review'}`}>
                      {profile?.hasResume ? 'Resume on file' : 'Resume missing'}
                    </span>
                  </div>

                  <div className="identity-form-grid">
                    <div className="identity-form-field">
                      <label htmlFor="candidate-name">Full name</label>
                      <input id="candidate-name" name="name" value={formData.name} onChange={handleChange} />
                    </div>
                    <div className="identity-form-field">
                      <label htmlFor="candidate-headline">Headline</label>
                      <input
                        id="candidate-headline"
                        name="headline"
                        value={formData.headline}
                        onChange={handleChange}
                        placeholder="Full-stack engineer focused on product quality"
                      />
                    </div>
                    <div className="identity-form-field">
                      <label htmlFor="candidate-location">Location</label>
                      <input
                        id="candidate-location"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        placeholder="Bengaluru, India"
                      />
                    </div>
                    <div className="identity-form-field">
                      <label htmlFor="candidate-phone">Phone</label>
                      <input
                        id="candidate-phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+91 90000 00000"
                      />
                    </div>
                    <div className="identity-form-field identity-form-field-wide">
                      <label htmlFor="candidate-linkedin">LinkedIn</label>
                      <input
                        id="candidate-linkedin"
                        name="linkedin"
                        value={formData.linkedin}
                        onChange={handleChange}
                        placeholder="https://www.linkedin.com/in/your-profile"
                      />
                    </div>
                  </div>
                </section>

                <section className="identity-section">
                  <div className="identity-section-head">
                    <div>
                      <span className="identity-kicker">Narrative</span>
                      <h2>Professional summary</h2>
                      <p>Describe your focus, strengths, and the kind of work you want to be considered for.</p>
                    </div>
                  </div>

                  <div className="identity-form-field identity-form-field-wide">
                    <label htmlFor="candidate-bio">Summary</label>
                    <textarea
                      id="candidate-bio"
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      placeholder="Describe the kind of problems you solve well, the environments you thrive in, and the evidence recruiters should anchor on."
                    />
                  </div>
                </section>

                <section className="identity-section">
                  <div className="identity-section-head">
                    <div>
                      <span className="identity-kicker">Evidence</span>
                      <h2>Skills and documents</h2>
                      <p>Keep your experience range, visible skills, and supporting files aligned.</p>
                    </div>
                  </div>

                  <div className="identity-evidence-grid">
                    <div className="identity-form-field identity-form-field-compact">
                      <label htmlFor="candidate-experience">Experience band</label>
                      <select
                        id="candidate-experience"
                        name="experience"
                        value={formData.experience}
                        onChange={handleChange}
                      >
                        <option value="">Select current range</option>
                        {experienceOptions.map((option) => (
                          <option key={option} value={option}>
                            {option} years
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
                        <label className="identity-file-button" htmlFor="candidate-picture">
                          <FaCamera /> Upload image
                          <input
                            id="candidate-picture"
                            type="file"
                            name="profilePicture"
                            accept="image/png,image/jpeg,image/webp"
                            onChange={handleChange}
                          />
                        </label>
                      </div>
                      <p>Shown on your profile and in recruiter-facing candidate views.</p>
                    </div>
                  </div>

                  <div className="identity-form-field identity-form-field-wide">
                    <label htmlFor="candidate-skills">Skills</label>
                    <textarea
                      id="candidate-skills"
                      name="skills"
                      value={formData.skills}
                      onChange={handleChange}
                      placeholder="React, TypeScript, Node.js, API design, testing, product thinking"
                    />
                    <small>Use comma-separated skills so recommendations and recruiter filtering stay accurate.</small>
                  </div>

                  <div className="identity-upload-card identity-upload-card-wide">
                    <div className="identity-upload-head">
                      <div>
                        <span className="identity-upload-label-text">Resume</span>
                        <strong>{formData.resume ? formData.resume.name : 'PDF only'}</strong>
                      </div>
                      <label className="identity-file-button" htmlFor="candidate-resume">
                        <FaFileUpload /> Replace resume
                        <input
                          id="candidate-resume"
                          type="file"
                          name="resume"
                          accept="application/pdf"
                          onChange={handleChange}
                        />
                      </label>
                    </div>
                    <p>
                      {profile?.hasResume
                        ? 'Replacing the file updates recruiter access immediately.'
                        : 'Upload a resume to unlock stronger screening and matching.'}
                    </p>
                  </div>
                </section>

                <div className="identity-savebar">
                  <p>
                    Changes save directly to the live candidate record used by recruiter list and detail views.
                  </p>
                  <button type="submit" className="identity-save-button" disabled={saving}>
                    {saving ? <><FaSpinner className="identity-inline-spin" /> Saving...</> : <><FaSave /> Save candidate profile</>}
                  </button>
                </div>

                {success && (
                  <div className="identity-feedback success">
                    <FaCheckCircle /> {success}
                  </div>
                )}
                {error && (
                  <div className="identity-feedback error">
                    <FaUserAstronaut /> {error}
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

export default CandidateProfilePage;
