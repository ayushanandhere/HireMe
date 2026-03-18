const crypto = require('crypto');
const Candidate = require('../models/candidateModel');
const Recruiter = require('../models/recruiterModel');
const generateToken = require('../utils/generateToken');
const { hasEmailConfig, sendEmail } = require('../utils/emailService');
const { buildCandidatePayload, buildRecruiterPayload } = require('../utils/profileSerializers');

const getModelForRole = (role) => {
  if (role === 'candidate') {
    return Candidate;
  }

  if (role === 'recruiter') {
    return Recruiter;
  }

  return null;
};

const getFrontendUrl = () => (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');

const getAuthPayload = (user, role) => {
  if (role === 'candidate') {
    return {
      ...buildCandidatePayload(user),
      token: generateToken(user._id, user.role),
    };
  }

  return {
    ...buildRecruiterPayload(user),
    token: generateToken(user._id, user.role),
  };
};

const buildResetUrl = (role, token) => `${getFrontendUrl()}/reset-password/${role}/${token}`;

const requestPasswordReset = async (req, res) => {
  const role = req.params.role;
  const Model = getModelForRole(role);
  const email = req.body.email?.trim().toLowerCase();

  if (!Model) {
    return res.status(400).json({
      success: false,
      message: 'Unsupported account type.',
    });
  }

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email is required.',
    });
  }

  try {
    const user = await Model.findOne({ email });

    if (!user) {
      return res.json({
        success: true,
        message: 'If an account exists for that email, a reset link has been prepared.',
      });
    }

    if (!user.password) {
      return res.status(400).json({
        success: false,
        message: 'This account uses Google sign-in. Continue with Google to access it.',
      });
    }

    const plainToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(plainToken).digest('hex');

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    const resetUrl = buildResetUrl(role, plainToken);
    if (hasEmailConfig()) {
      await sendEmail({
        to: user.email,
        subject: 'Reset your HireMe password',
        html: `
          <p>Hello ${user.name || 'there'},</p>
          <p>Use the link below to reset your password. It expires in 1 hour.</p>
          <p><a href="${resetUrl}">${resetUrl}</a></p>
        `,
      });
    } else {
      console.log(`Password reset link for ${role} ${user.email}: ${resetUrl}`);
    }

    const response = {
      success: true,
      message: hasEmailConfig()
        ? 'A password reset link has been sent if the account exists.'
        : 'A reset link has been generated for local use.',
    };

    if (!hasEmailConfig() || process.env.NODE_ENV !== 'production') {
      response.resetUrl = resetUrl;
    }

    res.json(response);
  } catch (error) {
    console.error('Error requesting password reset:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to start password reset.',
    });
  }
};

const resetPassword = async (req, res) => {
  const role = req.params.role;
  const token = req.params.token;
  const Model = getModelForRole(role);
  const password = req.body.password;

  if (!Model) {
    return res.status(400).json({
      success: false,
      message: 'Unsupported account type.',
    });
  }

  if (!password || password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters long.',
    });
  }

  try {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await Model.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'This reset link is invalid or has expired.',
      });
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.json({
      success: true,
      data: getAuthPayload(user, role),
      message: 'Password updated successfully.',
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to reset password.',
    });
  }
};

module.exports = {
  requestPasswordReset,
  resetPassword,
};
