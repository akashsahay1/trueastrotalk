const { MongoClient } = require('mongodb');
const crypto = require('crypto');
const path = require('path');

// Load environment configuration
const envPath = path.join(__dirname, '../.env');
require('dotenv').config({ path: envPath });

const MONGODB_URI = process.env.MONGODB_URL;
const DB_NAME = process.env.DB_NAME;

// Hash password function (same as API)
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Validation function (same as API)
function validateAndSanitizeAstrologer(data) {
  // Apply the same validation rules as the API
  const sanitized = {
    // Required basic fields
    full_name: data.full_name || '',
    email_address: data.email_address || '',
    password: data.password ? hashPassword(data.password) : hashPassword('defaultpass123'),
    user_type: 'astrologer',
    auth_type: data.auth_type || 'email',
    phone_number: data.phone_number || '',
    gender: data.gender || 'male',
    
    // Profile fields with defaults (same as API)
    profile_image_id: data.profile_image_id || null,
    social_auth_profile_image: data.social_auth_profile_image || null,
    
    // Personal info fields with defaults
    date_of_birth: data.date_of_birth || '',
    birth_time: data.birth_time || '',
    birth_place: data.birth_place || '',
    address: data.address || '',
    city: data.city || '',
    state: data.state || '',
    country: data.country || 'India',
    zip: data.zip || '',
    
    // Account status fields (same as API defaults)
    account_status: data.account_status || 'active',
    is_online: data.is_online !== undefined ? data.is_online : false,
    verification_status: data.verification_status || 'verified',
    verification_status_message: data.verification_status_message || '',
    verified_at: data.verification_status === 'verified' ? (data.verified_at || new Date()) : null,
    verified_by: data.verification_status === 'verified' ? (data.verified_by || 'admin') : null,
    
    // Astrologer specific fields
    bio: data.bio || '',
    qualifications: Array.isArray(data.qualifications) ? data.qualifications : [],
    skills: Array.isArray(data.skills) ? data.skills : [],
    languages: Array.isArray(data.languages) ? data.languages : ['Hindi', 'English'],
    experience_years: data.experience_years || 0,
    
    // Rates (API validation: must be under 50)
    call_rate: Math.min(data.call_rate || 25, 49),
    chat_rate: Math.min(data.chat_rate || 15, 49),
    video_rate: Math.min(data.video_rate || 35, 49),
    commission_rates: {
      call_rate: Math.min(data.call_rate || 25, 49),
      chat_rate: Math.min(data.chat_rate || 15, 49),
      video_rate: Math.min(data.video_rate || 35, 49)
    },
    
    // Timestamps
    created_at: new Date(),
    updated_at: new Date()
  };

  // API-level validation checks
  if (!sanitized.full_name || !sanitized.email_address || !sanitized.phone_number) {
    throw new Error(`Missing required fields for astrologer: ${sanitized.email_address}`);
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitized.email_address)) {
    throw new Error(`Invalid email format: ${sanitized.email_address}`);
  }

  // Rates validation (same as API)
  if (sanitized.call_rate >= 50 || sanitized.chat_rate >= 50 || sanitized.video_rate >= 50) {
    throw new Error(`All rates must be under ₹50 for astrologer: ${sanitized.email_address}`);
  }

  return sanitized;
}

// Get available profile images from media library
async function getAvailableProfileImages(db) {
  const mediaCollection = db.collection('media');
  const images = await mediaCollection.find({
    $or: [
      { original_name: /\.(jpg|jpeg|png|gif)$/i },
      { file_path: /\.(jpg|jpeg|png|gif)$/i }
    ]
  }).toArray();
  
  // Filter for suitable profile images (exclude product images)
  const profileImages = images.filter(img => {
    const name = img.original_name?.toLowerCase() || '';
    return name.includes('avatar') || 
           name.includes('profile') || 
           name.includes('astro') ||
           name.includes('ta-') || // Generic uploaded images
           name === 'default_astrologer_avatar.jpg';
  });
  
  // If no specific profile images found, use first few general images
  if (profileImages.length < 10) {
    return images.slice(0, Math.min(20, images.length));
  }
  
  return profileImages;
}

