const express = require('express');
const router = express.Router();
const addresses = require('../controllers/addressController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/', addresses.getAddresses);
router.post('/', addresses.addAddress);
router.put('/:id', addresses.updateAddress);
router.delete('/:id', addresses.deleteAddress);

module.exports = router;
