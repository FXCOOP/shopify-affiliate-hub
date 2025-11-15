const snoowrap = require('snoowrap');
const logger = require('../logger');

// Initialize Reddit client
let reddit = null;

function initReddit() {
    if (reddit) return reddit;

    try {
        reddit = new snoowrap({
            userAgent: process.env.REDDIT_USER_AGENT || 'ShopifyAutomation/1.0',
            clientId: process.env.REDDIT_CLIENT_ID,
            clientSecret: process.env.REDDIT_CLIENT_SECRET,
            username: process.env.REDDIT_USERNAME,
            password: process.env.REDDIT_PASSWORD
        });

        logger.success('Reddit client initialized');
        return reddit;
    } catch (error) {
        logger.error(`Failed to initialize Reddit: ${error.message}`);
        throw error;
    }
}

// Post to subreddit
async function postToSubreddit(subreddit, title, content) {
    try {
        const r = initReddit();

        logger.pending(`Posting to r/${subreddit}...`);

        const submission = await r.submitSelfpost({
            subredditName: subreddit,
            title: title,
            text: content
        });

        const url = `https://reddit.com${submission.permalink}`;

        logger.success(`Posted to r/${subreddit}: ${url}`);

        return {
            success: true,
            url: url,
            id: submission.id,
            permalink: submission.permalink
        };
    } catch (error) {
        logger.error(`Reddit post error: ${error.message}`);
        return {
            success: false,
            error: error.message
        };
    }
}

// Post comment
async function postComment(submissionId, content) {
    try {
        const r = initReddit();

        logger.pending(`Posting Reddit comment...`);

        const submission = await r.getSubmission(submissionId);
        const comment = await submission.reply(content);

        const url = `https://reddit.com${comment.permalink}`;

        logger.success(`Posted comment: ${url}`);

        return {
            success: true,
            url: url,
            id: comment.id
        };
    } catch (error) {
        logger.error(`Reddit comment error: ${error.message}`);
        return {
            success: false,
            error: error.message
        };
    }
}

// Find relevant posts to comment on
async function findPostsToCommentOn(subreddit, limit = 5) {
    try {
        const r = initReddit();

        logger.pending(`Finding posts in r/${subreddit}...`);

        const posts = await r.getSubreddit(subreddit).getNew({ limit: limit });

        const relevant = [];

        for (const post of posts) {
            // Filter for questions (posts with question mark or asking for help)
            const isQuestion = post.title.includes('?') ||
                             post.title.toLowerCase().includes('help') ||
                             post.title.toLowerCase().includes('how to') ||
                             post.title.toLowerCase().includes('beginner');

            if (isQuestion && !post.is_self === false) {
                relevant.push({
                    id: post.id,
                    title: post.title,
                    url: post.url,
                    permalink: post.permalink
                });
            }
        }

        logger.info(`Found ${relevant.length} relevant posts`);

        return relevant;
    } catch (error) {
        logger.error(`Error finding posts: ${error.message}`);
        return [];
    }
}

// Main posting function
async function post(content) {
    try {
        logger.info('📝 Starting Reddit automation...');

        const results = {
            post: null,
            comments: []
        };

        // 1. Post value post to r/shopify
        const postTitle = generateTitle(content.post);
        results.post = await postToSubreddit('shopify', postTitle, content.post);

        // Wait 5 minutes between actions
        await delay(5);

        // 2. Find and comment on 3-5 relevant posts
        const targetSubreddits = ['shopify', 'ecommerce', 'Entrepreneur'];

        for (const subreddit of targetSubreddits) {
            const posts = await findPostsToCommentOn(subreddit, 2);

            for (const post of posts.slice(0, 2)) {
                const commentResult = await postComment(post.id, content.comment);
                results.comments.push(commentResult);

                // Wait 3 minutes between comments
                await delay(3);
            }
        }

        logger.success(`✅ Reddit automation complete! Posted 1 post + ${results.comments.length} comments`);

        return results;
    } catch (error) {
        logger.error(`Reddit automation error: ${error.message}`);
        return {
            success: false,
            error: error.message
        };
    }
}

// Helper: Generate engaging title from content
function generateTitle(content) {
    // Extract first line or generate from content
    const lines = content.split('\n').filter(l => l.trim());
    let title = lines[0];

    // Clean up title
    title = title.replace(/^#+\s+/, ''); // Remove markdown headers
    title = title.trim();

    // Truncate if too long
    if (title.length > 300) {
        title = title.substring(0, 297) + '...';
    }

    // If title is empty or too short, use default
    if (!title || title.length < 10) {
        title = 'Starting with Shopify? Here are 5 tips that helped me succeed';
    }

    return title;
}

// Helper: Delay function
function delay(minutes) {
    const ms = minutes * 60 * 1000;
    logger.info(`⏳ Waiting ${minutes} minutes...`);
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
    post,
    postToSubreddit,
    postComment,
    findPostsToCommentOn
};
