# EduGuard Deployment Guide

## ✅ Yes, if API routes work in browser with frontend locally, they will work on Render/Vercel

The application is designed to work the same way in production. Here's what you need to configure:

---

## 🔧 Required Environment Variables

### Backend (Render) - Environment Variables

```bash
# Server Configuration
PORT=3000  # Render will set this automatically, but include it
NODE_ENV=production

# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/eduguard

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here-change-in-production
JWT_EXPIRE=7d

# Frontend URL (for CORS) - IMPORTANT: Set this to your Vercel URL
FRONTEND_URL=https://your-app.vercel.app

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@example.com
EMAIL_PASS=your-gmail-app-password-here

# Twilio Configuration (optional)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+250XXXXXXXXX

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=dvblrudum
CLOUDINARY_API_KEY=787958224179297
CLOUDINARY_API_SECRET=ZiwkrOU4sG8WGmB3Yy07miIovUI

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
```

### Frontend (Vercel) - Environment Variables

```bash
# API Configuration - IMPORTANT: Set this to your Render backend URL
VITE_API_URL=https://your-backend.onrender.com/api

# Application Configuration
VITE_APP_NAME=EduGuard
VITE_APP_VERSION=1.0.0
```

---

## 🌐 CORS Configuration Check

The backend CORS is configured to:
1. ✅ Accept requests from `FRONTEND_URL` environment variable
2. ✅ Allow credentials
3. ✅ Support all HTTP methods (GET, POST, PUT, DELETE, PATCH)
4. ✅ Work in development mode

**Important:** Make sure to set `FRONTEND_URL` in Render to your Vercel URL (e.g., `https://your-app.vercel.app`)

---

## 📋 Deployment Steps

### 1. Backend Deployment (Render)

1. **Create a new Web Service on Render**
   - Connect your GitHub repository
   - Select the `backend` folder
   - Build Command: `npm install`
   - Start Command: `npm start`

2. **Set Environment Variables**
   - Copy all variables from `backend/env.example`
   - **CRITICAL:** Set `FRONTEND_URL` to your Vercel URL
   - Set `NODE_ENV=production`
   - Update `MONGODB_URI` with your MongoDB Atlas connection string

3. **After Deployment**
   - Note your Render URL (e.g., `https://eduguard-backend.onrender.com`)
   - Test the health endpoint: `https://eduguard-backend.onrender.com/api/health`

### 2. Frontend Deployment (Vercel)

1. **Import Project to Vercel**
   - Connect your GitHub repository
   - Select the `frontend` folder
   - Framework Preset: Vite

2. **Set Environment Variables**
   - `VITE_API_URL` = `https://your-backend.onrender.com/api`
   - Other optional variables as needed

3. **After Deployment**
   - Update `FRONTEND_URL` in Render backend env vars to your Vercel URL
   - Redeploy backend if needed

---

## 🧪 Testing API Routes

### Health Check (No Auth Required)
```bash
GET https://your-backend.onrender.com/api/health
```

### Public Routes (No Auth Required)
```bash
# Get districts and sectors
GET https://your-backend.onrender.com/api/schools/districts-sectors

# Get schools for registration
GET https://your-backend.onrender.com/api/schools/for-registration

# Get classes for school
GET https://your-backend.onrender.com/api/classes/for-school?schoolId=YOUR_SCHOOL_ID

# Register user
POST https://your-backend.onrender.com/api/auth/register
```

### Protected Routes (Require JWT Token)
All other routes require authentication. Test with:
```bash
# Login first to get token
POST https://your-backend.onrender.com/api/auth/login
Body: { "email": "user@example.com", "password": "password123" }

# Use token in Authorization header
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## ✅ Verification Checklist

Before going live, verify:

- [ ] Backend health check works: `/api/health`
- [ ] CORS is configured with correct `FRONTEND_URL`
- [ ] Frontend `VITE_API_URL` points to Render backend
- [ ] MongoDB connection string is correct
- [ ] JWT_SECRET is set (not default)
- [ ] Cloudinary credentials are set
- [ ] Email credentials are set (if using email features)
- [ ] Test login works end-to-end
- [ ] Test a protected route (e.g., `/api/users/profile`)

---

## 🔍 Why It Works the Same

1. **API Client**: Uses environment variable `VITE_API_URL` - same code, different URL
2. **CORS**: Configured via `FRONTEND_URL` environment variable - same logic, different origin
3. **Authentication**: JWT tokens work the same way regardless of domain
4. **No Hardcoded URLs**: All URLs are environment-based
5. **Proxy Only in Dev**: Vite proxy is development-only, production uses direct API calls

---

## 🚨 Common Issues

### CORS Errors
- **Solution**: Ensure `FRONTEND_URL` in Render matches your Vercel URL exactly (including https://)

### API Not Found
- **Solution**: Check `VITE_API_URL` includes `/api` at the end

### Authentication Errors
- **Solution**: Verify JWT_SECRET is set and same across deployments

### MongoDB Connection
- **Solution**: Ensure MongoDB Atlas allows connections from Render IPs (0.0.0.0/0 for testing)

---

## 📞 Support

If you encounter issues:
1. Check Render logs for backend errors
2. Check Vercel logs for frontend errors
3. Verify all environment variables are set correctly
4. Test API endpoints directly using Postman or curl

