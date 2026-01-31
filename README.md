# 📱 WhatsApp Bot - Koyeb Optimized

WhatsApp bot with **pairing code support** specifically optimized for **Koyeb cloud deployment**.

## ✨ Features

- 🔐 **Pairing Code** - No QR code needed, just enter your number
- ☁️ **Koyeb Optimized** - Designed specifically for Koyeb hosting
- 🚀 **One-Click Deploy** - Deploy in minutes
- 🔄 **Auto-Reconnect** - Automatic reconnection on disconnect
- 💬 **Command System** - Built-in commands with easy customization
- 🌐 **Web Interface** - Beautiful landing page for pairing
- 📊 **Health Monitoring** - Built-in health checks for Koyeb
- 🛠️ **RESTful API** - Complete API for bot control

## 🚀 Quick Deploy to Koyeb

### 1. Upload to GitHub

1. Create a new repository
2. Upload all files from this folder
3. Commit and push

### 2. Deploy on Koyeb

1. Go to [Koyeb.com](https://www.koyeb.com/)
2. Click **"Create App"**
3. Select **GitHub** as source
4. Choose your repository
5. Set environment variables:
   - `PORT=8000`
   - `OWNER_NUMBER=your_number`
   - `BOT_NAME=Your Bot Name`
   - `PREFIX=.`
6. Set health check path: `/health`
7. Click **Deploy**

### 3. Get Pairing Code

Once deployed:
1. Open `https://your-app.koyeb.app`
2. Enter your WhatsApp number
3. Get pairing code
4. Link device in WhatsApp

**Done!** 🎉

## 📱 How to Use

### Get Pairing Code

**Via Browser:**
```
https://your-app.koyeb.app
```

**Via API:**
```
https://your-app.koyeb.app/api/pair/code?phone=1234567890
```

### Link Your Device

1. Open WhatsApp
2. Settings → Linked Devices
3. Link a Device
4. Link with Phone Number
5. Enter the code

### Test Bot

Send to your bot:
```
.ping
```

Response:
```
🏓 Pong! Bot is active and running on Koyeb!
```

## 💬 Available Commands

| Command | Description |
|---------|-------------|
| `.ping` | Check if bot is active |
| `.help` | Show help menu |
| `.info` | Bot information |
| `.alive` | Check bot status |
| `.menu` | Show all commands |
| `.owner` | Get owner contact |
| `.runtime` | Check uptime |

## 🌐 API Endpoints

### Pairing

```bash
# Get pairing code
GET /api/pair/code?phone=1234567890

# Check status
GET /api/pair/status/1234567890

# Remove session
DELETE /api/pair/1234567890

# List connections
GET /api/pair/connections
```

### Bot Control

```bash
# Start bot
POST /api/bot/start
Body: {"phoneNumber": "1234567890"}

# Stop bot
POST /api/bot/stop
Body: {"phoneNumber": "1234567890"}

# Send message
POST /api/bot/send
Body: {
  "phoneNumber": "bot_number",
  "to": "recipient_number",
  "message": "Hello!"
}

# Check status
GET /api/bot/status/1234567890

# List bots
GET /api/bot/list
```

### Health

```bash
# Health check (for Koyeb monitoring)
GET /health
```

## ⚙️ Configuration

Environment variables (set on Koyeb):

```env
PORT=8000
OWNER_NUMBER=1234567890
BOT_NAME=PASIYA-MD
PREFIX=.
```

Koyeb auto-sets:
- `KOYEB_PUBLIC_DOMAIN`
- `KOYEB_APP_NAME`
- `KOYEB_INSTANCE_ID`

## 🔧 Local Development

```bash
# Install dependencies
npm install

# Start server
npm start

# Development mode
npm run dev
```

Access at `http://localhost:8000`

## 📁 Project Structure

```
koyeb-bot/
├── index.js           # Main server (Koyeb optimized)
├── routes/
│   ├── pair.js       # Pairing code logic
│   └── bot.js        # Bot commands & message handler
├── package.json
├── .env
├── .gitignore
└── KOYEB_DEPLOY.md   # Detailed deployment guide
```

## 🐛 Troubleshooting

### Pairing code not working
- Ensure number includes country code
- Generate new code
- Update WhatsApp to latest version

### Bot not responding
```bash
# Check health
curl https://your-app.koyeb.app/health

# Check bot status
curl https://your-app.koyeb.app/api/bot/status/YOUR_NUMBER
```

### Connection issues
- Check Koyeb logs
- Verify environment variables
- Ensure health check is passing

### Session expired
- Redeploy app
- Get new pairing code
- Link device again

## 🔄 Updates

To update your bot:

1. Push changes to GitHub
2. Koyeb auto-deploys (if enabled)
3. Or manually trigger redeploy

## 🌟 Why Koyeb?

- ✅ Free tier available
- ✅ Easy deployment
- ✅ Automatic scaling
- ✅ Built-in monitoring
- ✅ GitHub integration
- ✅ Persistent storage

## 📚 Documentation

- [Full Deployment Guide](KOYEB_DEPLOY.md)
- [Koyeb Documentation](https://www.koyeb.com/docs)
- [Baileys Documentation](https://github.com/WhiskeySockets/Baileys)

## 🔒 Security

- Sessions stored securely on Koyeb
- Environment variables encrypted
- No sensitive data in code
- Health checks for monitoring

## 💰 Pricing

**Koyeb Free Tier:**
- Perfect for testing
- 2 services
- 512MB RAM

**Eco Tier ($5/mo):**
- Better performance
- Dedicated resources
- Recommended for production

## ✨ Features on Koyeb

- Auto-restart on crash
- Zero-downtime deployments
- Persistent session storage
- Built-in SSL/HTTPS
- Global CDN
- Automatic backups

## 🎯 Next Steps

1. ✅ Deploy to Koyeb
2. ✅ Get pairing code
3. ✅ Link WhatsApp device
4. ✅ Test commands
5. ✅ Customize as needed

## 📞 Support

For issues:
- Check logs on Koyeb dashboard
- Review [KOYEB_DEPLOY.md](KOYEB_DEPLOY.md)
- Test locally first

## 📄 License

MIT License - Free to use and modify

## 🙏 Credits

- Built with [Baileys](https://github.com/WhiskeySockets/Baileys)
- Optimized for [Koyeb](https://www.koyeb.com/)
- Powered by Express.js

---

**🎉 Ready to deploy? Follow [KOYEB_DEPLOY.md](KOYEB_DEPLOY.md) for step-by-step instructions!**

Your bot will be live at: `https://your-app-name.koyeb.app`
