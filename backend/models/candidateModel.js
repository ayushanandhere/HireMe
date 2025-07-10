const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const experienceSchema = new mongoose.Schema({
  company: String,
  role: String,
  startDate: Date,
  endDate: {
    type: mongoose.Schema.Types.Mixed, // Allow Date or String ('Present')
    set: function(val) {
      // If the value is 'Present', store it as a string
      if (val === 'Present') {
        this.current = true;
        return val;
      }
      // Otherwise, try to convert to a Date
      return val;
    }
  },
  description: String,
  current: {
    type: Boolean,
    default: false
  }
});

const educationSchema = new mongoose.Schema({
  institution: String,
  degree: String,
  fieldOfStudy: String,
  startDate: Date,
  endDate: {
    type: mongoose.Schema.Types.Mixed, // Allow Date or String ('Present')
    set: function(val) {
      // If the value is 'Present', store it as a string
      if (val === 'Present') {
        this.current = true;
        return val;
      }
      // Otherwise, try to convert to a Date
      return val;
    }
  },
  current: {
    type: Boolean,
    default: false
  }
});

const candidateSchema = new mongoose.Schema(
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
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters']
    },
    skills: {
      type: String,
      trim: true
    },
    experience: {
      type: String,
      trim: true
    },
    resumePath: {
      type: String
    },
    role: {
      type: String,
      default: 'candidate'
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    // New fields for resume parsing
    parsedSkills: [{ 
      type: String 
    }],
    parsedExperience: [experienceSchema],
    parsedEducation: [educationSchema],
    atsScore: { 
      type: Number,
      min: 0,
      max: 100,
      default: 0 
    },
    parsedResumeDate: { 
      type: Date 
    },
    resumeParsingStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'not_started'],
      default: 'not_started'
    }
  },
  {
    timestamps: true
  }
);

// Hash password before saving
candidateSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
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
candidateSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const Candidate = mongoose.model('Candidate', candidateSchema);

module.exports = Candidate; 