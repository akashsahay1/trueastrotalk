#!/bin/bash

# TrueAstroTalk Mobile App E2E Test Execution Script
# Generated: 2025-08-25T13:25:26.710030

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
if test_user_registration "Astrologer" '{"user_type":"astrologer","full_name":"Aadhya Singh","email":"astrologer1@testastro.com","phone":"+919000000001","password":"TestAstro123","city":"Delhi","state":"Maharashtra","country":"India","bio":"Experienced Vastu Shastra practitioner with 12 years of expertise in guiding people through life\'s challenges.","skills":["Face Reading","Horary Astrology"],"languages":["Punjabi"],"call_rate":57.0,"chat_rate":26.0,"video_rate":20.0}' "1"; then
    ((astrologer_success++))
fi
if test_user_registration "Astrologer" '{"user_type":"astrologer","full_name":"Fatima Bansal","email":"astrologer2@testastro.com","phone":"+919000000002","password":"TestAstro223","city":"Pune","state":"Maharashtra","country":"India","bio":"Experienced Vedic Astrology practitioner with 10 years of expertise in guiding people through life\'s challenges.","skills":["Palmistry","Tarot Reading","Gemology"],"languages":["Telugu"],"call_rate":24.0,"chat_rate":10.0,"video_rate":52.0}' "2"; then
    ((astrologer_success++))
fi
if test_user_registration "Astrologer" '{"user_type":"astrologer","full_name":"Priya Singh","email":"astrologer3@testastro.com","phone":"+919000000003","password":"TestAstro323","city":"Pune","state":"Maharashtra","country":"India","bio":"Experienced Prashna Astrology practitioner with 17 years of expertise in guiding people through life\'s challenges.","skills":["Prashna Astrology","Gemology","Palmistry"],"languages":["English","Hindi","Telugu"],"call_rate":29.0,"chat_rate":31.0,"video_rate":76.0}' "3"; then
    ((astrologer_success++))
fi
if test_user_registration "Astrologer" '{"user_type":"astrologer","full_name":"Inaya Shah","email":"astrologer4@testastro.com","phone":"+919000000004","password":"TestAstro423","city":"Jaipur","state":"Maharashtra","country":"India","bio":"Experienced Lal Kitab practitioner with 4 years of expertise in guiding people through life\'s challenges.","skills":["Vedic Astrology","Prashna Astrology","KP Astrology","Horary Astrology"],"languages":["Telugu"],"call_rate":11.0,"chat_rate":17.0,"video_rate":39.0}' "4"; then
    ((astrologer_success++))
fi
if test_user_registration "Astrologer" '{"user_type":"astrologer","full_name":"Vivaan Bansal","email":"astrologer5@testastro.com","phone":"+919000000005","password":"TestAstro523","city":"Ahmedabad","state":"Maharashtra","country":"India","bio":"Experienced Gemology practitioner with 13 years of expertise in guiding people through life\'s challenges.","skills":["Gemology","Tarot Reading","Face Reading","KP Astrology","Vastu Shastra"],"languages":["Gujarati","Tamil","Malayalam"],"call_rate":28.0,"chat_rate":20.0,"video_rate":34.0}' "5"; then
    ((astrologer_success++))
fi
if test_user_registration "Astrologer" '{"user_type":"astrologer","full_name":"Anaya Joshi","email":"astrologer6@testastro.com","phone":"+919000000006","password":"TestAstro623","city":"Chennai","state":"Maharashtra","country":"India","bio":"Experienced Remedial Astrology practitioner with 1 years of expertise in guiding people through life\'s challenges.","skills":["Remedial Astrology","Lal Kitab"],"languages":["Hindi","English","Tamil"],"call_rate":10.0,"chat_rate":13.0,"video_rate":32.0}' "6"; then
    ((astrologer_success++))
fi
if test_user_registration "Astrologer" '{"user_type":"astrologer","full_name":"Vivaan Singh","email":"astrologer7@testastro.com","phone":"+919000000007","password":"TestAstro723","city":"Bangalore","state":"Maharashtra","country":"India","bio":"Experienced Prashna Astrology practitioner with 5 years of expertise in guiding people through life\'s challenges.","skills":["Tarot Reading","Numerology"],"languages":["Malayalam","Urdu","Hindi"],"call_rate":29.0,"chat_rate":24.0,"video_rate":62.0}' "7"; then
    ((astrologer_success++))
fi
if test_user_registration "Astrologer" '{"user_type":"astrologer","full_name":"Myra Kumar","email":"astrologer8@testastro.com","phone":"+919000000008","password":"TestAstro823","city":"Bangalore","state":"Maharashtra","country":"India","bio":"Experienced Gemology practitioner with 1 years of expertise in guiding people through life\'s challenges.","skills":["Horary Astrology","Gemology","Palmistry"],"languages":["Bengali","Urdu","Punjabi"],"call_rate":24.0,"chat_rate":10.0,"video_rate":83.0}' "8"; then
    ((astrologer_success++))
fi
if test_user_registration "Astrologer" '{"user_type":"astrologer","full_name":"Kavya Patel","email":"astrologer9@testastro.com","phone":"+919000000009","password":"TestAstro923","city":"Jaipur","state":"Maharashtra","country":"India","bio":"Experienced Lal Kitab practitioner with 16 years of expertise in guiding people through life\'s challenges.","skills":["Tarot Reading","KP Astrology"],"languages":["Tamil","Gujarati"],"call_rate":51.0,"chat_rate":27.0,"video_rate":63.0}' "9"; then
    ((astrologer_success++))
