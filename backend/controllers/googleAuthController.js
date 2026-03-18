const axios = require('axios');
const Candidate = require('../models/candidateModel');
const Recruiter = require('../models/recruiterModel');
const generateToken = require('../utils/generateToken');
const { buildCandidatePayload, buildRecruiterPayload } = require('../utils/profileSerializers');

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://openidconnect.googleapis.com/v1/userinfo';
const SUPPORTED_ROLES = new Set(['candidate', 'recruiter']);
const SUPPORTED_MODES = new Set(['login', 'register']);

const getFrontendUrl = () => (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');

const getBackendUrl = () => {
  if (process.env.BACKEND_URL) {
    return process.env.BACKEND_URL.replace(/\/$/, '');
  }

  return `http://localhost:${process.env.PORT || 5000}`;
};

const getGoogleRedirectUri = () =>
  process.env.GOOGLE_AUTH_REDIRECT_URI || `${getBackendUrl()}/api/auth/google/callback`;

const buildFrontendCallbackUrl = (params) => {
  const hash = new URLSearchParams(params).toString();
  return `${getFrontendUrl()}/auth/google/callback#${hash}`;
};

const redirectToFrontend = (res, params) => {
  res.redirect(buildFrontendCallbackUrl(params));
};

const getGoogleConfig = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = getGoogleRedirectUri();

  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.');
  }

  return { clientId, clientSecret, redirectUri };
};

const getGoogleClientId = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (!clientId) {
    throw new Error('Google OAuth is not configured. Set GOOGLE_CLIENT_ID.');
  }

  return clientId;
};

const encodeState = (payload) => Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');

const decodeState = (encodedState) => {
  const decoded = Buffer.from(encodedState, 'base64url').toString('utf8');
  return JSON.parse(decoded);
};

const formatCompanyName = (domain = '') => {
  const label = domain.split('.')[0] || 'Company';
  return label
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const getDefaultCompanyName = (profile) => {
  const emailDomain = profile.email?.split('@')[1] || '';
  const sourceDomain = profile.hd || emailDomain;
  return formatCompanyName(sourceDomain);
};

const exchangeCodeForProfile = async (code) => {
  const { clientId, clientSecret, redirectUri } = getGoogleConfig();

  const tokenResponse = await axios.post(
    GOOGLE_TOKEN_URL,
    new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }).toString(),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );

  const accessToken = tokenResponse.data.access_token;

  if (!accessToken) {
    throw new Error('Google did not return an access token.');
  }

  const profileResponse = await axios.get(GOOGLE_USERINFO_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return profileResponse.data;
};

const verifyGoogleCredential = async (credential) => {
  const clientId = getGoogleClientId();

  if (!credential) {
    throw new Error('Google credential is required.');
  }

  const tokenInfoResponse = await axios.get('https://oauth2.googleapis.com/tokeninfo', {
    params: {
      id_token: credential,
    },
  });

  const tokenInfo = tokenInfoResponse.data;

  if (tokenInfo.aud !== clientId) {
    throw new Error('Google credential audience does not match this application.');
  }

  if (tokenInfo.email_verified !== 'true') {
    throw new Error('Use a Google account with a verified email address.');
  }

  return {
    sub: tokenInfo.sub,
    email: tokenInfo.email,
    email_verified: true,
    name: tokenInfo.name,
    picture: tokenInfo.picture,
    hd: tokenInfo.hd,
  };
};

const upsertCandidateFromGoogle = async (profile) => {
  let candidate = await Candidate.findOne({
    $or: [{ googleId: profile.sub }, { email: profile.email }],
  });

  if (!candidate) {
    candidate = await Candidate.create({
      name: profile.name,
      email: profile.email,
      googleId: profile.sub,
    });

    return candidate;
  }

  let shouldSave = false;

  if (!candidate.googleId) {
    candidate.googleId = profile.sub;
    shouldSave = true;
  }

  if (!candidate.name && profile.name) {
    candidate.name = profile.name;
    shouldSave = true;
  }

  if (shouldSave) {
    await candidate.save();
  }

  return candidate;
};

