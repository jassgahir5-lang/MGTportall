const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { isAuthenticated } = require('../middleware/auth');

router.use(isAuthenticated);

router.get('/dashboard', userController.getDashboard);
router.post('/register-event/:id', userController.registerEvent);
router.post('/cancel-event/:id', userController.cancelRegistration);

router.get('/profile', userController.getProfile);
router.post('/profile/update', userController.updateProfile);
router.post('/profile/change-password', userController.changePassword);

module.exports = router;