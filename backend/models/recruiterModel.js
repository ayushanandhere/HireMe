const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const recruiterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
    password: {
      type: String,
      required: function() {
        return !this.googleId;
      },
      minlength: [6, 'Password must be at least 6 characters']
    },
    company: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true
    },
    title: {
      type: String,
      trim: true,
      maxlength: 120
    },
    role: {
      type: String,
      default: 'recruiter'
    },
    phone: {
      type: String,
      trim: true
    },
    location: {
      type: String,
      trim: true,
      maxlength: 120
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 1200
    },
    companyWebsite: {
      type: String,
      trim: true,
      maxlength: 255
    },
    companySize: {
      type: String,
      trim: true,
      maxlength: 60
    },
    industry: {
      type: String,
      trim: true,
      maxlength: 120
    },
    profilePicturePath: {
      type: String
    },
    companyAutofilled: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Hash password before saving
recruiterSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to check if entered password is correct
recruiterSchema.methods.matchPassword = async function(enteredPassword) {
  if (!this.password) {
    return false;
  }

  return await bcrypt.compare(enteredPassword, this.password);
};

const Recruiter = mongoose.model('Recruiter', recruiterSchema);

module.exports = Recruiter; 
