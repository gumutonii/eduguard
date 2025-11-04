# Vercel Build Fix - Step by Step

## The Problem
Vercel is running `vercel build` instead of your actual build command, which means it's not properly detecting your project structure.

## Solution

### Step 1: Update Vercel Project Settings

1. Go to **Vercel Dashboard** → Your Project
2. Click **Settings** → **General**
3. Scroll down to **Build and Development Settings**

### Step 2: Override Build Settings

In the **Build and Development Settings** section:

1. **Framework Preset**: Keep as `Vite`
2. **Root Directory**: Make sure it's set to `frontend`
3. **Override** section - Enable these toggles:

   **Build Command Override:**
   - Toggle: **ON** (enabled)
   - Value: `npm run build`
   
   **Output Directory Override:**
   - Toggle: **ON** (enabled)
   - Value: `dist`
   
   **Install Command Override:**
   - Toggle: **ON** (enabled)
   - Value: `npm install`

### Step 3: Verify Environment Variables

Go to **Settings** → **Environment Variables**:
- Make sure `VITE_API_URL` = `https://eduguard-w5tr.onrender.com/api`

### Step 4: Redeploy

1. Go to **Deployments** tab
2. Click the **three dots** (⋯) on the latest deployment
3. Click **Redeploy**
4. Or push a new commit to trigger auto-deploy

---

## Alternative: If Override Doesn't Work

If the override settings don't appear, try this:

1. **Delete the project** in Vercel (don't worry, you can recreate it)
2. **Re-import** the project
3. When configuring, make sure:
   - **Root Directory**: `frontend` (click Edit)
   - **Framework Preset**: `Vite`
4. **Before clicking Deploy**, go to **Environment Variables**:
   - Add: `VITE_API_URL` = `https://eduguard-w5tr.onrender.com/api`
5. Click **Deploy**

---

## Why This Happens

When Vercel sees a monorepo, it sometimes runs `vercel build` to auto-detect the framework. But with a subdirectory, it needs explicit instructions to:
- Work within the `frontend` folder
- Use the correct build command
- Output to the correct directory

The override settings force Vercel to use your specific commands instead of auto-detection.

