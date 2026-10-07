const express = require('express');
const router = express.Router();
const admin = require('../controllers/adminController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

router.use(authenticate, authorizeAdmin);

// Dashboard
router.get('/dashboard', admin.getDashboard);

// Medicines
router.post('/medicines', admin.addMedicine);
router.put('/medicines/:id', admin.updateMedicine);
router.delete('/medicines/:id', admin.deleteMedicine);

// Inventory
router.get('/inventory', admin.getInventory);
router.put('/inventory/update', admin.updateStock);
router.get('/inventory/:id/history', admin.getStockHistory);

// Orders
router.get('/orders', admin.getOrders);
router.get('/orders/:id', admin.getAdminOrderById);
router.put('/orders/:id/status', admin.updateOrderStatus);

// Prescriptions
router.get('/prescriptions', admin.getPrescriptions);
router.put('/prescriptions/:id', admin.updatePrescription);

// Users
router.get('/users', admin.getUsers);
router.put('/users/:id/toggle-status', admin.toggleUserStatus);

// Payments
router.get('/payments', admin.getPayments);

// Categories
router.post('/categories', admin.addCategory);
router.put('/categories/:id', admin.updateCategory);

module.exports = router;
