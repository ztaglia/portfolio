const { all, get, run } = require('../db');

class Settings {
    static get(key) {
        const result = get('SELECT value FROM settings WHERE key = ?', [key]);
        return result ? result.value : null;
    }

    static getAll() {
        const rows = all('SELECT key, value FROM settings');
        const settings = {};
        rows.forEach(row => {
            settings[row.key] = row.value;
        });
        return settings;
    }

    static set(key, value) {
        // Check if exists
        const existing = get('SELECT key FROM settings WHERE key = ?', [key]);
        
        if (existing) {
            run('UPDATE settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?', [value, key]);
        } else {
            run('INSERT INTO settings (key, value) VALUES (?, ?)', [key, value]);
        }
        
        return this.get(key);
    }

    static setMultiple(settings) {
        for (const [key, value] of Object.entries(settings)) {
            this.set(key, value);
        }
        return this.getAll();
    }

    static delete(key) {
        return run('DELETE FROM settings WHERE key = ?', [key]);
    }
}

module.exports = Settings;
