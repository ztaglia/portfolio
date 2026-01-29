const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../../data/portfolio.db');
const dataDir = path.dirname(dbPath);

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

let db = null;
let SQL = null;
let isInitialized = false;

// Initialize the database
async function initDatabase() {
    if (isInitialized && db) return db;
    
    SQL = await initSqlJs();
    
    // Load existing database or create new one
    if (fs.existsSync(dbPath)) {
        const buffer = fs.readFileSync(dbPath);
        db = new SQL.Database(buffer);
    } else {
        db = new SQL.Database();
    }
    
    isInitialized = true;
    return db;
}

// Save database to file
function saveDatabase() {
    if (db) {
        const data = db.export();
        const buffer = Buffer.from(data);
        fs.writeFileSync(dbPath, buffer);
    }
}

// Helper to run a query and return all results
function all(sql, params = []) {
    if (!db) throw new Error('Database not initialized. Call initDatabase() first.');
    const stmt = db.prepare(sql);
    if (params.length > 0) {
        stmt.bind(params);
    }
    const results = [];
    while (stmt.step()) {
        results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
}

// Helper to run a query and return first result
function get(sql, params = []) {
    const results = all(sql, params);
    return results.length > 0 ? results[0] : null;
}

// Helper to run a query (INSERT, UPDATE, DELETE)
function run(sql, params = []) {
    if (!db) throw new Error('Database not initialized. Call initDatabase() first.');
    db.run(sql, params);
    saveDatabase();
    const lastId = db.exec("SELECT last_insert_rowid()");
    return {
        lastInsertRowid: lastId[0]?.values[0][0] || 0,
        changes: db.getRowsModified()
    };
}

// Helper to execute multiple statements
function exec(sql) {
    if (!db) throw new Error('Database not initialized. Call initDatabase() first.');
    db.exec(sql);
    saveDatabase();
}

module.exports = {
    initDatabase,
    saveDatabase,
    all,
    get,
    run,
    exec,
    getDb: () => db
};
