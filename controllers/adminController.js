const db = require('../config/db');

exports.getDashboard = async (req, res) => {
  try {
    const totalEvents = await db.query('SELECT COUNT(*) FROM events');
    const totalUsers = await db.query("SELECT COUNT(*) FROM users WHERE role = 'user'");
    const totalRegistrations = await db.query('SELECT COUNT(*) FROM registrations');
    
    // Category Breakdown Analytics
    const categoryStats = await db.query(`
      SELECT c.name, COUNT(e.id) AS event_count
      FROM categories c
      LEFT JOIN events e ON c.id = e.category_id
      GROUP BY c.id, c.name
      ORDER BY event_count DESC
    `);

    const recentEvents = await db.query(`
      SELECT 
        e.*, 
        c.name AS category_name, 
        v.name AS venue_name,
        COALESCE((SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id), 0) AS registered_count
      FROM events e 
      LEFT JOIN categories c ON e.category_id = c.id 
      LEFT JOIN venues v ON e.venue_id = v.id 
      ORDER BY e.start_time ASC, e.created_at DESC
    `);

    res.render('admin/dashboard', {
      stats: {
        events: totalEvents.rows[0].count,
        users: totalUsers.rows[0].count,
        registrations: totalRegistrations.rows[0].count
      },
      categoryStats: categoryStats.rows,
      events: recentEvents.rows,
      message: req.query.msg || null,
      error: req.query.err || null
    });
  } catch (err) {
    console.error('Admin dashboard error:', err);
    res.status(500).send('Server Error loading admin dashboard');
  }
};

