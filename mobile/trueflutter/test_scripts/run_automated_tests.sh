#!/bin/bash

# TrueAstroTalk Mobile - Automated Test Runner
echo "🚀 TrueAstroTalk Mobile - Automated E2E Testing"
echo "============================================="

# Configuration
TEST_DATA_DIR="./test_data"
LOG_FILE="./automated_test_$(date +%Y%m%d_%H%M%S).log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

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

echo -e "${BLUE}🔍 Phase 1: Environment Check${NC}"
echo "==============================="

# Check Flutter installation
if command -v flutter &> /dev/null; then
    flutter_version=$(flutter --version | head -n1)
    test_result "Flutter Installation" "PASS" "$flutter_version"
else
    test_result "Flutter Installation" "FAIL" "Flutter not found"
    exit 1
fi

# Check if we're in Flutter project
if [ ! -f "pubspec.yaml" ]; then
    test_result "Flutter Project" "FAIL" "Not in Flutter project directory"
    exit 1
else
    test_result "Flutter Project" "PASS" "pubspec.yaml found"
fi

echo ""

echo -e "${BLUE}🔍 Phase 2: Dependencies Check${NC}"
echo "================================="

# Install dependencies
echo "Installing Flutter dependencies..."
flutter_get_output=$(flutter pub get 2>&1)
if [ $? -eq 0 ]; then
    test_result "Flutter Dependencies" "PASS" "Dependencies installed successfully"
else
    test_result "Flutter Dependencies" "FAIL" "Failed to install dependencies"
    echo "$flutter_get_output"
fi

echo ""

echo -e "${BLUE}🔍 Phase 3: Test Data Validation${NC}"
echo "=================================="

# Generate test data if not exists
if [ ! -d "$TEST_DATA_DIR" ]; then
    echo "Generating test data..."
    dart run test_scripts/simple_e2e_test.dart
fi

# Check test data files
if [ -f "$TEST_DATA_DIR/astrologers.json" ] && [ -f "$TEST_DATA_DIR/customers.json" ]; then
    astrologer_count=$(grep -c "id" "$TEST_DATA_DIR/astrologers.json" || echo "0")
    customer_count=$(grep -c "id" "$TEST_DATA_DIR/customers.json" || echo "0")
    test_result "Test Data Generation" "PASS" "$astrologer_count astrologers, $customer_count customers"
else
    test_result "Test Data Generation" "FAIL" "Test data files not found"
fi

echo ""

echo -e "${BLUE}🔍 Phase 4: Integration Tests${NC}"
echo "================================"

# Run Flutter integration tests
echo "Running Flutter integration tests..."

# Check if integration test file exists
if [ ! -f "integration_test/app_test.dart" ]; then
    test_result "Integration Test File" "FAIL" "integration_test/app_test.dart not found"
else
    test_result "Integration Test File" "PASS" "Test file exists"
    
    # Run the integration tests
    echo "Executing integration tests..."
    integration_output=$(flutter test integration_test/app_test.dart 2>&1)
    integration_exit_code=$?
    
    if [ $integration_exit_code -eq 0 ]; then
        test_result "Integration Tests Execution" "PASS" "All integration tests passed"
        
        # Count individual test results
        test_count=$(echo "$integration_output" | grep -c "✓" || echo "0")
        if [ $test_count -gt 0 ]; then
            test_result "Individual Test Cases" "PASS" "$test_count test cases passed"
        fi
    else
        test_result "Integration Tests Execution" "FAIL" "Integration tests failed"
        echo -e "${YELLOW}Integration test output:${NC}"
        echo "$integration_output"
    fi
fi

echo ""

echo -e "${BLUE}🔍 Phase 5: App Compilation Test${NC}"
echo "==================================="

# Test app compilation
echo "Testing app compilation..."
build_output=$(flutter build apk --debug 2>&1)
build_exit_code=$?

if [ $build_exit_code -eq 0 ]; then
    test_result "App Compilation" "PASS" "Debug APK built successfully"
    
    # Check if APK file exists
    if [ -f "build/app/outputs/flutter-apk/app-debug.apk" ]; then
        apk_size=$(ls -lh build/app/outputs/flutter-apk/app-debug.apk | awk '{print $5}')
        test_result "APK Generation" "PASS" "APK size: $apk_size"
    else
        test_result "APK Generation" "FAIL" "APK file not found"
    fi
else
    test_result "App Compilation" "FAIL" "Build failed"
    echo -e "${YELLOW}Build output:${NC}"
    echo "$build_output" | tail -20
fi

echo ""

echo -e "${BLUE}🔍 Phase 6: Manual Testing Guide${NC}"
echo "=================================="

echo -e "${CYAN}📱 Next Steps for Manual Testing:${NC}"
echo "1. Install the generated APK on Android device/emulator"
echo "2. Test the following workflows with generated test data:"
echo ""

echo -e "${YELLOW}📋 Manual Testing Checklist:${NC}"
echo "✅ Astrologer Registration & Login (10 users)"
echo "✅ Customer Registration & Login (10 users)"  
echo "✅ Profile Image Upload (App + Gmail profiles)"
echo "✅ Online Status Management (Astrologers)"
echo "✅ Wallet Top-up & Transactions (Customers)"
echo "✅ Chat/Call Consultations"
echo "✅ Payment Processing"
echo "✅ Reviews & Ratings"
echo "✅ Earnings Tracking (Astrologers)"
echo "✅ Transaction History"
echo ""

if [ -f "$TEST_DATA_DIR/astrologers.csv" ]; then
    echo -e "${YELLOW}📊 Use Test Data From:${NC}"
    echo "• Astrologers: $TEST_DATA_DIR/astrologers.csv"
    echo "• Customers: $TEST_DATA_DIR/customers.csv"
    echo "• Test scenarios: $TEST_DATA_DIR/manual_testing_checklist.md"
fi

echo ""

# Final summary
echo -e "${BLUE}🔍 Test Execution Summary${NC}"
echo "========================="

end_time=$(date +%s)
execution_time=$((end_time - start_time))

echo ""
echo -e "${CYAN}📊 Automated Test Results:${NC}"
echo "============================"
echo "Total Tests: $total_tests"
echo -e "Passed: ${GREEN}$passed_tests${NC}"
echo -e "Failed: ${RED}$failed_tests${NC}"
if [ $total_tests -gt 0 ]; then
    success_rate=$((passed_tests * 100 / total_tests))
    echo "Success Rate: ${success_rate}%"
fi
echo "Execution Time: ${execution_time}s"
echo ""

echo -e "${CYAN}📁 Generated Files:${NC}"
echo "==================="
echo "• Test Log: $LOG_FILE"
if [ -f "build/app/outputs/flutter-apk/app-debug.apk" ]; then
    echo "• Debug APK: build/app/outputs/flutter-apk/app-debug.apk"
fi
if [ -d "$TEST_DATA_DIR" ]; then
    echo "• Test Data: $TEST_DATA_DIR/"
fi
echo ""

# Final status
if [ $failed_tests -eq 0 ]; then
    echo -e "${GREEN}🎉 All automated tests passed! Ready for manual testing.${NC}"
    echo -e "${CYAN}📱 Install the APK and test with generated user data.${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️ Some automated tests failed. Check details above.${NC}"
    echo -e "${CYAN}💡 You can still proceed with manual testing if the app builds successfully.${NC}"
    exit 1
fi