const upsertRecruiterFromGoogle = async (profile) => {
  let recruiter = await Recruiter.findOne({
    $or: [{ googleId: profile.sub }, { email: profile.email }],
  });

  if (!recruiter) {
    recruiter = await Recruiter.create({
      name: profile.name,
      email: profile.email,
      googleId: profile.sub,
      company: getDefaultCompanyName(profile),
      companyAutofilled: true,
    });

    return recruiter;
  }

  let shouldSave = false;

  if (!recruiter.googleId) {
    recruiter.googleId = profile.sub;
    shouldSave = true;
  }

  if (!recruiter.name && profile.name) {
    recruiter.name = profile.name;
    shouldSave = true;
  }

  if (!recruiter.company) {
    recruiter.company = getDefaultCompanyName(profile);
    recruiter.companyAutofilled = true;
    shouldSave = true;
  }

  if (shouldSave) {
    await recruiter.save();
  }

  return recruiter;
};

const startGoogleAuth = async (req, res) => {
  const role = req.params.role;
  const mode = req.query.mode || 'login';

  if (!SUPPORTED_ROLES.has(role)) {
    return res.status(400).json({
      success: false,
      message: 'Unsupported Google auth role.',
    });
  }

  if (!SUPPORTED_MODES.has(mode)) {
    return res.status(400).json({
      success: false,
      message: 'Unsupported Google auth mode.',
    });
  }

  try {
    const { clientId, redirectUri } = getGoogleConfig();
    const state = encodeState({ role, mode });
    const authUrl = new URL(GOOGLE_AUTH_URL);

    authUrl.search = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      prompt: 'select_account',
      state,
    }).toString();

    res.redirect(authUrl.toString());
  } catch (error) {
    console.error('Error starting Google auth:', error);
    redirectToFrontend(res, {
      role,
      error: error.message || 'Unable to start Google sign-in.',
    });
  }
};

const handleGoogleAuthCallback = async (req, res) => {
  const providerError = req.query.error;
  const encodedState = req.query.state;

  if (!encodedState) {
    return redirectToFrontend(res, {
      error: 'Google authentication state was missing.',
    });
  }

  let state;

  try {
    state = decodeState(encodedState);
  } catch (error) {
    console.error('Invalid Google auth state:', error);
    return redirectToFrontend(res, {
      error: 'Google authentication state was invalid.',
    });
  }

  const { role } = state;

  if (!SUPPORTED_ROLES.has(role)) {
    return redirectToFrontend(res, {
      role,
      error: 'Unsupported Google auth role.',
    });
  }

  if (providerError) {
    return redirectToFrontend(res, {
      role,
      error: 'Google authentication was cancelled or denied.',
    });
  }

  const code = req.query.code;

  if (!code) {
    return redirectToFrontend(res, {
      role,
      error: 'Google did not return an authorization code.',
    });
  }

  try {
    const profile = await exchangeCodeForProfile(code);

    if (!profile.email || !profile.sub) {
      throw new Error('Google account information is incomplete.');
    }

    if (!profile.email_verified) {
      throw new Error('Use a Google account with a verified email address.');
    }

    const user =
      role === 'candidate'
        ? await upsertCandidateFromGoogle(profile)
        : await upsertRecruiterFromGoogle(profile);

    const payload =
      role === 'candidate' ? buildCandidatePayload(user) : buildRecruiterPayload(user);

    redirectToFrontend(res, {
      role,
      token: generateToken(user._id, role),
      user: JSON.stringify(payload),
    });
  } catch (error) {
    const message =
      error.response?.data?.error_description ||
      error.response?.data?.error ||
      error.message ||
      'Google authentication failed.';

    console.error('Error completing Google auth:', message);
    redirectToFrontend(res, {
      role,
      error: message,
    });
  }
};

const authenticateWithGoogleCredential = async (req, res) => {
  const { role, credential } = req.body;

  if (!SUPPORTED_ROLES.has(role)) {
    return res.status(400).json({
      success: false,
      message: 'Unsupported Google auth role.',
    });
  }

  try {
    const profile = await verifyGoogleCredential(credential);

    const user =
      role === 'candidate'
        ? await upsertCandidateFromGoogle(profile)
        : await upsertRecruiterFromGoogle(profile);

    const payload =
      role === 'candidate' ? buildCandidatePayload(user) : buildRecruiterPayload(user);

    res.json({
      success: true,
      data: {
        ...payload,
        token: generateToken(user._id, role),
      },
    });
  } catch (error) {
    const message =
      error.response?.data?.error_description ||
      error.response?.data?.error ||
      error.message ||
      'Google authentication failed.';

    console.error('Error authenticating Google credential:', message);
    res.status(400).json({
      success: false,
      message,
    });
  }
};

module.exports = {
  startGoogleAuth,
  handleGoogleAuthCallback,
  authenticateWithGoogleCredential,
};