exports.getCreateEvent = async (req, res) => {
  try {
    const categories = await db.query('SELECT * FROM categories ORDER BY name ASC');
    const venues = await db.query('SELECT * FROM venues ORDER BY name ASC');
    res.render('admin/create-event', {
      categories: categories.rows,
      venues: venues.rows,
      error: null
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

exports.postCreateEvent = async (req, res) => {
  const { title, description, category_id, venue_id, start_time, end_time, capacity, poster_url } = req.body;
  try {
    await db.query(`
      INSERT INTO events (title, description, category_id, venue_id, start_time, end_time, capacity, poster_url, created_by, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'upcoming')
    `, [title, description, category_id || null, venue_id || null, start_time, end_time, capacity, poster_url || null, req.session.user.id]);

    res.redirect('/admin/dashboard?msg=New event published successfully!');
  } catch (err) {
    console.error('Create event error:', err);
    const categories = await db.query('SELECT * FROM categories ORDER BY name ASC');
    const venues = await db.query('SELECT * FROM venues ORDER BY name ASC');
    res.render('admin/create-event', {
      categories: categories.rows,
      venues: venues.rows,
      error: 'Failed to create event. Please verify all required inputs.'
    });
  }
};

// Edit Event GET
exports.getEditEvent = async (req, res) => {
  const eventId = req.params.id;
  try {
    const eventRes = await db.query('SELECT * FROM events WHERE id = $1', [eventId]);
    if (eventRes.rows.length === 0) return res.status(404).send('Event not found');

    const categories = await db.query('SELECT * FROM categories ORDER BY name ASC');
    const venues = await db.query('SELECT * FROM venues ORDER BY name ASC');

    res.render('admin/edit-event', {
      event: eventRes.rows[0],
      categories: categories.rows,
      venues: venues.rows,
      error: null
    });
  } catch (err) {
    console.error('Error fetching event for edit:', err);
    res.status(500).send('Server Error loading edit event');
  }
};

// Edit Event POST
exports.postEditEvent = async (req, res) => {
  const eventId = req.params.id;
  const { title, description, category_id, venue_id, start_time, end_time, capacity, poster_url, status } = req.body;

  try {
    await db.query(`
      UPDATE events 
      SET title = $1, description = $2, category_id = $3, venue_id = $4, 
          start_time = $5, end_time = $6, capacity = $7, poster_url = $8, status = $9
      WHERE id = $10
    `, [title, description, category_id || null, venue_id || null, start_time, end_time, capacity, poster_url || null, status || 'upcoming', eventId]);

    res.redirect('/admin/dashboard?msg=Event details updated successfully!');
  } catch (err) {
    console.error('Error updating event:', err);
    const eventRes = await db.query('SELECT * FROM events WHERE id = $1', [eventId]);
    const categories = await db.query('SELECT * FROM categories ORDER BY name ASC');
    const venues = await db.query('SELECT * FROM venues ORDER BY name ASC');
    res.render('admin/edit-event', {
      event: { ...eventRes.rows[0], ...req.body },
      categories: categories.rows,
      venues: venues.rows,
      error: 'Failed to save changes: ' + err.message
    });
  }
};

exports.getEventAttendees = async (req, res) => {
  const eventId = req.params.id;
  try {
    const eventRes = await db.query(`
      SELECT e.*, c.name AS category_name, v.name AS venue_name 
      FROM events e 
      LEFT JOIN categories c ON e.category_id = c.id 
      LEFT JOIN venues v ON e.venue_id = v.id 
      WHERE e.id = $1
    `, [eventId]);

    if (eventRes.rows.length === 0) {
      return res.status(404).send('Event not found');
    }

    const attendees = await db.query(`
      SELECT 
        r.id AS reg_id, 
        r.registered_at, 
        u.id AS user_id,
        u.name, 
        u.email, 
        d.name AS department_name,
        att.id AS attendance_id,
        att.scanned_at
      FROM registrations r
      JOIN users u ON r.user_id = u.id
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN attendance att ON att.registration_id = r.id
      WHERE r.event_id = $1
      ORDER BY r.registered_at ASC
    `, [eventId]);

    res.render('admin/attendees', {
      event: eventRes.rows[0],
      attendees: attendees.rows,
      message: req.query.msg || null,
      error: req.query.err || null
    });
  } catch (err) {
    console.error('Error fetching roster:', err);
    res.status(500).send('Server Error fetching roster');
  }
};

// Toggle Attendance for a Registration
exports.toggleAttendance = async (req, res) => {
  const { eventId, regId } = req.params;
  try {
    const check = await db.query('SELECT id FROM attendance WHERE registration_id = $1', [regId]);
    if (check.rows.length > 0) {
      // Undo check-in
      await db.query('DELETE FROM attendance WHERE registration_id = $1', [regId]);
      res.redirect(`/admin/events/${eventId}/attendees?msg=Check-in reverted.`);
    } else {
      // Mark attended
      await db.query('INSERT INTO attendance (registration_id, scanned_at) VALUES ($1, NOW())', [regId]);
      res.redirect(`/admin/events/${eventId}/attendees?msg=Student pass verified and checked in!`);
    }
  } catch (err) {
    console.error('Error toggling attendance:', err);
    res.redirect(`/admin/events/${eventId}/attendees?err=Failed to update attendance status.`);
  }
};

// Export Attendee List as CSV
exports.exportAttendeesCSV = async (req, res) => {
  const eventId = req.params.id;
  try {
    const eventRes = await db.query('SELECT title FROM events WHERE id = $1', [eventId]);
    if (eventRes.rows.length === 0) return res.status(404).send('Event not found');

    const attendees = await db.query(`
      SELECT 
        r.id AS reg_id, 
        u.name, 
        u.email, 
        d.name AS department_name,
        r.registered_at,
        CASE WHEN att.id IS NOT NULL THEN 'Checked In' ELSE 'Pending' END AS attendance_status,
        att.scanned_at
      FROM registrations r
      JOIN users u ON r.user_id = u.id
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN attendance att ON att.registration_id = r.id
      WHERE r.event_id = $1
      ORDER BY r.registered_at ASC
    `, [eventId]);

    let csv = 'Ticket ID,Student Name,Email,Department,Registered Date,Attendance Status,Checked In At\n';
    attendees.rows.forEach(a => {
      const regDate = new Date(a.registered_at).toLocaleString('en-US');
      const scanDate = a.scanned_at ? new Date(a.scanned_at).toLocaleString('en-US') : 'N/A';
      csv += `"TKN-00${a.reg_id}","${a.name}","${a.email}","${a.department_name || 'General'}","${regDate}","${a.attendance_status}","${scanDate}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="Roster_Event_${eventId}.csv"`);
    res.status(200).send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error exporting CSV');
  }
};

// Safe Deletion with Cascade of attendance, feedback, and registrations
exports.deleteEvent = async (req, res) => {
  const eventId = req.params.id;
  try {
    await db.query('DELETE FROM attendance WHERE registration_id IN (SELECT id FROM registrations WHERE event_id = $1)', [eventId]);
    await db.query('DELETE FROM feedback WHERE event_id = $1', [eventId]);
    await db.query('DELETE FROM registrations WHERE event_id = $1', [eventId]);
    await db.query('DELETE FROM events WHERE id = $1', [eventId]);
    res.redirect('/admin/dashboard?msg=Event and all associated passes were permanently deleted.');
  } catch (err) {
    console.error('Delete event error:', err);
    res.redirect('/admin/dashboard?err=Failed to delete event: ' + err.message);
  }
};

// Student Directory
exports.getStudents = async (req, res) => {
  try {
    const studentsRes = await db.query(`
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.role, 
        u.status, 
        u.created_at,
        d.name AS department_name,
        COALESCE((SELECT COUNT(*) FROM registrations r WHERE r.user_id = u.id), 0) AS passes_count
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.role = 'user'
      ORDER BY u.created_at DESC
    `);

    res.render('admin/students', {
      students: studentsRes.rows,
      message: req.query.msg || null,
      error: req.query.err || null
    });
  } catch (err) {
    console.error('Error fetching students:', err);
    res.status(500).send('Server Error loading students');
  }
};

// Toggle Student Status (Active / Blocked)
exports.toggleStudentStatus = async (req, res) => {
  const studentId = req.params.id;
  try {
    const userRes = await db.query('SELECT status FROM users WHERE id = $1', [studentId]);
    if (userRes.rows.length === 0) return res.redirect('/admin/students?err=Student not found');

    const newStatus = userRes.rows[0].status === 'active' ? 'blocked' : 'active';
    await db.query('UPDATE users SET status = $1 WHERE id = $2', [newStatus, studentId]);

    res.redirect(`/admin/students?msg=Student account is now ${newStatus.toUpperCase()}`);
  } catch (err) {
    console.error('Error toggling student status:', err);
    res.redirect('/admin/students?err=Failed to update student account status');
  }
};