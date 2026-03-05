# Render Deployment Guide for Life Vault

## Prerequisites
- GitHub repository with your code
- Render account (free tier available)
- Domain name (optional, but recommended)

## 1. Backend Deployment (Node.js)

### Create Render Web Service

1. **Go to Render Dashboard** → **New** → **Web Service**
2. **Connect GitHub Repository**
   - Select your `LifeVault-MERN` repository
   - Choose branch: `main`

3. **Configure Service**
   ```
   Name: life-vault-api
   Environment: Node
   Region: Choose nearest region
   Branch: main
   Root Directory: server
   Build Command: npm install
   Start Command: node api-routes.js
   ```

4. **Environment Variables** (Add these in Render dashboard):
   ```
   MONGODB_URI=mongodb+srv://patankaif23_db_user:lifevault123@lifevault.29gld6x.mongodb.net/lifevault?retryWrites=true&w=majority
   RESEND_API_KEY=your_actual_resend_api_key
   JWT_SECRET=8839e0acac438d4de37ecbc26dd746f8e496a14bb6d597ad02300864c2017ab61301996b92deb37be2bb308d91bb67b2fa8aba647d503065d6312828c1240a9a
   NODE_ENV=production
   PORT=3001
   ```

5. **Advanced Settings**:
   - Auto-Deploy: Yes (on push to main)
   - Health Check Path: `/health`

### Add Health Check Endpoint

Create `server/health.js`:
```javascript
export default function handler(req, res) {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'life-vault-api'
  });
}
```

## 2. Frontend Deployment (React/Vite)

### Create Render Web Service

1. **Go to Render Dashboard** → **New** → **Web Service**
2. **Connect GitHub Repository**
   - Select same repository
   - Branch: `main`

3. **Configure Service**
   ```
   Name: life-vault-frontend
   Environment: Node
   Region: Same as backend
   Branch: main
   Root Directory: client
   Build Command: npm run build
   Start Command: npm run preview
   ```

4. **Environment Variables**:
   ```
   VITE_API_BASE_URL=https://life-vault-api.onrender.com
   VITE_ANALYTICS_ENDPOINT=https://life-vault-frontend.onrender.com
   VITE_ANALYTICS_WEBSITE_ID=prod
   ```

### Update Vite Config

Ensure `client/vite.config.js` has:
```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 3003
  },
  preview: {
    host: true,
    port: 3003
  },
  build: {
    outDir: 'dist'
  }
});
```

## 3. Custom Domain Setup (Optional)

### For Backend API
1. Go to backend service → **Settings** → **Custom Domains**
2. Add: `api.your-domain.com`
3. Update DNS records as instructed by Render

### For Frontend
1. Go to frontend service → **Settings** → **Custom Domains**
2. Add: `your-domain.com`
3. Update DNS records as instructed by Render

## 4. Update Environment Variables

### Backend Environment Variables
```bash
# Production URLs (after custom domain setup)
FRONTEND_URL=https://your-domain.com
OAUTH_SERVER_URL=https://your-domain.com
VITE_ANALYTICS_ENDPOINT=https://your-domain.com
```

### Frontend Environment Variables
```bash
# Update to use custom domain
VITE_API_BASE_URL=https://api.your-domain.com
```

## 5. OAuth Configuration Updates

### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Update authorized JavaScript origins:
   - `https://your-domain.com`
   - `https://life-vault-frontend.onrender.com`
3. Update authorized redirect URIs:
   - `https://your-domain.com/auth/callback`
   - `https://life-vault-frontend.onrender.com/auth/callback`

### GitHub OAuth
1. Go to GitHub → Settings → Developer settings → OAuth Apps
2. Update Homepage URL: `https://your-domain.com`
3. Update Authorization callback URL: `https://your-domain.com/auth/github/callback`

## 6. Resend Domain Verification

1. Go to [Resend Dashboard](https://resend.com/domains)
2. Add your domain: `your-domain.com`
3. Add DNS records:
   - TXT record for domain verification
   - CNAME record for DKIM
   - MX record for email routing

## 7. Testing After Deployment

### Backend Tests
```bash
# Test health endpoint
curl https://life-vault-api.onrender.com/health

# Test API endpoints
curl https://life-vault-api.onrender.com/api/users
```

### Frontend Tests
1. Visit `https://life-vault-frontend.onrender.com`
2. Test user registration/login
3. Test email functionality
4. Test OAuth flows

## 8. Monitoring and Logs

### View Logs
- Backend: Service → **Logs** tab
- Frontend: Service → **Logs** tab

### Health Monitoring
- Both services have built-in health checks
- Monitor response times and error rates

## 9. Common Issues and Solutions

### CORS Issues
Add this to your backend:
```javascript
app.use(cors({
  origin: [
    'https://your-domain.com',
    'https://life-vault-frontend.onrender.com'
  ],
  credentials: true
}));
```

### Environment Variables Not Loading
Ensure all variables are added in Render dashboard, not just in `.env` file.

### Build Failures
Check build logs for missing dependencies or syntax errors.

### Database Connection Issues
Verify MongoDB URI is correct and accessible from Render's network.

## 10. Deployment Commands Summary

### Backend Deployment
```bash
# Push to trigger deployment
git add .
git commit -m "Deploy backend to Render"
git push origin main
```

### Frontend Deployment
```bash
# Push to trigger deployment
git add .
git commit -m "Deploy frontend to Render"
git push origin main
```

## 11. Cost Optimization

### Free Tier Limits
- 750 hours/month per service
- 100GB bandwidth/month
- 512MB RAM per service

### Optimization Tips
- Use efficient database queries
- Implement caching where possible
- Optimize images and assets
- Monitor bandwidth usage

## 12. Security Considerations

- Enable HTTPS (automatic on Render)
- Use environment variables for secrets
- Implement rate limiting
- Regular security updates
- Monitor for suspicious activity

## 13. Backup Strategy

- Database: MongoDB Atlas automated backups
- Code: Git version control
- Environment variables: Document securely
- User data: Regular exports if needed

## Next Steps

1. Deploy backend first
2. Test backend functionality
3. Deploy frontend
4. Test full application
5. Set up custom domain
6. Configure monitoring
7. Set up backups

---

**Note**: This guide assumes you're using Render's free tier. Adjust configurations based on your specific needs and subscription level.
