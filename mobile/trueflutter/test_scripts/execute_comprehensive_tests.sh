#!/bin/bash

# TrueAstroTalk Mobile App - Comprehensive E2E Test Execution Script
# Generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")

echo "🚀 TrueAstroTalk Mobile App - Comprehensive E2E Testing"
echo "======================================================="
echo ""

# Configuration
ADMIN_API_URL="http://localhost:4000/api/admin"
USER_API_URL="http://localhost:4000/api"
TEST_DATA_DIR="./test_data"
LOG_FILE="./test_execution_$(date +%Y%m%d_%H%M%S).log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo "📊 Test Configuration:"
echo "- Admin API URL: $ADMIN_API_URL"
echo "- User API URL: $USER_API_URL"
echo "- Test Data Directory: $TEST_DATA_DIR"
echo "- Log File: $LOG_FILE"
echo ""

# Initialize counters
total_tests=0
passed_tests=0
failed_tests=0
start_time=$(date +%s)

# Logging function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') $1" | tee -a "$LOG_FILE"
}

# Test result function
test_result() {
    local test_name="$1"
    local result="$2"
    local details="$3"
    
    total_tests=$((total_tests + 1))
    
    if [ "$result" = "PASS" ]; then
        echo -e "${GREEN}✅ PASS${NC}: $test_name"
        passed_tests=$((passed_tests + 1))
        log "PASS: $test_name - $details"
    else
        echo -e "${RED}❌ FAIL${NC}: $test_name"
        failed_tests=$((failed_tests + 1))
        log "FAIL: $test_name - $details"
    fi
}

# API call function
api_call() {
    local method="$1"
    local endpoint="$2"
    local data="$3"
    local headers="$4"
    
    if [ "$method" = "POST" ]; then
        if [ -n "$headers" ]; then
            response=$(curl -s -w "\n%{http_code}" -X POST \
                -H "Content-Type: application/json" \
                -H "$headers" \
                -d "$data" \
                "$USER_API_URL$endpoint" 2>/dev/null)
        else
            response=$(curl -s -w "\n%{http_code}" -X POST \
                -H "Content-Type: application/json" \
                -d "$data" \
                "$USER_API_URL$endpoint" 2>/dev/null)
        fi
    elif [ "$method" = "GET" ]; then
        if [ -n "$headers" ]; then
            response=$(curl -s -w "\n%{http_code}" -X GET \
                -H "$headers" \
                "$USER_API_URL$endpoint" 2>/dev/null)
        else
            response=$(curl -s -w "\n%{http_code}" -X GET \
                "$USER_API_URL$endpoint" 2>/dev/null)
        fi
    fi
    
    echo "$response"
}

# Check server availability
echo -e "${BLUE}🔍 Phase 1: Server Health Check${NC}"
echo "================================="

health_response=$(curl -s -w "%{http_code}" "$USER_API_URL/health" -o /dev/null 2>/dev/null || echo "000")

if [ "$health_response" = "200" ]; then
    test_result "Server Health Check" "PASS" "Server responding at $USER_API_URL"
else
    test_result "Server Health Check" "FAIL" "Server not responding (HTTP: $health_response)"
    echo ""
    echo -e "${RED}⚠️ WARNING: Backend server is not running!${NC}"
    echo "Please start the backend server before running tests."
    echo "Expected server at: $USER_API_URL"
    echo ""
    read -p "Continue with offline testing? (y/N): " continue_offline
    if [[ ! "$continue_offline" =~ ^[Yy]$ ]]; then
        echo "Exiting..."
        exit 1
    fi
fi

echo ""

# Load test data
echo -e "${BLUE}🔍 Phase 2: Test Data Validation${NC}"
echo "=================================="

# Check if test data files exist
if [ ! -f "$TEST_DATA_DIR/astrologers.json" ]; then
    test_result "Astrologer Data File" "FAIL" "File not found: $TEST_DATA_DIR/astrologers.json"
    echo "Run: dart simple_e2e_test.dart to generate test data"
    exit 1
else
    astrologer_count=$(cat "$TEST_DATA_DIR/astrologers.json" | grep -o '"id"' | wc -l)
    test_result "Astrologer Data File" "PASS" "$astrologer_count astrologers found"
fi

if [ ! -f "$TEST_DATA_DIR/customers.json" ]; then
    test_result "Customer Data File" "FAIL" "File not found: $TEST_DATA_DIR/customers.json"
    exit 1
else
    customer_count=$(cat "$TEST_DATA_DIR/customers.json" | grep -o '"id"' | wc -l)
    test_result "Customer Data File" "PASS" "$customer_count customers found"
fi

echo ""

