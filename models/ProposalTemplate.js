const mongoose = require('mongoose');

const proposalTemplateSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  projectType: {
    type: String,
    enum: ['Kitchen Renovation', 'Bathroom Remodel', 'Home Extension', 'Full House Renovation', 'Loft Conversion', 'Garden Landscaping', 'General'],
    default: 'General'
  },
  budgetRange: {
    min: {
      type: Number,
      default: 0
    },
    max: {
      type: Number,
      default: 1000000
    }
  },
  tags: [{
    type: String,
    trim: true
  }],
  sections: [{
    title: String,
    content: String,
    optional: {
      type: Boolean,
      default: false
    }
  }],
  usageCount: {
    type: Number,
    default: 0
  },
  successRate: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  createdBy: {
    type: String,
    ref: 'User'
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

// Add indexes for faster queries
proposalTemplateSchema.index({ projectType: 1 });
proposalTemplateSchema.index({ tags: 1 });
proposalTemplateSchema.index({ usageCount: -1 });
proposalTemplateSchema.index({ successRate: -1 });

// Pre-save middleware to update timestamps
proposalTemplateSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const ProposalTemplate = mongoose.model('ProposalTemplate', proposalTemplateSchema);

module.exports = ProposalTemplate; 