const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Load environment variables
require('dotenv').config();

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'trueastrotalkDB';
const SALT_ROUNDS = 12;

// Indian names arrays
const firstNames = [
  'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan',
  'Shaurya', 'Atharv', 'Advik', 'Pranav', 'Rishabh', 'Ritvik', 'Daksh', 'Aryan', 'Veer', 'Rudra',
  'Ananya', 'Fatima', 'Ira', 'Priya', 'Riya', 'Anvi', 'Vani', 'Aahana', 'Aditi', 'Kavya',
  'Pihu', 'Diya', 'Avni', 'Pooja', 'Kiara', 'Saanvi', 'Arya', 'Sara', 'Myra', 'Aanya'
];

const lastNames = [
  'Sharma', 'Verma', 'Gupta', 'Agarwal', 'Singh', 'Patel', 'Kumar', 'Jain', 'Yadav', 'Mishra',
  'Tiwari', 'Pandey', 'Srivastava', 'Chauhan', 'Joshi', 'Saxena', 'Mathur', 'Bansal', 'Arora', 'Kapoor',
  'Malhotra', 'Chopra', 'Shah', 'Mehta', 'Thakur', 'Rajput', 'Nair', 'Menon', 'Pillai', 'Reddy'
];

const cities = [
  'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Ahmedabad', 'Chennai', 'Kolkata', 'Surat', 'Pune', 'Jaipur',
  'Lucknow', 'Kanpur', 'Nagpur', 'Visakhapatnam', 'Indore', 'Thane', 'Bhopal', 'Patna', 'Vadodara', 'Ghaziabad',
  'Ludhiana', 'Nashik', 'Faridabad', 'Meerut', 'Rajkot', 'Kalyan', 'Vasai', 'Varanasi', 'Srinagar', 'Aurangabad'
];

const states = [
  'Maharashtra', 'Karnataka', 'Tamil Nadu', 'Gujarat', 'Rajasthan', 'Uttar Pradesh', 'West Bengal', 
  'Madhya Pradesh', 'Bihar', 'Andhra Pradesh', 'Telangana', 'Kerala', 'Punjab', 'Haryana', 'Odisha',
  'Jharkhand', 'Assam', 'Chhattisgarh', 'Uttarakhand', 'Himachal Pradesh'
];

// These must match exactly what's in Settings -> Astrologers -> Skills & Languages
const skills = [
  'Vedic', 'Palmistry', 'Numerology', 'Vastu', 'Lal kitab', 'Loshu grid',
  'Prashana', 'Tarot', 'Psychic', 'Nadi', 'Kp', 'Etc'
];

const languages = [
  'Hindi', 'English', 'Tamil', 'Telugu', 'Malayalam', 'Kannada',
  'Marathi', 'Gujarati', 'Bengali', 'Punjabi', 'Urdu', 'Sanskrit'
];

const qualifications = [
  'Bachelor of Arts in Astrology',
  'Master of Arts in Astrology', 
  'Jyotish Acharya',
  'Jyotish Visharad',
  'PhD in Vedic Studies',
  'Certificate in Vastu Shastra',
  'Diploma in Palmistry',
  'Advanced Tarot Reading Certification',
  'Numerology Expert Certification',
  'Gemology Certification'
];

const bioTemplates = [
  "Experienced astrologer with {experience} years of practice in Vedic astrology and spiritual guidance.",
  "Passionate about helping people find clarity and direction through ancient wisdom and modern understanding.",
  "Specialized in {specialization} with a deep understanding of planetary influences on human life.",
  "Dedicated to providing accurate predictions and practical solutions for life's challenges.",
  "Combining traditional knowledge with contemporary approach to offer meaningful insights.",
  "Expert in relationship counseling, career guidance, and spiritual healing through astrological methods.",
  "Helping individuals discover their true potential and navigate life's journey with confidence.",
  "Committed to spreading the wisdom of Vedic astrology and its practical applications in daily life."
];

