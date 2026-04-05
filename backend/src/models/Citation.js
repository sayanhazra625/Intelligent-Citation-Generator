const mongoose = require('mongoose');

const citationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    style: {
      type: String,
      required: true,
      enum: ['apa', 'mla', 'chicago', 'harvard', 'vancouver', 'ieee'],
    },
    sourceType: {
      type: String,
      required: true,
      enum: ['journal', 'book', 'book-chapter', 'website', 'thesis', 'conference'],
    },
    rawInput: {
      type: String,
      required: true,
      maxlength: 5000,
    },
    citation: {
      type: String,
      required: true,
    },
    inTextCitation: {
      type: String,
      required: true,
    },
    breakdown: {
      authors: { type: String, default: '' },
      year: { type: String, default: '' },
      title: { type: String, default: '' },
      source: { type: String, default: '' },
      doi: { type: String, default: '' },
      url: { type: String, default: '' },
      volume: { type: String, default: '' },
      issue: { type: String, default: '' },
      pages: { type: String, default: '' },
      publisher: { type: String, default: '' },
      edition: { type: String, default: '' },
    },
    notes: {
      type: String,
      default: '',
    },
    projectIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
citationSchema.index({ userId: 1, createdAt: -1 });
citationSchema.index({ userId: 1, style: 1 });
citationSchema.index({ userId: 1, sourceType: 1 });
citationSchema.index({ 'breakdown.title': 'text', 'breakdown.authors': 'text', rawInput: 'text' });

module.exports = mongoose.model('Citation', citationSchema);
