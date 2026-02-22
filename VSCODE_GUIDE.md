# Life Vault - VS Code Complete Guide

This guide shows you exactly how to run Life Vault in VS Code with step-by-step instructions.

## 📋 Prerequisites

1. **VS Code installed** - [Download](https://code.visualstudio.com/)
2. **Node.js v18+** - [Download](https://nodejs.org/)
3. **pnpm installed** - Run in terminal: `npm install -g pnpm`
4. **MongoDB Atlas account** - [Create](https://www.mongodb.com/cloud/atlas)
5. **Gmail account** - Already configured

## 🎯 Step 1: Open Project in VS Code

### Method 1: From Terminal
```bash
# Navigate to project
cd /home/ubuntu/life-vault

# Open in VS Code
code .
```

### Method 2: From VS Code UI
1. Open VS Code
2. Click **File** → **Open Folder**
3. Navigate to `/home/ubuntu/life-vault`
4. Click **Select Folder**

## 🔧 Step 2: Install Recommended Extensions

VS Code will prompt you to install recommended extensions. Click **Install All** or install manually:

1. **ES7+ React/Redux/React-Native snippets** (dsznajder.es7-react-js-snippets)
2. **MongoDB for VS Code** (mongodb.mongodb-vscode)
3. **Prettier** (esbenp.prettier-vscode)
4. **ESLint** (dbaeumer.vscode-eslint)
5. **Tailwind CSS IntelliSense** (bradlc.vscode-tailwindcss)
6. **REST Client** (humao.rest-client) - For API testing
7. **Debugger for Chrome** (ms-debugger-for-chrome) - For frontend debugging

**To install:**
1. Click **Extensions** icon (left sidebar)
2. Search for extension name
3. Click **Install**

## 📝 Step 3: Create `.env` File

1. In VS Code, right-click on project root folder
2. Select **New File**
3. Name it `.env`
4. Paste this content:

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

5. Save file (Ctrl+S)

## 🚀 Step 4: Install Dependencies

### Method 1: Using VS Code Terminal (Recommended)

1. Click **Terminal** → **New Terminal** (or press Ctrl+`)
2. Run:
```bash
pnpm install
```

3. Wait for installation to complete (this takes 2-3 minutes)

### Method 2: Using Quick Start Script

```bash
chmod +x QUICK_START.sh
./QUICK_START.sh
```

## ▶️ Step 5: Run the Project

### Option A: Run Everything Together (Easiest)

In the terminal, run:
```bash
pnpm dev
```

**Expected output:**
```
✓ Frontend dev server running at http://localhost:5173
✓ Backend server running on http://localhost:3000
```

Then open browser to: **http://localhost:5173**

---

### Option B: Run Backend & Frontend in Separate Terminals

#### Terminal 1 - Backend:
```bash
pnpm run dev:server
```

Expected output:
```
[MongoDB] Connected successfully to database: lifevault
Server running on http://localhost:3000/
```

#### Terminal 2 - Frontend:
1. Click **Terminal** → **New Terminal**
2. Run:
```bash
cd client
pnpm dev
```

Expected output:
```
VITE v7.1.9  ready in 245 ms
➜  Local:   http://localhost:5173/
```

Then open browser to: **http://localhost:5173**

---

### Option C: Use VS Code Debug Mode

1. Click **Run and Debug** icon (left sidebar, or Ctrl+Shift+D)
2. Click **"Full Stack (Backend + Frontend)"** in the dropdown
3. Press **F5** or click the green play button
4. Both backend and frontend start with debugging enabled

## 🌐 Access the Application

Once running, open your browser and go to:

```
http://localhost:5173
```

You should see the Life Vault home page with:
- "Life Vault" logo
- Feature overview
- "Get Started" button

## 🧪 Test the Application

### Test Signup:
1. Click **"Get Started"**
2. Fill in form:
   - Name: Test User
   - Age: 25
   - Phone: 9876543210
   - Email: test@example.com
   - Password: TestPass123!
   - Confirm Password: TestPass123!
3. Click **"Sign Up"**
4. Check email for OTP (check spam folder)
5. Enter OTP and verify
6. Account created!

### Test Login:
1. Click **"Sign In"**
2. Enter email: test@example.com
3. Enter password: TestPass123!
4. Click **"Login"**
5. You're now on the Dashboard!

### Test Vaults:
1. Click **"Present Vault"**
2. Enter slot name: "Birthday"
3. Click **"Add Slot"**
4. Click **"Schedule"** on the slot
5. Enter recipient email and date
6. Click **"Schedule"**

## 🐛 Debugging

### Debug Backend

1. Open VS Code Debug panel (Ctrl+Shift+D)
2. Select **"Backend (Node.js)"** from dropdown
3. Press **F5** to start debugging
4. Add breakpoints by clicking line numbers
5. Execution will pause at breakpoints

### Debug Frontend

1. Open browser DevTools (F12)
2. Go to **Sources** tab
3. Click breakpoints on left side
4. Interact with app to trigger breakpoints
5. Step through code using controls

### View Console Logs

1. **Backend logs**: Check VS Code terminal
2. **Frontend logs**: Open browser DevTools (F12) → Console tab

## 📁 File Structure in VS Code

```
life-vault/
├── client/                    # Frontend code
│   └── src/
│       ├── pages/            # Page components
│       ├── components/       # Reusable components
│       ├── contexts/         # React contexts
│       ├── App.jsx
│       └── main.jsx
├── server/                    # Backend code
│   ├── api-routes.js
│   ├── db-mongo.js
│   ├── auth-utils.js
│   ├── vault-utils.js
│   └── email-service.js
├── .vscode/                   # VS Code settings
├── .env                       # Environment variables
├── package.json
├── README.md
├── SETUP_GUIDE.md
└── VSCODE_GUIDE.md           # This file
```

## 🔍 Useful VS Code Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+` | Open/Close Terminal |
| Ctrl+Shift+D | Open Debug panel |
| F5 | Start Debugging |
| Ctrl+Shift+F | Find in all files |
| Ctrl+H | Find and Replace |
| Ctrl+S | Save file |
| Ctrl+Shift+S | Save all files |
| Alt+Up/Down | Move line up/down |
| Ctrl+/ | Toggle comment |
| Ctrl+Shift+P | Command palette |

## 🔗 Useful Links

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **MongoDB Atlas**: https://cloud.mongodb.com
- **VS Code Docs**: https://code.visualstudio.com/docs

## 🚨 Common Issues

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
1. Check MongoDB Atlas Network Access (whitelist your IP)
2. Verify connection string in `.env`
3. Ensure database "lifevault" exists

### Issue: Email not sending
**Solution:**
1. Check Gmail app password in `.env`
2. Enable "Less secure app access" in Gmail settings
3. Check spam folder for emails

### Issue: Frontend can't connect to backend
**Solution:**
1. Ensure backend is running on port 3000
2. Check browser console (F12) for errors
3. Verify CORS is enabled

## 📊 Monitoring

### Check Backend Status
- Look at VS Code terminal output
- Should show: "Server running on http://localhost:3000/"

### Check Frontend Status
- Look at VS Code terminal output
- Should show: "Local: http://localhost:5173/"

### Check MongoDB Connection
- Backend terminal should show: "[MongoDB] Connected successfully"

## 🎯 Next Steps

1. ✅ Open project in VS Code
2. ✅ Create `.env` file
3. ✅ Run `pnpm install`
4. ✅ Run `pnpm dev`
5. ✅ Test signup/login
6. ✅ Create vaults
7. ✅ Schedule memories
8. ✅ Deploy when ready

## 💡 Pro Tips

1. **Use Prettier**: Save file (Ctrl+S) to auto-format code
2. **Use ESLint**: Hover over red squiggles for suggestions
3. **Use REST Client**: Open `API_TESTING.rest` to test APIs
4. **Use MongoDB Extension**: Connect to MongoDB Atlas directly from VS Code
5. **Use Debugger**: Set breakpoints and step through code

## 📞 Need Help?

1. Check **SETUP_GUIDE.md** for detailed instructions
2. Check **README.md** for project overview
3. Check **API_TESTING.rest** for API examples
4. Review browser console (F12) for errors
5. Review VS Code terminal for backend errors

---

**Happy coding! 🚀**

You're now ready to develop Life Vault locally in VS Code!
