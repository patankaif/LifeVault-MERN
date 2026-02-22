# Life Vault - Local Setup Guide (For Your Mac)

## 📋 Prerequisites

Before you start, make sure you have these installed on your Mac:

1. **Node.js v18+** - [Download](https://nodejs.org/)
   - Check: `node --version`
   
2. **pnpm** (Package Manager)
   - Install: `npm install -g pnpm`
   - Check: `pnpm --version`

3. **VS Code** - [Download](https://code.visualstudio.com/)

---

## 🚀 Step-by-Step Setup

### Step 1: Download the Project

1. Download the `life-vault.zip` file
2. Extract it to your desired location (e.g., `~/Downloads/life-vault`)
3. Open the folder in VS Code:
   ```bash
   cd ~/Downloads/life-vault
   code .
   ```

### Step 2: Verify `.env` File

The `.env` file is already created with all credentials in the project root.

**Location:** `life-vault/.env`

**Contents:**
```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/<database>?retryWrites=true&w=majority
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-12345
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173
```

✅ This file is already in the project root!

### Step 3: Install Dependencies

Open terminal in VS Code (`Cmd+` ` on Mac) and run:

```bash
pnpm install
```

**What this does:**
- Downloads all required packages (778 dependencies)
- Takes about 2-3 minutes
- Creates `node_modules` folder

**Expected output:**
```
Packages: +778
Done in 17.4s using pnpm v10.4.1
```

### Step 4: Start the Development Server

Run this command:

```bash
pnpm dev
```

**What this does:**
- Starts both frontend and backend servers
- Frontend runs on: `http://localhost:5173`
- Backend runs on: `http://localhost:3000`

**Expected output:**
```
✓ Frontend dev server running at http://localhost:5173
✓ Backend server running on http://localhost:3000
[MongoDB] Connected successfully to database: lifevault
[Email Service] SMTP connection successful
```

### Step 5: Open in Browser

Open your browser and go to:
```
http://localhost:5173
```

You should see the **Life Vault** home page! 🎉

---

## 📚 What Each Command Does

| Command | Purpose |
|---------|---------|
| `pnpm install` | Install all dependencies |
| `pnpm dev` | Run both frontend and backend |
| `pnpm run dev:server` | Run only backend |
| `cd client && pnpm dev` | Run only frontend |
| `pnpm build` | Build for production |
| `pnpm test` | Run tests |

---

## 🧪 Test the Application

### 1. Test Signup:
- Click **"Get Started"** button
- Fill in the form:
  - Name: Test User
  - Age: 25
  - Phone: 9876543210
  - Email: test@example.com
  - Password: TestPass123!
- Click **"Sign Up"**
- Check your email for OTP (check spam folder)
- Enter OTP and verify
- ✅ Account created!

### 2. Test Login:
- Click **"Sign In"**
- Email: test@example.com
- Password: TestPass123!
- ✅ You're logged in!

### 3. Test Vaults:
- Click **"Present Vault"**
- Enter slot name: "Birthday"
- Click **"Add Slot"**
- Click **"Schedule"** to schedule to an email
- ✅ Slot created and scheduled!

---

## 🐛 Troubleshooting

### Issue: "pnpm: command not found"
**Solution:**
```bash
npm install -g pnpm
```

### Issue: Port 3000 already in use
**Solution:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 pnpm dev
```

### Issue: MongoDB connection error
**Solution:**
1. Check your internet connection
2. Verify MongoDB Atlas Network Access includes your IP
3. Check `.env` file has correct connection string

### Issue: Email not sending
**Solution:**
1. Check Gmail app password in `.env` is correct: `qhgu hphj xmbz ihpu`
2. Check spam folder for emails
3. Verify 2-Step Verification is enabled on Gmail

### Issue: Frontend can't connect to backend
**Solution:**
1. Ensure backend is running on port 3000
2. Check browser console (F12) for errors
3. Verify `.env` has `FRONTEND_URL=http://localhost:5173`

---

## 📁 Project Structure

```
life-vault/
├── client/                    # React Frontend
│   ├── src/
│   │   ├── pages/            # Page components (.jsx)
│   │   ├── components/       # Reusable components
│   │   ├── contexts/         # React contexts
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   └── vite.config.js
├── server/                    # Node.js Backend
│   ├── api-routes.js
│   ├── db-mongo.js
│   ├── auth-utils.js
│   ├── vault-utils.js
│   ├── email-service.js
│   └── _core/
├── .env                       # ✅ Already created!
├── package.json
├── README.md
└── SETUP_GUIDE.md
```

---

## 🎯 VS Code Extensions (Recommended)

Install these for better development experience:

1. **ES7+ React/Redux/React-Native snippets** - dsznajder.es7-react-js-snippets
2. **Prettier** - esbenp.prettier-vscode
3. **ESLint** - dbaeumer.vscode-eslint
4. **Tailwind CSS IntelliSense** - bradlc.vscode-tailwindcss
5. **REST Client** - humao.rest-client (for API testing)

---

## 🔧 Useful VS Code Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+` ` | Open/Close Terminal |
| `Cmd+Shift+D` | Open Debug panel |
| `F5` | Start Debugging |
| `Cmd+S` | Save file |
| `Cmd+Shift+P` | Command palette |

---

## 📊 Architecture Overview

**Frontend (React):**
- Pages: Home, Signup, Login, Dashboard, Vaults, etc.
- Styling: Tailwind CSS
- Routing: Wouter
- State: React Context (AuthContext)

**Backend (Node.js):**
- Framework: Express
- Database: MongoDB Atlas
- Authentication: JWT + OTP
- Email: Gmail SMTP
- File Storage: S3

**Database (MongoDB):**
- Collections: users, otps, vaults, slots, media, schedules, inactivityLogs
- Connection: MongoDB Atlas Cloud

---

## ✅ Checklist

- [ ] Node.js installed (`node --version`)
- [ ] pnpm installed (`pnpm --version`)
- [ ] Project downloaded and extracted
- [ ] `.env` file exists in project root
- [ ] Opened project in VS Code
- [ ] Ran `pnpm install`
- [ ] Ran `pnpm dev`
- [ ] Opened `http://localhost:5173` in browser
- [ ] Tested signup/login flow
- [ ] Created a vault and slot

---

## 🎉 You're All Set!

Your Life Vault application is now running locally! 

**Next Steps:**
1. Explore the application
2. Test all features
3. Customize as needed
4. Deploy when ready

---

## 📞 Need Help?

1. Check the troubleshooting section above
2. Review the error message in the terminal
3. Check browser console (F12) for frontend errors
4. Verify `.env` file has all credentials

---

**Happy coding! 🚀**

For more details, see:
- `README.md` - Project overview
- `SETUP_GUIDE.md` - Detailed setup instructions
- `VSCODE_GUIDE.md` - VS Code specific guide
