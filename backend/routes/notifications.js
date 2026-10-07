const express = require('express');
const router = express.Router();
const notifications = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/', notifications.getNotifications);
router.put('/:id/read', notifications.markAsRead);
router.put('/read-all', notifications.markAllRead);

module.exports = router;
