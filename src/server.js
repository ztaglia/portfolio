require('dotenv').config();

const express = require('express');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const rateLimit = require('express-rate-limit');

// Database initialization
const { initDatabase } = require('./db');

// Import routes
const indexRoutes = require('./routes/index');
const apiRoutes = require('./routes/api');
const adminRoutes = require('./routes/admin');

// Initialize express
const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));

// Compression
app.use(compression());

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Rate limiting for API routes
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: { error: 'Too many requests, please try again later.' }
});

// Contact form rate limiting (stricter)
const contactLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // Limit each IP to 5 contact submissions per hour
    message: { error: 'Too many contact submissions, please try again later.' }
});

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Make site config available to all views
app.use((req, res, next) => {
    res.locals.siteName = process.env.SITE_NAME || 'Portfolio';
    res.locals.siteUrl = process.env.SITE_URL || `http://localhost:${PORT}`;
    res.locals.currentYear = new Date().getFullYear();
    next();
});

// Routes
app.use('/', indexRoutes);
app.use('/api', apiLimiter, apiRoutes);
app.use('/api/contact', contactLimiter);
app.use('/admin', adminRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).render('404', { title: 'Page Not Found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('error', { 
        title: 'Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// Start server (async to initialize database first)
async function startServer() {
    try {
        // Initialize database
        await initDatabase();
        console.log('✅ Database initialized');
        
        // Start listening
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`Portfolio server running on port ${PORT}`);
        });
    } catch (err) {
        console.error('❌ Failed to start server:', err);
        process.exit(1);
    }
}

startServer();

module.exports = app;
