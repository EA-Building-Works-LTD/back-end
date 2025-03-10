// models/Lead.js
const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  phoneNumber: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  address: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    trim: true
  },
  workRequired: {
    type: String,
    trim: true
  },
  details: {
    type: String,
    trim: true
  },
  budget: {
    type: Number,
    default: 0
  },
  startDate: {
    type: Date
  },
  contactPreference: {
    type: String,
    enum: ['Phone', 'Email', 'Either'],
    default: 'Either'
  },
  status: {
    type: String,
    enum: ['Initial Contact', 'Site Visit', 'Proposal Sent', 'Negotiation', 'Contract Signed', 'Project Started', 'Completed', 'Lost'],
    default: 'Initial Contact'
  },
  builder: {
    type: String,
    ref: 'User'
  },
  notes: [{
    text: String,
    createdAt: {
      type: Date,
      default: Date.now
    },
    createdBy: {
      type: String,
      ref: 'User'
    }
  }],
  completedAt: {
    type: Date
  },
  // AI-powered lead scoring fields
  conversionScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 50
  },
  scoreFactors: {
    budgetFactor: { type: Number, default: 0 },
    responsivenessFactor: { type: Number, default: 0 },
    projectTypeFactor: { type: Number, default: 0 },
    locationFactor: { type: Number, default: 0 },
    interactionsFactor: { type: Number, default: 0 }
  },
  scoreUpdatedAt: {
    type: Date
  },
  // Lead qualification fields
  qualificationStatus: {
    type: String,
    enum: ['Unqualified', 'Qualified', 'Highly Qualified'],
    default: 'Unqualified'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Add index for faster queries
leadSchema.index({ status: 1 });
leadSchema.index({ builder: 1 });
leadSchema.index({ createdAt: 1 });
leadSchema.index({ completedAt: 1 });
leadSchema.index({ conversionScore: 1 }); // Index for lead scoring queries

// Pre-save middleware to update timestamps
leadSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // If status is changed to Completed, set completedAt date
  if (this.isModified('status') && this.status === 'Completed' && !this.completedAt) {
    this.completedAt = new Date();
  }
  
  next();
});

const Lead = mongoose.model('Lead', leadSchema);

module.exports = Lead;
