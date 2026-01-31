const express = require('express');
const router = express.Router();
const { 
    default: makeWASocket,
    DisconnectReason,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    downloadMediaMessage
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs-extra');
const path = require('path');

// Import active connections from pair.js
const { activeConnections } = require('./pair');

// Store for bot instances
const botInstances = new Map();

/**
 * Start bot for a phone number
 */
router.post('/start', async (req, res) => {
    try {
        const { phoneNumber } = req.body;

        if (!phoneNumber) {
            return res.status(400).json({ error: 'Phone number is required' });
        }

        const cleanNumber = phoneNumber.replace(/\D/g, '');
        
        // Check if already running
        if (botInstances.has(cleanNumber)) {
            return res.json({
                success: true,
                message: 'Bot already running',
                phoneNumber: cleanNumber
            });
        }

        const sessionPath = path.join(__dirname, '../sessions', cleanNumber);
        
        if (!await fs.pathExists(sessionPath)) {
            return res.status(400).json({ 
                error: 'Session not found',
                message: 'Please pair the device first'
            });
        }

        console.log(`🤖 Starting bot for: ${cleanNumber}`);

        const { version } = await fetchLatestBaileysVersion();
        const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

        const socket = makeWASocket({
            version,
            logger: pino({ level: 'silent' }),
            printQRInTerminal: false,
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
            },
            browser: ['PASIYA-MD', 'Chrome', '121.0.0'],
            markOnlineOnConnect: true,
            getMessage: async () => undefined
        });

        // Handle connection updates
        socket.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;

            if (connection === 'close') {
                const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
                console.log(`❌ Connection closed for ${cleanNumber}. Reconnect:`, shouldReconnect);
                
                if (shouldReconnect) {
                    botInstances.delete(cleanNumber);
                    setTimeout(() => {
                        // Auto-restart
                        console.log(`🔄 Auto-restarting bot for ${cleanNumber}`);
                        const mockReq = { body: { phoneNumber: cleanNumber } };
                        const mockRes = { 
                            json: () => {},
                            status: () => ({ json: () => {} })
                        };
                        router.post('/start')(mockReq, mockRes);
                    }, 5000);
                } else {
                    botInstances.delete(cleanNumber);
                }
            } else if (connection === 'open') {
                console.log(`✅ Bot connected for: ${cleanNumber}`);
                botInstances.set(cleanNumber, socket);
            }
        });

        socket.ev.on('creds.update', saveCreds);

        // Handle incoming messages
        socket.ev.on('messages.upsert', async ({ messages, type }) => {
            if (type !== 'notify') return;

            for (const message of messages) {
                if (!message.message) continue;
                if (message.key.fromMe) continue; // Ignore own messages
                
                await handleMessage(socket, message, cleanNumber);
            }
        });

        res.json({
            success: true,
            message: 'Bot started successfully',
            phoneNumber: cleanNumber
        });

    } catch (error) {
        console.error('❌ Bot start error:', error);
        res.status(500).json({ 
            error: 'Failed to start bot',
            message: error.message 
        });
    }
});

/**
 * Stop bot
 */
router.post('/stop', async (req, res) => {
    try {
        const { phoneNumber } = req.body;
        const cleanNumber = phoneNumber.replace(/\D/g, '');

        if (!botInstances.has(cleanNumber)) {
            return res.status(404).json({ 
                error: 'Bot not running',
                phoneNumber: cleanNumber
            });
        }

        const socket = botInstances.get(cleanNumber);
        await socket.end();
        botInstances.delete(cleanNumber);

        res.json({
            success: true,
            message: 'Bot stopped successfully',
            phoneNumber: cleanNumber
        });
    } catch (error) {
        res.status(500).json({ 
            error: 'Failed to stop bot',
            message: error.message 
        });
    }
});

/**
 * Send message
 */
router.post('/send', async (req, res) => {
    try {
        const { phoneNumber, to, message } = req.body;

        if (!phoneNumber || !to || !message) {
            return res.status(400).json({ 
                error: 'phoneNumber, to, and message are required' 
            });
        }

        const cleanNumber = phoneNumber.replace(/\D/g, '');
        const cleanTo = to.replace(/\D/g, '') + '@s.whatsapp.net';

        if (!botInstances.has(cleanNumber)) {
            return res.status(404).json({ 
                error: 'Bot not running. Start it first'
            });
        }

        const socket = botInstances.get(cleanNumber);

        await socket.sendMessage(cleanTo, { 
            text: message 
        });

        res.json({
            success: true,
            message: 'Message sent successfully',
            to: to
        });
    } catch (error) {
        res.status(500).json({ 
            error: 'Failed to send message',
            message: error.message 
        });
    }
});

/**
 * Get bot status
 */
