const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');
const fs = require('fs');
const logger = require('./logger');

// Create database directory
const dbDir = path.join(__dirname, 'database');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'posts.json');

// Initialize database with FileSync adapter
const adapter = new FileSync(dbPath);
const db = low(adapter);

// Set defaults
db.defaults({
    automation_runs: [],
    posts: [],
    analytics: []
}).write();

logger.info('✅ Database initialized');

// Start new automation run
function startAutomationRun() {
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

    db.get('automation_runs')
        .push(run)
        .write();

    logger.info(`Started automation run #${run.id}`);
    return run.id;
}

// Complete automation run
function completeAutomationRun(runId, stats) {
    const run = db.get('automation_runs')
        .find({ id: runId })
        .value();

    if (run) {
        db.get('automation_runs')
            .find({ id: runId })
            .assign({
                completed_at: new Date().toISOString(),
                status: stats.status || 'completed',
                platforms_attempted: stats.attempted || 0,
                platforms_succeeded: stats.succeeded || 0,
                platforms_failed: stats.failed || 0,
                total_posts: stats.totalPosts || 0,
                errors: stats.errors ? JSON.stringify(stats.errors) : null
            })
            .write();

        logger.success(`Completed automation run #${runId}`);
    }
}

// Save post record
function savePost(runId, platform, postType, content, result) {
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

    db.get('posts')
        .push(post)
        .write();

    if (result.success) {
        logger.success(`Saved ${platform} ${postType} to database`);
    } else {
        logger.error(`Saved failed ${platform} ${postType}: ${result.error}`);
    }
}

// Get recent automation runs
function getRecentRuns(limit = 10) {
    return db.get('automation_runs')
        .orderBy(['created_at'], ['desc'])
        .take(limit)
        .value();
}

// Get posts for a run
function getPostsForRun(runId) {
    return db.get('posts')
        .filter({ run_id: runId })
        .orderBy(['created_at'], ['desc'])
        .value();
}

// Get all posts (paginated)
function getAllPosts(limit = 50, offset = 0) {
    return db.get('posts')
        .orderBy(['created_at'], ['desc'])
        .slice(offset, offset + limit)
        .value();
}

// Get statistics
function getStats() {
    const posts = db.get('posts').value();
    const totalPosts = posts.length;
    const successfulPosts = posts.filter(p => p.status === 'success').length;
    const runs = db.get('automation_runs').value();
    const totalRuns = runs.length;
    const lastRun = runs.length > 0
        ? runs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
        : null;

    return {
        totalPosts: totalPosts,
        successfulPosts: successfulPosts,
        totalRuns: totalRuns,
        successRate: totalPosts > 0 ? ((successfulPosts / totalPosts) * 100).toFixed(1) : 0,
        lastRun: lastRun
    };
}

// Get platform statistics
function getPlatformStats() {
    const posts = db.get('posts').value();
    const platforms = {};

    posts.forEach(post => {
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
function cleanupOldPosts() {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const posts = db.get('posts').value();
    const initialCount = posts.length;

    db.set('posts', posts.filter(post =>
        new Date(post.created_at) >= ninetyDaysAgo
    )).write();

    const deletedCount = initialCount - db.get('posts').value().length;

    if (deletedCount > 0) {
        logger.info(`Cleaned up ${deletedCount} old posts`);
    }

    return deletedCount;
}

// Delete post by ID
function deletePost(postId) {
    const initialLength = db.get('posts').value().length;

    db.get('posts')
        .remove(p => p.id == postId)
        .write();

    const newLength = db.get('posts').value().length;

    return newLength < initialLength;
}

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
