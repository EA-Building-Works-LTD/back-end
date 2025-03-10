const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  builder: {
    type: String,
    ref: 'User',
    required: true
  },
  lead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead'
  },
  location: {
    address: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    postalCode: {
      type: String,
      trim: true
    }
  },
  appointmentType: {
    type: String,
    enum: ['Initial Consultation', 'Site Visit', 'Follow-up', 'Proposal Presentation', 'Contract Signing', 'Other'],
    default: 'Initial Consultation'
  },
  status: {
    type: String,
    enum: ['Scheduled', 'Completed', 'Cancelled', 'Rescheduled'],
    default: 'Scheduled'
  },
  priority: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  travelTimeEstimate: {
    type: Number, // in minutes
    default: 30
  },
  suggestedByAI: {
    type: Boolean,
    default: false
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
appointmentSchema.index({ builder: 1, startTime: 1 });
appointmentSchema.index({ lead: 1 });
appointmentSchema.index({ startTime: 1, endTime: 1 });
appointmentSchema.index({ status: 1 });

// Pre-save middleware to update timestamps
appointmentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Appointment = mongoose.model('Appointment', appointmentSchema);

module.exports = Appointment; 