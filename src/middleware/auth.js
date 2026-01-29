const { get } = require('../db');
const bcrypt = require('bcryptjs');

// Check if user is authenticated
function isAuthenticated(req, res, next) {
    if (req.session && req.session.userId) {
        return next();
    }
    
    // For API routes, return JSON error
    if (req.originalUrl.startsWith('/api/')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // For web routes, redirect to login
    res.redirect('/admin/login');
}

// Verify user credentials
function verifyCredentials(username, password) {
    const user = get('SELECT * FROM users WHERE username = ?', [username]);
    
    if (!user) {
        return null;
    }
    
    if (bcrypt.compareSync(password, user.password)) {
        return { id: user.id, username: user.username };
    }
    
    return null;
}

// Add user info to locals for views
function addUserToLocals(req, res, next) {
    if (req.session && req.session.userId) {
        const user = get('SELECT id, username FROM users WHERE id = ?', [req.session.userId]);
        res.locals.user = user;
    } else {
        res.locals.user = null;
    }
    next();
}

module.exports = {
    isAuthenticated,
    verifyCredentials,
    addUserToLocals
};