# Test user registrations (if server is available)
if [ "$health_response" = "200" ]; then
    echo -e "${BLUE}🔍 Phase 3: User Registration Testing${NC}"
    echo "====================================="
    
    # Test astrologer registrations
    echo -e "${PURPLE}Testing Astrologer Registrations...${NC}"
    
    # Read first few astrologers for testing
    while IFS= read -r line; do
        if echo "$line" | grep -q '"email"'; then
            email=$(echo "$line" | grep -o '"[^"]*@[^"]*"' | sed 's/"//g')
            echo "Testing registration for: $email"
            
            # Create basic registration data (simplified)
            reg_data="{\"user_type\":\"astrologer\",\"email\":\"$email\",\"password\":\"TestPass123\",\"full_name\":\"Test Astrologer\",\"accept_terms\":true}"
            
            response=$(api_call "POST" "/auth/register" "$reg_data")
            http_code=$(echo "$response" | tail -n1)
            response_body=$(echo "$response" | head -n -1)
            
            if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
                test_result "Astrologer Registration ($email)" "PASS" "HTTP: $http_code"
            else
                test_result "Astrologer Registration ($email)" "FAIL" "HTTP: $http_code, Response: $response_body"
            fi
            
            # Only test first 3 to avoid spam
            break
        fi
    done < "$TEST_DATA_DIR/astrologers.json"
    
    echo ""
    echo -e "${PURPLE}Testing Customer Registrations...${NC}"
    
    # Test customer registrations
    while IFS= read -r line; do
        if echo "$line" | grep -q '"email"'; then
            email=$(echo "$line" | grep -o '"[^"]*@[^"]*"' | sed 's/"//g')
            echo "Testing registration for: $email"
            
            # Create basic registration data (simplified)
            reg_data="{\"user_type\":\"user\",\"email\":\"$email\",\"password\":\"TestPass123\",\"full_name\":\"Test Customer\",\"accept_terms\":true}"
            
            response=$(api_call "POST" "/auth/register" "$reg_data")
            http_code=$(echo "$response" | tail -n1)
            response_body=$(echo "$response" | head -n -1)
            
            if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
                test_result "Customer Registration ($email)" "PASS" "HTTP: $http_code"
            else
                test_result "Customer Registration ($email)" "FAIL" "HTTP: $http_code, Response: $response_body"
            fi
            
            # Only test first 3 to avoid spam
            break
        fi
    done < "$TEST_DATA_DIR/customers.json"
    
    echo ""
fi

# Manual testing instructions
echo -e "${BLUE}🔍 Phase 4: Manual Testing Guide${NC}"
echo "================================="

echo "📱 Mobile App Testing Instructions:"
echo ""
echo -e "${YELLOW}1. Astrologer Testing (10 users):${NC}"
cat "$TEST_DATA_DIR/astrologers.csv" | head -6 | tail -5 | while IFS=, read -r id name email phone city skills experience call_rate chat_rate video_rate profile_type; do
    name=$(echo "$name" | sed 's/"//g')
    email=$(echo "$email" | sed 's/"//g')
    profile_type=$(echo "$profile_type" | sed 's/"//g')
    
    echo "   • $name ($email)"
    echo "     - Profile Image: $profile_type"
    echo "     - Test signup, profile completion, earnings tracking"
done

echo ""
echo -e "${YELLOW}2. Customer Testing (10 users):${NC}"
cat "$TEST_DATA_DIR/customers.csv" | head -6 | tail -5 | while IFS=, read -r id name email phone city gender marital profile_type gmail; do
    name=$(echo "$name" | sed 's/"//g')
    email=$(echo "$email" | sed 's/"//g')
    profile_type=$(echo "$profile_type" | sed 's/"//g')
    gmail=$(echo "$gmail" | sed 's/"//g')
    
    echo "   • $name ($email)"
    echo "     - Profile Image: $profile_type (Gmail: $gmail)"
    echo "     - Test signup, wallet, consultations, reviews"
done

echo ""
echo -e "${YELLOW}3. Profile Image Testing:${NC}"
echo "   • Gmail Profile Images: Test customers 3, 6, 9"
echo "   • App Upload Images: Test astrologers 2, 4, 6, 8, 10"
echo "   • No Profile Images: Verify default avatars work"
echo ""

echo -e "${YELLOW}4. End-to-End Scenarios:${NC}"
echo "   • Complete astrologer registration → approval → earning money"
echo "   • Complete customer registration → wallet top-up → consultation"
echo "   • Cross-user interactions (chat, calls, payments, reviews)"
echo "   • Test all profile image types across the app"
echo ""

# Performance testing
echo -e "${BLUE}🔍 Phase 5: Performance & Load Testing${NC}"
echo "======================================"

echo "📊 Recommended Performance Tests:"
echo "   • Simultaneous user registrations (5+ concurrent)"
echo "   • Multiple active chat sessions (3+ concurrent)"
echo "   • Multiple active call sessions (2+ concurrent)"
echo "   • Concurrent payment transactions"
echo "   • Image upload stress testing"
echo ""

# Test completion summary
echo -e "${BLUE}🔍 Phase 6: Test Execution Summary${NC}"
echo "=================================="

end_time=$(date +%s)
execution_time=$((end_time - start_time))

echo ""
echo -e "${CYAN}📊 Test Results Summary:${NC}"
echo "========================="
echo "Total Tests Executed: $total_tests"
echo -e "Passed: ${GREEN}$passed_tests${NC}"
echo -e "Failed: ${RED}$failed_tests${NC}"
echo "Success Rate: $(( passed_tests * 100 / total_tests ))%"
echo "Execution Time: ${execution_time}s"
echo ""

echo -e "${CYAN}📁 Generated Files:${NC}"
echo "==================="
echo "• Test Data: $TEST_DATA_DIR/"
echo "• Execution Log: $LOG_FILE"
echo "• Manual Testing Checklist: $TEST_DATA_DIR/manual_testing_checklist.md"
echo "• Test Scenarios: ./test_scenarios.json"
echo ""

echo -e "${CYAN}🎯 Next Steps:${NC}"
echo "==============="
echo "1. 📱 Install and run the Flutter mobile app"
echo "2. 🔧 Ensure backend server is running (http://localhost:4000)"
echo "3. 👥 Test user registrations with generated data"
echo "4. 🖼️ Test profile image functionality (Gmail + App uploads)"
echo "5. 💬 Test chat and call consultations"
echo "6. 💰 Test payment and wallet operations"
echo "7. 📝 Follow the manual testing checklist"
echo "8. 🐛 Report any issues found during testing"
echo ""

if [ $failed_tests -eq 0 ]; then
    echo -e "${GREEN}🎉 All automated tests passed! Ready for manual testing.${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️ Some automated tests failed. Please check the log file for details.${NC}"
    echo "Log file: $LOG_FILE"
    exit 1
fi