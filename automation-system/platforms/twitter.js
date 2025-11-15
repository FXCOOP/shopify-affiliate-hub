const { TwitterApi } = require('twitter-api-v2');
const logger = require('../logger');

// Initialize Twitter client
let client = null;

function initTwitter() {
    if (client) return client;

    try {
        client = new TwitterApi({
            appKey: process.env.TWITTER_API_KEY,
            appSecret: process.env.TWITTER_API_SECRET,
            accessToken: process.env.TWITTER_ACCESS_TOKEN,
            accessSecret: process.env.TWITTER_ACCESS_SECRET,
        });

        logger.success('Twitter client initialized');
        return client;
    } catch (error) {
        logger.error(`Failed to initialize Twitter: ${error.message}`);
        throw error;
    }
}

// Post a single tweet
async function postTweet(content) {
    try {
        const twitter = initTwitter();

        logger.pending('Posting tweet...');

        const tweet = await twitter.v2.tweet(content);

        logger.success(`Posted tweet: https://twitter.com/i/web/status/${tweet.data.id}`);

        return {
            success: true,
            id: tweet.data.id,
            url: `https://twitter.com/i/web/status/${tweet.data.id}`
        };
    } catch (error) {
        logger.error(`Twitter post error: ${error.message}`);
        return {
            success: false,
            error: error.message
        };
    }
}

// Post a thread (multiple tweets)
async function postThread(tweets) {
    try {
        const twitter = initTwitter();

        logger.pending(`Posting thread with ${tweets.length} tweets...`);

        const results = [];
        let previousTweetId = null;

        for (let i = 0; i < tweets.length; i++) {
            const tweetContent = tweets[i];

            logger.info(`Posting tweet ${i + 1}/${tweets.length}...`);

            const tweetOptions = {
                text: tweetContent
            };

            // Reply to previous tweet if this is a thread
            if (previousTweetId) {
                tweetOptions.reply = {
                    in_reply_to_tweet_id: previousTweetId
                };
            }

            const tweet = await twitter.v2.tweet(tweetOptions);

            results.push({
                success: true,
                id: tweet.data.id,
                url: `https://twitter.com/i/web/status/${tweet.data.id}`
            });

            previousTweetId = tweet.data.id;

            // Wait 2 seconds between tweets to avoid rate limits
            if (i < tweets.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        logger.success(`✅ Posted thread with ${tweets.length} tweets!`);
        logger.success(`Thread URL: ${results[0].url}`);

        return {
            success: true,
            tweets: results,
            threadUrl: results[0].url
        };
    } catch (error) {
        logger.error(`Twitter thread error: ${error.message}`);
        return {
            success: false,
            error: error.message
        };
    }
}

// Main posting function
async function post(content) {
    try {
        logger.info('🐦 Starting Twitter automation...');

        let result;

        if (content.tweets && content.tweets.length > 1) {
            // Post as thread
            result = await postThread(content.tweets);
        } else if (content.tweets && content.tweets.length === 1) {
            // Post single tweet
            result = await postTweet(content.tweets[0]);
        } else {
            // Fallback: treat fullThread as single tweet or parse it
            const tweets = parseThreadContent(content.fullThread || content);
            if (tweets.length > 1) {
                result = await postThread(tweets);
            } else {
                result = await postTweet(tweets[0]);
            }
        }

        logger.success('✅ Twitter automation complete!');

        return result;
    } catch (error) {
        logger.error(`Twitter automation error: ${error.message}`);
        return {
            success: false,
            error: error.message
        };
    }
}

// Helper: Parse thread content into individual tweets
function parseThreadContent(content) {
    if (typeof content !== 'string') {
        return [JSON.stringify(content).substring(0, 280)];
    }

    // Try to split by tweet numbers (1/15, 2/15, etc.)
    let tweets = content.split(/\n(?=\d+\/\d+)/).map(t => t.trim()).filter(t => t);

    // If no numbered tweets found, split by double newlines
    if (tweets.length === 1) {
        tweets = content.split('\n\n').map(t => t.trim()).filter(t => t);
    }

    // If still one long tweet, split by character limit (280)
    if (tweets.length === 1 && content.length > 280) {
        tweets = [];
        const sentences = content.split('. ');
        let currentTweet = '';

        for (const sentence of sentences) {
            if ((currentTweet + sentence).length > 270) {
                if (currentTweet) {
                    tweets.push(currentTweet.trim());
                    currentTweet = sentence;
                } else {
                    // Sentence itself is too long, truncate it
                    tweets.push(sentence.substring(0, 277) + '...');
                }
            } else {
                currentTweet += (currentTweet ? '. ' : '') + sentence;
            }
        }

        if (currentTweet) {
            tweets.push(currentTweet.trim());
        }
    }

    // Ensure each tweet is under 280 characters
    tweets = tweets.map(tweet => {
        if (tweet.length > 280) {
            return tweet.substring(0, 277) + '...';
        }
        return tweet;
    });

    return tweets.length > 0 ? tweets : [content.substring(0, 280)];
}

module.exports = {
    post,
    postTweet,
    postThread
};
