#!/bin/bash

# TrueAstroTalk Mobile App E2E Test Execution Script
# Generated: 2025-08-25T13:08:00.644097

echo "🚀 Starting TrueAstroTalk E2E Testing"
echo "======================================"

# Test Configuration
ADMIN_API_URL="http://localhost:4000/api/admin"
USER_API_URL="http://localhost:4000/api"
ASTROLOGER_COUNT=10
CUSTOMER_COUNT=10

echo "📊 Test Configuration:"
echo "- Astrologers to test: $ASTROLOGER_COUNT"  
echo "- Customers to test: $CUSTOMER_COUNT"
echo "- Admin API URL: $ADMIN_API_URL"
echo "- User API URL: $USER_API_URL"
echo ""

# Function to test user registration
test_user_registration() {
    local user_type=$1
    local user_data=$2
    local test_id=$3
    
    echo "📝 Testing $user_type registration (ID: $test_id)..."
    
    # Make registration API call
    response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "$user_data" \
        "$USER_API_URL/auth/register")
    
    # Check if successful
    if echo "$response" | grep -q '"success":true'; then
        echo "✅ $user_type $test_id registration successful"
        return 0
    else
        echo "❌ $user_type $test_id registration failed"
        echo "Response: $response"
        return 1
    fi
}

# Function to test user login
test_user_login() {
    local email=$1
    local password=$2
    local user_type=$3
    
    echo "🔐 Testing login for $email..."
    
    response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$email\",\"password\":\"$password\"}" \
        "$USER_API_URL/auth/login")
    
    if echo "$response" | grep -q '"success":true'; then
        echo "✅ Login successful for $email"
        # Extract token for further tests
        token=$(echo "$response" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
        echo "🎫 Token: $token"
        return 0
    else
        echo "❌ Login failed for $email"
        return 1
    fi
}

echo "🎯 Phase 1: Testing User Registrations"
echo "======================================"

# Test astrologer registrations
echo "Testing 10 astrologers..."
astrologer_success=0
if test_user_registration "Astrologer" '{"user_type":"astrologer","full_name":"Arjun Mittal","email":"astrologer1@testastro.com","phone":"+919000000001","password":"TestAstro123","city":"Ahmedabad","state":"Maharashtra","country":"India","bio":"Experienced Gemology practitioner with 6 years of expertise in guiding people through life\'s challenges.","skills":["Vedic Astrology","Horary Astrology"],"languages":["Bengali","English","Malayalam"],"call_rate":44.0,"chat_rate":21.0,"video_rate":20.0}' "1"; then
    ((astrologer_success++))
fi
if test_user_registration "Astrologer" '{"user_type":"astrologer","full_name":"Reyansh Kumar","email":"astrologer2@testastro.com","phone":"+919000000002","password":"TestAstro223","city":"Kolkata","state":"Maharashtra","country":"India","bio":"Experienced Vastu Shastra practitioner with 5 years of expertise in guiding people through life\'s challenges.","skills":["Numerology","Horary Astrology","Face Reading"],"languages":["Telugu","Tamil"],"call_rate":54.0,"chat_rate":8.0,"video_rate":77.0}' "2"; then
    ((astrologer_success++))
fi
if test_user_registration "Astrologer" '{"user_type":"astrologer","full_name":"Fatima Sharma","email":"astrologer3@testastro.com","phone":"+919000000003","password":"TestAstro323","city":"Hyderabad","state":"Maharashtra","country":"India","bio":"Experienced Gemology practitioner with 12 years of expertise in guiding people through life\'s challenges.","skills":["Palmistry","Vedic Astrology","Vastu Shastra"],"languages":["Marathi","Urdu","Punjabi"],"call_rate":34.0,"chat_rate":24.0,"video_rate":44.0}' "3"; then
    ((astrologer_success++))
fi
if test_user_registration "Astrologer" '{"user_type":"astrologer","full_name":"Aarav Mittal","email":"astrologer4@testastro.com","phone":"+919000000004","password":"TestAstro423","city":"Kolkata","state":"Maharashtra","country":"India","bio":"Experienced KP Astrology practitioner with 14 years of expertise in guiding people through life\'s challenges.","skills":["Numerology","Remedial Astrology","Vedic Astrology","Horary Astrology","Vastu Shastra"],"languages":["Telugu","Punjabi"],"call_rate":35.0,"chat_rate":9.0,"video_rate":38.0}' "4"; then
    ((astrologer_success++))
fi
if test_user_registration "Astrologer" '{"user_type":"astrologer","full_name":"Aanya Jain","email":"astrologer5@testastro.com","phone":"+919000000005","password":"TestAstro523","city":"Pune","state":"Maharashtra","country":"India","bio":"Experienced Remedial Astrology practitioner with 12 years of expertise in guiding people through life\'s challenges.","skills":["Palmistry","Lal Kitab"],"languages":["Gujarati","English"],"call_rate":55.0,"chat_rate":10.0,"video_rate":40.0}' "5"; then
    ((astrologer_success++))
