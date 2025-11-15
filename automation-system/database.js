const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const logger = require('./logger');

// Create database directory
const dbDir = path.join(__dirname, 'database');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'posts.db');
const db = new Database(dbPath);

// Initialize database schema
function initDatabase() {
    logger.info('Initializing database...');

    // Automation runs table
    db.exec(`
        CREATE TABLE IF NOT EXISTS automation_runs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            started_at TEXT NOT NULL,
            completed_at TEXT,
            status TEXT NOT NULL,
            platforms_attempted INTEGER DEFAULT 0,
            platforms_succeeded INTEGER DEFAULT 0,
            platforms_failed INTEGER DEFAULT 0,
            total_posts INTEGER DEFAULT 0,
            errors TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Posts table
    db.exec(`
        CREATE TABLE IF NOT EXISTS posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            run_id INTEGER,
            platform TEXT NOT NULL,
            post_type TEXT NOT NULL,
            content TEXT NOT NULL,
            post_url TEXT,
            post_id TEXT,
            status TEXT NOT NULL,
            error_message TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (run_id) REFERENCES automation_runs(id)
        )
    `);

    // Analytics table
    db.exec(`
        CREATE TABLE IF NOT EXISTS analytics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            platform TEXT NOT NULL,
            metric_name TEXT NOT NULL,
            metric_value INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    `);

    logger.success('Database initialized');
}

// Start new automation run
function startAutomationRun() {
    const stmt = db.prepare(`
        INSERT INTO automation_runs (started_at, status)
        VALUES (?, 'running')
    `);

    const result = stmt.run(new Date().toISOString());
    logger.info(`Started automation run #${result.lastInsertRowid}`);

    return result.lastInsertRowid;
}

// Complete automation run
function completeAutomationRun(runId, stats) {
    const stmt = db.prepare(`
        UPDATE automation_runs
        SET completed_at = ?,
            status = ?,
            platforms_attempted = ?,
            platforms_succeeded = ?,
            platforms_failed = ?,
            total_posts = ?,
            errors = ?
        WHERE id = ?
    `);

    stmt.run(
        new Date().toISOString(),
        stats.status || 'completed',
        stats.attempted || 0,
        stats.succeeded || 0,
        stats.failed || 0,
        stats.totalPosts || 0,
        stats.errors ? JSON.stringify(stats.errors) : null,
        runId
    );

    logger.success(`Completed automation run #${runId}`);
}

// Save post record
function savePost(runId, platform, postType, content, result) {
    const stmt = db.prepare(`
        INSERT INTO posts (run_id, platform, post_type, content, post_url, post_id, status, error_message)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
        runId,
        platform,
        postType,
        content,
        result.url || null,
        result.id || null,
        result.success ? 'success' : 'failed',
        result.error || null
    );

    if (result.success) {
        logger.success(`Saved ${platform} ${postType} to database`);
    } else {
        logger.error(`Saved failed ${platform} ${postType}: ${result.error}`);
    }
}

// Get recent automation runs
function getRecentRuns(limit = 10) {
    const stmt = db.prepare(`
        SELECT * FROM automation_runs
        ORDER BY created_at DESC
        LIMIT ?
    `);

    return stmt.all(limit);
}

// Get posts for a run
function getPostsForRun(runId) {
    const stmt = db.prepare(`
        SELECT * FROM posts
        WHERE run_id = ?
        ORDER BY created_at DESC
    `);

    return stmt.all(runId);
}

// Get all posts (paginated)
function getAllPosts(limit = 50, offset = 0) {
    const stmt = db.prepare(`
        SELECT * FROM posts
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
    `);

    return stmt.all(limit, offset);
}

// Get statistics
function getStats() {
    const totalPosts = db.prepare('SELECT COUNT(*) as count FROM posts').get();
    const successfulPosts = db.prepare('SELECT COUNT(*) as count FROM posts WHERE status = "success"').get();
    const totalRuns = db.prepare('SELECT COUNT(*) as count FROM automation_runs').get();
    const recentRuns = db.prepare('SELECT * FROM automation_runs ORDER BY created_at DESC LIMIT 1').get();

    return {
        totalPosts: totalPosts.count,
        successfulPosts: successfulPosts.count,
        totalRuns: totalRuns.count,
        successRate: totalPosts.count > 0 ? ((successfulPosts.count / totalPosts.count) * 100).toFixed(1) : 0,
        lastRun: recentRuns
    };
}

// Get platform statistics
function getPlatformStats() {
    const stmt = db.prepare(`
        SELECT
            platform,
            COUNT(*) as total_posts,
            SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful_posts,
            CAST(SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) AS FLOAT) / COUNT(*) * 100 as success_rate
        FROM posts
        GROUP BY platform
        ORDER BY total_posts DESC
    `);

    return stmt.all();
}

// Delete old posts (older than 90 days)
function cleanupOldPosts() {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const stmt = db.prepare(`
        DELETE FROM posts
        WHERE created_at < ?
    `);

    const result = stmt.run(ninetyDaysAgo.toISOString());
    logger.info(`Cleaned up ${result.changes} old posts`);

    return result.changes;
}

// Delete post by ID
function deletePost(postId) {
    const stmt = db.prepare('DELETE FROM posts WHERE id = ?');
    const result = stmt.run(postId);
    return result.changes > 0;
}

// Initialize database on load
initDatabase();

module.exports = {
    db,
    startAutomationRun,
    completeAutomationRun,
    savePost,
    getRecentRuns,
    getPostsForRun,
    getAllPosts,
    getStats,
    getPlatformStats,
    cleanupOldPosts,
    deletePost
};
