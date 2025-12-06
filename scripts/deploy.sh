#!/bin/bash

echo "🚀 Wedding RSVP Deployment Script"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null
then
    echo -e "${RED}❌ Railway CLI not found${NC}"
    echo "Install it with: npm i -g @railway/cli"
    exit 1
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null
then
    echo -e "${RED}❌ Vercel CLI not found${NC}"
    echo "Install it with: npm i -g vercel"
    exit 1
fi

echo -e "${BLUE}📦 Step 1: Deploy Backend to Railway${NC}"
echo "--------------------------------------"
cd backend

echo "Installing backend dependencies..."
npm install

echo "Deploying to Railway..."
railway up

echo -e "${GREEN}✅ Backend deployed!${NC}"
echo ""

# Get Railway URL
echo "Please enter your Railway backend URL:"
read RAILWAY_URL

cd ..

echo -e "${BLUE}📦 Step 2: Deploy Frontend to Vercel${NC}"
echo "---------------------------------------"
cd frontend

echo "Creating production environment file..."
echo "REACT_APP_API_URL=$RAILWAY_URL" > .env.production

echo "Installing frontend dependencies..."
npm install

echo "Building frontend..."
npm run build

echo "Deploying to Vercel..."
vercel --prod

echo -e "${GREEN}✅ Frontend deployed!${NC}"
echo ""

echo "================================================"
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo "================================================"
echo ""
echo "Next steps:"
echo "1. Update backend FRONTEND_URL in Railway environment variables"
echo "2. Test your application"
echo "3. Share the Vercel URL with your guests!"
echo ""