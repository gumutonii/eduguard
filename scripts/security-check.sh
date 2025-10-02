#!/bin/bash

# 🔒 EduGuard Security Check Script
# This script verifies that sensitive files are properly ignored

echo "🔒 EduGuard Security Check"
echo "=========================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo -e "${RED}❌ Not in a git repository${NC}"
    exit 1
fi

echo "📁 Checking for sensitive files..."

# Check for .env files
ENV_FILES=$(find . -name ".env*" -not -path "./.git/*" 2>/dev/null)
if [ -n "$ENV_FILES" ]; then
    echo -e "${YELLOW}⚠️  Found .env files:${NC}"
    echo "$ENV_FILES"
    echo ""
    
    # Check if they're ignored
    for file in $ENV_FILES; do
        if git check-ignore "$file" >/dev/null 2>&1; then
            echo -e "${GREEN}✅ $file is properly ignored${NC}"
        else
            echo -e "${RED}❌ $file is NOT ignored - DANGER!${NC}"
        fi
    done
else
    echo -e "${GREEN}✅ No .env files found${NC}"
fi

echo ""

# Check for other sensitive files
SENSITIVE_FILES=$(find . -name "*.key" -o -name "*.pem" -o -name "*.p12" -o -name "*.pfx" -o -name "secrets.json" -o -name "config.json" -not -path "./.git/*" 2>/dev/null)
if [ -n "$SENSITIVE_FILES" ]; then
    echo -e "${YELLOW}⚠️  Found potentially sensitive files:${NC}"
    echo "$SENSITIVE_FILES"
    echo ""
    
    for file in $SENSITIVE_FILES; do
        if git check-ignore "$file" >/dev/null 2>&1; then
            echo -e "${GREEN}✅ $file is properly ignored${NC}"
        else
            echo -e "${RED}❌ $file is NOT ignored - Check if it contains secrets${NC}"
        fi
    done
else
    echo -e "${GREEN}✅ No other sensitive files found${NC}"
fi

echo ""

# Check git status for sensitive files
echo "🔍 Checking git status for sensitive files..."
SENSITIVE_IN_STATUS=$(git status --porcelain | grep -E "\.(env|key|pem|secret)" || true)
if [ -n "$SENSITIVE_IN_STATUS" ]; then
    echo -e "${RED}❌ Sensitive files detected in git status:${NC}"
    echo "$SENSITIVE_IN_STATUS"
else
    echo -e "${GREEN}✅ No sensitive files in git status${NC}"
fi

echo ""

# Check .gitignore files
echo "📋 Checking .gitignore files..."
if [ -f ".gitignore" ]; then
    echo -e "${GREEN}✅ Root .gitignore exists${NC}"
else
    echo -e "${RED}❌ Root .gitignore missing${NC}"
fi

if [ -f "backend/.gitignore" ]; then
    echo -e "${GREEN}✅ Backend .gitignore exists${NC}"
else
    echo -e "${RED}❌ Backend .gitignore missing${NC}"
fi

if [ -f "frontend/.gitignore" ]; then
    echo -e "${GREEN}✅ Frontend .gitignore exists${NC}"
else
    echo -e "${RED}❌ Frontend .gitignore missing${NC}"
fi

echo ""
echo "🔒 Security check complete!"
echo "=========================="
