#!/bin/bash

# Production Deployment Script for GuruKool HomeSchool
# Run this script to prepare and deploy to production

echo "🚀 GuruKool HomeSchool - Production Deployment"
echo "============================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version)
echo "📦 Node.js version: $NODE_VERSION"

# Install dependencies
echo "📥 Installing dependencies..."
npm ci --only=production

# Run security audit
echo "🔒 Running security audit..."
npm audit --audit-level high

# Build the application
echo "🔨 Building application..."
NODE_ENV=production npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed. Please fix errors before deploying."
    exit 1
fi

# Test the production build
echo "🧪 Testing production build..."
npm run start &
SERVER_PID=$!
sleep 5

# Kill the test server
kill $SERVER_PID

echo "✅ Production build test completed"

# Git operations (if in a git repo)
if [ -d ".git" ]; then
    echo "📤 Preparing Git commit..."
    
    # Add all changes
    git add .
    
    # Create commit with timestamp
    COMMIT_MSG="Production deployment preparation - $(date '+%Y-%m-%d %H:%M:%S')"
    git commit -m "$COMMIT_MSG"
    
    echo "✅ Git commit created: $COMMIT_MSG"
    echo "📤 Ready to push to main branch for Vercel deployment"
    echo ""
    echo "Next steps:"
    echo "1. git push origin main"
    echo "2. Check Vercel dashboard for deployment status"
    echo "3. Verify deployment at your production URL"
else
    echo "⚠️  Not a git repository. Please initialize git for Vercel deployment."
fi

echo ""
echo "🎉 Production deployment preparation complete!"
echo "📋 Remember to set environment variables in Vercel dashboard."