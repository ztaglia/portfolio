const { all, get, run } = require('../db');

class Contact {
    static getAll() {
        return all('SELECT * FROM contacts ORDER BY created_at DESC');
    }

    static getUnread() {
        return all('SELECT * FROM contacts WHERE read = 0 ORDER BY created_at DESC');
    }

    static getById(id) {
        return get('SELECT * FROM contacts WHERE id = ?', [id]);
    }

    static create(data) {
        const result = run(`
            INSERT INTO contacts (name, email, subject, message)
            VALUES (?, ?, ?, ?)
        `, [
            data.name,
            data.email,
            data.subject || '',
            data.message
        ]);
        
        return this.getById(result.lastInsertRowid);
    }

    static markAsRead(id) {
        run('UPDATE contacts SET read = 1 WHERE id = ?', [id]);
        return this.getById(id);
    }

    static markAsReplied(id) {
        run('UPDATE contacts SET replied = 1, read = 1 WHERE id = ?', [id]);
        return this.getById(id);
    }

    static delete(id) {
        return run('DELETE FROM contacts WHERE id = ?', [id]);
    }

    static getUnreadCount() {
        const result = get('SELECT COUNT(*) as count FROM contacts WHERE read = 0');
        return result ? result.count : 0;
    }
}

module.exports = Contact;
