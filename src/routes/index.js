const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const Post = require('../models/Post');
const Settings = require('../models/Settings');

// Home page
router.get('/', (req, res) => {
    const projects = Project.getFeatured();
    const settings = Settings.getAll();
    const skills = settings.skills ? settings.skills.split(',').map(s => s.trim()) : [];
    
    res.render('index', {
        title: `Zach's Portfolio`,
        tagline: settings.site_tagline,
        description: settings.site_description,
        aboutText: settings.about_text,
        skills,
        projects,
        settings
    });
});

// Project detail page
router.get('/project/:slug', (req, res) => {
    const project = Project.getBySlug(req.params.slug);
    
    if (!project) {
        return res.status(404).render('404', { title: 'Project Not Found' });
    }
    
    const settings = Settings.getAll();
    
    res.render('project', {
        title: `${project.title} | ${settings.site_title}`,
        project,
        settings
    });
});

// Blog listing
router.get('/blog', (req, res) => {
    const posts = Post.getAll();
    const tags = Post.getAllTags();
    const settings = Settings.getAll();
    
    res.render('blog', {
        title: `Blog | ${settings.site_title}`,
        posts,
        tags,
        settings
    });
});

// Blog post detail
router.get('/blog/:slug', (req, res) => {
    const post = Post.getBySlug(req.params.slug);
    
    if (!post) {
        return res.status(404).render('404', { title: 'Post Not Found' });
    }
    
    const settings = Settings.getAll();
    
    res.render('post', {
        title: `${post.title} | ${settings.site_title}`,
        post,
        settings
    });
});

// About page (optional standalone)
router.get('/about', (req, res) => {
    const settings = Settings.getAll();
    const skills = settings.skills ? settings.skills.split(',').map(s => s.trim()) : [];
    
    res.render('about', {
        title: `About | ${settings.site_title}`,
        aboutText: settings.about_text,
        skills,
        settings
    });
});

module.exports = router;
