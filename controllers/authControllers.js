const bcrypt = require('bcryptjs');
const db = require('../config/db');

const getLogin = (req, res) => {
  res.render('login', { error: null });
};

const getRegister = async (req, res) => {
  try {
    const depts = await db.query('SELECT * FROM departments ORDER BY name ASC');
    res.render('register', { departments: depts.rows, error: null });
  } catch (err) {
    console.error(err);
    res.render('register', { departments: [], error: 'Failed to load departments' });
  }
};

const postLogin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.render('login', { error: 'Invalid email or password' });
    }

    const user = result.rows[0];
    if (user.status === 'blocked') {
      return res.render('login', { error: 'Your account has been blocked by an administrator.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.render('login', { error: 'Invalid email or password' });
    }

    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    if (user.role === 'admin') {
      res.redirect('/admin/dashboard');
    } else {
      res.redirect('/user/dashboard');
    }
  } catch (err) {
    console.error(err);
    res.render('login', { error: 'An error occurred during login' });
  }
};

const postRegister = async (req, res) => {
  const { name, email, password, department_id } = req.body;
  try {
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      const depts = await db.query('SELECT * FROM departments ORDER BY name ASC');
      return res.render('register', { departments: depts.rows, error: 'Email is already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query(
      'INSERT INTO users (name, email, password, department_id, role) VALUES ($1, $2, $3, $4, $5)',
      [name, email, hashedPassword, department_id || null, 'user']
    );

    res.redirect('/auth/login');
  } catch (err) {
    console.error(err);
    const depts = await db.query('SELECT * FROM departments ORDER BY name ASC');
    res.render('register', { departments: depts.rows, error: 'Registration failed' });
  }
};

const logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/auth/login');
  });
};

module.exports = {
  getLogin,
  getRegister,
  postLogin,
  postRegister,
  logout
};