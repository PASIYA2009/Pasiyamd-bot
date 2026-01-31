require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs-extra');

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Trust proxy (required for Koyeb)
app.set('trust proxy', 1);

// Import routes
const pairRoute = require('./routes/pair');
const botRoute = require('./routes/bot');

// Routes
app.use('/api/pair', pairRoute);
app.use('/api/bot', botRoute);

// Main landing page
app.get('/', (req, res) => {
    const baseUrl = process.env.KOYEB_PUBLIC_DOMAIN 
        ? `https://${process.env.KOYEB_PUBLIC_DOMAIN}` 
        : `http://localhost:${PORT}`;
    
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WhatsApp Bot - Get Pairing Code</title>
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
        }
        .logo {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo h1 {
            color: #25D366;
            font-size: 36px;
            margin-bottom: 10px;
        }
        .logo p {
            color: #666;
            font-size: 16px;
        }
        .form-group {
            margin-bottom: 25px;
        }
        label {
            display: block;
            margin-bottom: 8px;
            color: #333;
            font-weight: 600;
            font-size: 14px;
        }
        input {
            width: 100%;
            padding: 15px;
            border: 2px solid #e0e0e0;
            border-radius: 10px;
            font-size: 16px;
            transition: all 0.3s;
        }
        input:focus {
            outline: none;
            border-color: #25D366;
        }
        .btn {
            width: 100%;
            padding: 15px;
            background: #25D366;
            color: white;
            border: none;
            border-radius: 10px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
            text-decoration: none;
            display: block;
            text-align: center;
        }
        .btn:hover {
            background: #20bd5a;
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(37, 211, 102, 0.4);
        }
        .info {
            background: #e7f3ff;
            padding: 15px;
            border-radius: 10px;
            margin-top: 20px;
            border-left: 4px solid #2196F3;
        }
        .info h3 {
            color: #2196F3;
            margin-bottom: 10px;
            font-size: 16px;
        }
        .info p {
            color: #666;
            font-size: 14px;
            line-height: 1.6;
        }
        .example {
            background: #f8f9fa;
            padding: 10px;
            border-radius: 5px;
            margin-top: 5px;
            font-family: 'Courier New', monospace;
            font-size: 14px;
        }
        .status {
            text-align: center;
            margin-top: 20px;
            padding: 15px;
            background: #d4edda;
            border-radius: 10px;
            color: #155724;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            color: #999;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">
            <h1>📱 WhatsApp Bot</h1>
            <p>Get Your Pairing Code</p>
        </div>

        <form id="pairForm" onsubmit="getPairingCode(event)">
            <div class="form-group">
                <label for="phoneNumber">Phone Number (with country code)</label>
                <input 
                    type="tel" 
                    id="phoneNumber" 
                    placeholder="e.g., 94741856766" 
                    required
                    pattern="[0-9]+"
                >
                <div class="example">
                    Example: 94741856766 (for +94 741856766)
                </div>
            </div>

            <button type="submit" class="btn">
                🔐 Get Pairing Code
            </button>
        </form>

        <div class="info">
            <h3>ℹ️ How it works:</h3>
            <p>
                1. Enter your WhatsApp number with country code<br>
                2. Click "Get Pairing Code"<br>
                3. Open WhatsApp → Settings → Linked Devices<br>
                4. Link with Phone Number<br>
                5. Enter the code you receive
            </p>
        </div>

        <div class="status">
            ✅ Server is running on Koyeb
        </div>

        <div class="footer">
            <p>Powered by Baileys & Express.js</p>
            <p>Hosted on Koyeb</p>
        </div>
    </div>

    <script>
        function getPairingCode(event) {
            event.preventDefault();
            const phoneNumber = document.getElementById('phoneNumber').value.trim();
            
            if (!phoneNumber) {
                alert('Please enter your phone number');
                return;
            }

            // Redirect to pairing code endpoint
            window.location.href = '/api/pair/code?phone=' + phoneNumber;
        }
    </script>
</body>
</html>
    `);
});

// Health check (important for Koyeb)
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'WhatsApp Bot is running on Koyeb',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// API info
app.get('/api', (req, res) => {
    const baseUrl = process.env.KOYEB_PUBLIC_DOMAIN 
        ? `https://${process.env.KOYEB_PUBLIC_DOMAIN}` 
        : `http://localhost:${PORT}`;

    res.json({
        name: 'WhatsApp Bot API',
        version: '2.0.0',
        endpoints: {
            pair: `${baseUrl}/api/pair/code?phone=YOUR_NUMBER`,
            status: `${baseUrl}/api/pair/status/:phoneNumber`,
            start_bot: `${baseUrl}/api/bot/start`,
            health: `${baseUrl}/health`
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        message: err.message 
    });
});

// Create necessary directories
const dirs = ['./sessions', './temp'];
dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`
╔═══════════════════════════════════════╗
║                                       ║
║   WhatsApp Bot - Koyeb Deployment     ║
║                                       ║
║  Port: ${PORT.toString().padEnd(29)}║
║  Host: 0.0.0.0                        ║
║  Time: ${new Date().toLocaleString().padEnd(28)}║
║                                       ║
${process.env.KOYEB_PUBLIC_DOMAIN ? 
`║  URL: https://${process.env.KOYEB_PUBLIC_DOMAIN.padEnd(24)}║` :
`║  URL: http://localhost:${PORT.toString().padEnd(18)}║`}
║                                       ║
╚═══════════════════════════════════════╝
    `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

module.exports = app;
