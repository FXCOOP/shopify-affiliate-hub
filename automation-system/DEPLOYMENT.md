# 🚀 Deployment Guide

## Deploy to Render (Recommended)

### Option 1: Automatic Deployment from GitHub

1. **Push code to GitHub:**
   ```bash
   git add .
   git commit -m "Add automation system"
   git push origin main
   ```

2. **Create Render Blueprint:**
   - Go to: https://dashboard.render.com
   - Click **"New +"** → **"Blueprint"**
   - Connect your GitHub repository
   - Select the `automation-system` directory
   - Render will automatically detect `render.yaml`
   - Click **"Apply"**

3. **Add Environment Variables:**
   In the Render dashboard, go to each service and add:

   **Required:**
   - `OPENAI_API_KEY` = `sk-proj-your-actual-key-here`

   **Optional (for platform APIs):**
   - `REDDIT_CLIENT_ID`
   - `REDDIT_CLIENT_SECRET`
   - `REDDIT_USERNAME`
   - `REDDIT_PASSWORD`
   - `TWITTER_API_KEY`
   - `TWITTER_API_SECRET`
   - `TWITTER_ACCESS_TOKEN`
   - `TWITTER_ACCESS_SECRET`

4. **Deploy:**
   Render will automatically deploy both services:
   - **Web Service**: API + Dashboard (running 24/7)
   - **Cron Job**: Daily automation (runs at 7 AM UTC)

---

### Option 2: Manual Service Creation

1. **Create Web Service (API + Dashboard):**
   - New Web Service
   - Connect GitHub repo
   - Root Directory: `automation-system`
   - Build Command: `npm install`
   - Start Command: `node api-server.js`
   - Add environment variables

2. **Create Cron Job (Daily Automation):**
   - New Cron Job
   - Connect GitHub repo
   - Root Directory: `automation-system`
   - Build Command: `npm install`
   - Command: `node main.js --now`
   - Schedule: `0 7 * * *` (7 AM UTC daily)
   - Add environment variables

---

## Deploy to GitHub Actions (Alternative - Free)

### Advantages:
- ✅ Completely FREE (2,000 minutes/month)
- ✅ No credit card required
- ✅ Runs daily automatically

### Setup:

1. **Add GitHub Secrets:**
   - Go to: Repository → Settings → Secrets → Actions
   - Add secret: `OPENAI_API_KEY`
   - Add optional secrets for platforms

2. **GitHub Actions workflow already created:**
   - File: `.github/workflows/daily-automation.yml`
   - Runs daily at 7 AM UTC
   - Runs on every push (for testing)

3. **Enable Actions:**
   - Go to: Repository → Actions
   - Enable workflows if disabled

---

## Access Your Services

### Render Deployment:
- **API**: `https://shopify-automation-api.onrender.com`
- **Dashboard**: `https://shopify-automation-api.onrender.com/backoffice`
- **Logs**: Check Render dashboard

### GitHub Actions:
- **Logs**: Repository → Actions tab
- **Database**: Saved in repository (committed after each run)

---

## Cost Comparison

| Platform | Cost | Notes |
|----------|------|-------|
| **GitHub Actions** | $0/month | 2,000 minutes free, enough for daily runs |
| **Render Free** | $0/month | Web service sleeps after 15min inactivity |
| **Render Paid** | $7/month | Always on, no sleep |
| **OpenAI API** | ~$0.20-0.50/month | Based on gpt-4o-mini usage |

**Recommended for $40K/month revenue goal:**
- Start: GitHub Actions (Free)
- Scale: Render Free tier
- Growth: Render Paid ($7/month) for 24/7 reliability

---

## Monitoring

### Check System Health:
```bash
node health-check.js
```

### Test Automation Locally:
```bash
node main.js --now
```

### View Logs:
```bash
cat logs/activity.log
cat logs/errors.log
```

### Access Dashboard:
```
http://localhost:3000/backoffice
```

---

## Troubleshooting

### OpenAI API Errors:
1. Check billing: https://platform.openai.com/settings/organization/billing
2. Verify API key: https://platform.openai.com/api-keys
3. Ensure environment variables are set in Render

### Platform Posting Failures:
1. Check platform credentials in environment variables
2. Review logs for specific errors
3. Use `platform-debugger` subagent to diagnose

### Database Issues:
1. Ensure `database/` directory exists
2. Check file permissions
3. Review `database.js` logs

---

## Next Steps

1. ✅ Set environment variables in Render
2. ✅ Deploy services
3. ✅ Test with first run
4. ✅ Monitor logs
5. ✅ Scale as revenue grows

Your automation system is ready to generate $40K/month! 🚀
