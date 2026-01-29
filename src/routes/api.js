const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const nodemailer = require('nodemailer');
const Project = require('../models/Project');
const Post = require('../models/Post');
const Contact = require('../models/Contact');
const Settings = require('../models/Settings');

// Get all projects
router.get('/projects', (req, res) => {
    const projects = Project.getFeatured();
    res.json(projects);
});

// Get single project
router.get('/projects/:slug', (req, res) => {
    const project = Project.getBySlug(req.params.slug);
    if (!project) {
        return res.status(404).json({ error: 'Project not found' });
    }
    res.json(project);
});

// Get all blog posts
router.get('/posts', (req, res) => {
    const posts = Post.getAll();
    res.json(posts);
});

// Get recent blog posts
router.get('/posts/recent', (req, res) => {
    const limit = parseInt(req.query.limit) || 5;
    const posts = Post.getRecent(limit);
    res.json(posts);
});

// Get single blog post
router.get('/posts/:slug', (req, res) => {
    const post = Post.getBySlug(req.params.slug);
    if (!post) {
        return res.status(404).json({ error: 'Post not found' });
    }
    res.json(post);
});

// Get site settings (public ones only)
router.get('/settings', (req, res) => {
    const settings = Settings.getAll();
    // Filter to only public settings
    const publicSettings = {
        site_title: settings.site_title,
        site_tagline: settings.site_tagline,
        site_description: settings.site_description,
        contact_email: settings.contact_email,
        social_linkedin: settings.social_linkedin,
        social_github: settings.social_github,
        social_twitter: settings.social_twitter,
        social_dribbble: settings.social_dribbble,
    };
    res.json(publicSettings);
});

// Contact form submission
router.post('/contact', [
    body('name').trim().notEmpty().withMessage('Name is required').escape(),
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('subject').trim().escape(),
    body('message').trim().notEmpty().withMessage('Message is required').escape(),
], async (req, res) => {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, subject, message } = req.body;

    try {
        // Save to database
        const contact = Contact.create({ name, email, subject, message });

        // Send email notification (if configured)
        if (process.env.SMTP_HOST && process.env.SMTP_USER) {
            const transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: process.env.SMTP_PORT || 587,
                secure: process.env.SMTP_SECURE === 'true',
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                },
            });

            await transporter.sendMail({
                from: process.env.EMAIL_FROM,
                to: process.env.EMAIL_TO,
                subject: `Portfolio Contact: ${subject || 'New Message'}`,
                text: `
Name: ${name}
Email: ${email}
Subject: ${subject || 'N/A'}

Message:
${message}
                `,
                html: `
<h2>New Contact Form Submission</h2>
<p><strong>Name:</strong> ${name}</p>
<p><strong>Email:</strong> ${email}</p>
<p><strong>Subject:</strong> ${subject || 'N/A'}</p>
<hr>
<p><strong>Message:</strong></p>
<p>${message.replace(/\n/g, '<br>')}</p>
                `,
            });
        }

        res.status(201).json({ 
            success: true, 
            message: 'Thank you for your message! I\'ll get back to you soon.' 
        });
    } catch (error) {
        console.error('Contact form error:', error);
        res.status(500).json({ 
            error: 'Failed to send message. Please try again later.' 
        });
    }
});

module.exports = router;
