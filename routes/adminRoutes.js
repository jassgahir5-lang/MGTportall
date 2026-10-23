const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

router.use(isAuthenticated, isAdmin);

// Dashboard
router.get('/dashboard', adminController.getDashboard);

// Events
router.get('/events/create', adminController.getCreateEvent);
router.post('/events/create', adminController.postCreateEvent);

router.get('/events/:id/edit', adminController.getEditEvent);
router.post('/events/:id/edit', adminController.postEditEvent);

router.get('/events/:id/attendees', adminController.getEventAttendees);
router.post('/events/:eventId/attendees/:regId/toggle-attendance', adminController.toggleAttendance);
router.get('/events/:id/export-csv', adminController.exportAttendeesCSV);
router.post('/events/:id/delete', adminController.deleteEvent);

// Students Directory & Moderation
router.get('/students', adminController.getStudents);
router.post('/students/:id/toggle-status', adminController.toggleStudentStatus);

module.exports = router;