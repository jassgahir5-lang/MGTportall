const bcrypt = require('bcryptjs');
const db = require('../config/db');

const defaultDepartments = [
  { id: '1', name: 'Computer Science & Engineering (CSE)' },
  { id: '2', name: 'Information Technology (IT)' },
  { id: '3', name: 'Artificial Intelligence & Data Science (AI & DS)' },
  { id: '4', name: 'Business Administration (MBA / BBA)' },
  { id: '5', name: 'Computer Applications (MCA / BCA)' },
  { id: '6', name: 'Electronics & Communication Engineering (ECE)' }
];

const getLogin = (req, res) => {
  const successMsg = req.query.registered ? 'Account created successfully! Please sign in below.' : null;
  res.render('login', { error: null, success: successMsg });
};

const getRegister = async (req, res) => {
  try {
    const depts = await db.query('SELECT * FROM departments ORDER BY name ASC');
    const departments = depts.rows.length > 0 ? depts.rows : defaultDepartments;
    res.render('register', { departments, error: null });
  } catch (err) {
    console.error('Error loading departments:', err);
    res.render('register', { departments: defaultDepartments, error: null });
  }
};

const postLogin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const cleanEmail = (email || '').trim().toLowerCase();
    const result = await db.query('SELECT * FROM users WHERE LOWER(email) = $1', [cleanEmail]);
    if (result.rows.length === 0) {
      return res.render('login', { error: 'Invalid email or password', success: null });
    }

    const user = result.rows[0];
    if (user.status === 'blocked') {
      return res.render('login', { error: 'Your account has been suspended by campus administration.', success: null });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.render('login', { error: 'Invalid email or password', success: null });
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
    console.error('Login error:', err);
    res.render('login', { error: 'An unexpected error occurred during login. Please try again.', success: null });
  }
};

const postRegister = async (req, res) => {
  const { name, email, password, department_id } = req.body;
  try {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanName = (name || '').trim();

    if (!cleanName || !cleanEmail || !password) {
      const depts = await db.query('SELECT * FROM departments ORDER BY name ASC').catch(() => ({ rows: defaultDepartments }));
      return res.render('register', { departments: depts.rows.length ? depts.rows : defaultDepartments, error: 'All fields are required.' });
    }

    if (password.length < 6) {
      const depts = await db.query('SELECT * FROM departments ORDER BY name ASC').catch(() => ({ rows: defaultDepartments }));
      return res.render('register', { departments: depts.rows.length ? depts.rows : defaultDepartments, error: 'Password must be at least 6 characters.' });
    }

    const existing = await db.query('SELECT id FROM users WHERE LOWER(email) = $1', [cleanEmail]);
    if (existing.rows.length > 0) {
      const depts = await db.query('SELECT * FROM departments ORDER BY name ASC').catch(() => ({ rows: defaultDepartments }));
      return res.render('register', { departments: depts.rows.length ? depts.rows : defaultDepartments, error: 'This university email is already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const validDeptId = department_id && String(department_id).trim() !== '' ? department_id : null;

    await db.query(
      'INSERT INTO users (name, email, password, department_id, role, status) VALUES ($1, $2, $3, $4, $5, $6)',
      [cleanName, cleanEmail, hashedPassword, validDeptId, 'user', 'active']
    );

    res.redirect('/auth/login?registered=true');
  } catch (err) {
    console.error('Registration failed:', err);
    const depts = await db.query('SELECT * FROM departments ORDER BY name ASC').catch(() => ({ rows: defaultDepartments }));
    res.render('register', { departments: depts.rows.length ? depts.rows : defaultDepartments, error: 'Registration failed. Please check your inputs.' });
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