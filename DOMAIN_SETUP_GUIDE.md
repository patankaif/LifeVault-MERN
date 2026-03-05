# Domain Setup Guide for Life Vault

## After Domain Creation Checklist

### 1. Update Environment Variables
Replace `your-domain.com` in `.env` with your actual domain:

```bash
DOMAIN=your-actual-domain.com
FRONTEND_URL=https://your-actual-domain.com
OAUTH_SERVER_URL=https://your-actual-domain.com
VITE_ANALYTICS_ENDPOINT=https://your-actual-domain.com
VITE_API_BASE_URL=https://api.your-actual-domain.com
```

### 2. Resend Domain Verification
1. Go to [Resend Dashboard](https://resend.com/domains)
2. Add your domain (`your-actual-domain.com`)
3. Verify DNS records:
   - Add TXT record for verification
   - Add CNAME record for DKIM
   - Add MX record for email routing

### 3. Update Email From Address
In `server/email-service.js`, update the from address:
```javascript
from: 'Life Vault <noreply@your-actual-domain.com>',
```

### 4. SSL Certificate
Ensure SSL is configured for your domain to use HTTPS.

### 5. CORS Configuration
Update any CORS settings to include your new domain.

### 6. OAuth Providers
Update OAuth callback URLs in:
- Google Console
- GitHub OAuth App
- Any other providers

## Deployment URLs Structure

- **Frontend**: `https://your-domain.com`
- **API**: `https://api.your-domain.com` (if using subdomain)
- **Email**: `noreply@your-domain.com`

## Testing After Domain Setup

1. Test email sending with new domain
2. Verify OAuth flows work with new URLs
3. Check all API endpoints use HTTPS
4. Test frontend functionality

## Notes

- Keep development URLs commented for local testing
- Update `NODE_ENV=production` for production deployment
- Restart services after updating environment variables
