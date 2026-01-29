const { all, get, run } = require('../db');
const slugify = require('slugify');

class Post {
    static getAll(includeUnpublished = false) {
        const query = includeUnpublished
            ? 'SELECT * FROM posts ORDER BY created_at DESC'
            : 'SELECT * FROM posts WHERE published = 1 ORDER BY created_at DESC';
        return all(query);
    }

    static getRecent(limit = 5) {
        return all(`
            SELECT * FROM posts 
            WHERE published = 1 
            ORDER BY created_at DESC 
            LIMIT ?
        `, [limit]);
    }

    static getById(id) {
        return get('SELECT * FROM posts WHERE id = ?', [id]);
    }

    static getBySlug(slug) {
        return get('SELECT * FROM posts WHERE slug = ? AND published = 1', [slug]);
    }

    static getByTag(tag) {
        return all(`
            SELECT * FROM posts 
            WHERE published = 1 AND tags LIKE ? 
            ORDER BY created_at DESC
        `, [`%${tag}%`]);
    }

    static create(data) {
        const slug = slugify(data.title, { lower: true, strict: true });
        
        const result = run(`
            INSERT INTO posts (title, slug, excerpt, content, thumbnail, tags, published)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
            data.title,
            slug,
            data.excerpt || '',
            data.content || '',
            data.thumbnail || '',
            data.tags || '',
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
            UPDATE posts SET
                title = ?,
                slug = ?,
                excerpt = ?,
                content = ?,
                thumbnail = ?,
                tags = ?,
                published = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [
            data.title ?? existing.title,
            slug,
            data.excerpt ?? existing.excerpt,
            data.content ?? existing.content,
            data.thumbnail ?? existing.thumbnail,
            data.tags ?? existing.tags,
            data.published !== undefined ? (data.published ? 1 : 0) : existing.published,
            id
        ]);

        return this.getById(id);
    }

    static delete(id) {
        return run('DELETE FROM posts WHERE id = ?', [id]);
    }

    static getAllTags() {
        const posts = all('SELECT tags FROM posts WHERE published = 1');
        const tagSet = new Set();
        posts.forEach(post => {
            if (post.tags) {
                post.tags.split(',').forEach(tag => tagSet.add(tag.trim()));
            }
        });
        return Array.from(tagSet).sort();
    }
}

module.exports = Post;