function generateRandomData() {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const city = cities[Math.floor(Math.random() * cities.length)];
  const state = states[Math.floor(Math.random() * states.length)];
  
  // Generate random skills (2-5 skills per astrologer)
  const numSkills = 2 + Math.floor(Math.random() * 4);
  const selectedSkills = [];
  for (let i = 0; i < numSkills; i++) {
    const skill = skills[Math.floor(Math.random() * skills.length)];
    if (!selectedSkills.includes(skill)) {
      selectedSkills.push(skill);
    }
  }
  
  // Generate random languages (1-3 languages per astrologer)
  const numLanguages = 1 + Math.floor(Math.random() * 3);
  const selectedLanguages = [];
  for (let i = 0; i < numLanguages; i++) {
    const language = languages[Math.floor(Math.random() * languages.length)];
    if (!selectedLanguages.includes(language)) {
      selectedLanguages.push(language);
    }
  }
  
  // Generate random qualifications (1-3 per astrologer)
  const numQualifications = 1 + Math.floor(Math.random() * 3);
  const selectedQualifications = [];
  for (let i = 0; i < numQualifications; i++) {
    const qualification = qualifications[Math.floor(Math.random() * qualifications.length)];
    if (!selectedQualifications.includes(qualification)) {
      selectedQualifications.push(qualification);
    }
  }
  
  const experienceYears = 1 + Math.floor(Math.random() * 25); // 1-25 years experience
  const specialization = selectedSkills[0]; // Use first skill as specialization
  
  const bio = bioTemplates[Math.floor(Math.random() * bioTemplates.length)]
    .replace('{experience}', experienceYears)
    .replace('{specialization}', specialization);
  
  // Generate random birth details
  const birthYear = 1960 + Math.floor(Math.random() * 40); // Birth year between 1960-2000
  const birthMonth = 1 + Math.floor(Math.random() * 12);
  const birthDay = 1 + Math.floor(Math.random() * 28); // Safe day range
  const birthHour = Math.floor(Math.random() * 24);
  const birthMinute = Math.floor(Math.random() * 60);
  const ampm = birthHour >= 12 ? 'PM' : 'AM';
  const displayHour = birthHour === 0 ? 12 : birthHour > 12 ? birthHour - 12 : birthHour;
  
  // Generate bank details
  const banks = ['State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Punjab National Bank', 'Bank of Baroda', 
                 'Axis Bank', 'Kotak Mahindra Bank', 'IndusInd Bank', 'IDBI Bank', 'Yes Bank'];
  const bankName = banks[Math.floor(Math.random() * banks.length)];
  
  // Generate IFSC code (format: XXXX0NNNNNN where X is bank code, N is branch)
  const bankCodes = {
    'State Bank of India': 'SBIN',
    'HDFC Bank': 'HDFC',
    'ICICI Bank': 'ICIC',
    'Punjab National Bank': 'PUNB',
    'Bank of Baroda': 'BARB',
    'Axis Bank': 'UTIB',
    'Kotak Mahindra Bank': 'KKBK',
    'IndusInd Bank': 'INDB',
    'IDBI Bank': 'IBKL',
    'Yes Bank': 'YESB'
  };
  const ifscCode = bankCodes[bankName] + '0' + String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
  
  return {
    firstName,
    lastName,
    city,
    state,
    skills: selectedSkills,
    languages: selectedLanguages,
    qualifications: selectedQualifications,
    experienceYears,
    bio,
    birthDate: `${birthYear}-${String(birthMonth).padStart(2, '0')}-${String(birthDay).padStart(2, '0')}`,
    birthTime: `${String(displayHour).padStart(2, '0')}:${String(birthMinute).padStart(2, '0')} ${ampm}`,
    birthPlace: `${city}, ${state}`,
    callRate: 25 + Math.floor(Math.random() * 176), // 25-200 per minute
    chatRate: 15 + Math.floor(Math.random() * 86),  // 15-100 per minute  
    videoRate: 35 + Math.floor(Math.random() * 216), // 35-250 per minute
    bankName: bankName,
    ifscCode: ifscCode,
    accountNumber: '1' + String(Math.floor(Math.random() * 10000000000)).padStart(10, '0'), // 11 digit account number
    accountHolderName: `${firstName} ${lastName}`
  };
}

