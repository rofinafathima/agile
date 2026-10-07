const express = require('express');
const router = express.Router();
const auth = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

router.post('/register', auth.register);
router.post('/login', auth.login);
router.get('/profile', authenticate, auth.getProfile);
router.put('/profile', authenticate, auth.updateProfile);
router.put('/change-password', authenticate, auth.changePassword);

module.exports = router;
