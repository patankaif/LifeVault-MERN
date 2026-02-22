# Life Vault - Memory Preservation Platform

A comprehensive MERN stack application for preserving, organizing, and sharing memories with loved ones. Features secure authentication, hierarchical memory organization, and automated legacy delivery.

## 🎯 Features

### Authentication System
- ✅ Email-based signup with OTP verification
- ✅ Secure login with JWT tokens
- ✅ Password reset with OTP verification
- ✅ Industry-level security with bcrypt hashing
- ✅ Session management and activity tracking

### Three Vault System

#### Present Vault
- Schedule memories to be shared within 1 month
- Unlimited nested slots (e.g., "Dad" → "Dad on a trip")
- Support for images, videos, and text
- Email-based sharing with secure access links

#### Future Vault
- Schedule memories up to 9 months in advance
- Perfect for milestone celebrations
- Same hierarchical structure as Present Vault
- Automated email delivery on scheduled date

#### Death Vault
- Legacy messages for Mom and Dad
- Automatically triggered after 9 months of inactivity
- Confirmation email sent to prevent accidental delivery
- Secure delivery to designated recipients

### Inactivity Detection
- 9-month inactivity threshold
- Automated "are you alive" confirmation email
- 15-day confirmation window
- Automatic Death Vault trigger on failed confirmation
- Activity tracking on every login

### File Management
- S3 integration for image/video storage
- Metadata stored in MongoDB
- Secure file access with expiring links
- Support for multiple media types

## 🛠️ Tech Stack

### Frontend
- **React 19** - UI library
- **Vite** - Build tool and dev server
- **Tailwind CSS 4** - Styling
- **Wouter** - Lightweight routing
- **JavaScript/JSX** - No TypeScript in frontend

### Backend
- **Node.js** - Runtime
- **Express 4** - Web framework
- **MongoDB** - Database
- **JWT** - Authentication
- **SMTP** - Email service
- **S3** - File storage

### Database
- **MongoDB Atlas** - Cloud database
- **Collections**: users, otps, vaults, slots, media, schedules, inactivityLogs

## 📋 Prerequisites

