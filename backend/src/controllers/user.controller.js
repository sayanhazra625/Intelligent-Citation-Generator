const User = require('../models/User');
const Citation = require('../models/Citation');
const Project = require('../models/Project');
const RefreshToken = require('../models/RefreshToken');

// ==================== GET PROFILE ====================
const getProfile = async (req, res, next) => {
  try {
    const user = req.user.toSafeObject();
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// ==================== UPDATE PROFILE ====================
const updateProfile = async (req, res, next) => {
  try {
    const { name, email } = req.body;
    const updates = {};

    if (name) updates.name = name;

    if (email && email !== req.user.email) {
      // Check if email is already taken
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email is already in use',
        });
      }
      updates.email = email;
      updates.isVerified = false; // require re-verification
      // TODO: Send verification email for new address
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    res.json({
      success: true,
      message: 'Profile updated',
      data: user.toSafeObject(),
    });
  } catch (error) {
    next(error);
  }
};

// ==================== CHANGE PASSWORD ====================
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');

    // If user has no password (Google-only account)
    if (!user.password) {
      // Allow setting a password for the first time
      user.password = newPassword;
      await user.save();
      return res.json({
        success: true,
        message: 'Password set successfully',
      });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    user.password = newPassword;
    await user.save();

    // Invalidate all refresh tokens
    await RefreshToken.deleteMany({ userId: user._id });

    res.json({
      success: true,
      message: 'Password changed successfully. Please log in again.',
    });
  } catch (error) {
    next(error);
  }
};

// ==================== GET USER STATS ====================
const getStats = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const [totalCitations, savedCitations, styleAgg, sourceTypeAgg] = await Promise.all([
      Citation.countDocuments({ userId }),
      Citation.countDocuments({ userId }),
      Citation.aggregate([
        { $match: { userId } },
        { $group: { _id: '$style', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 1 },
      ]),
      Citation.aggregate([
        { $match: { userId } },
        { $group: { _id: '$sourceType', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 1 },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        totalGenerated: totalCitations,
        totalSaved: savedCitations,
        mostUsedStyle: styleAgg.length > 0 ? styleAgg[0]._id : null,
        mostUsedSourceType: sourceTypeAgg.length > 0 ? sourceTypeAgg[0]._id : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==================== UPLOAD AVATAR ====================
const uploadAvatar = async (req, res, next) => {
  try {
    const { avatar } = req.body;

    if (!avatar) {
      return res.status(400).json({ success: false, message: 'No avatar data provided' });
    }

    // Validate it's a data URI (data:image/...;base64,...)
    if (!avatar.startsWith('data:image/')) {
      return res.status(400).json({ success: false, message: 'Invalid image format' });
    }

    // Check size (base64 string ~ 500KB max => ~375KB image)
    if (avatar.length > 700000) {
      return res.status(400).json({ success: false, message: 'Image too large. Max size is 500KB.' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Avatar updated',
      data: user.toSafeObject(),
    });
  } catch (error) {
    next(error);
  }
};

// ==================== REMOVE AVATAR ====================
const removeAvatar = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: null },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Avatar removed',
      data: user.toSafeObject(),
    });
  } catch (error) {
    next(error);
  }
};

// ==================== DELETE ACCOUNT ====================
const deleteAccount = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Delete all user data
    await Promise.all([
      Citation.deleteMany({ userId }),
      Project.deleteMany({ userId }),
      RefreshToken.deleteMany({ userId }),
      User.findByIdAndDelete(userId),
    ]);

    res.json({
      success: true,
      message: 'Account and all associated data permanently deleted',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  getStats,
  uploadAvatar,
  removeAvatar,
  deleteAccount,
};
