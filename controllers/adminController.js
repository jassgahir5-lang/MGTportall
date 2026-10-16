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
      ORDER BY e.created_at DESC
    `);

    res.render('admin/dashboard', {
      stats: {
        events: totalEvents.rows[0].count,
        users: totalUsers.rows[0].count,
        registrations: totalRegistrations.rows[0].count
      },
      categoryStats: categoryStats.rows,
      events: recentEvents.rows
    });
  } catch (err) {
    console.error(err);
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
      INSERT INTO events (title, description, category_id, venue_id, start_time, end_time, capacity, poster_url, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [title, description, category_id || null, venue_id || null, start_time, end_time, capacity, poster_url || null, req.session.user.id]);

    res.redirect('/admin/dashboard');
  } catch (err) {
    console.error(err);
    const categories = await db.query('SELECT * FROM categories ORDER BY name ASC');
    const venues = await db.query('SELECT * FROM venues ORDER BY name ASC');
    res.render('admin/create-event', {
      categories: categories.rows,
      venues: venues.rows,
      error: 'Failed to create event. Please check inputs.'
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
        u.name, 
        u.email, 
        d.name AS department_name
      FROM registrations r
      JOIN users u ON r.user_id = u.id
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE r.event_id = $1
      ORDER BY r.registered_at ASC
    `, [eventId]);

    res.render('admin/attendees', {
      event: eventRes.rows[0],
      attendees: attendees.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error fetching roster');
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
        r.registered_at
      FROM registrations r
      JOIN users u ON r.user_id = u.id
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE r.event_id = $1
      ORDER BY r.registered_at ASC
    `, [eventId]);

    let csv = 'Ticket ID,Student Name,Email,Department,Registered Date\n';
    attendees.rows.forEach(a => {
      const dateStr = new Date(a.registered_at).toLocaleString('en-US');
      csv += `"TKN-00${a.reg_id}","${a.name}","${a.email}","${a.department_name || 'General'}","${dateStr}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="Roster_Event_${eventId}.csv"`);
    res.status(200).send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error exporting CSV');
  }
};

exports.deleteEvent = async (req, res) => {
  const eventId = req.params.id;
  try {
    await db.query('DELETE FROM registrations WHERE event_id = $1', [eventId]);
    await db.query('DELETE FROM events WHERE id = $1', [eventId]);
    res.redirect('/admin/dashboard');
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to delete event');
  }
};