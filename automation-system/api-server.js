require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const database = require('./database');
const logger = require('./logger');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
    contentSecurityPolicy: false, // Disable for development
}));
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

// Logging middleware
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`);
    next();
});

// ============================================
// API Routes
// ============================================

// GET /api/stats - Get dashboard statistics
app.get('/api/stats', (req, res) => {
    try {
        const stats = database.getStats();
        const platformStats = database.getPlatformStats();

        // Calculate additional metrics
        const totalVisitors = stats.totalPosts * 28; // Estimate: 28 visitors per post
        const estimatedRevenue = (totalVisitors * 0.02 * 150).toFixed(0); // 2% conversion at $150

        res.json({
            success: true,
            data: {
                totalPosts: stats.totalPosts,
                successfulPosts: stats.successfulPosts,
                successRate: stats.successRate,
                totalRuns: stats.totalRuns,
                totalVisitors: totalVisitors,
                estimatedRevenue: estimatedRevenue,
                lastRun: stats.lastRun,
                platformStats: platformStats
            }
        });
    } catch (error) {
        logger.error(`Stats error: ${error.message}`);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/runs - Get recent automation runs
app.get('/api/runs', (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const runs = database.getRecentRuns(limit);

        res.json({
            success: true,
            data: runs
        });
    } catch (error) {
        logger.error(`Runs error: ${error.message}`);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/posts - Get all posts (paginated)
app.get('/api/posts', (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const offset = parseInt(req.query.offset) || 0;

        const posts = database.getAllPosts(limit, offset);

        res.json({
            success: true,
            data: posts,
            pagination: {
                limit: limit,
                offset: offset,
                total: posts.length
            }
        });
    } catch (error) {
        logger.error(`Posts error: ${error.message}`);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/posts/:runId - Get posts for specific run
app.get('/api/runs/:runId/posts', (req, res) => {
    try {
        const runId = parseInt(req.params.runId);
        const posts = database.getPostsForRun(runId);

        res.json({
            success: true,
            data: posts
        });
    } catch (error) {
        logger.error(`Run posts error: ${error.message}`);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// DELETE /api/posts/:id - Delete a post
app.delete('/api/posts/:id', (req, res) => {
    try {
        const postId = parseInt(req.params.id);
        const deleted = database.deletePost(postId);

        if (deleted) {
            logger.success(`Deleted post #${postId}`);
            res.json({
                success: true,
                message: 'Post deleted successfully'
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'Post not found'
            });
        }
    } catch (error) {
        logger.error(`Delete post error: ${error.message}`);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/logs - Get recent logs
app.get('/api/logs', (req, res) => {
    try {
        const logType = req.query.type || 'activity';
        const limit = parseInt(req.query.limit) || 100;

        const logFile = path.join(__dirname, 'logs', `${logType}.log`);

        if (!fs.existsSync(logFile)) {
            return res.json({
                success: true,
                data: []
            });
        }

        const logs = fs.readFileSync(logFile, 'utf8')
            .split('\n')
            .filter(line => line.trim())
            .slice(-limit)
            .reverse();

        res.json({
            success: true,
            data: logs
        });
    } catch (error) {
        logger.error(`Logs error: ${error.message}`);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/logs/download - Download log file
app.get('/api/logs/download', (req, res) => {
    try {
        const logType = req.query.type || 'activity';
        const logFile = path.join(__dirname, 'logs', `${logType}.log`);

        if (!fs.existsSync(logFile)) {
            return res.status(404).json({
                success: false,
                error: 'Log file not found'
            });
        }

        res.download(logFile, `${logType}-${new Date().toISOString().split('T')[0]}.log`);
    } catch (error) {
        logger.error(`Log download error: ${error.message}`);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// POST /api/logs/clear - Clear log file
app.post('/api/logs/clear', (req, res) => {
    try {
        const logType = req.body.type || 'activity';
        const logFile = path.join(__dirname, 'logs', `${logType}.log`);

        if (fs.existsSync(logFile)) {
            fs.writeFileSync(logFile, '');
            logger.success(`Cleared ${logType}.log`);
        }

        res.json({
            success: true,
            message: `${logType} log cleared`
        });
    } catch (error) {
        logger.error(`Log clear error: ${error.message}`);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/config - Get current configuration
app.get('/api/config', (req, res) => {
    try {
        const config = {
            openai: {
                model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
                hasKey: !!process.env.OPENAI_API_KEY
            },
            site: {
                url: process.env.SITE_URL || 'https://shopify-success-hub.onrender.com',
                affiliateLink: process.env.AFFILIATE_LINK || 'https://shopify.pxf.io/Qj5oDz'
            },
            schedule: {
                cron: process.env.CRON_SCHEDULE || '0 7 * * *',
            },
            platforms: {
                reddit: !!process.env.REDDIT_CLIENT_ID,
                twitter: !!process.env.TWITTER_API_KEY,
                quora: !!process.env.QUORA_EMAIL,
                medium: !!process.env.MEDIUM_EMAIL,
                linkedin: !!process.env.LINKEDIN_EMAIL,
                pinterest: !!process.env.PINTEREST_ACCESS_TOKEN
            },
            options: {
                headlessBrowser: process.env.HEADLESS_BROWSER === 'true',
                maxRetries: parseInt(process.env.MAX_RETRIES) || 3,
                delayBetweenPosts: parseInt(process.env.DELAY_BETWEEN_POSTS) || 300000
            }
        };

        res.json({
            success: true,
            data: config
        });
    } catch (error) {
        logger.error(`Config error: ${error.message}`);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// POST /api/platforms/toggle - Enable/disable platform
app.post('/api/platforms/toggle', (req, res) => {
    try {
        const { platform, enabled } = req.body;

        logger.info(`Platform ${platform} ${enabled ? 'enabled' : 'disabled'}`);

        // In a real implementation, this would update a platforms config file
        // For now, we'll just log it

        res.json({
            success: true,
            message: `Platform ${platform} ${enabled ? 'enabled' : 'disabled'}`
        });
    } catch (error) {
        logger.error(`Platform toggle error: ${error.message}`);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// POST /api/run-now - Trigger automation manually
app.post('/api/run-now', (req, res) => {
    try {
        logger.info('🚀 Manual automation run triggered from dashboard');

        // Spawn child process to run automation
        const { spawn } = require('child_process');
        const child = spawn('node', ['main.js', '--now'], {
            cwd: __dirname,
            detached: true,
            stdio: 'ignore'
        });

        child.unref();

        res.json({
            success: true,
            message: 'Automation started! Check logs for progress.'
        });
    } catch (error) {
        logger.error(`Run now error: ${error.message}`);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/health - Health check
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// ============================================
// Serve backoffice dashboard
// ============================================

app.get('/backoffice', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'backoffice.html'));
});

// ============================================
// Error handling
// ============================================

app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Not found'
    });
});

app.use((err, req, res, next) => {
    logger.error(`Server error: ${err.message}`);
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});

// ============================================
// Start server
// ============================================

app.listen(PORT, () => {
    logger.success(`✅ API Server running on port ${PORT}`);
    logger.info(`📊 Dashboard: http://localhost:${PORT}/backoffice`);
    logger.info(`🔗 API: http://localhost:${PORT}/api`);
    logger.info('');
    logger.info('Press Ctrl+C to stop');
});
