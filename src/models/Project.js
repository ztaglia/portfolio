const { all, get, run } = require('../db');
const slugify = require('slugify');

class Project {
    static getAll(includeUnpublished = false) {
        const query = includeUnpublished
            ? 'SELECT * FROM projects ORDER BY sort_order ASC, created_at DESC'
            : 'SELECT * FROM projects WHERE published = 1 ORDER BY sort_order ASC, created_at DESC';
        return all(query);
    }

    static getFeatured() {
        return all(`
            SELECT * FROM projects 
            WHERE published = 1 AND featured = 1 
            ORDER BY sort_order ASC, created_at DESC
        `);
    }

    static getById(id) {
        return get('SELECT * FROM projects WHERE id = ?', [id]);
    }

    static getBySlug(slug) {
        return get('SELECT * FROM projects WHERE slug = ? AND published = 1', [slug]);
    }

    static create(data) {
        const slug = slugify(data.title, { lower: true, strict: true });
        
        const result = run(`
            INSERT INTO projects (title, slug, category, description, content, thumbnail, images, link, github, featured, sort_order, published)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            data.title,
            slug,
            data.category || '',
            data.description || '',
            data.content || '',
            data.thumbnail || '',
            data.images || '',
            data.link || '',
            data.github || '',
            data.featured ? 1 : 0,
            data.sort_order || 0,
            data.published ? 1 : 0
        ]);
        
        return this.getById(result.lastInsertRowid);
    }

    static update(id, data) {
        const existing = this.getById(id);
        if (!existing) return null;

        const slug = data.title !== existing.title 
            ? slugify(data.title, { lower: true, strict: true })
            : existing.slug;

        run(`
            UPDATE projects SET
                title = ?,
                slug = ?,
                category = ?,
                description = ?,
                content = ?,
                thumbnail = ?,
                images = ?,
                link = ?,
                github = ?,
                featured = ?,
                sort_order = ?,
                published = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [
            data.title ?? existing.title,
            slug,
            data.category ?? existing.category,
            data.description ?? existing.description,
            data.content ?? existing.content,
            data.thumbnail ?? existing.thumbnail,
            data.images ?? existing.images,
            data.link ?? existing.link,
            data.github ?? existing.github,
            data.featured !== undefined ? (data.featured ? 1 : 0) : existing.featured,
            data.sort_order ?? existing.sort_order,
            data.published !== undefined ? (data.published ? 1 : 0) : existing.published,
            id
        ]);

        return this.getById(id);
    }

    static delete(id) {
        return run('DELETE FROM projects WHERE id = ?', [id]);
    }

    static reorder(orderedIds) {
        orderedIds.forEach((id, index) => {
            run('UPDATE projects SET sort_order = ? WHERE id = ?', [index, id]);
        });
    }
}

module.exports = Project;
