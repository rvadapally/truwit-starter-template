#!/bin/bash

# Quick Post-Deploy Validation Script
# Run this after every deployment to catch critical issues

echo "🔍 TruWit Post-Deploy Validation"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if file exists
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✅ $1 exists${NC}"
        return 0
    else
        echo -e "${RED}❌ $1 missing${NC}"
        return 1
    fi
}

# Function to check URL
check_url() {
    local url=$1
    local description=$2
    
    if curl -s --head "$url" | head -n 1 | grep -q "200 OK"; then
        echo -e "${GREEN}✅ $description loads (200 OK)${NC}"
        return 0
    else
        echo -e "${RED}❌ $description failed to load${NC}"
        return 1
    fi
}

echo ""
echo "📁 Checking Critical Assets..."

# Check Astro assets
check_file "public/logo.svg"
check_file "public/images/verified-circular-badge.jpg"

# Check Angular assets  
check_file "app/src/assets/logo.svg"
check_file "app/src/assets/verified-circular-badge.jpg"

echo ""
echo "🌐 Checking Critical URLs..."

# Check main pages
check_url "https://truwit.ai/" "Homepage"
check_url "https://truwit.ai/about" "About page"
check_url "https://truwit.ai/app/#/verify" "Angular verify page"

echo ""
echo "🔧 Checking Build Status..."

# Check if builds work
if [ -d "dist" ]; then
    echo -e "${GREEN}✅ Astro dist folder exists${NC}"
else
    echo -e "${YELLOW}⚠️  Astro dist folder missing - run 'npm run build'${NC}"
fi

if [ -d "app/dist" ]; then
    echo -e "${GREEN}✅ Angular dist folder exists${NC}"
else
    echo -e "${YELLOW}⚠️  Angular dist folder missing - run 'cd app && npm run build'${NC}"
fi

echo ""
echo "📋 Component Integration Check..."

# Check if all Astro pages use Header component
pages=("about" "contact" "how-it-works" "investors" "pricing" "technology" "use-cases")
for page in "${pages[@]}"; do
    if grep -q "import Header from" "src/pages/${page}.astro"; then
        echo -e "${GREEN}✅ ${page}.astro uses Header component${NC}"
    else
        echo -e "${RED}❌ ${page}.astro still uses old Nav component${NC}"
    fi
done

echo ""
echo "🎨 Theme Variables Check..."

if grep -q "theme-variables.css" "src/styles/global.css"; then
    echo -e "${GREEN}✅ Theme variables imported in global.css${NC}"
else
    echo -e "${RED}❌ Theme variables not imported in global.css${NC}"
fi

echo ""
echo "🏠 Homepage Content Check..."

if grep -q "home-hero" "src/pages/index.astro"; then
    echo -e "${RED}❌ Homepage still has old hero content${NC}"
else
    echo -e "${GREEN}✅ Homepage cleaned up (no old hero)${NC}"
fi

echo ""
echo "📱 Asset Path Check..."

# Check Astro components
if grep -q 'src="/logo.svg"' "src/components/Logo.astro"; then
    echo -e "${GREEN}✅ Astro Logo uses correct path${NC}"
else
    echo -e "${RED}❌ Astro Logo uses wrong path${NC}"
fi

if grep -q 'src="/images/verified-circular-badge.jpg"' "src/components/Footer.astro"; then
    echo -e "${GREEN}✅ Astro Footer uses correct path${NC}"
else
    echo -e "${RED}❌ Astro Footer uses wrong path${NC}"
fi

# Check Angular components
if grep -q 'src="assets/logo.svg"' "app/src/app/shared/components/logo/logo.component.ts"; then
    echo -e "${GREEN}✅ Angular Logo uses correct path${NC}"
else
    echo -e "${RED}❌ Angular Logo uses wrong path${NC}"
fi

if grep -q 'src="assets/verified-circular-badge.jpg"' "app/src/app/layout/footer/footer.component.ts"; then
    echo -e "${GREEN}✅ Angular Footer uses correct path${NC}"
else
    echo -e "${RED}❌ Angular Footer uses wrong path${NC}"
fi

echo ""
echo "🎯 Summary"
echo "=========="
echo "Run this script after every deployment to catch issues early."
echo "If any checks fail, fix them before considering deployment successful."
echo ""
echo "For detailed validation, see POST-DEPLOY-CHECKLIST.md"
echo "For automated testing, run: ./run-comprehensive-e2e-tests.bat"
