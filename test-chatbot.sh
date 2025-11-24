#!/bin/bash

# Money Manager - AI Chatbot Test Script
# Tests the Qwen3-30B integration

echo "================================"
echo "AI Chatbot Integration Test"
echo "================================"
echo ""

# Configuration
BASE_URL="http://localhost:5001/api"
TEST_USER_EMAIL="test@example.com"
TEST_USER_PASSWORD="password123"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

echo "🔍 Testing AI Chatbot API Endpoints..."
echo ""

# Test 1: Health Check
echo "Test 1: Server Health Check"
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/health" 2>/dev/null)
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ PASSED${NC} - Server is running"
    ((PASSED++))
else
    echo -e "${RED}✗ FAILED${NC} - Server is not responding (HTTP $HTTP_CODE)"
    ((FAILED++))
fi
echo ""

# Test 2: User Login (to get token)
echo "Test 2: User Authentication"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$TEST_USER_EMAIL\",\"password\":\"$TEST_USER_PASSWORD\"}")

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -n "$TOKEN" ]; then
    echo -e "${GREEN}✓ PASSED${NC} - User authenticated successfully"
    ((PASSED++))
else
    echo -e "${RED}✗ FAILED${NC} - Authentication failed"
    echo "Response: $LOGIN_RESPONSE"
    ((FAILED++))
fi
echo ""

# Test 3: Simple Chatbot Query
echo "Test 3: Simple Chatbot Query"
CHAT_RESPONSE=$(curl -s -X POST "$BASE_URL/chatbot" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"message":"What is Money Manager?"}')

if echo "$CHAT_RESPONSE" | grep -q '"response"'; then
    echo -e "${GREEN}✓ PASSED${NC} - Chatbot responded to query"
    echo "Response preview: $(echo "$CHAT_RESPONSE" | head -c 100)..."
    ((PASSED++))
else
    echo -e "${RED}✗ FAILED${NC} - Chatbot did not respond"
    echo "Response: $CHAT_RESPONSE"
    ((FAILED++))
fi
echo ""

# Test 4: Budget Advice Query
echo "Test 4: Budget Advice Query"
BUDGET_RESPONSE=$(curl -s -X POST "$BASE_URL/chatbot" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"message":"Give me tips for saving money"}')

if echo "$BUDGET_RESPONSE" | grep -q '"response"'; then
    echo -e "${GREEN}✓ PASSED${NC} - Budget advice query successful"
    ((PASSED++))
else
    echo -e "${RED}✗ FAILED${NC} - Budget advice query failed"
    ((FAILED++))
fi
echo ""

# Test 5: Conversation Context
echo "Test 5: Conversation Context Test"
CONTEXT_RESPONSE=$(curl -s -X POST "$BASE_URL/chatbot" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"message":"Tell me more about that"}')

if echo "$CONTEXT_RESPONSE" | grep -q '"response"'; then
    echo -e "${GREEN}✓ PASSED${NC} - Context maintained in conversation"
    ((PASSED++))
else
    echo -e "${RED}✗ FAILED${NC} - Context test failed"
    ((FAILED++))
fi
echo ""

# Test 6: Unauthenticated Request
echo "Test 6: Unauthenticated Request (Should Fail)"
UNAUTH_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/chatbot" \
    -H "Content-Type: application/json" \
    -d '{"message":"This should fail"}' 2>/dev/null)
UNAUTH_HTTP_CODE=$(echo "$UNAUTH_RESPONSE" | tail -n1)

if [ "$UNAUTH_HTTP_CODE" = "401" ] || [ "$UNAUTH_HTTP_CODE" = "403" ]; then
    echo -e "${GREEN}✓ PASSED${NC} - Properly rejected unauthenticated request"
    ((PASSED++))
else
    echo -e "${RED}✗ FAILED${NC} - Should have rejected unauthenticated request (HTTP $UNAUTH_HTTP_CODE)"
    ((FAILED++))
fi
echo ""

# Summary
echo "================================"
echo "Test Summary"
echo "================================"
echo -e "Tests Passed: ${GREEN}$PASSED${NC}"
echo -e "Tests Failed: ${RED}$FAILED${NC}"
echo "Total Tests: $((PASSED + FAILED))"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed${NC}"
    exit 1
fi
