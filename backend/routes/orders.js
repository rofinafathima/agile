const express = require('express');
const router = express.Router();
const orders = require('../controllers/orderController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.post('/', orders.createOrder);
router.get('/', orders.getOrders);
router.get('/:id', orders.getOrderById);
router.put('/:id/cancel', orders.cancelOrder);
router.post('/:id/reorder', orders.reorder);

module.exports = router;
