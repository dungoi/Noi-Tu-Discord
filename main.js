require('dotenv').config();

const DiscordBot = require('./src/discordBot');
const db = require('./src/db');
const { setupLogger } = require('./src/utils');

const logger = setupLogger('main');

const TOKEN_ENV_NAMES = ['DISCORD_BOT_TOKEN', 'DISCORD_TOKEN', 'BOT_TOKEN', 'TOKEN'];

function getDiscordToken() {
    for (const name of TOKEN_ENV_NAMES) {
        const value = process.env[name];
        if (value && value.trim()) return value.trim();
    }
    return null;
}

async function main() {
    let bot;
    try {
        bot = new DiscordBot();
        const token = getDiscordToken();

        if (!token) {
            logger.error(`Discord bot token not found. Set one of these environment variables in the panel: ${TOKEN_ENV_NAMES.join(', ')}`);
            process.exit(1);
        }

        const handleShutdown = (signal) => {
            logger.info(`Received ${signal}. Shutting down gracefully...`);
            if (bot && bot.client) {
                try {
                    bot.client.destroy();
                } catch (e) {
                    logger.error(`Error destroying Discord client: ${e.message}`);
                }
            }
            db.close();
            process.exit(0);
        };

        process.on('SIGINT', () => handleShutdown('SIGINT'));
        process.on('SIGTERM', () => handleShutdown('SIGTERM'));
        process.on('unhandledRejection', (reason) => {
            logger.error('Unhandled promise rejection:', reason);
        });

        await bot.start(token);
        logger.info('Bot started successfully');
    } catch (error) {
        logger.error('Failed to start bot:', error);
        process.exit(1);
    }
}

main();
