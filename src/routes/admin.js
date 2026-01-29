const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { body, validationResult } = require('express-validator');
const { isAuthenticated, verifyCredentials, addUserToLocals } = require('../middleware/auth');
const Project = require('../models/Project');
const Post = require('../models/Post');
const Contact = require('../models/Contact');
const Settings = require('../models/Settings');

// File upload configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('Only image files are allowed'));
    }
});

// Add user to all admin views
router.use(addUserToLocals);

// Login page
router.get('/login', (req, res) => {
    if (req.session.userId) {
        return res.redirect('/admin');
    }
    res.render('admin/login', { 
        title: 'Admin Login',
        error: null 
    });
});

// Login handler
router.post('/login', [
    body('username').trim().notEmpty(),
    body('password').notEmpty(),
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.render('admin/login', { 
            title: 'Admin Login',
            error: 'Please enter username and password' 
        });
    }

    const { username, password } = req.body;
    const user = verifyCredentials(username, password);

    if (user) {
        req.session.userId = user.id;
        res.redirect('/admin');
    } else {
        res.render('admin/login', { 
            title: 'Admin Login',
            error: 'Invalid username or password' 
        });
    }
});

// Logout
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/admin/login');
});

// Dashboard
router.get('/', isAuthenticated, (req, res) => {
    const projects = Project.getAll(true);
    const posts = Post.getAll(true);
    const unreadContacts = Contact.getUnreadCount();
    const recentContacts = Contact.getAll().slice(0, 5);

    res.render('admin/dashboard', {
        title: 'Admin Dashboard',
        stats: {
            projects: projects.length,
            posts: posts.length,
            unreadContacts
        },
        recentContacts
    });
});

// Projects list
router.get('/projects', isAuthenticated, (req, res) => {
    const projects = Project.getAll(true);
    res.render('admin/projects', {
        title: 'Manage Projects',
        projects
    });
});

// New project form
router.get('/projects/new', isAuthenticated, (req, res) => {
    res.render('admin/project-form', {
        title: 'New Project',
        project: null,
        error: null
    });
});

// Create project
router.post('/projects', isAuthenticated, upload.single('thumbnail'), (req, res) => {
    const data = {
        ...req.body,
        thumbnail: req.file ? `/uploads/${req.file.filename}` : '',
        featured: req.body.featured === 'on',
        published: req.body.published === 'on'
    };

    try {
        Project.create(data);
        res.redirect('/admin/projects');
    } catch (error) {
        res.render('admin/project-form', {
            title: 'New Project',
            project: data,
            error: error.message
        });
    }
});

// Edit project form
router.get('/projects/:id/edit', isAuthenticated, (req, res) => {
    const project = Project.getById(req.params.id);
    if (!project) {
        return res.redirect('/admin/projects');
    }
    res.render('admin/project-form', {
        title: 'Edit Project',
        project,
        error: null
    });
});

// Update project
router.post('/projects/:id', isAuthenticated, upload.single('thumbnail'), (req, res) => {
    const data = {
        ...req.body,
        featured: req.body.featured === 'on',
        published: req.body.published === 'on'
    };
    
    if (req.file) {
        data.thumbnail = `/uploads/${req.file.filename}`;
    }

    try {
        Project.update(req.params.id, data);
        res.redirect('/admin/projects');
    } catch (error) {
        res.render('admin/project-form', {
            title: 'Edit Project',
            project: { id: req.params.id, ...data },
            error: error.message
        });
    }
});

// Delete project
router.post('/projects/:id/delete', isAuthenticated, (req, res) => {
    Project.delete(req.params.id);
    res.redirect('/admin/projects');
});

// Posts list
router.get('/posts', isAuthenticated, (req, res) => {
    const posts = Post.getAll(true);
    res.render('admin/posts', {
        title: 'Manage Posts',
        posts
    });
});

// New post form
router.get('/posts/new', isAuthenticated, (req, res) => {
    res.render('admin/post-form', {
        title: 'New Post',
        post: null,
        error: null
    });
});

// Create post
router.post('/posts', isAuthenticated, upload.single('thumbnail'), (req, res) => {
    const data = {
        ...req.body,
        thumbnail: req.file ? `/uploads/${req.file.filename}` : '',
        published: req.body.published === 'on'
    };

    try {
        Post.create(data);
        res.redirect('/admin/posts');
    } catch (error) {
        res.render('admin/post-form', {
            title: 'New Post',
            post: data,
            error: error.message
        });
    }
});

// Edit post form
router.get('/posts/:id/edit', isAuthenticated, (req, res) => {
    const post = Post.getById(req.params.id);
    if (!post) {
        return res.redirect('/admin/posts');
    }
    res.render('admin/post-form', {
        title: 'Edit Post',
        post,
        error: null
    });
});

// Update post
router.post('/posts/:id', isAuthenticated, upload.single('thumbnail'), (req, res) => {
    const data = {
        ...req.body,
        published: req.body.published === 'on'
    };
    
    if (req.file) {
        data.thumbnail = `/uploads/${req.file.filename}`;
    }

    try {
        Post.update(req.params.id, data);
        res.redirect('/admin/posts');
    } catch (error) {
        res.render('admin/post-form', {
            title: 'Edit Post',
            post: { id: req.params.id, ...data },
            error: error.message
        });
    }
});

// Delete post
router.post('/posts/:id/delete', isAuthenticated, (req, res) => {
    Post.delete(req.params.id);
    res.redirect('/admin/posts');
});

// Contacts list
router.get('/contacts', isAuthenticated, (req, res) => {
    const contacts = Contact.getAll();
    res.render('admin/contacts', {
        title: 'Contact Submissions',
        contacts
    });
});

// View contact
router.get('/contacts/:id', isAuthenticated, (req, res) => {
    const contact = Contact.getById(req.params.id);
    if (!contact) {
        return res.redirect('/admin/contacts');
    }
    
    // Mark as read
    Contact.markAsRead(req.params.id);
    
    res.render('admin/contact-view', {
        title: 'View Message',
        contact
    });
});

// Delete contact
router.post('/contacts/:id/delete', isAuthenticated, (req, res) => {
    Contact.delete(req.params.id);
    res.redirect('/admin/contacts');
});

// Settings page
router.get('/settings', isAuthenticated, (req, res) => {
    const settings = Settings.getAll();
    res.render('admin/settings', {
        title: 'Site Settings',
        settings,
        success: req.query.success === '1'
    });
});

// Update settings (with file upload support)
router.post('/settings', isAuthenticated, upload.single('about_image'), (req, res) => {
    try {
        // Handle the uploaded image
        if (req.file) {
            Settings.set('about_image', `/uploads/${req.file.filename}`);
        }
        
        // Handle all other settings (exclude about_image from body since we handled it above)
        const { about_image, ...otherSettings } = req.body;
        Settings.setMultiple(otherSettings);
        
        res.redirect('/admin/settings?success=1');
    } catch (error) {
        const settings = Settings.getAll();
        res.render('admin/settings', {
            title: 'Site Settings',
            settings,
            error: error.message
        });
    }
});

module.exports = router;