router.get('/status/:phoneNumber', (req, res) => {
    const { phoneNumber } = req.params;
    const cleanNumber = phoneNumber.replace(/\D/g, '');

    const isRunning = botInstances.has(cleanNumber);

    res.json({
        phoneNumber: cleanNumber,
        running: isRunning,
        status: isRunning ? 'active' : 'stopped'
    });
});

/**
 * List all bots
 */
router.get('/list', (req, res) => {
    const bots = Array.from(botInstances.keys()).map(number => ({
        phoneNumber: number,
        status: 'active'
    }));

    res.json({
        total: bots.length,
        bots: bots
    });
});

/**
 * Handle incoming messages
 */
async function handleMessage(socket, message, botNumber) {
    try {
        const messageType = Object.keys(message.message)[0];
        const from = message.key.remoteJid;
        const isGroup = from.endsWith('@g.us');
        
        let messageText = '';
        
        if (messageType === 'conversation') {
            messageText = message.message.conversation;
        } else if (messageType === 'extendedTextMessage') {
            messageText = message.message.extendedTextMessage.text;
        }

        if (!messageText) return;

        console.log(`📨 Message from ${from}: ${messageText}`);

        const prefix = process.env.PREFIX || '.';
        
        if (!messageText.startsWith(prefix)) return;

        const args = messageText.slice(prefix.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();

        // Handle commands
        switch (command) {
            case 'ping':
                await socket.sendMessage(from, { 
                    text: '🏓 Pong! Bot is active and running on Koyeb!' 
                });
                break;

            case 'help':
                const helpText = `
*📚 Available Commands*

*Basic:*
• ${prefix}ping - Check if bot is active
• ${prefix}help - Show this menu
• ${prefix}info - Bot information
• ${prefix}alive - Check bot status
• ${prefix}menu - Show all commands

*Info:*
• ${prefix}owner - Get owner contact
• ${prefix}runtime - Check uptime

_Bot is running on Koyeb Cloud_ ☁️
                `.trim();
                
                await socket.sendMessage(from, { text: helpText });
                break;

            case 'info':
            case 'alive':
                const uptime = process.uptime();
                const hours = Math.floor(uptime / 3600);
                const minutes = Math.floor((uptime % 3600) / 60);
                const seconds = Math.floor(uptime % 60);

                const info = `
*🤖 Bot Information*

• *Name:* ${process.env.BOT_NAME || 'PASIYA-MD'}
• *Version:* 2.0.0 Koyeb
• *Prefix:* ${prefix}
• *Phone:* ${botNumber}
• *Status:* Active ✅
• *Platform:* Koyeb Cloud ☁️
• *Uptime:* ${hours}h ${minutes}m ${seconds}s

_Powered by Baileys_
                `.trim();
                
                await socket.sendMessage(from, { text: info });
                break;

            case 'menu':
                const menuText = `
╭━━━『 *MENU* 』━━━┈⊷
│
│ *Bot Commands:*
│ • ${prefix}ping
│ • ${prefix}help
│ • ${prefix}info
│ • ${prefix}alive
│ • ${prefix}menu
│ • ${prefix}owner
│ • ${prefix}runtime
│
╰━━━━━━━━━━━━━━━┈⊷

_Type ${prefix}help for more info_
                `.trim();
                
                await socket.sendMessage(from, { text: menuText });
                break;

            case 'runtime':
            case 'uptime':
                const runtime = process.uptime();
                const days = Math.floor(runtime / 86400);
                const hrs = Math.floor((runtime % 86400) / 3600);
                const mins = Math.floor((runtime % 3600) / 60);
                const secs = Math.floor(runtime % 60);

                let runtimeText = '⏰ *Bot Runtime*\n\n';
                if (days > 0) runtimeText += `${days} days, `;
                if (hrs > 0) runtimeText += `${hrs} hours, `;
                if (mins > 0) runtimeText += `${mins} minutes, `;
                runtimeText += `${secs} seconds`;

                await socket.sendMessage(from, { text: runtimeText });
                break;

            case 'owner':
                const ownerNumber = process.env.OWNER_NUMBER || '94741856766';
                const vcard = 'BEGIN:VCARD\n'
                    + 'VERSION:3.0\n'
                    + 'FN:Bot Owner\n'
                    + 'ORG:PASIYA-MD;\n'
                    + `TEL;type=CELL;type=VOICE;waid=${ownerNumber}:+${ownerNumber}\n`
                    + 'END:VCARD';
                
                await socket.sendMessage(from, {
                    contacts: {
                        displayName: 'Bot Owner',
                        contacts: [{ vcard }]
                    }
                });
                break;

            default:
                await socket.sendMessage(from, { 
                    text: `❌ Unknown command: *${command}*\n\nType ${prefix}help for available commands.` 
                });
        }
    } catch (error) {
        console.error('❌ Message handling error:', error);
    }
}

module.exports = router;
