#!/usr/bin/env node

require('dotenv').config();
const cron = require('node-cron');
const logger = require('./logger');
const database = require('./database');
const contentGenerator = require('./content-generator');

// Platform modules
const reddit = require('./platforms/reddit-browser');
const twitter = require('./platforms/twitter');
const quora = require('./platforms/quora');
const medium = require('./platforms/medium-browser');
const linkedin = require('./platforms/linkedin-browser');

// Configuration
const CRON_SCHEDULE = process.env.CRON_SCHEDULE || '0 7 * * *'; // 7 AM daily
const RUN_NOW = process.argv.includes('--now');

// Helper: Delay between posts
function delay(minutes) {
    const ms = minutes * 60 * 1000;
    logger.info(`⏳ Waiting ${minutes} minutes before next platform...`);
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Main automation function
async function runAutomation() {
    const startTime = Date.now();

    logger.info('🚀 ========================================');
    logger.info('🚀 Starting Daily Automation Run');
    logger.info('🚀 ========================================');

    // Start database tracking
    const runId = database.startAutomationRun();

    const stats = {
        attempted: 0,
        succeeded: 0,
        failed: 0,
        totalPosts: 0,
        errors: []
    };

    try {
        // Step 1: Generate all content with ChatGPT
        logger.info('');
        logger.info('📝 Step 1: Generating Content');
        logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        const content = await contentGenerator.generateDailyContent();

        logger.success('✅ All content generated successfully!');
        logger.info('');

        // Step 2: Post to all platforms
        logger.info('📤 Step 2: Posting to Platforms');
        logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        // === REDDIT ===
        try {
            stats.attempted++;
            logger.info('');
            logger.info('1️⃣  Reddit');
            logger.info('─────────────────────────────────');

            const redditResult = await reddit.post(content.reddit);

            if (redditResult.success || (redditResult.post && redditResult.post.success)) {
                stats.succeeded++;
                stats.totalPosts += 1 + (redditResult.comments?.length || 0);

                database.savePost(runId, 'reddit', 'post', content.reddit.post, redditResult.post || redditResult);

                if (redditResult.comments) {
                    redditResult.comments.forEach(comment => {
                        database.savePost(runId, 'reddit', 'comment', content.reddit.comment, comment);
                    });
                }
            } else {
                stats.failed++;
                stats.errors.push(`Reddit: ${redditResult.error}`);
            }

            await delay(parseFloat(process.env.DELAY_BETWEEN_POSTS) / 60000 || 5);

        } catch (error) {
            logger.error(`Reddit error: ${error.message}`);
            stats.failed++;
            stats.errors.push(`Reddit: ${error.message}`);
        }

        // === TWITTER ===
        try {
            stats.attempted++;
            logger.info('');
            logger.info('2️⃣  Twitter');
            logger.info('─────────────────────────────────');

            const twitterResult = await twitter.post(content.twitter);

            if (twitterResult.success) {
                stats.succeeded++;
                stats.totalPosts += twitterResult.tweets?.length || 1;

                database.savePost(runId, 'twitter', 'thread', content.twitter.fullThread, twitterResult);
            } else {
                stats.failed++;
                stats.errors.push(`Twitter: ${twitterResult.error}`);
            }

            await delay(parseFloat(process.env.DELAY_BETWEEN_POSTS) / 60000 || 5);

        } catch (error) {
            logger.error(`Twitter error: ${error.message}`);
            stats.failed++;
            stats.errors.push(`Twitter: ${error.message}`);
        }

        // === QUORA ===
        try {
            stats.attempted++;
            logger.info('');
            logger.info('3️⃣  Quora');
            logger.info('─────────────────────────────────');

            const quoraResult = await quora.post(content.quora);

            if (quoraResult.success) {
                stats.succeeded++;
                stats.totalPosts += 1;

                database.savePost(runId, 'quora', 'answer', content.quora, quoraResult);
            } else if (!quoraResult.skipped) {
                stats.failed++;
                stats.errors.push(`Quora: ${quoraResult.error}`);
            }

            await delay(parseFloat(process.env.DELAY_BETWEEN_POSTS) / 60000 || 5);

        } catch (error) {
            logger.error(`Quora error: ${error.message}`);
            stats.failed++;
            stats.errors.push(`Quora: ${error.message}`);
        }

        // === MEDIUM ===
        try {
            stats.attempted++;
            logger.info('');
            logger.info('4️⃣  Medium');
            logger.info('─────────────────────────────────');

            const mediumResult = await medium.post(content.medium);

            if (mediumResult.success) {
                stats.succeeded++;
                stats.totalPosts += 1;

                database.savePost(runId, 'medium', 'article', content.medium, mediumResult);
            } else {
                stats.failed++;
                stats.errors.push(`Medium: ${mediumResult.error}`);
            }

            await delay(parseFloat(process.env.DELAY_BETWEEN_POSTS) / 60000 || 5);

        } catch (error) {
            logger.error(`Medium error: ${error.message}`);
            stats.failed++;
            stats.errors.push(`Medium: ${error.message}`);
        }

        // === LINKEDIN ===
        try {
            stats.attempted++;
            logger.info('');
            logger.info('5️⃣  LinkedIn');
            logger.info('─────────────────────────────────');

            const linkedinResult = await linkedin.post(content.linkedin);

            if (linkedinResult.success) {
                stats.succeeded++;
                stats.totalPosts += 1;

                database.savePost(runId, 'linkedin', 'post', content.linkedin, linkedinResult);
            } else {
                stats.failed++;
                stats.errors.push(`LinkedIn: ${linkedinResult.error}`);
            }

            await delay(parseFloat(process.env.DELAY_BETWEEN_POSTS) / 60000 || 5);

        } catch (error) {
            logger.error(`LinkedIn error: ${error.message}`);
            stats.failed++;
            stats.errors.push(`LinkedIn: ${error.message}`);
        }

        // Step 3: Summary
        const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(2);

        logger.info('');
        logger.info('📊 Automation Summary');
        logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        logger.info(`⏱️  Duration: ${duration} minutes`);
        logger.info(`📊 Platforms attempted: ${stats.attempted}`);
        logger.info(`✅ Platforms succeeded: ${stats.succeeded}`);
        logger.info(`❌ Platforms failed: ${stats.failed}`);
        logger.info(`📝 Total posts created: ${stats.totalPosts}`);

        if (stats.errors.length > 0) {
            logger.info(`⚠️  Errors encountered: ${stats.errors.length}`);
            stats.errors.forEach(error => {
                logger.error(`   - ${error}`);
            });
        }

        // Save to database
        database.completeAutomationRun(runId, {
            status: stats.failed === 0 ? 'success' : 'partial',
            attempted: stats.attempted,
            succeeded: stats.succeeded,
            failed: stats.failed,
            totalPosts: stats.totalPosts,
            errors: stats.errors
        });

        logger.info('');
        logger.success('🎉 Automation run completed!');
        logger.info('🚀 ========================================');

    } catch (error) {
        logger.error(`Fatal error in automation: ${error.message}`);
        logger.error(error.stack);

        database.completeAutomationRun(runId, {
            status: 'failed',
            attempted: stats.attempted,
            succeeded: stats.succeeded,
            failed: stats.attempted - stats.succeeded,
            totalPosts: stats.totalPosts,
            errors: [...stats.errors, `Fatal: ${error.message}`]
        });
    }
}

// Schedule or run immediately
if (RUN_NOW) {
    // Run immediately for testing
    logger.info('🧪 Running automation NOW (test mode)');
    logger.info('');

    runAutomation()
        .then(() => {
            logger.info('');
            logger.success('Test run complete! Check logs for details.');
            process.exit(0);
        })
        .catch(error => {
            logger.error(`Test run failed: ${error.message}`);
            process.exit(1);
        });
} else {
    // Schedule for daily automation
    logger.info('⏰ Automation System Started');
    logger.info(`📅 Schedule: ${CRON_SCHEDULE}`);
    logger.info(`🕐 Next run: ${getNextRunTime(CRON_SCHEDULE)}`);
    logger.info('');
    logger.info('Press Ctrl+C to stop');
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Schedule the cron job
    cron.schedule(CRON_SCHEDULE, () => {
        logger.info('');
        logger.info('⏰ Scheduled run triggered');
        runAutomation();
    }, {
        timezone: "UTC"
    });

    // Keep process alive
    process.on('SIGINT', () => {
        logger.info('');
        logger.info('👋 Shutting down automation system...');
        process.exit(0);
    });
}

// Helper: Get next run time from cron schedule
function getNextRunTime(schedule) {
    // Simple parser for common cron patterns
    const parts = schedule.split(' ');
    const minute = parts[0];
    const hour = parts[1];

    if (minute !== '*' && hour !== '*') {
        return `${hour.padStart(2, '0')}:${minute.padStart(2, '0')} UTC daily`;
    }

    return 'Based on cron schedule: ' + schedule;
}
