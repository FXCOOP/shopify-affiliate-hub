const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const logger = require('../logger');

puppeteer.use(StealthPlugin());

// Browser automation for LinkedIn
async function postToLinkedIn(content) {
    const email = process.env.LINKEDIN_EMAIL;
    const password = process.env.LINKEDIN_PASSWORD;

    if (!email || !password) {
        logger.error('LinkedIn email/password not configured');
        return { success: false, error: 'Credentials not configured' };
    }

    let browser;
    try {
        logger.pending('Launching browser for LinkedIn...');

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

        // Login to LinkedIn
        logger.pending('Logging into LinkedIn...');
        await page.goto('https://www.linkedin.com/login', { waitUntil: 'networkidle2' });

        await page.waitForTimeout(2000);

        // Enter email
        const emailInput = await page.$('input#username, input[name="session_key"]');
        if (emailInput) {
            await emailInput.type(email);
        }

        // Enter password
        const passwordInput = await page.$('input#password, input[name="session_password"]');
        if (passwordInput) {
            await passwordInput.type(password);
        }

        // Click sign in
        const signInButton = await page.$('button[type="submit"], button:has-text("Sign in")');
        if (signInButton) {
            await signInButton.click();
            await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});
        }

        logger.success('Logged into LinkedIn');

        // Navigate to feed
        await page.goto('https://www.linkedin.com/feed/', { waitUntil: 'networkidle2' });
        await page.waitForTimeout(3000);

        // Click "Start a post" button
        logger.pending('Creating LinkedIn post...');
        const startPostButton = await page.$('button:has-text("Start a post"), button[aria-label*="Start a post"]');
        if (startPostButton) {
            await startPostButton.click();
            await page.waitForTimeout(2000);
        }

        // Find post text area
        const textArea = await page.$('div[contenteditable="true"], div[role="textbox"]');
        if (textArea) {
            await textArea.click();
            await page.waitForTimeout(500);
            await textArea.type(content);
            await page.waitForTimeout(1000);
        }

        // Click Post button
        const postButton = await page.$('button:has-text("Post"), button[aria-label*="Post"]');
        if (postButton) {
            await postButton.click();
            await page.waitForTimeout(3000);
        }

        const currentUrl = page.url();

        logger.success(`Posted to LinkedIn: ${currentUrl}`);

        await browser.close();

        return {
            success: true,
            url: currentUrl,
            platform: 'linkedin'
        };

    } catch (error) {
        logger.error(`LinkedIn browser automation error: ${error.message}`);
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
        logger.info('📝 Starting LinkedIn browser automation...');

        const result = await postToLinkedIn(content);

        logger.info(`✅ LinkedIn automation complete!`);

        return result;

    } catch (error) {
        logger.error(`LinkedIn error: ${error.message}`);
        return {
            success: false,
            error: error.message
        };
    }
}

module.exports = { post };
