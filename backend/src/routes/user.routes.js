const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate');
const Joi = require('joi');
const {
  getProfile,
  updateProfile,
  changePassword,
  getStats,
  uploadAvatar,
  removeAvatar,
  deleteAccount,
} = require('../controllers/user.controller');

// ---------- Validation Schemas ----------

const updateProfileSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).optional(),
  email: Joi.string().email().optional(),
}).min(1);

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().allow('').optional(),
  newPassword: Joi.string().min(8).max(128).required(),
});

// ---------- Routes ----------

/**
 * @swagger
 * /api/user/health:
 *   get:
 *     summary: User routes health check
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: User routes healthy
 */
router.get('/health', (req, res) => {
  res.json({ success: true, message: 'User routes healthy' });
});

/**
 * @swagger
 * /api/user/profile:
 *   get:
 *     summary: Get current user profile
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/UserSafe'
 *   put:
 *     summary: Update user profile (name or email)
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProfileRequest'
 *     responses:
 *       200:
 *         description: Profile updated
 *       400:
 *         description: Email already in use
 */
router.get('/profile', protect, getProfile);
router.put('/profile', protect, validate(updateProfileSchema), updateProfile);

/**
 * @swagger
 * /api/user/password:
 *   put:
 *     summary: Change password
 *     description: For Google-only accounts without a password, currentPassword can be omitted to set a password for the first time
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChangePasswordRequest'
 *     responses:
 *       200:
 *         description: Password changed (all sessions invalidated)
 *       400:
 *         description: Current password incorrect
 */
router.put('/password', protect, validate(changePasswordSchema), changePassword);

/**
 * @swagger
 * /api/user/stats:
 *   get:
 *     summary: Get user usage statistics
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Usage statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/UserStats'
 */
router.get('/stats', protect, getStats);

/**
 * @swagger
 * /api/user/avatar:
 *   put:
 *     summary: Upload/update profile avatar (base64 data URI)
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [avatar]
 *             properties:
 *               avatar:
 *                 type: string
 *                 description: Base64-encoded data URI (max ~500KB)
 *     responses:
 *       200:
 *         description: Avatar updated
 *   delete:
 *     summary: Remove profile avatar
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Avatar removed
 */
router.put('/avatar', protect, uploadAvatar);
router.delete('/avatar', protect, removeAvatar);

/**
 * @swagger
 * /api/user/account:
 *   delete:
 *     summary: Delete account and all associated data (GDPR compliant)
 *     description: Permanently removes user, all citations, projects, and refresh tokens
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account permanently deleted
 */
router.delete('/account', protect, deleteAccount);

module.exports = router;
