# 🚀 Complete Deployment Guide - Render (Backend) + Vercel (Frontend)

This guide will help you deploy your EduGuard application with automatic deployments from GitHub.

---

## 📋 Prerequisites

1. **GitHub Repository** - Your code must be pushed to GitHub
2. **Render Account** - Sign up at [render.com](https://render.com) (free tier available)
3. **Vercel Account** - Sign up at [vercel.com](https://vercel.com) (free tier available)
4. **MongoDB Atlas Account** - Sign up at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) (free tier available)

---

## 🗄️ Step 1: Setup MongoDB Atlas (Database)

### 1.1 Create MongoDB Atlas Account
1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Click "Try Free"
3. Sign up with your email

### 1.2 Create a Cluster
1. Select **FREE** tier (M0)
2. Choose a cloud provider (AWS recommended)
3. Select a region closest to you
4. Click "Create Cluster" (takes 3-5 minutes)

### 1.3 Create Database User
1. Go to **Database Access** (left sidebar)
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. Enter username and password (save these!)
5. Set privileges to **"Atlas admin"** or **"Read and write to any database"**
6. Click **"Add User"**

### 1.4 Whitelist IP Addresses
1. Go to **Network Access** (left sidebar)
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (for Render deployment)
   - Or add specific IPs: `0.0.0.0/0`
4. Click **"Confirm"**

### 1.5 Get Connection String
1. Go to **Database** (left sidebar)
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. Copy the connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/eduguard`)
5. Replace `<password>` with your database user password
6. Replace `<dbname>` with `eduguard` (or your preferred database name)

**✅ Save this connection string - you'll need it for Render!**

---

## 🔵 Step 2: Deploy Backend to Render

### 2.1 Create Render Account
1. Go to [render.com](https://render.com)
2. Click **"Get Started for Free"**
3. Sign up with GitHub (recommended) or email

### 2.2 Create New Web Service
1. Click **"New +"** button (top right)
2. Select **"Web Service"**
3. Connect your GitHub account (if not already connected)
4. Select your repository: `gumutonii/eduguard` (or your repo name)

### 2.3 Configure Backend Service

**Basic Settings:**
- **Name**: `eduguard-backend` (or your preferred name)
- **Region**: Choose closest to you
- **Branch**: `main` (or your default branch)
- **Root Directory**: `backend` ⚠️ **IMPORTANT: Set this!**
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Plan**: `Free` (or paid if you prefer)

**Advanced Settings:**
- **Auto-Deploy**: `Yes` (deploys automatically on push to main branch)

### 2.4 Set Environment Variables

Click **"Environment"** tab and add these variables:

```bash
# Server Configuration
NODE_ENV=production
PORT=3000

# MongoDB Configuration (from Step 1.5)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/eduguard

# JWT Configuration (generate a strong random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-to-random-string
JWT_EXPIRE=7d

# Frontend URL (we'll update this after Vercel deployment)
FRONTEND_URL=https://your-app.vercel.app

# Email Configuration (optional but recommended)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=dvblrudum
CLOUDINARY_API_KEY=787958224179297
CLOUDINARY_API_SECRET=ZiwkrOU4sG8WGmB3Yy07miIovUI

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
```

**⚠️ Important Notes:**
- Replace `your-super-secret-jwt-key-change-this-to-random-string` with a strong random string (you can generate one at [randomkeygen.com](https://randomkeygen.com))
- Replace `your-email@gmail.com` and `your-gmail-app-password` with your actual Gmail credentials (if using email features)
- Keep `FRONTEND_URL` as a placeholder for now - we'll update it after Vercel deployment

### 2.5 Deploy
1. Click **"Create Web Service"**
2. Render will start building and deploying your backend
3. Wait 5-10 minutes for first deployment
4. Once deployed, you'll see: **"Your service is live at https://eduguard-backend.onrender.com"**

**✅ Save your Render backend URL!**

### 2.6 Test Backend
1. Open your backend URL in browser: `https://your-backend.onrender.com/api/health`
2. You should see: `{"status":"OK","message":"EduGuard API is running",...}`
3. If you see this, your backend is working! ✅

---

## 🟢 Step 3: Deploy Frontend to Vercel

### 3.1 Create Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Click **"Sign Up"**
3. Sign up with GitHub (recommended)

### 3.2 Import Project
1. Click **"Add New..."** → **"Project"**
2. Select your repository: `gumutonii/eduguard` (or your repo name)
3. Click **"Import"**

### 3.3 Configure Frontend Project

**Framework Preset:**
- **Framework Preset**: `Vite` (should auto-detect)

**Project Settings:**
- **Root Directory**: Click **"Edit"** → Set to `frontend` ⚠️ **IMPORTANT!**
- **Build Command**: `npm run build` (auto-detected)
- **Output Directory**: `dist` (auto-detected)
- **Install Command**: `npm install` (auto-detected)

**Environment Variables:**
Click **"Environment Variables"** and add:

```bash
VITE_API_URL=https://your-backend.onrender.com/api
```

**⚠️ Replace `your-backend.onrender.com` with your actual Render backend URL!**

### 3.4 Deploy
1. Click **"Deploy"**
2. Vercel will build and deploy your frontend
3. Wait 2-3 minutes
4. Once deployed, you'll see: **"Your site is live at https://your-app.vercel.app"**

**✅ Save your Vercel frontend URL!**

### 3.5 Update Backend CORS
1. Go back to **Render Dashboard**
2. Click on your backend service
3. Go to **"Environment"** tab
4. Find `FRONTEND_URL` variable
5. Update it to: `https://your-app.vercel.app` (your Vercel URL)
6. Click **"Save Changes"**
7. Render will automatically redeploy with new CORS settings

---

## 🔄 Step 4: Enable Automatic Deployments

### 4.1 Render Auto-Deploy (Already Enabled)
- ✅ Render automatically deploys when you push to `main` branch
- No additional setup needed!

### 4.2 Vercel Auto-Deploy (Already Enabled)
- ✅ Vercel automatically deploys when you push to `main` branch
- No additional setup needed!

### 4.3 GitHub Actions (Optional - Already Created)
- ✅ GitHub Actions workflow is already in `.github/workflows/ci-cd.yml`
- It will run tests and build checks on every push
- View results in GitHub → **Actions** tab

---

## ✅ Step 5: Verify Everything Works

### 5.1 Test Backend Health
```
https://your-backend.onrender.com/api/health
```
Expected: `{"status":"OK","message":"EduGuard API is running",...}`

### 5.2 Test Public Endpoint
```
https://your-backend.onrender.com/api/schools/districts-sectors
```
Expected: JSON with districts and sectors data

### 5.3 Test Frontend
1. Open your Vercel URL: `https://your-app.vercel.app`
2. You should see the EduGuard landing page
3. Try logging in (if you have test users)

### 5.4 Test Full Flow
1. Register a new user on frontend
2. Login with credentials
3. Check if dashboard loads
4. Verify API calls work (check browser console for errors)

---

## 🔧 Step 6: Custom Domains (Optional)

### 6.1 Custom Domain for Render Backend
1. Go to Render Dashboard → Your Service
2. Click **"Custom Domains"**
3. Add your domain (e.g., `api.yourdomain.com`)
4. Follow DNS configuration instructions

### 6.2 Custom Domain for Vercel Frontend
1. Go to Vercel Dashboard → Your Project
2. Click **"Settings"** → **"Domains"**
3. Add your domain (e.g., `yourdomain.com`)
4. Follow DNS configuration instructions

---

## 📝 Environment Variables Summary

### Render (Backend) - Required Variables:
```bash
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
FRONTEND_URL=https://your-app.vercel.app
CLOUDINARY_CLOUD_NAME=dvblrudum
CLOUDINARY_API_KEY=787958224179297
CLOUDINARY_API_SECRET=ZiwkrOU4sG8WGmB3Yy07miIovUI
```

### Vercel (Frontend) - Required Variables:
```bash
VITE_API_URL=https://your-backend.onrender.com/api
```

---

## 🐛 Troubleshooting

### Backend Issues

**Problem: Build fails**
- Check Render logs for errors
- Verify `Root Directory` is set to `backend`
- Verify `Start Command` is `npm start`

**Problem: MongoDB connection fails**
- Verify MongoDB Atlas IP whitelist includes `0.0.0.0/0`
- Check `MONGODB_URI` is correct (replace `<password>` and `<dbname>`)
- Verify database user has correct permissions

**Problem: CORS errors**
- Verify `FRONTEND_URL` matches your Vercel URL exactly
- Check that backend is redeployed after updating `FRONTEND_URL`

### Frontend Issues

**Problem: Build fails**
- Check Vercel build logs
- Verify `Root Directory` is set to `frontend`
- Verify `VITE_API_URL` is set correctly

**Problem: API calls fail**
- Verify `VITE_API_URL` points to your Render backend URL
- Check browser console for CORS errors
- Verify backend is running and accessible

**Problem: 404 errors**
- Add `vercel.json` for SPA routing (see below)

---

## 📄 Additional Configuration Files

### Create `vercel.json` in root (for SPA routing)

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**⚠️ Note:** Vercel should auto-detect Vite, but if routing doesn't work, add this file.

---

## 🎉 Success Checklist

- [ ] MongoDB Atlas cluster created and accessible
- [ ] Backend deployed to Render and health check passes
- [ ] Frontend deployed to Vercel and loads correctly
- [ ] `FRONTEND_URL` in Render matches Vercel URL
- [ ] `VITE_API_URL` in Vercel points to Render backend
- [ ] Can login and access dashboard
- [ ] GitHub Actions workflow passes (optional)
- [ ] Automatic deployments work (push to main triggers deployment)

---

## 📚 Quick Reference Links

- **Render Dashboard**: [dashboard.render.com](https://dashboard.render.com)
- **Vercel Dashboard**: [vercel.com/dashboard](https://vercel.com/dashboard)
- **MongoDB Atlas**: [cloud.mongodb.com](https://cloud.mongodb.com)
- **GitHub Actions**: Your repo → **Actions** tab

---

## 🆘 Need Help?

1. **Render Logs**: Render Dashboard → Your Service → **Logs** tab
2. **Vercel Logs**: Vercel Dashboard → Your Project → **Deployments** → Click deployment → **Build Logs**
3. **GitHub Actions**: Your repo → **Actions** tab → Click workflow run → View logs

---

**🎊 Congratulations! Your EduGuard app is now live and will auto-deploy on every push to main!**

