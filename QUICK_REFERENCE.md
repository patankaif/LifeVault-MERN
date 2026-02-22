# Life Vault - Quick Reference Card

## 🚀 Quick Start (3 Steps)

### Step 1: Install Dependencies
```bash
pnpm install
```

### Step 2: Start Server
```bash
pnpm dev
```

### Step 3: Open Browser
```
http://localhost:5173
```

---

## 📦 What's Already Configured

✅ **`.env` file** - All credentials pre-configured
✅ **MongoDB** - Connected to lifevault database
✅ **Gmail SMTP** - Email service configured
✅ **JWT** - Authentication ready
✅ **All dependencies** - Ready to install

---

## 🔧 Installation Commands

```bash
# Install all dependencies (do this first!)
pnpm install

# Start development server (both frontend & backend)
pnpm dev

# Run only backend
pnpm run dev:server

# Run only frontend
cd client && pnpm dev

# Build for production
pnpm build

# Run production build
pnpm start
```

---

## 📍 URLs After Running

| Component | URL |
|-----------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3000 |
| MongoDB | Atlas Cloud |

---

## 📝 `.env` File Contents

Located in: `life-vault/.env`

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

---

## 🧪 Test Credentials

**Email:** test@example.com
**Password:** TestPass123!

---

## 📚 Documentation Files

- `LOCAL_SETUP_GUIDE.md` - Detailed setup instructions
- `README.md` - Project overview
- `SETUP_GUIDE.md` - Complete setup guide
- `VSCODE_GUIDE.md` - VS Code specific guide
- `API_TESTING.rest` - API endpoint examples

---

## ⚡ Common Issues & Quick Fixes

| Issue | Solution |
|-------|----------|
| pnpm not found | `npm install -g pnpm` |
| Port 3000 in use | `PORT=3001 pnpm dev` |
| MongoDB error | Check internet & `.env` |
| Email not sending | Verify Gmail app password |

---

## 🎯 Next Steps

1. ✅ Extract the zip file
2. ✅ Open in VS Code
3. ✅ Run `pnpm install`
4. ✅ Run `pnpm dev`
5. ✅ Open browser to http://localhost:5173
6. ✅ Test signup/login
7. ✅ Create vaults

---

**That's it! Happy coding! 🚀**
