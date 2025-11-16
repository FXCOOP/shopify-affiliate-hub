const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const logger = require('../logger');

puppeteer.use(StealthPlugin());

// Browser automation for Reddit
async function postToReddit(content) {
    const email = process.env.REDDIT_EMAIL;
    const password = process.env.REDDIT_PASSWORD;

    if (!email || !password) {
        logger.error('Reddit email/password not configured');
        return { success: false, error: 'Credentials not configured' };
    }

    let browser;
    try {
        logger.pending('Launching browser for Reddit...');

        browser = await puppeteer.launch({
            headless: process.env.HEADLESS_BROWSER === 'true',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-web-security'
            ]
        });

        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });

        // Login to Reddit
        logger.pending('Logging into Reddit...');
        await page.goto('https://www.reddit.com/login', { waitUntil: 'networkidle2' });

        // Wait for and fill username
        await page.waitForSelector('input[name="username"]', { timeout: 10000 });
        await page.type('input[name="username"]', email);
        await page.type('input[name="password"]', password);

        // Click login
        await page.click('button[type="submit"]');
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });

        logger.success('Logged into Reddit');

        // Navigate to submit page
        logger.pending('Creating post in r/shopify...');
        await page.goto('https://www.reddit.com/r/shopify/submit', { waitUntil: 'networkidle2' });

        await page.waitForTimeout(2000);

        // Click "Text" post type
        const textButton = await page.$('button[data-type="text"], button:has-text("Text")');
        if (textButton) {
            await textButton.click();
            await page.waitForTimeout(1000);
        }

        // Fill in title
        const titleInput = await page.$('textarea[placeholder*="Title"], input[placeholder*="Title"]');
        if (titleInput) {
            await titleInput.type(content.title);
        }

        // Fill in body
        const bodyInput = await page.$('div[contenteditable="true"], textarea[placeholder*="Text"]');
        if (bodyInput) {
            await bodyInput.type(content.body);
        }

        await page.waitForTimeout(1000);

        // Click Post button
        const postButton = await page.$('button:has-text("Post"), button[type="submit"]');
        if (postButton) {
            await postButton.click();
            await page.waitForTimeout(3000);
        }

        // Get the post URL
        const currentUrl = page.url();

        logger.success(`Posted to Reddit: ${currentUrl}`);

        await browser.close();

        return {
            success: true,
            url: currentUrl,
            platform: 'reddit'
        };

    } catch (error) {
        logger.error(`Reddit browser automation error: ${error.message}`);
        if (browser) await browser.close();
        return {
            success: false,
            error: error.message
        };
    }
}

// Post automation
async function post(content) {
    try {
        logger.info('📝 Starting Reddit browser automation...');

        const result = await postToReddit({
            title: extractTitle(content.post),
            body: content.post
        });

        logger.info(`✅ Reddit automation complete!`);

        return result;

    } catch (error) {
        logger.error(`Reddit error: ${error.message}`);
        return {
            success: false,
            error: error.message
        };
    }
}

// Extract title from content (first line or first 300 chars)
function extractTitle(content) {
    const lines = content.split('\n');
    const firstLine = lines[0].replace(/[#*]/g, '').trim();

    if (firstLine.length > 0 && firstLine.length <= 300) {
        return firstLine;
    }

    return content.substring(0, 297) + '...';
}

module.exports = { post };
