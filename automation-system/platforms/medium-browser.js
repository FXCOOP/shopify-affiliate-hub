const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const logger = require('../logger');

puppeteer.use(StealthPlugin());

// Browser automation for Medium
async function postToMedium(content) {
    const email = process.env.MEDIUM_EMAIL;
    const password = process.env.MEDIUM_PASSWORD;

    if (!email || !password) {
        logger.error('Medium email/password not configured');
        return { success: false, error: 'Credentials not configured' };
    }

    let browser;
    try {
        logger.pending('Launching browser for Medium...');

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

        // Login to Medium
        logger.pending('Logging into Medium...');
        await page.goto('https://medium.com/m/signin', { waitUntil: 'networkidle2' });

        await page.waitForTimeout(2000);

        // Click "Sign in with email"
        const signInButton = await page.$('button:has-text("Sign in with email"), a[href*="signin"]');
        if (signInButton) {
            await signInButton.click();
            await page.waitForTimeout(2000);
        }

        // Enter email
        const emailInput = await page.$('input[type="email"], input[name="email"]');
        if (emailInput) {
            await emailInput.type(email);

            const continueButton = await page.$('button:has-text("Continue"), button[type="submit"]');
            if (continueButton) {
                await continueButton.click();
                await page.waitForTimeout(2000);
            }
        }

        // Enter password
        const passwordInput = await page.$('input[type="password"], input[name="password"]');
        if (passwordInput) {
            await passwordInput.type(password);

            const submitButton = await page.$('button[type="submit"], button:has-text("Sign in")');
            if (submitButton) {
                await submitButton.click();
                await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});
            }
        }

        logger.success('Logged into Medium');

        // Navigate to new story
        logger.pending('Creating Medium article...');
        await page.goto('https://medium.com/new-story', { waitUntil: 'networkidle2' });

        await page.waitForTimeout(3000);

        // Find title input
        const titleInput = await page.$('h1[data-placeholder], h3[data-placeholder], textarea[placeholder*="Title"]');
        if (titleInput) {
            await titleInput.click();
            await titleInput.type(content.title);
            await page.waitForTimeout(500);

            // Press Tab to move to body
            await page.keyboard.press('Tab');
            await page.waitForTimeout(500);
        }

        // Type body content
        await page.keyboard.type(content.body);
        await page.waitForTimeout(2000);

        // Click Publish button
        const publishButton = await page.$('button:has-text("Publish"), button[data-action="publish"]');
        if (publishButton) {
            await publishButton.click();
            await page.waitForTimeout(2000);

            // Click final publish confirmation
            const confirmButton = await page.$('button:has-text("Publish now"), button[data-action="publish-confirm"]');
            if (confirmButton) {
                await confirmButton.click();
                await page.waitForTimeout(3000);
            }
        }

        const currentUrl = page.url();

        logger.success(`Published on Medium: ${currentUrl}`);

        await browser.close();

        return {
            success: true,
            url: currentUrl,
            platform: 'medium'
        };

    } catch (error) {
        logger.error(`Medium browser automation error: ${error.message}`);
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
        logger.info('📝 Starting Medium browser automation...');

        const result = await postToMedium({
            title: extractTitle(content),
            body: content
        });

        logger.info(`✅ Medium automation complete!`);

        return result;

    } catch (error) {
        logger.error(`Medium error: ${error.message}`);
        return {
            success: false,
            error: error.message
        };
    }
}

// Extract title from content
function extractTitle(content) {
    const lines = content.split('\n');
    const firstLine = lines[0].replace(/[#*]/g, '').trim();

    if (firstLine.length > 0 && firstLine.length <= 100) {
        return firstLine;
    }

    return content.substring(0, 97) + '...';
}

module.exports = { post };
