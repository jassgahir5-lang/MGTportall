const express = require('express');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

// View Engine Setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 }
}));

// Pass user data to views
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// Routes
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/user', userRoutes);

app.get('/', (req, res) => {
  if (req.session.user) {
    return res.redirect(req.session.user.role === 'admin' ? '/admin/dashboard' : '/user/dashboard');
  }
  res.redirect('/auth/login');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running live at http://localhost:${PORT}`));