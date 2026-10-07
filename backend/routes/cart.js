const express = require('express');
const router = express.Router();
const cart = require('../controllers/cartController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/', cart.getCart);
router.get('/count', cart.getCartCount);
router.post('/items', cart.addItem);
router.put('/items/:id', cart.updateItem);
router.delete('/items/:id', cart.removeItem);
router.delete('/clear', cart.clearCart);

module.exports = router;
