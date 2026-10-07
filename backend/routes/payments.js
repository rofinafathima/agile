const express = require('express');
const router = express.Router();
const payments = require('../controllers/paymentController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.post('/create', payments.createPayment);
router.post('/verify', payments.verifyPayment);
router.post('/simulate', payments.simulatePayment);

module.exports = router;
