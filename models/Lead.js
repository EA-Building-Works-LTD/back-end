// models/Lead.js
const mongoose = require('mongoose');

const LeadSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  builder: { type: String, default: '' },
  fullName: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  address: { type: String, required: true },
  workRequired: { type: String, required: true },
  budget: { type: String, default: '' },
  city: { type: String, default: '' },
  startDate: { type: Date, default: null }, // Matches "startDate"
  email: { type: String, required: true },
  contactPreference: {
    type: String,
    enum: ['Phone', 'Email', 'Text', 'WhatsApp'],
    default: 'Phone',
  },
});

module.exports = mongoose.model('Lead', LeadSchema);
