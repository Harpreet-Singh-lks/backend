const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  
  role: {
    type: String,
    enum: {
      values: ['admin', 'teacher', 'student'],
      message: 'Role must be admin, teacher, or student'
    },
    default: 'student'
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  profile: {
    class: {
      type: String,
      enum: ['6', '7', '8', '9', '10', '11', '12']
    },
    subjects: [{
      type: String,
      enum: ['Mathematics', 'Science', 'English', 'Hindi', 'Social Studies', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'Economics', 'Political Science']
    }],
    school: {
      type: String,
      trim: true
    }
  },
  
  lastLogin: {
    type: Date
  },
  
  passwordResetToken: String,
  passwordResetExpires: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });

// Encrypt password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    this.password = await bcrypt.hash(this.password, 12);
    next();
  } catch (error) {
    next(error);
  }
});

// Update lastLogin on successful authentication
userSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('password')) {
    this.lastLogin = new Date();
  }
  next();
});

// Instance method to check password
userSchema.methods.correctPassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Instance method to generate JWT token
userSchema.methods.generateAuthToken = function() {
  try {
    // Import config here to avoid circular dependency issues
    const config = require('../config/config');
    
    if (!config.jwt.secret) {
      throw new Error('JWT secret is not configured');
    }
    
    return jwt.sign(
      { 
        id: this._id,
        email: this.email,
        role: this.role 
      },
      config.jwt.secret,
      { 
        expiresIn: config.jwt.expiresIn || '24h'
      }
    );
  } catch (error) {
    console.error('Token generation error:', error);
    throw new Error('Failed to generate authentication token');
  }
};

// Static method to find user by credentials
userSchema.statics.findByCredentials = async function(email, password) {
  const user = await this.findOne({ email, isActive: true }).select('+password');
  
  if (!user) {
    throw new Error('Invalid login credentials');
  }
  
  const isPasswordMatch = await user.correctPassword(password);
  if (!isPasswordMatch) {
    throw new Error('Invalid login credentials');
  }
  
  return user;
};

// Virtual for user's chapters count
userSchema.virtual('chaptersCount', {
  ref: 'Chapter',
  localField: '_id',
  foreignField: 'createdBy',
  count: true
});

module.exports = mongoose.model('User', userSchema);