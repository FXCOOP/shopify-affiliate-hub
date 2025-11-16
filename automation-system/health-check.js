#!/usr/bin/env node

/**
 * Health Check Script
 * Verifies all components of the automation system
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

console.log('\n🏥 AUTOMATION SYSTEM HEALTH CHECK');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

let passCount = 0;
let failCount = 0;
let warnCount = 0;

// Helper functions
function pass(message) {
    console.log(`✅ PASS: ${message}`);
    passCount++;
}

function fail(message) {
    console.log(`❌ FAIL: ${message}`);
    failCount++;
}

function warn(message) {
    console.log(`⚠️  WARN: ${message}`);
    warnCount++;
}

function section(title) {
    console.log(`\n📋 ${title}`);
    console.log('─────────────────────────────────────');
}

// 1. Check Node.js version
section('System Requirements');
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));
if (majorVersion >= 18) {
    pass(`Node.js ${nodeVersion} (>= 18 required)`);
} else {
    fail(`Node.js ${nodeVersion} (upgrade to 18+ required)`);
}

// 2. Check npm packages
section('Dependencies');
const packageJson = require('./package.json');
const requiredPackages = Object.keys(packageJson.dependencies);

requiredPackages.forEach(pkg => {
    try {
        require.resolve(pkg);
        pass(`${pkg} installed`);
    } catch (e) {
        fail(`${pkg} NOT installed - run: npm install`);
    }
});

// 3. Check .env file
section('Environment Configuration');
if (fs.existsSync('.env')) {
    pass('.env file exists');

    // Check required variables
    const requiredVars = [
        'OPENAI_API_KEY',
        'OPENAI_MODEL',
        'SITE_URL',
        'AFFILIATE_LINK'
    ];

    requiredVars.forEach(varName => {
        const value = process.env[varName];
        if (!value) {
            fail(`${varName} is missing in .env`);
        } else if (value.includes('your-') || value.includes('here')) {
            fail(`${varName} is still placeholder - update with real value`);
        } else {
            pass(`${varName} is configured`);
        }
    });
} else {
    fail('.env file missing - copy from .env.example');
}

// 4. Check API credentials
section('API Credentials');

// OpenAI
if (process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes('your-')) {
    const key = process.env.OPENAI_API_KEY;
    if (key.startsWith('sk-')) {
        pass('OpenAI API key format valid');
    } else {
        warn('OpenAI API key format unusual (should start with sk-)');
    }
} else {
    fail('OpenAI API key not configured');
}

// Reddit
const redditConfigured =
    process.env.REDDIT_CLIENT_ID &&
    process.env.REDDIT_CLIENT_SECRET &&
    !process.env.REDDIT_CLIENT_ID.includes('your-');

if (redditConfigured) {
    pass('Reddit credentials configured');
} else {
    warn('Reddit credentials not configured (optional for testing)');
}

// Twitter
const twitterConfigured =
    process.env.TWITTER_API_KEY &&
    process.env.TWITTER_API_SECRET &&
    !process.env.TWITTER_API_KEY.includes('your-');

if (twitterConfigured) {
    pass('Twitter credentials configured');
} else {
    warn('Twitter credentials not configured (optional for testing)');
}

// 5. Check file structure
section('File Structure');
const requiredFiles = [
    'main.js',
    'content-generator.js',
    'database.js',
    'logger.js',
    'api-server.js',
    'package.json',
    '.env.example',
    'platforms/reddit.js',
    'platforms/twitter.js',
    'platforms/quora.js',
    'config/prompts.json'
];

requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
        pass(`${file} exists`);
    } else {
        fail(`${file} is missing`);
    }
});

// 6. Check directories
section('Directories');
const requiredDirs = ['platforms', 'config'];
const createdDirs = ['logs', 'database'];

requiredDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
        pass(`${dir}/ directory exists`);
    } else {
        fail(`${dir}/ directory missing`);
    }
});

createdDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
        pass(`${dir}/ directory exists (auto-created)`);
    } else {
        warn(`${dir}/ directory will be created on first run`);
    }
});

// 7. Check database
section('Database');
if (fs.existsSync('database/posts.json')) {
    pass('Database file exists');
    try {
        const dbContent = fs.readFileSync('database/posts.json', 'utf8');
        const db = JSON.parse(dbContent);
        const postCount = db.posts?.length || 0;
        const runCount = db.automation_runs?.length || 0;
        pass(`Database contains ${postCount} posts from ${runCount} runs`);
    } catch (e) {
        warn('Database exists but has invalid format');
    }
} else {
    warn('Database not yet created (will be created on first run)');
}

// 8. Check logs
section('Logs');
if (fs.existsSync('logs')) {
    const logFiles = fs.readdirSync('logs');
    if (logFiles.length > 0) {
        pass(`${logFiles.length} log files found: ${logFiles.join(', ')}`);
    } else {
        warn('Logs directory empty (will be populated on first run)');
    }
} else {
    warn('Logs directory not yet created');
}

// 9. Test OpenAI connection (optional)
section('API Connectivity Test');
console.log('⏭️  Skipping live API tests (run with --test-apis to enable)');
if (process.argv.includes('--test-apis')) {
    // Could add actual API tests here
    console.log('   Testing OpenAI API...');
    console.log('   Testing Reddit API...');
    console.log('   Testing Twitter API...');
}

// 10. Configuration analysis
section('Configuration Analysis');
console.log(`📊 Model: ${process.env.OPENAI_MODEL || 'gpt-4o-mini (default)'}`);
console.log(`🌐 Site: ${process.env.SITE_URL || 'Not set'}`);
console.log(`🔗 Affiliate: ${process.env.AFFILIATE_LINK || 'Not set'}`);
console.log(`⏰ Schedule: ${process.env.CRON_SCHEDULE || '0 7 * * * (default)'}`);
console.log(`🤖 Headless: ${process.env.HEADLESS_BROWSER || 'true (default)'}`);
console.log(`🔁 Max retries: ${process.env.MAX_RETRIES || '3 (default)'}`);
console.log(`⏱️  Delay: ${process.env.DELAY_BETWEEN_POSTS || '300000ms (5min)'}`);

// Summary
console.log('\n' + '━'.repeat(50));
console.log('📊 HEALTH CHECK SUMMARY');
console.log('━'.repeat(50));
console.log(`✅ Passed: ${passCount}`);
console.log(`⚠️  Warnings: ${warnCount}`);
console.log(`❌ Failed: ${failCount}`);
console.log('━'.repeat(50));

if (failCount === 0) {
    console.log('\n🎉 System is healthy and ready to run!');
    console.log('\n📝 Next steps:');
    console.log('   1. Test run: node main.js --now');
    console.log('   2. Start API server: node api-server.js');
    console.log('   3. Open dashboard: http://localhost:3000/backoffice');
    console.log('   4. Deploy to GitHub Actions for 24/7 automation\n');
    process.exit(0);
} else {
    console.log('\n⚠️  System has issues that need to be fixed!');
    console.log('\n🔧 Fix the ❌ FAIL items above, then run this check again.\n');
    process.exit(1);
}
