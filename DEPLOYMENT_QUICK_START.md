# 🚀 Quick Start Deployment Guide

## TL;DR - Where to Go and What to Set

### 🔵 Render (Backend) - dashboard.render.com

**Step 1: Create Web Service**
1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect GitHub repo → Select `gumutonii/eduguard`
4. Configure:
   - **Name**: `eduguard-backend`
   - **Root Directory**: `backend` ⚠️
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

**Step 2: Set Environment Variables**
Go to **Environment** tab, add:
```
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/eduguard
JWT_SECRET=your-random-secret-key-here
FRONTEND_URL=https://your-app.vercel.app (update after Vercel)
CLOUDINARY_CLOUD_NAME=dvblrudum
CLOUDINARY_API_KEY=787958224179297
CLOUDINARY_API_SECRET=ZiwkrOU4sG8WGmB3Yy07miIovUI
```

**Step 3: Deploy**
- Click **"Create Web Service"**
- Wait 5-10 minutes
- Save your backend URL: `https://your-backend.onrender.com`

---

### 🟢 Vercel (Frontend) - vercel.com

**Step 1: Import Project**
1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New..."** → **"Project"**
3. Connect GitHub repo → Select `gumutonii/eduguard`
4. Configure:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend` ⚠️ (Click Edit to set)
   - **Build Command**: `npm run build` (auto)
   - **Output Directory**: `dist` (auto)

**Step 2: Set Environment Variables**
Go to **Settings** → **Environment Variables**, add:
```
VITE_API_URL=https://your-backend.onrender.com/api
```
(Replace with your actual Render backend URL)

**Step 3: Deploy**
- Click **"Deploy"**
- Wait 2-3 minutes
- Save your frontend URL: `https://your-app.vercel.app`

**Step 4: Update Backend CORS**
- Go back to Render
- Update `FRONTEND_URL` to your Vercel URL
- Backend will auto-redeploy

---

## ✅ Automatic Deployments

Both Render and Vercel automatically deploy when you:
- Push to `main` branch
- Merge pull requests to `main`

**No additional setup needed!** 🎉

---

## 📝 Full Guide

For detailed instructions, see: `COMPLETE_DEPLOYMENT_GUIDE.md`

---

## 🧪 Test After Deployment

1. **Backend Health**: `https://your-backend.onrender.com/api/health`
2. **Frontend**: `https://your-app.vercel.app`
3. **Login**: Try logging in to verify everything works

