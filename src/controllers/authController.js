const User = require('../models/User');
const { invalidateUserCache } = require('../middleware/cache');

// Register a new user
const register = async (req, res) => {
  try {
    const { name, email, password, role, profile } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'User with this email already exists'
      });
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      role: role || 'student',
      profile
    });

    await user.save();

    // Generate token
    const token = user.generateAuthToken();

    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          profile: user.profile
        },
        token
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Registration failed',
      error: error.message
    });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user and check password
    const user = await User.findByCredentials(email, password);
    
    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = user.generateAuthToken();

    res.json({
      status: 'success',
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          profile: user.profile,
          lastLogin: user.lastLogin
        },
        token
      }
    });
  } catch (error) {
    res.status(401).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get current user profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('chaptersCount');
    
    res.json({
      status: 'success',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          profile: user.profile,
          isActive: user.isActive,
          lastLogin: user.lastLogin,
          chaptersCount: user.chaptersCount,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch profile'
    });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const updates = req.body;
    const userId = req.user.id;

    // Remove sensitive fields that shouldn't be updated via this endpoint
    delete updates.password;
    delete updates.role;
    delete updates.email;

    const user = await User.findByIdAndUpdate(
      userId,
      updates,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Invalidate user cache
    invalidateUserCache(userId);

    res.json({
      status: 'success',
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          profile: user.profile
        }
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: 'Profile update failed',
      error: error.message
    });
  }
};

// Logout (client-side token removal, server-side token blacklisting could be added)
const logout = async (req, res) => {
  res.json({
    status: 'success',
    message: 'Logout successful'
  });
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  logout
};