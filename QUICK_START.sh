#!/bin/bash

# Life Vault - Quick Start Script
# This script automates the setup process

echo "🚀 Life Vault - Quick Start Setup"
echo "=================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v18 or higher."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "📦 Installing pnpm globally..."
    npm install -g pnpm
fi

echo "✅ pnpm version: $(pnpm --version)"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found!"
    echo ""
    echo "Creating .env file with template..."
    cat > .env << 'EOF'
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
EOF
    echo "✅ .env file created!"
else
    echo "✅ .env file already exists"
fi

echo ""
echo "📦 Installing dependencies..."
pnpm install

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Setup complete!"
    echo ""
    echo "🎯 Next steps:"
    echo "1. Verify MongoDB Atlas setup (see SETUP_GUIDE.md)"
    echo "2. Run: pnpm dev"
    echo "3. Open: http://localhost:5173"
    echo ""
else
    echo "❌ Installation failed!"
    exit 1
fi
