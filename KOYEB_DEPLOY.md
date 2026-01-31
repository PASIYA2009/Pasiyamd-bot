# 🚀 Koyeb Deployment Guide

Complete guide to deploy your WhatsApp bot on Koyeb cloud platform.

## 📋 Prerequisites

- GitHub account
- Koyeb account (free tier available)
- Your WhatsApp phone number

## 🎯 Quick Deploy

### Step 1: Fork/Upload to GitHub

1. Create a new repository on GitHub
2. Upload all files from this folder
3. Make sure `.gitignore` is included (sessions folder will be created automatically)

### Step 2: Deploy on Koyeb

1. Go to [Koyeb](https://www.koyeb.com/)
2. Sign up/Login
3. Click **"Create App"**

### Step 3: Configure Deployment

**GitHub Integration:**
- Select **"GitHub"** as source
- Choose your repository
- Branch: `main` or `master`

**Build Configuration:**
- Build command: (leave empty, will auto-detect)
- Run command: `npm start`

**Environment Variables:**
Click "Add Variable" and add:

```
PORT=8000
OWNER_NUMBER=94741856766
BOT_NAME=PASIYA-MD
PREFIX=.
```

**Instance Configuration:**
- Region: Choose closest to you
- Instance type: **Free** (Nano) or **Eco** (for better performance)

**Health Check:**
- Path: `/health`
- Port: `8000`

### Step 4: Deploy

1. Click **"Deploy"**
2. Wait 2-3 minutes for deployment
3. Your app will be live at: `https://your-app-name.koyeb.app`

## 📱 Get Pairing Code

Once deployed:

1. Open your Koyeb URL: `https://your-app-name.koyeb.app`
2. Enter your WhatsApp number (with country code)
3. Click "Get Pairing Code"
4. You'll see a code like: `ABC-DEF-GHI`

## 🔗 Link Your WhatsApp

On your phone:

1. Open **WhatsApp**
2. Go to **Settings** → **Linked Devices**
3. Tap **"Link a Device"**
4. Tap **"Link with Phone Number Instead"**
5. Enter the pairing code
6. Wait for connection ✅

## 🤖 Start the Bot

### Method 1: Automatic (Recommended)

The bot starts automatically after pairing! Just wait 10 seconds after linking.

### Method 2: Via API

```bash
curl -X POST https://your-app-name.koyeb.app/api/bot/start \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "YOUR_NUMBER"}'
```

## ✅ Test Your Bot

Send this message to your bot from any WhatsApp number:

```
.ping
```

You should get: "🏓 Pong! Bot is active and running on Koyeb!"

## 📊 Available Commands

- `.ping` - Check if bot is active
- `.help` - Show help menu
- `.info` - Bot information
- `.alive` - Check status
- `.menu` - All commands
- `.owner` - Get owner contact
- `.runtime` - Check uptime

## 🔧 Environment Variables on Koyeb

You can update environment variables anytime:

1. Go to your app on Koyeb
2. Click **"Settings"**
3. Go to **"Environment variables"**
4. Edit and save
5. Redeploy (automatic)

## 📁 File Structure

```
koyeb-bot/
├── index.js              # Main server
├── routes/
│   ├── pair.js          # Pairing logic
│   └── bot.js           # Bot commands
├── package.json
├── .env
└── .gitignore
```

## 🌐 API Endpoints

Your bot exposes these endpoints:

### Get Pairing Code
```
GET https://your-app.koyeb.app/api/pair/code?phone=1234567890
```

### Check Status
```
GET https://your-app.koyeb.app/api/pair/status/1234567890
```

### Start Bot
```
POST https://your-app.koyeb.app/api/bot/start
Body: {"phoneNumber": "1234567890"}
```

### Send Message
```
POST https://your-app.koyeb.app/api/bot/send
Body: {
  "phoneNumber": "bot_number",
  "to": "recipient_number",
  "message": "Hello!"
}
```

### Health Check
```
GET https://your-app.koyeb.app/health
```

## 🔄 Auto-Reconnect

The bot automatically reconnects if:
- Connection drops
- Server restarts
- Network issues

Sessions are preserved on Koyeb's persistent storage.

## 💾 Session Management

**Important:** Sessions are stored in `/sessions` folder which persists on Koyeb.

To reset a session:
1. Stop your app
2. Delete the app
3. Redeploy
4. Get new pairing code

## 🐛 Troubleshooting

### Bot not responding
```bash
# Check status
curl https://your-app.koyeb.app/health

# Check logs on Koyeb dashboard
# Go to: App → Logs
```

### Pairing code not working
- Make sure number includes country code
- Try generating a new code
- Check if WhatsApp is updated

### Session expired
- Redeploy the app
- Get new pairing code
- Link device again

### App keeps restarting
- Check logs on Koyeb dashboard
- Verify environment variables
- Ensure PORT=8000 is set

## 🔒 Security Tips

1. **Don't share** your Koyeb URL publicly
2. **Change** default owner number in .env
3. **Enable** Koyeb's authentication if needed
4. **Monitor** logs regularly

## 💰 Koyeb Pricing

**Free Tier:**
- 2 services
- Shared CPU
- 512MB RAM
- Perfect for testing

**Eco Tier:** ($5/month)
- Dedicated resources
- Better performance
- No sleep time

**Production:** (Custom)
- Scale as needed
- Multiple instances
- Load balancing

## 🔄 Updating Your Bot

1. Update code in your GitHub repository
2. Push changes
3. Koyeb auto-deploys (if enabled)
4. Or manually trigger redeploy on Koyeb

## 📈 Monitoring

**Check bot health:**
```bash
curl https://your-app.koyeb.app/health
```

**View active bots:**
```bash
curl https://your-app.koyeb.app/api/bot/list
```

**Check connections:**
```bash
curl https://your-app.koyeb.app/api/pair/connections
```

## 🎨 Customization

### Change Bot Prefix
Edit `.env`:
```
PREFIX=!
```

### Change Bot Name
Edit `.env`:
```
BOT_NAME=My Custom Bot
```

### Add Owner Number
Edit `.env`:
```
OWNER_NUMBER=1234567890
```

## 🌟 Advanced Features

### Add Custom Commands

Edit `routes/bot.js` and add in the switch statement:

```javascript
case 'mycommand':
    await socket.sendMessage(from, { 
        text: 'My custom response!' 
    });
    break;
```

### Add Auto-Reply

In `handleMessage` function, add before command check:

```javascript
if (messageText.toLowerCase().includes('hello')) {
    await socket.sendMessage(from, { 
        text: 'Hi there! How can I help?' 
    });
    return;
}
```

## 📞 Support

**Common Issues:**
- Check [GitHub Issues](https://github.com/WhiskeySockets/Baileys/issues)
- Read [Koyeb Docs](https://www.koyeb.com/docs)
- Check bot logs on Koyeb dashboard

**Need Help?**
- Review this guide carefully
- Check example deployments
- Test locally first: `npm start`

## ✨ Tips for Success

1. **Test locally** before deploying to Koyeb
2. **Use environment variables** for sensitive data
3. **Monitor logs** regularly
4. **Keep dependencies updated**
5. **Enable auto-deploy** on GitHub push

## 🎯 Next Steps

After successful deployment:

1. ✅ Test all commands
2. ✅ Add custom commands
3. ✅ Set up monitoring
4. ✅ Share with friends (optional)
5. ✅ Scale if needed

---

**🎉 Congratulations! Your WhatsApp bot is now live on Koyeb!**

Your bot URL: `https://your-app-name.koyeb.app`

For more features, check the main documentation.
