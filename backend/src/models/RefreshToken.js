const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const refreshTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    token: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Hash token before saving
refreshTokenSchema.pre('save', async function (next) {
  if (!this.isModified('token')) return next();
  const salt = await bcrypt.genSalt(10);
  this.token = await bcrypt.hash(this.token, salt);
  next();
});

// Compare raw token with hashed token
refreshTokenSchema.methods.compareToken = async function (candidateToken) {
  return await bcrypt.compare(candidateToken, this.token);
};

// Auto-delete expired tokens
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
refreshTokenSchema.index({ userId: 1 });

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);