- Node.js v18+ ([Download](https://nodejs.org/))
- pnpm ([Install](https://pnpm.io/installation))
- MongoDB Atlas account ([Create](https://www.mongodb.com/cloud/atlas))
- Gmail account with app password

## 🚀 Quick Start

### 1. Clone/Download Project
```bash
cd /home/ubuntu/life-vault
```

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Setup Environment Variables
Create `.env` file:
```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/<database>?retryWrites=true&w=majority
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
JWT_SECRET=your-secret-key-here
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173
```

### 4. Configure MongoDB Atlas
1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Add your IP to Network Access (0.0.0.0/0 for development)
3. Create database "lifevault"
4. Create collections: users, otps, vaults, slots, media, schedules, inactivityLogs

### 5. Run Development Server
```bash
# Run both frontend and backend
pnpm dev

# Or run separately
# Terminal 1: Backend
pnpm run dev:server

# Terminal 2: Frontend
cd client && pnpm dev
```

### 6. Access Application
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

## 📁 Project Structure

```
life-vault/
├── client/                    # React Frontend
│   ├── src/
│   │   ├── pages/            # Page components (.jsx)
│   │   │   ├── Home.jsx
│   │   │   ├── Signup.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── ForgotPassword.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── PresentVault.jsx
│   │   │   ├── FutureVault.jsx
│   │   │   ├── DeathVault.jsx
│   │   │   ├── SharedVault.jsx
│   │   │   ├── ConfirmAlive.jsx
│   │   │   └── NotFound.jsx
│   │   ├── components/       # Reusable components
│   │   ├── contexts/         # React contexts
│   │   │   └── AuthContext.jsx
│   │   ├── App.jsx           # Main app
│   │   └── main.jsx          # Entry point
│   ├── index.html
│   └── vite.config.js
├── server/                    # Node.js Backend
│   ├── api-routes.js         # API endpoints
│   ├── db-mongo.js           # MongoDB connection
│   ├── auth-utils.js         # Authentication logic
│   ├── vault-utils.js        # Vault operations
│   ├── email-service.js      # Email sending
│   ├── inactivity-utils.js   # Inactivity detection
│   ├── jobs.js               # Background jobs
│   ├── storage.ts            # S3 integration
│   └── _core/                # Core server files
├── .vscode/                   # VS Code config
│   ├── launch.json           # Debug configurations
│   ├── settings.json         # Editor settings
│   └── extensions.json       # Recommended extensions
├── .env                       # Environment variables (create this)
├── SETUP_GUIDE.md            # Detailed setup instructions
├── QUICK_START.sh            # Quick setup script
├── API_TESTING.rest          # API testing examples
├── package.json
└── README.md
```

## 🔧 Available Commands

```bash
# Development
pnpm dev              # Run both frontend and backend
pnpm run dev:server   # Run backend only
cd client && pnpm dev # Run frontend only

# Production
pnpm build            # Build for production
pnpm start            # Start production server

# Utilities
pnpm test             # Run tests
pnpm format           # Format code with Prettier
pnpm check            # TypeScript type checking
```

## 📚 API Endpoints

### Authentication
- `POST /api/auth/send-otp` - Send OTP for signup
- `POST /api/auth/verify-otp` - Verify OTP and create account
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/forgot-password` - Request password reset OTP
- `POST /api/auth/reset-password` - Reset password with OTP

### Vaults
- `GET /api/vaults/present/slots` - Get Present Vault slots
- `GET /api/vaults/future/slots` - Get Future Vault slots
- `GET /api/vaults/death/slots` - Get Death Vault slots
- `POST /api/vaults/{type}/slots` - Create slot
- `DELETE /api/slots/{slotId}` - Delete slot

### Scheduling
- `POST /api/slots/{slotId}/schedule` - Schedule slot to email
- `POST /api/slots/{slotId}/text` - Add text to slot
- `POST /api/slots/{slotId}/media` - Upload media to slot

### Shared Access
- `GET /api/shared-vault/{token}` - Access shared slot
- `POST /api/confirm-alive/{token}` - Confirm alive for inactivity

## 🧪 Testing

### Manual Testing Steps

1. **Signup Flow**
   - Go to http://localhost:5173
   - Click "Get Started"
   - Enter details and receive OTP
   - Verify email and create account

2. **Create Vaults**
   - Login to dashboard
   - Navigate to Present/Future/Death Vault
   - Create slots with names
   - Add text/media to slots

3. **Schedule Sharing**
   - Click "Schedule" on any slot
   - Enter recipient email and date
   - Recipient receives email with access link

4. **Test Inactivity**
   - Set inactivity threshold to 1 minute (for testing)
   - Wait for "are you alive" email
   - Click confirmation link
   - Verify Death Vault timer resets

### API Testing
Use the included `API_TESTING.rest` file with REST Client extension:
1. Install "REST Client" extension in VS Code
2. Open `API_TESTING.rest`
3. Click "Send Request" on any endpoint

## 🐛 Troubleshooting

### MongoDB Connection Error
```
Error: SSL routines:ssl3_read_bytes:tlsv1 alert internal error
```
**Solution:**
1. Verify IP is whitelisted in MongoDB Atlas Network Access
2. Check connection string has correct password
3. Ensure database "lifevault" exists

### Email Not Sending
```
Error: SMTP authentication failed
```
**Solution:**
1. Verify Gmail app password is correct
2. Enable "Less secure app access" in Gmail
3. Check SMTP credentials in `.env`

### Port Already in Use
```
Error: EADDRINUSE: address already in use :::3000
```
**Solution:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
# Or use different port
PORT=3001 pnpm dev
```

## 🔐 Security Features

- ✅ JWT token-based authentication
- ✅ Bcrypt password hashing
- ✅ OTP verification for sensitive operations
- ✅ HTTPS/SSL support
- ✅ Secure session management
- ✅ Email verification
- ✅ Activity tracking
- ✅ Inactivity detection

## 📦 Deployment

### Build for Production
```bash
pnpm build
```

### Deploy to Manus
1. Create checkpoint: `webdev_save_checkpoint`
2. Go to Management UI
3. Click "Publish" button
4. Select checkpoint version
5. Deploy

### Deploy to External Hosting
- Railway, Render, Vercel, Netlify supported
- Set environment variables in hosting dashboard
- Push to GitHub and connect

## 📖 Documentation

- **SETUP_GUIDE.md** - Detailed setup and configuration
- **QUICK_START.sh** - Automated setup script
- **API_TESTING.rest** - API endpoint examples
- **README.md** - This file

## 🤝 Support

For issues or questions:
1. Check SETUP_GUIDE.md troubleshooting section
2. Verify MongoDB Atlas connectivity
3. Check environment variables
4. Review API_TESTING.rest examples
5. Check browser console for errors

## 📝 License

MIT License - Feel free to use and modify

## 👨‍💻 Author & Contact

**Developed by: Patan Mohammad Kaif Khan**

📧 **Email:** patankaif23@gmail.com  
🔗 **GitHub:** [patankaif](https://github.com/patankaif)  
💼 **LinkedIn:** [Patan Mohammad Kaif Khan](https://www.linkedin.com/in/patan-mohammad-kaif-khan-36452a32a/)  
🌐 **Portfolio:** [portfolio-6cth.onrender.com](https://portfolio-6cth.onrender.com)

---

**Built with ❤️ for preserving memories**

For the latest updates and features, check the project repository.
