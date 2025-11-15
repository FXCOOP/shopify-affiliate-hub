const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Custom format for console output (colorful)
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message }) => {
        return `[${timestamp}] ${level}: ${message}`;
    })
);

// Custom format for file output (detailed)
const fileFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message }) => {
        return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    })
);

// Create logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    transports: [
        // Console output (colorful, readable)
        new winston.transports.Console({
            format: consoleFormat
        }),

        // Activity log (all info and above)
        new winston.transports.File({
            filename: path.join(logsDir, 'activity.log'),
            format: fileFormat,
            level: 'info'
        }),

        // Error log (errors only)
        new winston.transports.File({
            filename: path.join(logsDir, 'errors.log'),
            format: fileFormat,
            level: 'error'
        }),

        // Debug log (everything)
        new winston.transports.File({
            filename: path.join(logsDir, 'debug.log'),
            format: fileFormat,
            level: 'debug'
        })
    ]
});

// Add helpful methods
logger.success = (message) => logger.info(`✅ ${message}`);
logger.pending = (message) => logger.info(`⏳ ${message}`);
logger.skip = (message) => logger.info(`⏭️  ${message}`);

module.exports = logger;
