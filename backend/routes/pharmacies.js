const express = require('express');
const router = express.Router();
const pharmacy = require('../controllers/pharmacyController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

function authorizePharmacy(req, res, next) {
  if (!req.user || req.user.role !== 'pharmacy') {
    return res.status(403).json({ error: 'Access denied. Pharmacy login required.' });
  }
  next();
}

// Public: list pharmacies
router.get('/', pharmacy.getPharmacies);

// Admin: assign pharmacy to an order
router.post('/assign', authenticate, authorizeAdmin, pharmacy.assignPharmacy);
router.post('/auto-assign', authenticate, authorizeAdmin, pharmacy.autoAssignPharmacy);

// Pharmacy portal routes (require pharmacy login)
router.get('/portal/me', authenticate, authorizePharmacy, pharmacy.getMyPharmacy);
router.get('/portal/dashboard', authenticate, authorizePharmacy, pharmacy.getDashboard);
router.get('/portal/orders', authenticate, authorizePharmacy, pharmacy.getMyOrders);
router.get('/portal/orders/:id', authenticate, authorizePharmacy, pharmacy.getMyOrderById);
router.put('/portal/orders/:id/status', authenticate, authorizePharmacy, pharmacy.updateOrderStatus);

module.exports = router;
