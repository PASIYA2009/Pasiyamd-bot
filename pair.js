const express = require('express');
const router = express.Router();
const { 
    default: makeWASocket,
    DisconnectReason,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    delay
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs-extra');
const path = require('path');

// Store active connections
const activeConnections = new Map();
let pairingSocket = null;

/**
 * Generate pairing code - Koyeb optimized
 * Works without saving session until paired
 */
router.get('/code', async (req, res) => {
    try {
        const phoneNumber = req.query.phone;

        if (!phoneNumber) {
            return res.status(400).json({ 
                error: 'Phone number is required',
                usage: '/api/pair/code?phone=1234567890'
            });
        }

        // Clean phone number
        const cleanNumber = phoneNumber.replace(/\D/g, '');

        if (cleanNumber.length < 10) {
            return res.status(400).json({ 
                error: 'Invalid phone number',
                message: 'Phone number must be at least 10 digits'
            });
        }

        console.log(`📱 [KOYEB] Generating pairing code for: ${cleanNumber}`);

        // Create session directory
        const sessionPath = path.join(__dirname, '../sessions', cleanNumber);
        await fs.ensureDir(sessionPath);

        // Get latest Baileys version
        const { version } = await fetchLatestBaileysVersion();

        // Setup authentication
        const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

        // Create socket connection
        const socket = makeWASocket({
            version,
            logger: pino({ level: 'silent' }),
            printQRInTerminal: false,
            mobile: false,
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
            },
            browser: ['PASIYA-MD', 'Chrome', '121.0.0'],
            markOnlineOnConnect: false,
            generateHighQualityLinkPreview: true,
            syncFullHistory: false,
            getMessage: async () => undefined
        });

        // Store socket for later use
        pairingSocket = socket;

        // Handle connection updates
        socket.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;

            if (connection === 'close') {
                const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
                console.log(`❌ Connection closed for ${cleanNumber}. Reconnect:`, shouldReconnect);
                
                if (!shouldReconnect) {
                    pairingSocket = null;
                }
            } else if (connection === 'open') {
                console.log(`✅ Device paired successfully: ${cleanNumber}`);
                activeConnections.set(cleanNumber, socket);
                pairingSocket = null;
                
                // Send welcome message
                try {
                    await socket.sendMessage(socket.user.id, {
                        text: `✅ *Device Paired Successfully!*\n\nYour WhatsApp bot is now connected and ready to use.\n\n📱 Number: ${cleanNumber}\n🤖 Bot: PASIYA-MD\n⚡ Status: Active\n\nType .help to see available commands.`
                    });
                } catch (err) {
                    console.log('Could not send welcome message:', err.message);
                }
            }
        });

        // Save credentials on update
        socket.ev.on('creds.update', saveCreds);

        // Request pairing code
        if (!socket.authState.creds.registered) {
            // Wait for socket to initialize
            await delay(3000);

            try {
                const code = await socket.requestPairingCode(cleanNumber);
                
                console.log(`✅ Pairing code generated: ${code}`);

                // Send HTML response with the code
                return res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WhatsApp Pairing Code</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 20px;
            padding: 40px;
            max-width: 500px;
            width: 100%;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            text-align: center;
        }
        h1 { color: #25D366; margin-bottom: 20px; font-size: 32px; }
        .code {
            font-size: 64px;
            font-weight: bold;
            color: #25D366;
            letter-spacing: 15px;
            margin: 30px 0;
            font-family: 'Courier New', monospace;
            background: #f0f0f0;
            padding: 20px;
            border-radius: 10px;
        }
        .instructions {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            margin-top: 20px;
            text-align: left;
        }
        .instructions h3 { color: #333; margin-bottom: 15px; }
        .instructions ol { margin-left: 20px; }
        .instructions li { color: #666; margin-bottom: 10px; line-height: 1.6; }
        .success { color: #28a745; font-weight: bold; margin-top: 20px; }
        .timer {
            color: #666;
            margin-top: 15px;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📱 WhatsApp Pairing Code</h1>
        <p style="color: #666; margin-bottom: 10px;">For: <strong>${cleanNumber}</strong></p>
        
        <div class="code">${code}</div>
        
        <div class="instructions">
            <h3>How to Link Your Device:</h3>
            <ol>
                <li>Open WhatsApp on your phone</li>
                <li>Go to <strong>Settings → Linked Devices</strong></li>
                <li>Tap <strong>"Link a Device"</strong></li>
                <li>Tap <strong>"Link with Phone Number Instead"</strong></li>
                <li>Enter the code: <strong>${code}</strong></li>
            </ol>
        </div>
        
        <div class="success">
            ✅ Code is valid and ready to use!
        </div>
        
        <div class="timer">
            This code will expire in 60 seconds
        </div>
    </div>
</body>
</html>
                `);
            } catch (error) {
                console.error('❌ Error requesting pairing code:', error);
                throw error;
            }
        } else {
            return res.json({
                success: true,
                message: 'Device already registered',
                phoneNumber: cleanNumber
            });
        }

    } catch (error) {
        console.error('❌ Pairing error:', error);
        res.status(500).send(`
<!DOCTYPE html>
<html>
<head>
    <title>Error</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background: #f8d7da;
            padding: 40px;
            text-align: center;
        }
        .error {
            background: white;
            padding: 30px;
            border-radius: 10px;
            max-width: 500px;
            margin: 0 auto;
        }
        h1 { color: #dc3545; }
        p { color: #666; }
    </style>
</head>
<body>
    <div class="error">
        <h1>❌ Error</h1>
        <p>${error.message}</p>
        <p><a href="/">Try Again</a></p>
    </div>
</body>
</html>
        `);
    }
});

/**
 * Check connection status
 */
router.get('/status/:phoneNumber', async (req, res) => {
    try {
        const { phoneNumber } = req.params;
        const cleanNumber = phoneNumber.replace(/\D/g, '');

        const isActive = activeConnections.has(cleanNumber);
        const sessionPath = path.join(__dirname, '../sessions', cleanNumber);
        const sessionExists = await fs.pathExists(sessionPath);

        res.json({
            phoneNumber: cleanNumber,
            active: isActive,
            sessionExists: sessionExists,
            status: isActive ? 'connected' : (sessionExists ? 'disconnected' : 'not_initialized')
        });
    } catch (error) {
        res.status(500).json({ 
            error: 'Failed to check status',
            message: error.message 
        });
    }
});

/**
 * Disconnect and remove session
 */
router.delete('/:phoneNumber', async (req, res) => {
    try {
        const { phoneNumber } = req.params;
        const cleanNumber = phoneNumber.replace(/\D/g, '');

        // Close connection if active
        if (activeConnections.has(cleanNumber)) {
            const socket = activeConnections.get(cleanNumber);
            await socket.logout();
            activeConnections.delete(cleanNumber);
        }

        // Remove session files
        const sessionPath = path.join(__dirname, '../sessions', cleanNumber);
        if (await fs.pathExists(sessionPath)) {
            await fs.remove(sessionPath);
        }

        res.json({
            success: true,
            message: 'Session removed successfully',
            phoneNumber: cleanNumber
        });
    } catch (error) {
        res.status(500).json({ 
            error: 'Failed to remove session',
            message: error.message 
        });
    }
});

/**
 * Get all active connections
 */
router.get('/connections', (req, res) => {
    const connections = Array.from(activeConnections.keys()).map(number => ({
        phoneNumber: number,
        status: 'active'
    }));

    res.json({
        total: connections.length,
        connections: connections
    });
});

module.exports = router;
module.exports.activeConnections = activeConnections;
