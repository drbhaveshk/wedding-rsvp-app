#!/bin/bash

echo "🎉 Wedding RSVP - Local Setup Script"
echo "====================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js 18+ required. Current: $(node -v)${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js version: $(node -v)${NC}"
echo ""

# Setup Backend
echo -e "${BLUE}📦 Setting up Backend...${NC}"
cd backend

if [ ! -f ".env" ]; then
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo -e "${RED}⚠️  Please edit backend/.env with your credentials${NC}"
fi

echo "Installing backend dependencies..."
npm install

echo -e "${GREEN}✅ Backend setup complete${NC}"
echo ""

# Setup Frontend
echo -e "${BLUE}📦 Setting up Frontend...${NC}"
cd ../frontend

if [ ! -f ".env" ]; then
    echo "Creating .env..."
    echo "REACT_APP_API_URL=http://localhost:3001" > .env
fi

echo "Installing frontend dependencies..."
npm install

echo -e "${GREEN}✅ Frontend setup complete${NC}"
echo ""

echo "================================================"
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo "================================================"
echo ""
echo "Next steps:"
echo "1. Edit backend/.env with your credentials"
echo "2. Start backend: cd backend && npm run dev"
echo "3. Start frontend: cd frontend && npm start"
echo ""
echo "Access points:"
echo "- RSVP Form: http://localhost:3000/rsvp"
echo "- Admin Panel: http://localhost:3000/admin"
echo "- Backend API: http://localhost:3001"
echo ""