async function seedAstrologers(count = 1) {
  const client = new MongoClient(MONGODB_URL);
  
  try {
    console.log('🔗 Connecting to database...');
    await client.connect();
    const db = client.db(DB_NAME);
    
    // Find the highest astrologer number to continue from
    console.log('🔍 Checking existing astrologers...');
    const existingAstrologers = await db.collection('users')
      .find({ 
        user_type: 'astrologer',
        email_address: { $regex: /^astro\d+@trueastrotalk\.com$/ }
      })
      .sort({ email_address: -1 })
      .limit(1)
      .toArray();
    
    let startNumber = 1;
    if (existingAstrologers.length > 0) {
      const lastEmail = existingAstrologers[0].email_address;
      const match = lastEmail.match(/astro(\d+)@trueastrotalk\.com/);
      if (match) {
        startNumber = parseInt(match[1]) + 1;
      }
    }
    
    console.log(`📊 Starting from astrologer number: ${startNumber}`);
    
    // Hash the password once
    console.log('🔒 Hashing password...');
    const hashedPassword = await bcrypt.hash('Akash243@#$', SALT_ROUNDS);
    
    // Get available media IDs for profile images
    console.log('📸 Getting available media for profile images...');
    const mediaFiles = await db.collection('media').find({}, { 
      projection: { media_id: 1, original_name: 1 } 
    }).toArray();
    
    if (mediaFiles.length === 0) {
      console.log('❌ No media files found. Please upload some profile images first.');
      return;
    }
    
    console.log(`✅ Found ${mediaFiles.length} media files for profile images`);
    
    const astrologers = [];
    
    console.log(`🔄 Generating ${count} astrologer(s)...`);
    
    for (let i = 0; i < count; i++) {
      const astrologerNumber = startNumber + i;
      const data = generateRandomData();
      const profileMediaFile = mediaFiles[Math.floor(Math.random() * mediaFiles.length)];
      const panCardMediaFile = mediaFiles[Math.floor(Math.random() * mediaFiles.length)]; // Random PAN card from media
      
      const astrologer = {
        _id: new ObjectId(),
        user_id: `user_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
        full_name: `${data.firstName} ${data.lastName}`,
        email_address: `astro${astrologerNumber}@trueastrotalk.com`,
        password: hashedPassword,
        user_type: 'astrologer',
        auth_type: 'email',
        phone_number: `9${String(Math.floor(Math.random() * 900000000) + 100000000)}`, // Generate 10-digit mobile
        date_of_birth: data.birthDate,
        birth_time: data.birthTime,
        birth_place: data.birthPlace,
        address: `${Math.floor(Math.random() * 999) + 1}, ${data.city}`,
        city: data.city,
        state: data.state,
        country: 'India',
        zip: String(Math.floor(Math.random() * 900000) + 100000), // 6-digit PIN
        gender: Math.random() > 0.5 ? 'male' : 'female',
        account_status: 'active',
        verification_status: 'verified',
        verification_status_message: '',
        verified_at: new Date(),
        verified_by: 'admin',
        is_online: Math.random() > 0.3, // 70% chance of being online
        is_featured: Math.random() > 0.8, // 20% chance of being featured
        skills: data.skills,
        languages: data.languages,
        qualifications: data.qualifications,
        experience_years: data.experienceYears,
        bio: data.bio,
        call_rate: data.callRate,
        chat_rate: data.chatRate,
        video_rate: data.videoRate,
        // Commission percentages (platform takes 25% by default)
        commission_percentage: {
          call: 25,
          chat: 25,
          video: 25
        },
        // Bank details for payouts
        bank_details: {
          account_holder_name: data.accountHolderName,
          account_number: data.accountNumber,
          bank_name: data.bankName,
          ifsc_code: data.ifscCode
        },
        profile_image_id: profileMediaFile.media_id,
        pan_card_id: panCardMediaFile.media_id, // PAN card from media library
        created_at: new Date(),
        updated_at: new Date(),
        failed_login_attempts: 0,
        last_failed_login: null,
        login_count: 0
      };
      
      astrologers.push(astrologer);
      console.log(`📝 Generated: ${astrologer.full_name} (${astrologer.email_address})`);
    }
    
    // Insert astrologers into database
    console.log(`\n💾 Inserting ${count} astrologer(s) into database...`);
    const result = await db.collection('users').insertMany(astrologers);
    
    console.log(`✅ Successfully inserted ${result.insertedCount} astrologer(s)!`);
    
    // Show summary
    console.log('\n📊 Summary:');
    console.log(`- Total astrologers created: ${result.insertedCount}`);
    console.log(`- Email format: astro1@trueastrotalk.com, astro2@trueastrotalk.com, ...`);
    console.log(`- Password: Akash243@#$`);
    console.log(`- All have random profile images from media library`);
    console.log(`- All have random skills, languages, and qualifications`);
    console.log(`- Random rates, experience, and bio`);
    
    return result.insertedCount;
    
  } catch (error) {
    console.error('❌ Error seeding astrologers:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const count = parseInt(args[0]) || 1;
  
  console.log(`🌟 Starting astrologer seeding process for ${count} astrologer(s)...\n`);
  
  try {
    const inserted = await seedAstrologers(count);
    console.log(`\n🎉 Seeding completed successfully! Created ${inserted} astrologer(s).`);
  } catch (error) {
    console.error('\n💥 Seeding failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { seedAstrologers };