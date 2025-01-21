// routes/leads.js
const router = require('express').Router();
const Lead = require('../models/Lead'); // Our Mongoose model

router.get('/', async (req, res) => {
  try {
    const leads = await Lead.find({});
    res.json(leads);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;