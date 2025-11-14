# 🚀 QUICK START - Upload to GitHub & Deploy to Render

## For: FXCOOP (https://github.com/FXCOOP)

---

## ⚡ STEP 1: Update Your Affiliate Links (2 minutes)

Open ALL `.html` files and replace:
```
https://shopify.pxf.io/yourafflink
```

With YOUR actual Shopify affiliate link.

**How to do this fast:**
1. Open VS Code
2. Press `Ctrl + Shift + F` (Find in Files)
3. Find: `https://shopify.pxf.io/yourafflink`
4. Replace: `YOUR_ACTUAL_SHOPIFY_AFFILIATE_LINK`
5. Click "Replace All"

---

## 📦 STEP 2: Upload to GitHub (5 minutes)

Open **Command Prompt** or **Git Bash** in the `shopify-hub` folder and run these commands:

```bash
# 1. Initialize git (if not already done)
git init

# 2. Add all files
git add .

# 3. Commit
git commit -m "Initial commit - Shopify affiliate minisite"

# 4. Add your GitHub remote
git remote add origin https://github.com/FXCOOP/shopify-affiliate-hub.git

# 5. Push to GitHub
git branch -M main
git push -u origin main
```

**Note:** You'll need to create the repository first on GitHub:
1. Go to https://github.com/new
2. Repository name: `shopify-affiliate-hub`
3. Keep it public (required for free Render hosting)
4. DON'T check "Initialize with README"
5. Click "Create repository"

Then run the commands above.

---

## 🌐 STEP 3: Deploy to Render (3 minutes)

1. Go to https://dashboard.render.com/
2. Click "New +" → "Static Site"
3. Click "Connect GitHub" (authorize if needed)
4. Select repository: `FXCOOP/shopify-affiliate-hub`
5. Settings:
   - **Name:** `shopify-success-hub`
   - **Branch:** `main`
   - **Build Command:** Leave empty
   - **Publish Directory:** `.`
6. Click "Create Static Site"

**Done!** Your site will be live at:
`https://shopify-success-hub.onrender.com`

---

## 🔄 To Update Your Site Later

After making changes, just run:

```bash
git add .
git commit -m "Updated content"
git push
```

Render will automatically redeploy! ✨

---

## ✅ Verify Everything Works

Open your site and check:
- [ ] Homepage loads
- [ ] All navigation links work
- [ ] Calculator functions
- [ ] Forms display
- [ ] Mobile responsive (test on phone)
- [ ] Affiliate links work (click one to test)

---

## 🎯 Next Steps

1. Share calculator tool on Reddit
2. Create Pinterest pins
3. Set up Google Analytics
4. Start building email list
5. Post to social media

**Your site is ready to make money!** 💰
