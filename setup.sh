#!/bin/bash

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " ATGCode — Browser IDE Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Install server deps
echo ""
echo "📦 Installing server dependencies..."
cd server && npm install
cd ..

# Install client deps
echo ""
echo "📦 Installing client dependencies..."
cd client && npm install
cd ..

# Create .env if not exists
if [ ! -f server/.env ]; then
  cp server/.env.example server/.env
  echo "✅ Created server/.env from example"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " ✅ Setup complete!"
echo ""
echo " Run in 2 terminals:"
echo "   Terminal 1: cd server && npm run dev"
echo "   Terminal 2: cd client && npm run dev"
echo ""
echo " Then open: http://localhost:5173"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