fi
if test_user_registration "Astrologer" '{"user_type":"astrologer","full_name":"Vivaan Jain","email":"astrologer10@testastro.com","phone":"+919000000010","password":"TestAstro1023","city":"Mumbai","state":"Maharashtra","country":"India","bio":"Experienced Palmistry practitioner with 8 years of expertise in guiding people through life\'s challenges.","skills":["Numerology","Prashna Astrology","Horary Astrology"],"languages":["Bengali"],"call_rate":51.0,"chat_rate":13.0,"video_rate":59.0}' "10"; then
    ((astrologer_success++))
fi

echo "✅ Astrologer registrations completed: $astrologer_success/10"

# Test customer registrations  
echo "Testing 10 customers..."
customer_success=0
if test_user_registration "Customer" '{"user_type":"user","full_name":"Sai Kumar","email":"customer1@testuser.com","phone":"+918000000001","password":"TestUser123","city":"Delhi","state":"Karnataka","country":"India","date_of_birth":"08/09/1968","time_of_birth":"2:41 AM","place_of_birth":"Ahmedabad","gender":"Female","marital_status":"Single"}' "1"; then
    ((customer_success++))
fi
if test_user_registration "Customer" '{"user_type":"user","full_name":"Kavya Gupta","email":"customer2@testuser.com","phone":"+918000000002","password":"TestUser223","city":"Bangalore","state":"Karnataka","country":"India","date_of_birth":"09/09/1965","time_of_birth":"4:00 PM","place_of_birth":"Lucknow","gender":"Female","marital_status":"Single"}' "2"; then
    ((customer_success++))
fi
if test_user_registration "Customer" '{"user_type":"user","full_name":"Ayaan Gupta","email":"customer3@testuser.com","phone":"+918000000003","password":"TestUser323","city":"Hyderabad","state":"Karnataka","country":"India","date_of_birth":"05/09/1983","time_of_birth":"10:15 PM","place_of_birth":"Jaipur","gender":"Female","marital_status":"Divorced"}' "3"; then
    ((customer_success++))
fi
if test_user_registration "Customer" '{"user_type":"user","full_name":"Diya Singh","email":"customer4@testuser.com","phone":"+918000000004","password":"TestUser423","city":"Mumbai","state":"Karnataka","country":"India","date_of_birth":"10/09/1961","time_of_birth":"4:34 AM","place_of_birth":"Ahmedabad","gender":"Male","marital_status":"Married"}' "4"; then
    ((customer_success++))
fi
if test_user_registration "Customer" '{"user_type":"user","full_name":"Arjun Bansal","email":"customer5@testuser.com","phone":"+918000000005","password":"TestUser523","city":"Mumbai","state":"Karnataka","country":"India","date_of_birth":"09/09/1965","time_of_birth":"10:05 PM","place_of_birth":"Chennai","gender":"Male","marital_status":"Married"}' "5"; then
    ((customer_success++))
fi
if test_user_registration "Customer" '{"user_type":"user","full_name":"Priya Tiwari","email":"customer6@testuser.com","phone":"+918000000006","password":"TestUser623","city":"Mumbai","state":"Karnataka","country":"India","date_of_birth":"30/08/2005","time_of_birth":"3:14 AM","place_of_birth":"Pune","gender":"Male","marital_status":"Single"}' "6"; then
    ((customer_success++))
fi
if test_user_registration "Customer" '{"user_type":"user","full_name":"Fatima Shah","email":"customer7@testuser.com","phone":"+918000000007","password":"TestUser723","city":"Hyderabad","state":"Karnataka","country":"India","date_of_birth":"08/09/1969","time_of_birth":"10:56 AM","place_of_birth":"Mumbai","gender":"Female","marital_status":"Single"}' "7"; then
    ((customer_success++))
fi
if test_user_registration "Customer" '{"user_type":"user","full_name":"Reyansh Bansal","email":"customer8@testuser.com","phone":"+918000000008","password":"TestUser823","city":"Pune","state":"Karnataka","country":"India","date_of_birth":"09/09/1965","time_of_birth":"6:58 AM","place_of_birth":"Bangalore","gender":"Male","marital_status":"Single"}' "8"; then
    ((customer_success++))
fi
if test_user_registration "Customer" '{"user_type":"user","full_name":"Diya Bansal","email":"customer9@testuser.com","phone":"+918000000009","password":"TestUser923","city":"Hyderabad","state":"Karnataka","country":"India","date_of_birth":"31/08/2003","time_of_birth":"10:08 PM","place_of_birth":"Lucknow","gender":"Male","marital_status":"Married"}' "9"; then
    ((customer_success++))
fi
if test_user_registration "Customer" '{"user_type":"user","full_name":"Reyansh Goyal","email":"customer10@testuser.com","phone":"+918000000010","password":"TestUser1023","city":"Kolkata","state":"Karnataka","country":"India","date_of_birth":"10/09/1961","time_of_birth":"12:45 PM","place_of_birth":"Jaipur","gender":"Male","marital_status":"Divorced"}' "10"; then
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
