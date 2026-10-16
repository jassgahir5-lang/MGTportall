const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

router.use(isAuthenticated, isAdmin);

router.get('/dashboard', adminController.getDashboard);
router.get('/events/create', adminController.getCreateEvent);
router.post('/events/create', adminController.postCreateEvent);

router.get('/events/:id/attendees', adminController.getEventAttendees);
router.get('/events/:id/export-csv', adminController.exportAttendeesCSV);
router.post('/events/:id/delete', adminController.deleteEvent);

module.exports = router;