fi
if test_user_registration "Astrologer" '{"user_type":"astrologer","full_name":"Sai Patel","email":"astrologer6@testastro.com","phone":"+919000000006","password":"TestAstro623","city":"Mumbai","state":"Maharashtra","country":"India","bio":"Experienced KP Astrology practitioner with 18 years of expertise in guiding people through life\'s challenges.","skills":["Face Reading","Numerology","Tarot Reading","Lal Kitab"],"languages":["Gujarati","Malayalam"],"call_rate":45.0,"chat_rate":14.0,"video_rate":84.0}' "6"; then
    ((astrologer_success++))
fi
if test_user_registration "Astrologer" '{"user_type":"astrologer","full_name":"Fatima Shah","email":"astrologer7@testastro.com","phone":"+919000000007","password":"TestAstro723","city":"Ahmedabad","state":"Maharashtra","country":"India","bio":"Experienced Vedic Astrology practitioner with 1 years of expertise in guiding people through life\'s challenges.","skills":["KP Astrology","Remedial Astrology","Lal Kitab","Horary Astrology"],"languages":["Telugu","Punjabi","Marathi"],"call_rate":41.0,"chat_rate":14.0,"video_rate":16.0}' "7"; then
    ((astrologer_success++))
fi
if test_user_registration "Astrologer" '{"user_type":"astrologer","full_name":"Ayaan Joshi","email":"astrologer8@testastro.com","phone":"+919000000008","password":"TestAstro823","city":"Chennai","state":"Maharashtra","country":"India","bio":"Experienced KP Astrology practitioner with 16 years of expertise in guiding people through life\'s challenges.","skills":["Face Reading","KP Astrology","Tarot Reading","Prashna Astrology"],"languages":["Telugu","Marathi"],"call_rate":42.0,"chat_rate":20.0,"video_rate":50.0}' "8"; then
    ((astrologer_success++))
fi
if test_user_registration "Astrologer" '{"user_type":"astrologer","full_name":"Aadhya Verma","email":"astrologer9@testastro.com","phone":"+919000000009","password":"TestAstro923","city":"Mumbai","state":"Maharashtra","country":"India","bio":"Experienced Palmistry practitioner with 1 years of expertise in guiding people through life\'s challenges.","skills":["KP Astrology","Palmistry","Remedial Astrology","Horary Astrology"],"languages":["Urdu"],"call_rate":25.0,"chat_rate":33.0,"video_rate":35.0}' "9"; then
    ((astrologer_success++))
fi
if test_user_registration "Astrologer" '{"user_type":"astrologer","full_name":"Vivaan Agarwal","email":"astrologer10@testastro.com","phone":"+919000000010","password":"TestAstro1023","city":"Kolkata","state":"Maharashtra","country":"India","bio":"Experienced Lal Kitab practitioner with 5 years of expertise in guiding people through life\'s challenges.","skills":["Numerology","KP Astrology","Gemology","Horary Astrology"],"languages":["Gujarati","English"],"call_rate":26.0,"chat_rate":7.0,"video_rate":52.0}' "10"; then
    ((astrologer_success++))
fi

echo "✅ Astrologer registrations completed: $astrologer_success/10"

# Test customer registrations  
echo "Testing 10 customers..."
customer_success=0
if test_user_registration "Customer" '{"user_type":"user","full_name":"Anaya Mittal","email":"customer1@testuser.com","phone":"+918000000001","password":"TestUser123","city":"Hyderabad","state":"Karnataka","country":"India","date_of_birth":"10/09/1963","time_of_birth":"4:53 AM","place_of_birth":"Kolkata","gender":"Female","marital_status":"Married"}' "1"; then
    ((customer_success++))
fi
if test_user_registration "Customer" '{"user_type":"user","full_name":"Anaya Goyal","email":"customer2@testuser.com","phone":"+918000000002","password":"TestUser223","city":"Kolkata","state":"Karnataka","country":"India","date_of_birth":"31/08/2000","time_of_birth":"6:59 AM","place_of_birth":"Lucknow","gender":"Male","marital_status":"Married"}' "2"; then
    ((customer_success++))
fi
if test_user_registration "Customer" '{"user_type":"user","full_name":"Aanya Shah","email":"customer3@testuser.com","phone":"+918000000003","password":"TestUser323","city":"Hyderabad","state":"Karnataka","country":"India","date_of_birth":"07/09/1973","time_of_birth":"6:43 PM","place_of_birth":"Lucknow","gender":"Male","marital_status":"Married"}' "3"; then
    ((customer_success++))
fi
if test_user_registration "Customer" '{"user_type":"user","full_name":"Fatima Patel","email":"customer4@testuser.com","phone":"+918000000004","password":"TestUser423","city":"Pune","state":"Karnataka","country":"India","date_of_birth":"31/08/2000","time_of_birth":"8:03 PM","place_of_birth":"Chennai","gender":"Male","marital_status":"Married"}' "4"; then
    ((customer_success++))
fi
if test_user_registration "Customer" '{"user_type":"user","full_name":"Diya Tiwari","email":"customer5@testuser.com","phone":"+918000000005","password":"TestUser523","city":"Jaipur","state":"Karnataka","country":"India","date_of_birth":"31/08/2003","time_of_birth":"4:19 AM","place_of_birth":"Chennai","gender":"Male","marital_status":"Divorced"}' "5"; then
    ((customer_success++))
