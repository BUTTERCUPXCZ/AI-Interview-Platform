#!/bin/bash

# Pro Plan Upgrade Test Script
# This script helps verify that the Pro upgrade is working correctly

BASE_URL="http://localhost:3000/api"
COOKIE_FILE="cookies.txt"

echo "==================================="
echo "Pro Plan Upgrade Test Script"
echo "==================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Test 1: Check Debug Endpoint
echo "Test 1: Checking current subscription status..."
response=$(curl -s -X GET "$BASE_URL/subscription/debug" \
  --cookie "$COOKIE_FILE" 2>/dev/null)

if [ $? -eq 0 ]; then
    print_success "Debug endpoint accessible"
    echo "$response" | jq '.' 2>/dev/null || echo "$response"
else
    print_error "Failed to access debug endpoint"
fi

echo ""
echo "==================================="
echo ""

# Test 2: Manual Sync
echo "Test 2: Attempting manual subscription sync..."
sync_response=$(curl -s -X POST "$BASE_URL/subscription/sync" \
  --cookie "$COOKIE_FILE" 2>/dev/null)

if [ $? -eq 0 ]; then
    print_success "Sync endpoint executed"
    echo "$sync_response" | jq '.' 2>/dev/null || echo "$sync_response"
else
    print_error "Failed to sync subscription"
fi

echo ""
echo "==================================="
echo ""

# Test 3: Verify Plan Status
echo "Test 3: Verifying updated subscription status..."
status_response=$(curl -s -X GET "$BASE_URL/subscription/status" \
  --cookie "$COOKIE_FILE" 2>/dev/null)

if [ $? -eq 0 ]; then
    plan_type=$(echo "$status_response" | jq -r '.planType' 2>/dev/null)
    
    if [ "$plan_type" = "PRO" ]; then
        print_success "User is on PRO plan!"
    elif [ "$plan_type" = "FREE" ]; then
        print_info "User is still on FREE plan"
    else
        print_info "Plan type: $plan_type"
    fi
    
    echo "$status_response" | jq '.' 2>/dev/null || echo "$status_response"
else
    print_error "Failed to check subscription status"
fi

echo ""
echo "==================================="
echo "Test Complete"
echo "==================================="

# Instructions
echo ""
print_info "If you see FREE plan after upgrading:"
echo "  1. Check Stripe dashboard for webhook delivery"
echo "  2. Run: curl -X POST $BASE_URL/subscription/sync"
echo "  3. Click 'Refresh Plan' button on Dashboard"
echo "  4. Check backend logs for errors"
echo ""
print_info "To save your cookies for testing:"
echo "  1. Login via browser"
echo "  2. Open DevTools → Application → Cookies"
echo "  3. Copy the session cookie"
echo "  4. Save to $COOKIE_FILE"
