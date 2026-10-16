module.exports = {
  // Check if user is logged in
  isAuthenticated: (req, res, next) => {
    if (req.session.user) return next();
    res.redirect('/auth/login');
  },
  
  // Check if logged-in user is an Admin
  isAdmin: (req, res, next) => {
    if (req.session.user && req.session.user.role === 'admin') return next();
    res.status(403).send('Access Denied: Admin privileges required.');
  }
};