fi
if test_user_registration "Customer" '{"user_type":"user","full_name":"Inaya Gupta","email":"customer6@testuser.com","phone":"+918000000006","password":"TestUser623","city":"Pune","state":"Karnataka","country":"India","date_of_birth":"10/09/1963","time_of_birth":"7:35 AM","place_of_birth":"Kolkata","gender":"Male","marital_status":"Married"}' "6"; then
    ((customer_success++))
fi
if test_user_registration "Customer" '{"user_type":"user","full_name":"Krishna Mehta","email":"customer7@testuser.com","phone":"+918000000007","password":"TestUser723","city":"Kolkata","state":"Karnataka","country":"India","date_of_birth":"06/09/1976","time_of_birth":"2:15 AM","place_of_birth":"Chennai","gender":"Female","marital_status":"Single"}' "7"; then
    ((customer_success++))
fi
if test_user_registration "Customer" '{"user_type":"user","full_name":"Arjun Patel","email":"customer8@testuser.com","phone":"+918000000008","password":"TestUser823","city":"Bangalore","state":"Karnataka","country":"India","date_of_birth":"03/09/1989","time_of_birth":"8:25 PM","place_of_birth":"Mumbai","gender":"Female","marital_status":"Single"}' "8"; then
    ((customer_success++))
fi
if test_user_registration "Customer" '{"user_type":"user","full_name":"Aditya Bansal","email":"customer9@testuser.com","phone":"+918000000009","password":"TestUser923","city":"Bangalore","state":"Karnataka","country":"India","date_of_birth":"05/09/1981","time_of_birth":"11:07 PM","place_of_birth":"Lucknow","gender":"Female","marital_status":"Married"}' "9"; then
    ((customer_success++))
fi
if test_user_registration "Customer" '{"user_type":"user","full_name":"Fatima Verma","email":"customer10@testuser.com","phone":"+918000000010","password":"TestUser1023","city":"Kolkata","state":"Karnataka","country":"India","date_of_birth":"01/09/1997","time_of_birth":"1:17 PM","place_of_birth":"Lucknow","gender":"Female","marital_status":"Single"}' "10"; then
    ((customer_success++))
fi

echo "✅ Customer registrations completed: $customer_success/10"

echo ""
echo "🎯 Phase 2: Testing User Logins"
echo "==============================="
test_user_login "astrologer1@testastro.com" "TestAstro123" "astrologer"
test_user_login "astrologer2@testastro.com" "TestAstro223" "astrologer"
test_user_login "astrologer3@testastro.com" "TestAstro323" "astrologer"
test_user_login "astrologer4@testastro.com" "TestAstro423" "astrologer"
test_user_login "astrologer5@testastro.com" "TestAstro523" "astrologer"
test_user_login "astrologer6@testastro.com" "TestAstro623" "astrologer"
test_user_login "astrologer7@testastro.com" "TestAstro723" "astrologer"
test_user_login "astrologer8@testastro.com" "TestAstro823" "astrologer"
test_user_login "astrologer9@testastro.com" "TestAstro923" "astrologer"
test_user_login "astrologer10@testastro.com" "TestAstro1023" "astrologer"
test_user_login "customer1@testuser.com" "TestUser123" "customer"  
test_user_login "customer2@testuser.com" "TestUser223" "customer"  
test_user_login "customer3@testuser.com" "TestUser323" "customer"  
test_user_login "customer4@testuser.com" "TestUser423" "customer"  
test_user_login "customer5@testuser.com" "TestUser523" "customer"  
test_user_login "customer6@testuser.com" "TestUser623" "customer"  
test_user_login "customer7@testuser.com" "TestUser723" "customer"  
test_user_login "customer8@testuser.com" "TestUser823" "customer"  
test_user_login "customer9@testuser.com" "TestUser923" "customer"  
test_user_login "customer10@testuser.com" "TestUser1023" "customer"  

echo ""
echo "🎯 Phase 3: Manual Testing Instructions"
echo "======================================="
echo "1. Run the Flutter app on device/emulator"
echo "2. Test the generated user accounts manually"
echo "3. Follow the test scenarios in test_scenarios.json"
echo "4. Test profile image functionality:"
echo "   - App upload: Use accounts with 'app_upload' type"
echo "   - Gmail profile: Use accounts with 'gmail_profile' type"
echo "5. Test cross-user interactions (chat, calls, payments)"
echo ""
echo "📊 Test Summary:"
echo "================"
echo "- Astrologer Success Rate: $astrologer_success/10"
echo "- Customer Success Rate: $customer_success/10"
echo "- Total Users Created: $(($astrologer_success + $customer_success))/20"
echo ""
echo "🎉 E2E Testing Script Complete!"

# Check if server is running
if ! curl -s "$USER_API_URL/health" > /dev/null 2>&1; then
    echo ""
    echo "⚠️  WARNING: Server not responding at $USER_API_URL"
    echo "   Please ensure the backend server is running before executing tests"
fi
