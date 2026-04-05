const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const { generateAccessToken, generateRefreshToken, generateRandomToken } = require('../utils/generateToken');
const sendEmail = require('../utils/sendEmail');

// ==================== REGISTER ====================
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists',
      });
    }

    // Generate verification token
    const verificationToken = generateRandomToken();

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      verificationToken,
    });

    // Send verification email
    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    await sendEmail({
      to: email,
      subject: 'Verify Your Email — Citation Generator',
      html: `
        <h2>Welcome to Citation Generator!</h2>
        <p>Hi ${name},</p>
        <p>Please verify your email address by clicking the link below:</p>
        <a href="${verifyUrl}" style="display:inline-block;padding:12px 24px;background:#b8860b;color:#fff;text-decoration:none;border-radius:6px;">Verify Email</a>
        <p>This link expires in 24 hours.</p>
        <p>If you didn't create this account, you can safely ignore this email.</p>
      `,
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email to verify your account.',
      user: user.toSafeObject(),
    });
  } catch (error) {
    next(error);
  }
};

// ==================== VERIFY EMAIL ====================
const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token',
      });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Email verified successfully. You can now log in.',
    });
  } catch (error) {
    next(error);
  }
};

// ==================== LOGIN ====================
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user and explicitly select password field
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Check if user signed up with Google only (no password)
    if (!user.password) {
      return res.status(401).json({
        success: false,
        message: 'This account uses Google sign-in. Please log in with Google.',
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Check if email is verified
    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email before logging in',
        code: 'EMAIL_NOT_VERIFIED',
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshTokenStr = generateRefreshToken();

    // Save refresh token (hashed)
    await RefreshToken.create({
      userId: user._id,
      token: refreshTokenStr,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    res.json({
      success: true,
      message: 'Login successful',
      accessToken,
      refreshToken: refreshTokenStr,
      user: user.toSafeObject(),
    });
  } catch (error) {
    next(error);
  }
};

// ==================== REFRESH TOKEN ====================
const refreshAccessToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required',
      });
    }

    // Find all non-expired refresh tokens for comparison
    const storedTokens = await RefreshToken.find({
      expiresAt: { $gt: new Date() },
    });

    // Find matching token (compare with bcrypt)
    let matchedToken = null;
    for (const stored of storedTokens) {
      const isMatch = await stored.compareToken(refreshToken);
      if (isMatch) {
        matchedToken = stored;
        break;
      }
    }

    if (!matchedToken) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token',
      });
    }

    // Get user
    const user = await User.findById(matchedToken.userId);
    if (!user) {
      await matchedToken.deleteOne();
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    // Rotate: delete old token, create new one
    await matchedToken.deleteOne();

    const newAccessToken = generateAccessToken(user._id);
    const newRefreshTokenStr = generateRefreshToken();

    await RefreshToken.create({
      userId: user._id,
      token: newRefreshTokenStr,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    res.json({
      success: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshTokenStr,
    });
  } catch (error) {
    next(error);
  }
};

// ==================== LOGOUT ====================
const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // Find and delete the matching refresh token
      const storedTokens = await RefreshToken.find({
        expiresAt: { $gt: new Date() },
      });

      for (const stored of storedTokens) {
        const isMatch = await stored.compareToken(refreshToken);
        if (isMatch) {
          await stored.deleteOne();
          break;
        }
      }
    }

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ==================== FORGOT PASSWORD ====================
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({
        success: true,
        message: 'If an account with that email exists, a reset link has been sent.',
      });
    }

    // Generate reset token
    const resetToken = generateRandomToken();
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    // Send reset email
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    await sendEmail({
      to: email,
      subject: 'Reset Your Password — Citation Generator',
      html: `
        <h2>Password Reset Request</h2>
        <p>Hi ${user.name},</p>
        <p>You requested a password reset. Click the link below to set a new password:</p>
        <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#b8860b;color:#fff;text-decoration:none;border-radius:6px;">Reset Password</a>
        <p>This link expires in 1 hour.</p>
        <p>If you didn't request this, you can safely ignore this email.</p>
      `,
    });

    res.json({
      success: true,
      message: 'If an account with that email exists, a reset link has been sent.',
    });
  } catch (error) {
    next(error);
  }
};

// ==================== RESET PASSWORD ====================
const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token',
      });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // Invalidate all refresh tokens for this user
    await RefreshToken.deleteMany({ userId: user._id });

    res.json({
      success: true,
      message: 'Password reset successful. Please log in with your new password.',
    });
  } catch (error) {
    next(error);
  }
};

// ==================== GOOGLE OAUTH CALLBACK ====================
const googleCallback = async (req, res, next) => {
  try {
    const user = req.user;

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshTokenStr = generateRefreshToken();

    await RefreshToken.create({
      userId: user._id,
      token: refreshTokenStr,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    // Redirect to frontend with tokens in URL params
    const redirectUrl = `${process.env.FRONTEND_URL}/auth/callback?accessToken=${accessToken}&refreshToken=${refreshTokenStr}`;
    res.redirect(redirectUrl);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  verifyEmail,
  login,
  refreshAccessToken,
  logout,
  forgotPassword,
  resetPassword,
  googleCallback,
};
