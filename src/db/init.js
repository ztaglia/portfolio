const { initDatabase, exec, get, run } = require('./index');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function initialize() {
    console.log('🌲 Initializing database...\n');
    
    // Initialize sql.js
    await initDatabase();
    
    // Create projects table
    exec(`
        CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            slug TEXT UNIQUE NOT NULL,
            category TEXT NOT NULL,
            description TEXT,
            content TEXT,
            thumbnail TEXT,
            images TEXT,
            link TEXT,
            github TEXT,
            featured INTEGER DEFAULT 0,
            sort_order INTEGER DEFAULT 0,
            published INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
    console.log('✅ Projects table created');

    // Create blog posts table
    exec(`
        CREATE TABLE IF NOT EXISTS posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            slug TEXT UNIQUE NOT NULL,
            excerpt TEXT,
            content TEXT,
            thumbnail TEXT,
            tags TEXT,
            published INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
    console.log('✅ Posts table created');

    // Create contact submissions table
    exec(`
        CREATE TABLE IF NOT EXISTS contacts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            subject TEXT,
            message TEXT NOT NULL,
            read INTEGER DEFAULT 0,
            replied INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
    console.log('✅ Contacts table created');

    // Create site settings table
    exec(`
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
    console.log('✅ Settings table created');

    // Create admin users table
    exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            email TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
    console.log('✅ Users table created');

    // Seed sample projects
    const projectCount = get('SELECT COUNT(*) as count FROM projects');
    
    if (projectCount.count === 0) {
        const sampleProjects = [
            ['Project Title One', 'project-one', 'Web Design', 'A brief description of this project, what problems it solved, and the impact it made for the client.', 1, 1],
            ['Project Title Two', 'project-two', 'Brand Identity', 'A brief description of this project, what problems it solved, and the impact it made for the client.', 1, 2],
            ['Project Title Three', 'project-three', 'Development', 'A brief description of this project, what problems it solved, and the impact it made for the client.', 1, 3],
        ];

        for (const project of sampleProjects) {
            run(
                'INSERT INTO projects (title, slug, category, description, featured, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
                project
            );
        }
        console.log('✅ Sample projects inserted');
    }

    // Insert default settings
    const defaultSettings = [
        ['site_title', 'Your Name'],
        ['site_tagline', 'Designer & Developer'],
        ['site_description', 'I\'m a creative professional who believes in the power of thoughtful design.'],
        ['contact_email', 'hello@yourname.com'],
        ['social_linkedin', '#'],
        ['social_github', '#'],
        ['social_twitter', '#'],
        ['social_dribbble', '#'],
        ['about_text', 'I\'m a designer and developer passionate about creating beautiful, functional digital experiences.'],
        ['skills', 'UI/UX Design,Web Development,Brand Identity,React,Figma,Motion Design'],
    ];

    for (const [key, value] of defaultSettings) {
        const existing = get('SELECT key FROM settings WHERE key = ?', [key]);
        if (!existing) {
            run('INSERT INTO settings (key, value) VALUES (?, ?)', [key, value]);
        }
    }
    console.log('✅ Default settings configured');

    // Create default admin user
    const adminExists = get('SELECT COUNT(*) as count FROM users WHERE username = ?', ['admin']);
    
    if (adminExists.count === 0) {
        const username = process.env.ADMIN_USERNAME || 'admin';
        const password = process.env.ADMIN_PASSWORD || 'changeme123';
        const hashedPassword = bcrypt.hashSync(password, 10);
        
        run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword]);
        console.log(`✅ Admin user created (username: ${username})`);
    }

    console.log('\n🎉 Database initialization complete!\n');
}

initialize().catch(err => {
    console.error('❌ Database initialization failed:', err);
    process.exit(1);
});
