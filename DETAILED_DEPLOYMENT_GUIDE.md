# Detailed Render Deployment Guide - Life Vault

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Backend Deployment](#backend-deployment)
3. [Frontend Deployment](#frontend-deployment)
4. [Environment Variables Setup](#environment-variables-setup)
5. [Testing & Verification](#testing--verification)
6. [Troubleshooting](#troubleshooting)
7. [Custom Domain Setup](#custom-domain-setup)

---

## Prerequisites

### Required Accounts
- [Render Account](https://render.com) (Free tier available)
- [GitHub Account](https://github.com)
- [MongoDB Atlas Account](https://www.mongodb.com/cloud/atlas)
- [Resend Account](https://resend.com)

### Before You Start
1. **Push latest code to GitHub:**
```bash
git add .
git commit -m "Ready for Render deployment"
git push origin main
```

2. **Verify your repository structure:**
```
LifeVault-MERN/
├── server/
│   ├── api-routes.js
│   ├── email-service.js
│   ├── auth-utils.js
│   ├── health.js
│   └── package.json
├── client/
│   ├── src/
│   ├── public/
│   └── package.json
├── vite.config.ts
├── package.json
└── .env
```

---

## Backend Deployment

### Step 1: Create Render Account
1. Go to [render.com](https://render.com)
2. Click **"Sign Up"**
3. Sign up with GitHub (recommended)
4. Verify your email

### Step 2: Create Backend Web Service

#### 2.1 Navigate to Dashboard
1. After login, you'll see the Render Dashboard
2. Click **"New +"** button in top right
3. Select **"Web Service"**

#### 2.2 Connect Repository
1. **Connect a repository**: Click **"Connect"**
2. **Select GitHub**: Choose your GitHub account
3. **Authorize Render**: Click **"Authorize"**
4. **Select Repository**: Find and select `LifeVault-MERN`
5. **Branch**: Select `main` branch
6. Click **"Connect"**

#### 2.3 Configure Basic Settings
```
Name: life-vault-api
Environment: Node
Region: Oregon (US West) [or closest to you]
Branch: main
Root Directory: server
Runtime: Node 18.x (or latest)
```

#### 2.4 Configure Build & Start Commands
```
Build Command: npm install
Start Command: node api-routes.js
```

#### 2.5 Configure Advanced Settings
1. **Auto-Deploy**: ✅ Enable (on push to main)
2. **Health Check Path**: `/health`
3. **Instance Type**: Free (to start)
4. **Plan**: Free

#### 2.6 Add Environment Variables
Click **"Environment"** tab and add these:

| Variable | Value | Sync |
|----------|-------|------|
| NODE_ENV | production | No |
| PORT | 3001 | No |
| MONGODB_URI | mongodb+srv://patankaif23_db_user:lifevault123@lifevault.29gld6x.mongodb.net/lifevault?retryWrites=true&w=majority | No |
| JWT_SECRET | 8839e0acac438d4de37ecbc26dd746f8e496a14bb6d597ad02300864c2017ab61301996b92deb37be2bb308d91bb67b2fa8aba647d503065d6312828c1240a9a | No |
| RESEND_API_KEY | [Your actual Resend API key] | No |

#### 2.7 Deploy Backend
1. Click **"Create Web Service"**
2. Wait for deployment (2-5 minutes)
3. You'll see logs showing build progress
4. Success: Service will show **"Live"** status

#### 2.8 Test Backend
Once deployed, test these URLs:
```
Health Check: https://life-vault-api.onrender.com/health
API Root: https://life-vault-api.onrender.com/api
```

Expected response for health check:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "service": "life-vault-api",
  "version": "1.0.0"
}
```

---

## Frontend Deployment

### Step 3: Create Frontend Web Service

#### 3.1 Create New Web Service
1. Go back to Render Dashboard
2. Click **"New +"** → **"Web Service"**
3. **Connect Repository**: Same repository `LifeVault-MERN`
4. **Branch**: `main`
5. Click **"Connect"**

#### 3.2 Configure Frontend Settings
```
Name: life-vault-frontend
Environment: Node
Region: Same as backend
Branch: main
Root Directory: . (root of repository)
Runtime: Node 18.x
```

#### 3.3 Configure Build & Start Commands
```
Build Command: npm run build
Start Command: npm run preview
```

#### 3.4 Add Frontend Environment Variables
| Variable | Value | Sync |
|----------|-------|------|
| VITE_API_BASE_URL | https://life-vault-api.onrender.com | No |
| VITE_ANALYTICS_ENDPOINT | https://life-vault-frontend.onrender.com | No |
| VITE_ANALYTICS_WEBSITE_ID | prod | No |

#### 3.5 Configure Advanced Settings
1. **Auto-Deploy**: ✅ Enable
2. **Instance Type**: Free
3. **Plan**: Free

#### 3.6 Deploy Frontend
1. Click **"Create Web Service"**
2. Wait for deployment (3-7 minutes)
3. Monitor build logs
4. Success: Service shows **"Live"**

#### 3.7 Test Frontend
Visit: `https://life-vault-frontend.onrender.com`

You should see:
- Life Vault homepage
- Login/Register forms
- No console errors

---

## Environment Variables Setup

### Backend Environment Variables

#### Required Variables
```bash
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb+srv://patankaif23_db_user:lifevault123@lifevault.29gld6x.mongodb.net/lifevault?retryWrites=true&w=majority
JWT_SECRET=8839e0acac438d4de37ecbc26dd746f8e496a14bb6d597ad02300864c2017ab61301996b92deb37be2bb308d91bb67b2fa8aba647d503065d6312828c1240a9a
RESEND_API_KEY=re_your_actual_api_key_here
```

#### Optional Variables
```bash
FRONTEND_URL=https://life-vault-frontend.onrender.com
OAUTH_SERVER_URL=https://life-vault-frontend.onrender.com
```

### Frontend Environment Variables

```bash
VITE_API_BASE_URL=https://life-vault-api.onrender.com
VITE_ANALYTICS_ENDPOINT=https://life-vault-frontend.onrender.com
VITE_ANALYTICS_WEBSITE_ID=prod
```

---

## Testing & Verification

### Step 4: Complete Application Testing

#### 4.1 Backend Testing
Test these endpoints in your browser or with curl:

```bash
# Health check
curl https://life-vault-api.onrender.com/health

# Test API endpoint
curl https://life-vault-api.onrender.com/api/users

# Test with POST (user registration)
curl -X POST https://life-vault-api.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'
```

#### 4.2 Frontend Testing
1. **Visit**: `https://life-vault-frontend.onrender.com`
2. **Test User Registration**:
   - Click "Sign Up"
   - Enter email, password, name
   - Submit form
   - Check for success/error messages

3. **Test User Login**:
   - Click "Login"
   - Enter credentials
   - Verify successful login

4. **Test Email Functionality**:
   - Try "Forgot Password"
   - Check email receives OTP
   - Verify OTP works

#### 4.3 Integration Testing
1. **Create Account** → **Login** → **Create Vault** → **Add Memory**
2. **Test OAuth** (Google/GitHub) if configured
3. **Test Email Notifications**
4. **Test File Uploads**

---

## Troubleshooting

### Common Issues & Solutions

#### Issue 1: Backend Deployment Fails
**Error**: `npm install` fails
```
Solution:
1. Check package.json exists in server/ directory
2. Verify all dependencies are listed
3. Check for syntax errors in package.json
```

#### Issue 2: Frontend Build Fails
**Error**: Build process stops
```
Solution:
1. Check vite.config.ts configuration
2. Verify all imports are correct
3. Check for TypeScript errors
4. Ensure client/package.json exists
```

#### Issue 3: Database Connection Error
**Error**: `MongoNetworkError`
```
Solution:
1. Verify MONGODB_URI is correct
2. Check MongoDB Atlas network access
3. Ensure IP is whitelisted in Atlas
```

#### Issue 4: CORS Errors
**Error**: `Access-Control-Allow-Origin`
```
Solution:
Add this to your backend (api-routes.js):
import cors from 'cors';

app.use(cors({
  origin: [
    'https://life-vault-frontend.onrender.com',
    'http://localhost:3003'
  ],
  credentials: true
}));
```

#### Issue 5: Environment Variables Not Loading
**Error**: `undefined` variables
```
Solution:
1. Ensure variables are added in Render dashboard
2. Check variable names match exactly
3. Restart service after adding variables
```

#### Issue 6: Email Service Fails
**Error**: Resend API errors
```
Solution:
1. Verify RESEND_API_KEY is correct
2. Check Resend domain verification
3. Ensure from email is verified
```

### Debugging Steps

#### Check Backend Logs
1. Go to Backend Service → **"Logs"** tab
2. Look for error messages
3. Check startup sequence

#### Check Frontend Logs
1. Go to Frontend Service → **"Logs"** tab
2. Look for build errors
3. Check runtime errors

#### Test Locally
```bash
# Test backend locally
cd server
npm install
node api-routes.js

# Test frontend locally
npm run dev
```

---

## Custom Domain Setup

### Step 5: Configure Custom Domain

#### 5.1 Purchase Domain
1. Buy domain from any registrar (GoDaddy, Namecheap, etc.)
2. Note: This is optional but recommended for production

#### 5.2 Backend Custom Domain
1. Go to Backend Service → **"Settings"** → **"Custom Domains"**
2. Click **"Add Custom Domain"**
3. Enter: `api.yourdomain.com`
4. Render will provide DNS records

#### 5.3 Frontend Custom Domain
1. Go to Frontend Service → **"Settings"** → **"Custom Domains"**
2. Click **"Add Custom Domain"**
3. Enter: `yourdomain.com`
4. Render will provide DNS records

#### 5.4 Update DNS Records
At your domain registrar, add these records:

**For Frontend (yourdomain.com):**
```
Type: CNAME
Name: @
Value: cname.vercel-dns.com (or whatever Render provides)
TTL: 300
```

**For Backend (api.yourdomain.com):**
```
Type: CNAME
Name: api
Value: cname.vercel-dns.com (or whatever Render provides)
TTL: 300
```

#### 5.5 Update Environment Variables
After domain is active, update variables:

**Backend:**
```bash
FRONTEND_URL=https://yourdomain.com
OAUTH_SERVER_URL=https://yourdomain.com
```

**Frontend:**
```bash
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_ANALYTICS_ENDPOINT=https://yourdomain.com
```

#### 5.6 Update OAuth Providers
**Google OAuth:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Update authorized JavaScript origins: `https://yourdomain.com`
3. Update redirect URIs: `https://yourdomain.com/auth/google/callback`

**GitHub OAuth:**
1. Go to GitHub → Settings → Developer settings → OAuth Apps
2. Update Homepage URL: `https://yourdomain.com`
3. Update Authorization callback: `https://yourdomain.com/auth/github/callback`

---

## Production Checklist

### Security
- [ ] HTTPS enabled (automatic on Render)
- [ ] Environment variables set
- [ ] CORS configured correctly
- [ ] Rate limiting implemented
- [ ] Input validation in place

### Performance
- [ ] Database indexes optimized
- [ ] Images compressed
- [ ] Caching implemented
- [ ] CDN configured (if using custom domain)

### Monitoring
- [ ] Health checks working
- [ ] Error logging enabled
- [ ] Performance monitoring set up
- [ ] Uptime monitoring configured

### Backup
- [ ] Database backups enabled (MongoDB Atlas)
- [ ] Code backed up (Git)
- [ ] Environment variables documented
- [ ] Recovery plan documented

---

## Next Steps After Deployment

1. **Monitor Performance**: Check Render dashboard for metrics
2. **Set Up Alerts**: Configure email alerts for downtime
3. **Scale Resources**: Upgrade from free tier if needed
4. **Analytics**: Set up Google Analytics or similar
5. **SEO**: Add meta tags and sitemap
6. **Testing**: Regular security and performance testing

---

## Support Resources

- [Render Documentation](https://render.com/docs)
- [Render Status Page](https://status.render.com)
- [MongoDB Atlas Docs](https://docs.atlas.mongodb.com/)
- [Resend Documentation](https://resend.com/docs)

---

## Quick Commands Reference

```bash
# Deploy backend changes
git add .
git commit -m "Update backend"
git push origin main

# Deploy frontend changes
git add .
git commit -m "Update frontend"
git push origin main

# Check deployment status
curl https://life-vault-api.onrender.com/health
curl https://life-vault-frontend.onrender.com

# View logs (in Render dashboard)
# Backend: Service → Logs tab
# Frontend: Service → Logs tab
```

---

**🎉 Congratulations! Your Life Vault application is now deployed on Render!**

For any issues, refer to the troubleshooting section or check the Render documentation.