// Generate realistic astrologer data
function generateAstrologerData(index, availableImages = []) {
  const firstNames = [
    'Dr. Rajesh', 'Pandit Suresh', 'Acharya Vikram', 'Dr. Priya', 'Guruji Mahesh',
    'Pt. Ramesh', 'Dr. Sunita', 'Acharya Deepak', 'Pandit Ravi', 'Dr. Neeta',
    'Guruji Sanjay', 'Pt. Ashok', 'Dr. Kavita', 'Acharya Pramod', 'Pandit Gopal',
    'Dr. Meera', 'Guruji Vinod', 'Pt. Manoj', 'Dr. Rekha', 'Acharya Dinesh'
  ];
  
  const lastNames = [
    'Sharma', 'Kumar', 'Singh', 'Patel', 'Tiwari', 'Gupta', 'Joshi', 'Mishra', 
    'Shastri', 'Agarwal', 'Pandey', 'Dwivedi', 'Verma', 'Rai', 'Tripathi'
  ];

  const cities = [
    'Delhi', 'Mumbai', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 
    'Ahmedabad', 'Jaipur', 'Surat', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Varanasi'
  ];

  const states = [
    'Delhi', 'Maharashtra', 'Karnataka', 'Tamil Nadu', 'West Bengal', 'Telangana',
    'Gujarat', 'Rajasthan', 'Uttar Pradesh', 'Madhya Pradesh'
  ];

  const qualifications = [
    ['Jyotish Acharya', 'Vedic Astrology'], ['PhD in Astrology', 'Palmistry'], 
    ['Vastu Shastra', 'Numerology'], ['Tarot Reading', 'Crystal Healing'],
    ['Gemology', 'Horoscope Analysis'], ['Kundli Matching', 'Career Guidance']
  ];

  const skills = [
    ['Vedic Astrology', 'Palmistry', 'Vastu'], ['Numerology', 'Tarot', 'Gemology'],
    ['Kundli Matching', 'Career Guidance', 'Love Marriage'], ['Health Astrology', 'Business Astrology', 'Remedies'],
    ['Horoscope Reading', 'Future Prediction', 'Spiritual Healing']
  ];

  const birthPlaces = [
    'New Delhi', 'Mumbai', 'Bangalore', 'Chennai', 'Kolkata', 'Jaipur', 'Varanasi',
    'Rishikesh', 'Haridwar', 'Mathura', 'Vrindavan', 'Amritsar', 'Puri', 'Kashi'
  ];

  const birthTimes = [
    '06:00 AM', '06:30 AM', '07:00 AM', '07:30 AM', '08:00 AM', '08:30 AM',
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM',
    '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM'
  ];

  const addresses = [
    'Sector 15, Noida', 'Andheri West', 'Koramangala', 'T. Nagar', 'Salt Lake City',
    'Banjara Hills', 'Kothrud', 'Satellite', 'Malviya Nagar', 'Adajan'
  ];

  // Generate varied rates based on experience level
  const experienceLevel = ['junior', 'mid', 'senior'][index % 3];
  let callRate, chatRate, videoRate;
  
  switch(experienceLevel) {
    case 'junior':
      callRate = 15 + Math.floor(Math.random() * 15); // 15-29
      chatRate = 8 + Math.floor(Math.random() * 12); // 8-19
      videoRate = 20 + Math.floor(Math.random() * 15); // 20-34
      break;
    case 'mid':
      callRate = 25 + Math.floor(Math.random() * 15); // 25-39
      chatRate = 15 + Math.floor(Math.random() * 13); // 15-27
      videoRate = 28 + Math.floor(Math.random() * 14); // 28-41
      break;
    case 'senior':
      callRate = 35 + Math.floor(Math.random() * 14); // 35-48
      chatRate = 25 + Math.floor(Math.random() * 10); // 25-34
      videoRate = 38 + Math.floor(Math.random() * 11); // 38-48
      break;
  }

  const firstName = firstNames[index % firstNames.length];
  const lastName = lastNames[index % lastNames.length];
  const city = cities[index % cities.length];
  const state = states[index % states.length];
  
  // Generate birth date (age 25-60)
  const age = 25 + Math.floor(Math.random() * 35);
  const birthYear = new Date().getFullYear() - age;
  const birthMonth = 1 + Math.floor(Math.random() * 12);
  const birthDay = 1 + Math.floor(Math.random() * 28);
  const birthDate = `${birthYear}-${birthMonth.toString().padStart(2, '0')}-${birthDay.toString().padStart(2, '0')}`;

  // Assign profile image from available images (cycling through them)
  let profileImageId = null;
  if (availableImages.length > 0) {
    const selectedImage = availableImages[index % availableImages.length];
    profileImageId = selectedImage._id;
  }

  return {
    profile_image_id: profileImageId,
    full_name: `${firstName} ${lastName}`,
    email_address: `astro${index + 1}@trueastrotalk.com`,
    password: 'astrologer123',
    phone_number: `+91 ${9000000000 + index}`,
    gender: index % 3 === 0 ? 'female' : 'male',
    date_of_birth: birthDate,
    birth_time: birthTimes[index % birthTimes.length],
    birth_place: birthPlaces[index % birthPlaces.length],
    address: addresses[index % addresses.length],
    city: city,
    state: state,
    country: 'India',
    zip: `${110000 + index}`,
    bio: `Experienced ${firstName} with ${5 + (index % 15)} years of expertise in Vedic astrology and spiritual guidance. Specializing in career, relationships, and life predictions.`,
    qualifications: qualifications[index % qualifications.length],
    skills: skills[index % skills.length],
    languages: index % 4 === 0 ? ['Hindi', 'English', 'Sanskrit'] : ['Hindi', 'English'],
    experience_years: 5 + (index % 15),
    call_rate: callRate,
    chat_rate: chatRate,
    video_rate: videoRate,
    verification_status: index % 5 === 0 ? 'verified' : 'pending'
  };
}

