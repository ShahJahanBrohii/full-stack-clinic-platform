#!/bin/bash
# INSTALLATION & SETUP GUIDE FOR IMPROVEMENTS
# Run this script to install new dependencies and setup the enhanced system

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  Apex Clinic - Security & UX Enhancements Setup          ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Backend Setup
echo "📦 Installing backend dependencies..."
cd backend
npm install
echo "✓ Backend dependencies installed"

# Check for .env
if [ ! -f .env ]; then
    echo ""
    echo "⚠️  .env file not found in backend/"
    echo "Please create .env with these required variables:"
    echo "  MONGO_URI=your_mongodb_connection"
    echo "  JWT_SECRET=your_secret_key"
    echo "  PORT=5000"
    echo "  NODE_ENV=development"
fi

cd ..

# Frontend Setup
echo ""
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
echo "✓ Frontend dependencies installed"
cd ..

# Verify installations
echo ""
echo "✓ Checking installations..."
echo ""

# Test backend
cd backend
echo "Testing backend:"
npm list express-validator > /dev/null 2>&1 && echo "  ✓ express-validator installed" || echo "  ✗ express-validator missing"
npm list express-rate-limit > /dev/null 2>&1 && echo "  ✓ express-rate-limit installed" || echo "  ✗ express-rate-limit missing"

cd ..

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  Setup Complete! Next Steps:                              ║"
echo "╠════════════════════════════════════════════════════════════╣"
echo "║                                                            ║"
echo "║  1. Update following files with new colors:               ║"
echo "║     - src/pages/Home.jsx                                  ║"
echo "║     - src/pages/Dashboard.jsx                             ║"
echo "║     - src/pages/Login.jsx                                 ║"
echo "║     - src/pages/Register.jsx                              ║"
echo "║     - src/components/Footer.jsx                           ║"
echo "║                                                            ║"
echo "║  2. Setup Email Service:                                  ║"
echo "║     - Configure Nodemailer in backend/routes/authRoutes   ║"
echo "║     - Add SMTP credentials to .env                        ║"
echo "║                                                            ║"
echo "║  3. Start Development:                                    ║"
echo "║     Backend:  cd backend && npm run dev                   ║"
echo "║     Frontend: cd frontend && npm run dev                  ║"
echo "║                                                            ║"
echo "║  View improvements at: /IMPROVEMENTS.md                   ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "Happy coding! 🚀"
