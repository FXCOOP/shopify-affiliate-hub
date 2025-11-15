const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');
const path = require('path');
const fs = require('fs');
const logger = require('./logger');

// Create database directory
const dbDir = path.join(__dirname, 'database');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'posts.json');

// Default database structure
const defaultData = {
    automation_runs: [],
    posts: [],
    analytics: []
};

// Initialize database
const adapter = new JSONFile(dbPath);
const db = new Low(adapter, defaultData);

// Initialize database schema
async function initDatabase() {
    logger.info('Initializing database...');

    await db.read();
    db.data ||= defaultData;
    await db.write();

    logger.success('Database initialized');
}

// Start new automation run
async function startAutomationRun() {
    await db.read();

    const run = {
        id: Date.now(),
        started_at: new Date().toISOString(),
        completed_at: null,
        status: 'running',
        platforms_attempted: 0,
        platforms_succeeded: 0,
        platforms_failed: 0,
        total_posts: 0,
        errors: null,
        created_at: new Date().toISOString()
    };

    db.data.automation_runs.push(run);
    await db.write();

    logger.info(`Started automation run #${run.id}`);
    return run.id;
}

// Complete automation run
async function completeAutomationRun(runId, stats) {
    await db.read();

    const run = db.data.automation_runs.find(r => r.id === runId);
    if (run) {
        run.completed_at = new Date().toISOString();
        run.status = stats.status || 'completed';
        run.platforms_attempted = stats.attempted || 0;
        run.platforms_succeeded = stats.succeeded || 0;
        run.platforms_failed = stats.failed || 0;
        run.total_posts = stats.totalPosts || 0;
        run.errors = stats.errors ? JSON.stringify(stats.errors) : null;

        await db.write();
        logger.success(`Completed automation run #${runId}`);
    }
}

// Save post record
async function savePost(runId, platform, postType, content, result) {
    await db.read();

    const post = {
        id: Date.now() + Math.random(), // Unique ID
        run_id: runId,
        platform: platform,
        post_type: postType,
        content: content,
        post_url: result.url || null,
        post_id: result.id || null,
        status: result.success ? 'success' : 'failed',
        error_message: result.error || null,
        created_at: new Date().toISOString()
    };

    db.data.posts.push(post);
    await db.write();

    if (result.success) {
        logger.success(`Saved ${platform} ${postType} to database`);
    } else {
        logger.error(`Saved failed ${platform} ${postType}: ${result.error}`);
    }
}

// Get recent automation runs
async function getRecentRuns(limit = 10) {
    await db.read();

    return db.data.automation_runs
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, limit);
}

// Get posts for a run
async function getPostsForRun(runId) {
    await db.read();

    return db.data.posts
        .filter(p => p.run_id === runId)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

// Get all posts (paginated)
async function getAllPosts(limit = 50, offset = 0) {
    await db.read();

    return db.data.posts
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(offset, offset + limit);
}

// Get statistics
async function getStats() {
    await db.read();

    const totalPosts = db.data.posts.length;
    const successfulPosts = db.data.posts.filter(p => p.status === 'success').length;
    const totalRuns = db.data.automation_runs.length;
    const recentRuns = db.data.automation_runs.sort((a, b) =>
        new Date(b.created_at) - new Date(a.created_at)
    )[0];

    return {
        totalPosts: totalPosts,
        successfulPosts: successfulPosts,
        totalRuns: totalRuns,
        successRate: totalPosts > 0 ? ((successfulPosts / totalPosts) * 100).toFixed(1) : 0,
        lastRun: recentRuns
    };
}

// Get platform statistics
async function getPlatformStats() {
    await db.read();

    const platforms = {};

    db.data.posts.forEach(post => {
        if (!platforms[post.platform]) {
            platforms[post.platform] = {
                platform: post.platform,
                total_posts: 0,
                successful_posts: 0,
                success_rate: 0
            };
        }

        platforms[post.platform].total_posts++;
        if (post.status === 'success') {
            platforms[post.platform].successful_posts++;
        }
    });

    // Calculate success rates
    Object.values(platforms).forEach(p => {
        p.success_rate = p.total_posts > 0
            ? (p.successful_posts / p.total_posts * 100).toFixed(1)
            : 0;
    });

    return Object.values(platforms).sort((a, b) => b.total_posts - a.total_posts);
}

// Delete old posts (older than 90 days)
async function cleanupOldPosts() {
    await db.read();

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const initialCount = db.data.posts.length;
    db.data.posts = db.data.posts.filter(post =>
        new Date(post.created_at) >= ninetyDaysAgo
    );

    const deletedCount = initialCount - db.data.posts.length;

    if (deletedCount > 0) {
        await db.write();
        logger.info(`Cleaned up ${deletedCount} old posts`);
    }

    return deletedCount;
}

// Delete post by ID
async function deletePost(postId) {
    await db.read();

    const initialLength = db.data.posts.length;
    db.data.posts = db.data.posts.filter(p => p.id != postId);

    if (db.data.posts.length < initialLength) {
        await db.write();
        return true;
    }

    return false;
}

// Initialize database on load
initDatabase().catch(err => {
    logger.error(`Failed to initialize database: ${err.message}`);
});

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