async function seedAstrologers() {
  if (!MONGODB_URI || !DB_NAME) {
    console.error('❌ Missing environment variables: MONGODB_URL and DB_NAME are required');
    process.exit(1);
  }

  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('🚀 Starting fresh astrologer seeding with API validation...');
    console.log('🔄 Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected to MongoDB successfully');

    const db = client.db(DB_NAME);
    const usersCollection = db.collection('users');

    // Check if astrologers already exist
    const existingCount = await usersCollection.countDocuments({ user_type: 'astrologer' });
    if (existingCount > 0) {
      console.log(`⚠️  Found ${existingCount} existing astrologers. Please run cleanup first.`);
      return;
    }

    console.log('🖼️  Fetching available profile images from media library...');
    const availableImages = await getAvailableProfileImages(db);
    console.log(`📸 Found ${availableImages.length} suitable profile images`);

    console.log('📝 Generating astrologer data with proper validation...');
    
    const numberOfAstrologers = 50; // Reasonable number for testing
    const astrologers = [];
    let validationErrors = 0;

    for (let i = 0; i < numberOfAstrologers; i++) {
      try {
        const rawData = generateAstrologerData(i, availableImages);
        const validatedData = validateAndSanitizeAstrologer(rawData);
        astrologers.push(validatedData);
      } catch (error) {
        console.error(`❌ Validation failed for astrologer ${i + 1}: ${error.message}`);
        validationErrors++;
      }
    }

    if (validationErrors > 0) {
      console.log(`⚠️  ${validationErrors} astrologers failed validation and were skipped`);
    }

    if (astrologers.length === 0) {
      console.error('❌ No valid astrologers to insert');
      return;
    }

    console.log(`💾 Inserting ${astrologers.length} validated astrologers...`);

    // Check for duplicate emails (API-level validation)
    const emails = astrologers.map(a => a.email_address);
    const existingUsers = await usersCollection.find({ email_address: { $in: emails } }).toArray();
    
    if (existingUsers.length > 0) {
      console.error(`❌ Found ${existingUsers.length} duplicate emails. Please clean database first.`);
      return;
    }

    // Insert astrologers
    const result = await usersCollection.insertMany(astrologers);
    console.log(`✅ Successfully inserted ${result.insertedCount} astrologers`);

    // Generate summary statistics
    const rateStats = {
      call: { min: Math.min(...astrologers.map(a => a.call_rate)), max: Math.max(...astrologers.map(a => a.call_rate)) },
      chat: { min: Math.min(...astrologers.map(a => a.chat_rate)), max: Math.max(...astrologers.map(a => a.chat_rate)) },
      video: { min: Math.min(...astrologers.map(a => a.video_rate)), max: Math.max(...astrologers.map(a => a.video_rate)) }
    };

    const verificationStats = astrologers.reduce((acc, a) => {
      acc[a.verification_status] = (acc[a.verification_status] || 0) + 1;
      return acc;
    }, {});

    // Count astrologers with profile images
    const withImages = astrologers.filter(a => a.profile_image_id).length;

    console.log('\n📊 Seeding Summary:');
    console.log(`   Total astrologers: ${astrologers.length}`);
    console.log(`   With profile images: ${withImages}/${astrologers.length} ✅`);
    console.log(`   Rate ranges:`);
    console.log(`     Call: ₹${rateStats.call.min} - ₹${rateStats.call.max}`);
    console.log(`     Chat: ₹${rateStats.chat.min} - ₹${rateStats.chat.max}`);
    console.log(`     Video: ₹${rateStats.video.min} - ₹${rateStats.video.max}`);
    console.log(`   Verification status:`, verificationStats);
    console.log(`   All rates are under ₹50 as per API validation ✅`);
    console.log(`   All fields have proper defaults as per API logic ✅`);
    
    console.log('\n🎉 Fresh astrologer seeding completed successfully!');
    console.log('💡 All data follows the same validation rules as the API routes.');

  } catch (error) {
    console.error('❌ Error seeding astrologers:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 MongoDB connection closed');
  }
}

// Run the seeding
seedAstrologers()
  .then(() => {
    console.log('✨ Seeding process completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Seeding failed:', error);
    process.exit(1);
  });