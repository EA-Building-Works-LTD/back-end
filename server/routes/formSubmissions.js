const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/authMiddleware');

// Add API key for Google Form integration
const GOOGLE_FORM_API_KEY = process.env.GOOGLE_FORM_API_KEY;

// Mock Firestore for testing
console.log('Using mock Firestore for testing');
const db = {
  collection: (collectionName) => ({
    add: async (data) => ({ id: 'mock-id-' + Date.now() }),
    where: (field, operator, value) => ({
      get: async () => ({
        empty: true,
        docs: []
      })
    }),
    doc: (id) => ({
      set: async (data) => ({}),
      get: async () => ({
        exists: false,
        data: () => ({})
      })
    })
  })
};

const LEADS_COLLECTION = 'leads';
const USERS_COLLECTION = 'users';

/**
 * Middleware to check for API key authentication
 * This allows Google Apps Script to authenticate using an API key
 */
const checkApiKey = (req, res, next) => {
  console.log('Received request to form-submissions endpoint');
  console.log('Headers:', JSON.stringify(req.headers));
  
  const authHeader = req.headers['authorization'];
  console.log('Authorization header:', authHeader);
  
  const providedKey = authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.split(' ')[1] 
    : null;
  
  console.log('Provided key:', providedKey);
  console.log('Expected key:', GOOGLE_FORM_API_KEY);
  
  // If API key matches or token auth passes, proceed
  if (providedKey && providedKey === GOOGLE_FORM_API_KEY) {
    console.log('API key authentication successful');
    // Add a flag to indicate this was authenticated via API key
    req.apiKeyAuth = true;
    return next();
  }
  
  console.log('API key authentication failed, trying token authentication');
  // If no API key match, try token authentication
  return authenticateToken(req, res, next);
};

/**
 * @route POST /api/form-submissions
 * @desc Process a Google Form submission and store it in Firebase
 * @access Private (requires API key or token)
 */
router.post('/', checkApiKey, async (req, res) => {
  try {
    console.log('Processing form submission');
    console.log('Request body:', JSON.stringify(req.body));
    
    const formData = req.body;
    
    // Validate required fields
    if (!formData.fullName || !formData.phoneNumber) {
      console.log('Missing required fields');
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }
    
    // Extract builder name from the form data
    const builderName = formData.builder || 'N/A';
    
    // For testing, we'll use a mock builderId
    const builderId = 'mock-builder-id';
    
    // Prepare lead data from Google Form submission
    const leadData = {
      // Basic contact info
      fullName: formData.fullName || '',
      phoneNumber: formData.phoneNumber || '',
      email: formData.email || '',
      
      // Location info
      address: formData.address || '',
      city: formData.city || '',
      
      // Project details
      workRequired: formData.workRequired || '',
      details: formData.details || '',
      budget: formData.budget || '',
      startDate: formData.startDate || '',
      
      // Communication preferences
      contactPreference: formData.contactPreference || '',
      
      // Assignment and status
      builderId: builderId,
      builder: builderName,
      stage: 'New Lead',
      stageManuallySet: false,
      
      // Timestamps
      timestamp: new Date().toISOString(),
      
      // Additional metadata
      activities: [
        {
          type: 'stage_change',
          title: 'New Lead Created',
          description: `Lead has been submitted for ${builderName || 'unknown'}`,
          timestamp: new Date().toISOString()
        }
      ],
      googleFormSubmission: true,
      googleSheetRowId: formData.rowId || null
    };
    
    // Add the lead to Firestore (mock)
    const docRef = await db.collection(LEADS_COLLECTION).add(leadData);
    
    // Return success response
    return res.status(201).json({
      success: true,
      message: 'Form submission processed successfully',
      leadId: docRef.id
    });
  } catch (error) {
    console.error('Error processing form submission:', error);
    return res.status(500).json({
      success: false,
      message: 'Error processing form submission',
      error: error.message
    });
  }
});

/**
 * @route POST /api/form-submissions/sync
 * @desc Sync all Google Form submissions to Firebase
 * @access Private (requires admin role)
 */
router.post('/sync', checkApiKey, async (req, res) => {
  try {
    // Check if user is admin (skip check if authenticated via API key)
    if (!req.apiKeyAuth && req.user && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Admin role required'
      });
    }
    
    const { googleLeads } = req.body;
    
    if (!googleLeads || !Array.isArray(googleLeads) || googleLeads.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No leads provided for syncing'
      });
    }
    
    // For testing, we'll just return a success response
    return res.status(200).json({
      success: true,
      message: `Sync completed: ${googleLeads.length} leads synced, 0 skipped, 0 errors`,
      syncedCount: googleLeads.length,
      skippedCount: 0,
      errorCount: 0
    });
  } catch (error) {
    console.error('Error syncing form submissions:', error);
    return res.status(500).json({
      success: false,
      message: 'Error syncing form submissions',
      error: error.message
    });
  }
});

module.exports = router; 