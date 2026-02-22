# Life Vault - Complete Setup & Run Guide

## Prerequisites

Before you start, ensure you have the following installed:

1. **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
2. **pnpm** (Package Manager) - Install globally:
   ```bash
   npm install -g pnpm
   ```
3. **VS Code** - [Download](https://code.visualstudio.com/)
4. **MongoDB Atlas Account** - [Create Account](https://www.mongodb.com/cloud/atlas)
5. **Gmail Account** (for SMTP email) - Already configured

---

## Step 1: MongoDB Atlas Setup (CRITICAL)

### 1.1 Create/Verify Your Cluster

1. Go to [MongoDB Atlas Dashboard](https://cloud.mongodb.com)
2. Select your cluster "lifevault"
3. Click **"Connect"** button
4. Choose **"Drivers"** and copy your connection string
5. Replace `<password>` with your actual password

### 1.2 Network Access Configuration

1. In MongoDB Atlas, go to **"Network Access"** (left sidebar)
2. Click **"Add IP Address"**
3. Select **"Allow Access from Anywhere"** (0.0.0.0/0) for development
4. Click **"Confirm"**

### 1.3 Create Database

1. Go to **"Databases"** tab
2. Click **"Create"** or use existing cluster
3. Create a database named **"lifevault"**
4. Create these collections:
   - `users`
   - `otps`
   - `vaults`
   - `slots`
   - `media`
   - `schedules`
   - `inactivityLogs`

---

## Step 2: Environment Variables Setup

### 2.1 Create `.env` file in project root

Create a file named `.env` in `/home/ubuntu/life-vault/`:

```env
# MongoDB
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/<database>?retryWrites=true&w=majority

# Email Service (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# App Configuration
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173
```

### 2.2 Verify `.env` is in `.gitignore`

Open `.gitignore` and ensure `.env` is listed (it should be).

---

## Step 3: Install Dependencies

Open terminal in VS Code and run:

```bash
cd /home/ubuntu/life-vault
pnpm install
```

This will install all dependencies for both frontend and backend.

---

## Step 4: Running the Project

### Option A: Run Both Frontend & Backend Together (Recommended)

#### In VS Code Terminal:

```bash
cd /home/ubuntu/life-vault
pnpm dev
```

This starts:
- **Backend**: Running on `http://localhost:3000`
- **Frontend**: Running on `http://localhost:5173`

#### What you'll see:
```
✓ Frontend dev server running at http://localhost:5173
✓ Backend server running on http://localhost:3000
```

---

### Option B: Run Frontend & Backend Separately

#### Terminal 1 - Backend:

```bash
cd /home/ubuntu/life-vault
pnpm run dev:server
```

Expected output:
```
[MongoDB] Connected successfully to database: lifevault
Server running on http://localhost:3000/
```

#### Terminal 2 - Frontend:

```bash
cd /home/ubuntu/life-vault/client
pnpm run dev
```

Expected output:
```
  VITE v7.1.9  ready in 245 ms

  ➜  Local:   http://localhost:5173/
```

---

## Step 5: Access the Application

1. Open your browser
2. Go to `http://localhost:5173`
3. You should see the Life Vault home page

---

## Step 6: Testing the Application

### Test Signup Flow:

1. Click **"Get Started"** button
2. Enter your details:
   - Name: Test User
   - Age: 25
   - Phone: 9876543210
   - Email: test@example.com
   - Password: TestPass123!
3. You'll receive an OTP email (check spam folder)
4. Enter the OTP
5. Account created successfully!

### Test Login:

1. Click **"Sign In"**
2. Enter your email and password
3. You'll be logged in and redirected to Dashboard

### Test Vaults:

1. Click on **"Present Vault"**, **"Future Vault"**, or **"Death Vault"**
2. Create a slot by entering a name and clicking **"Add Slot"**
3. Click **"Schedule"** to schedule the slot to an email

---

## Step 7: VS Code Extensions (Recommended)

Install these extensions for better development experience:

1. **ES7+ React/Redux/React-Native snippets** - dsznajder.es7-react-js-snippets
2. **MongoDB for VS Code** - mongodb.mongodb-vscode
3. **Thunder Client** or **REST Client** - for API testing
4. **Prettier** - esbenp.prettier-vscode
5. **ESLint** - dbaeumer.vscode-eslint

---

## Step 8: Debugging

### Debug Backend:

1. Add breakpoints in `.js` files
2. Open VS Code Debug panel (Ctrl+Shift+D)
3. Select **"Node.js"** configuration
4. Press **F5** to start debugging

### Debug Frontend:

1. Add breakpoints in `.jsx` files
2. Open browser DevTools (F12)
3. Go to **"Sources"** tab
4. Set breakpoints and debug

---

## Step 9: Build for Production

```bash
cd /home/ubuntu/life-vault
pnpm build
```

This creates optimized production builds in `dist/` folder.

---

## Step 10: Common Issues & Solutions

### Issue: MongoDB Connection Error

**Error**: `SSL routines:ssl3_read_bytes:tlsv1 alert internal error`

**Solution**:
1. Verify your IP is whitelisted in MongoDB Atlas Network Access
2. Check the connection string has correct password
3. Ensure database "lifevault" exists
4. Try: `ping cluster.mongodb.net` to verify connectivity

### Issue: Email not sending

**Error**: `SMTP authentication failed`

**Solution**:
1. Verify Gmail app password is correct
2. Enable "Less secure app access" in Gmail settings
3. Check SMTP credentials in `.env` file

### Issue: Port 3000 already in use

**Error**: `Error: listen EADDRINUSE: address already in use :::3000`

**Solution**:
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 pnpm dev
```

### Issue: Frontend can't connect to backend

**Error**: `Failed to fetch from http://localhost:3000`

**Solution**:
1. Ensure backend is running on port 3000
2. Check `FRONTEND_URL` in backend `.env`
3. Verify CORS is enabled in backend

---

## Step 11: Project Structure

```
life-vault/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── pages/         # Page components (.jsx)
│   │   ├── components/    # Reusable components
│   │   ├── contexts/      # React contexts (AuthContext)
│   │   ├── App.jsx        # Main app component
│   │   └── main.jsx       # Entry point
│   ├── index.html         # HTML template
│   └── vite.config.js     # Vite configuration
├── server/                 # Node.js Backend
│   ├── api-routes.js      # API endpoints
│   ├── db-mongo.js        # MongoDB connection
│   ├── auth-utils.js      # Authentication logic
│   ├── vault-utils.js     # Vault operations
│   ├── email-service.js   # Email sending
│   ├── jobs.js            # Background jobs
│   └── _core/             # Core server files
├── drizzle/               # Database schema (legacy)
├── .env                   # Environment variables (create this)
├── package.json           # Dependencies
└── SETUP_GUIDE.md        # This file
```

---

## Step 12: Useful Commands

```bash
# Install dependencies
pnpm install

# Run development server (both frontend & backend)
pnpm dev

# Run only backend
pnpm run dev:server

# Run only frontend
cd client && pnpm dev

# Build for production
pnpm build

# Run production build
pnpm start

# Run tests
pnpm test

# Format code
pnpm format

# Type check
pnpm check
```

---

## Step 13: API Endpoints Reference

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
- `POST /api/vaults/present/slots` - Create slot in Present Vault
- `DELETE /api/slots/:slotId` - Delete a slot

### Scheduling
- `POST /api/slots/:slotId/schedule` - Schedule slot to email
- `POST /api/slots/:slotId/media` - Upload media to slot
- `POST /api/slots/:slotId/text` - Add text to slot

### Shared Access
- `GET /api/shared-vault/:token` - Access shared slot via token
- `POST /api/confirm-alive/:token` - Confirm alive for inactivity

---

## Step 14: Deployment (Optional)

When ready to deploy:

1. **Build the project**:
   ```bash
   pnpm build
   ```

2. **Deploy to Manus** (using the Management UI):
   - Go to Management UI → Publish button
   - Select your checkpoint
   - Click Publish

3. **Or deploy to external hosting** (Railway, Render, Vercel):
   - Follow their deployment guides
   - Set environment variables in their dashboard
   - Push to GitHub and connect

---

## Support & Troubleshooting

If you encounter issues:

1. Check the error message in terminal
2. Review this guide's "Common Issues" section
3. Check MongoDB Atlas connectivity
4. Verify all environment variables are set correctly
5. Ensure all ports (3000, 5173) are available

---

## Next Steps

1. ✅ Complete MongoDB setup
2. ✅ Create `.env` file with credentials
3. ✅ Run `pnpm install`
4. ✅ Start with `pnpm dev`
5. ✅ Test signup/login flow
6. ✅ Create vaults and test scheduling
7. ✅ Deploy when ready

---

**Happy coding! 🚀**

For questions or issues, refer back to this guide or check the project's API documentation.
