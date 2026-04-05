const mongoose = require('mongoose');
const crypto = require('crypto');

const projectSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      maxlength: [200, 'Project name cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: '',
    },
    citationIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Citation',
      },
    ],
    shareToken: {
      type: String,
      unique: true,
      sparse: true,
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
projectSchema.index({ userId: 1, createdAt: -1 });

// Method to generate a share token
projectSchema.methods.generateShareToken = function () {
  this.shareToken = crypto.randomBytes(16).toString('hex');
  this.isPublic = true;
  return this.shareToken;
};

module.exports = mongoose.model('Project', projectSchema);
