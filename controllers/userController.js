const db = require('../config/db');
const bcrypt = require('bcryptjs');
const QRCode = require('qrcode');

exports.getDashboard = async (req, res) => {
  try {
    const userId = req.session.user.id;

    const eventsQuery = await db.query(`
      SELECT 
        e.*, 
        c.name AS category_name, 
        v.name AS venue_name,
        COALESCE((SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id), 0) AS registered_count,
        EXISTS(SELECT 1 FROM registrations r WHERE r.event_id = e.id AND r.user_id = $1) AS is_registered
      FROM events e
      LEFT JOIN categories c ON e.category_id = c.id
      LEFT JOIN venues v ON e.venue_id = v.id
      ORDER BY e.start_time ASC, e.created_at DESC
    `, [userId]);

    const categoriesQuery = await db.query('SELECT * FROM categories ORDER BY name ASC');

    const myEventsQuery = await db.query(`
      SELECT 
        e.*, 
        v.name AS venue_name, 
        c.name AS category_name,
        r.id AS ticket_id,
        r.registered_at
      FROM registrations r
      JOIN events e ON r.event_id = e.id
      LEFT JOIN venues v ON e.venue_id = v.id
      LEFT JOIN categories c ON e.category_id = c.id
      WHERE r.user_id = $1
      ORDER BY r.registered_at DESC
    `, [userId]);

    // Generate real QR code tokens for all held passes
    const myEventsWithQR = await Promise.all(
      myEventsQuery.rows.map(async (ticket) => {
        const qrPayload = JSON.stringify({
          ticket_token: `TKN-00${ticket.ticket_id}`,
          event: ticket.title,
          student_id: userId,
          student_name: req.session.user.name,
          issued_at: ticket.registered_at
        });
        const qrDataUrl = await QRCode.toDataURL(qrPayload, {
          width: 260,
          margin: 2,
          color: { dark: '#0f172a', light: '#ffffff' }
        }).catch(() => null);

        return {
          ...ticket,
          qr_code: qrDataUrl
        };
      })
    );

    res.render('user/dashboard', {
      events: eventsQuery.rows,
      categories: categoriesQuery.rows,
      myEvents: myEventsWithQR,
      message: req.query.msg || null,
      error: req.query.err || null
    });
  } catch (err) {
    console.error('Error loading user dashboard:', err);
    res.status(500).send('Server Error loading dashboard');
  }
};

exports.registerEvent = async (req, res) => {
  const eventId = req.params.id;
  const userId = req.session.user.id;

  try {
    const existing = await db.query(
      'SELECT id FROM registrations WHERE user_id = $1 AND event_id = $2',
      [userId, eventId]
    );

    if (existing.rows.length > 0) {
      return res.redirect('/user/dashboard?err=You are already registered for this event');
    }

    const eventRes = await db.query('SELECT capacity FROM events WHERE id = $1', [eventId]);
    const regCountRes = await db.query('SELECT COUNT(*) FROM registrations WHERE event_id = $1', [eventId]);

    if (eventRes.rows.length === 0) {
      return res.redirect('/user/dashboard?err=Event not found');
    }

    const capacity = eventRes.rows[0].capacity;
    const currentRegs = parseInt(regCountRes.rows[0].count, 10);

    if (currentRegs >= capacity) {
      return res.redirect('/user/dashboard?err=Event is full!');
    }

    await db.query(
      'INSERT INTO registrations (user_id, event_id) VALUES ($1, $2)',
      [userId, eventId]
    );

    res.redirect('/user/dashboard?msg=Event Pass generated! Check your My Passes tab.');
  } catch (err) {
    console.error('Error registering event:', err);
    res.redirect('/user/dashboard?err=Registration failed');
  }
};

exports.cancelRegistration = async (req, res) => {
  const eventId = req.params.id;
  const userId = req.session.user.id;

  try {
    await db.query(
      'DELETE FROM registrations WHERE user_id = $1 AND event_id = $2',
      [userId, eventId]
    );

    res.redirect('/user/dashboard?msg=Registration cancelled successfully.');
  } catch (err) {
    console.error('Error cancelling registration:', err);
    res.redirect('/user/dashboard?err=Could not cancel registration');
  }
};

exports.getProfile = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const userRes = await db.query(`
      SELECT u.*, d.name AS department_name 
      FROM users u 
      LEFT JOIN departments d ON u.department_id = d.id 
      WHERE u.id = $1
    `, [userId]);

    const depts = await db.query('SELECT * FROM departments ORDER BY name ASC');

    res.render('user/profile', {
      userProfile: userRes.rows[0],
      departments: depts.rows,
      message: req.query.msg || null,
      error: req.query.err || null
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error loading profile');
  }
};

exports.updateProfile = async (req, res) => {
  const userId = req.session.user.id;
  const { name, department_id } = req.body;
  try {
    await db.query(
      'UPDATE users SET name = $1, department_id = $2 WHERE id = $3',
      [name, department_id || null, userId]
    );
    req.session.user.name = name;
    res.redirect('/user/profile?msg=Profile updated successfully!');
  } catch (err) {
    console.error(err);
    res.redirect('/user/profile?err=Failed to update profile');
  }
};

exports.changePassword = async (req, res) => {
  const userId = req.session.user.id;
  const { currentPassword, newPassword } = req.body;
  try {
    const userRes = await db.query('SELECT password FROM users WHERE id = $1', [userId]);
    const isMatch = await bcrypt.compare(currentPassword, userRes.rows[0].password);

    if (!isMatch) {
      return res.redirect('/user/profile?err=Current password is incorrect');
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password = $1 WHERE id = $2', [hashed, userId]);

    res.redirect('/user/profile?msg=Password updated successfully!');
  } catch (err) {
    console.error(err);
    res.redirect('/user/profile?err=Failed to change password');
  }
};