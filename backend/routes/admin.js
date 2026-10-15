const express = require('express');
const router = express.Router();
const admin = require('../controllers/adminController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

// Apply admin auth
router.use(authenticate, authorizeAdmin);

// Dashboard
router.get('/dashboard', admin.getDashboard);

// Pharmacies management
router.get('/pharmacies', admin.getPharmacies);
router.post('/pharmacies', admin.addPharmacy);

module.exports = router;
