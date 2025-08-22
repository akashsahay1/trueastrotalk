const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');

// Database configuration
const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'trueastrotalkDB';

// Sample data arrays
const astrologerNames = [
  'Dr. Rajesh Sharma', 'Pandit Suresh Kumar', 'Acharya Vikram Singh', 'Dr. Priya Patel', 'Guruji Mahesh Tiwari',
  'Pt. Ramesh Gupta', 'Dr. Sunita Joshi', 'Acharya Deepak Mishra', 'Pandit Ravi Shastri', 'Dr. Neeta Agarwal',
  'Guruji Sanjay Pandey', 'Pt. Ashok Dwivedi', 'Dr. Kavita Singh', 'Acharya Pramod Kumar', 'Pandit Gopal Das',
  'Dr. Meera Sharma', 'Guruji Vinod Tiwari', 'Pt. Manoj Jha', 'Dr. Rekha Verma', 'Acharya Dinesh Rai',
  'Pandit Anil Tripathi', 'Dr. Pooja Gupta', 'Guruji Rakesh Pandey', 'Pt. Sunil Shukla', 'Dr. Anita Mishra',
  'Acharya Bharat Singh', 'Pandit Ajay Kumar', 'Dr. Ritu Agarwal', 'Guruji Pankaj Tiwari', 'Pt. Vivek Sharma',
  'Dr. Sushma Joshi', 'Acharya Kiran Singh', 'Pandit Vijay Gupta', 'Dr. Manju Verma', 'Guruji Raj Kumar',
  'Pt. Yogesh Pandey', 'Dr. Sita Singh', 'Acharya Mukesh Rai', 'Pandit Rohit Shastri', 'Dr. Geeta Patel',
  'Guruji Amit Tiwari', 'Pt. Shyam Dwivedi', 'Dr. Uma Sharma', 'Acharya Naresh Kumar', 'Pandit Ranjan Das',
  'Dr. Lalita Agarwal', 'Guruji Jitendra Singh', 'Pt. Krishna Jha', 'Dr. Bharti Mishra', 'Acharya Sudhir Rai'
];

const skills = [
  'Vedic Astrology', 'Numerology', 'Palmistry', 'Tarot Reading', 'Face Reading',
  'Vastu Shastra', 'Love & Relationships', 'Career Guidance', 'Health Astrology', 'Business Astrology',
  'Marriage Compatibility', 'Kundli Making', 'Gem Stone Consultation', 'Spiritual Healing', 'Psychic Reading',
  'Western Astrology', 'KP Astrology', 'Prashna Astrology', 'Medical Astrology', 'Financial Astrology'
];

const languages = ['Hindi', 'English', 'Sanskrit', 'Bengali', 'Tamil', 'Telugu', 'Marathi', 'Gujarati', 'Punjabi', 'Urdu'];

const qualifications = [
  'PhD in Astrology', 'Masters in Jyotish Shastra', 'Diploma in Vedic Astrology', 'Certificate in Numerology',
  'Advanced Palmistry Course', 'Vastu Shastra Expert', 'Traditional Guru-Shishya Training', 'Self-taught Expert'
];

const cities = [
  'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad', 'Surat', 'Jaipur',
  'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Pimpri', 'Patna', 'Vadodara'
];

const states = [
  'Maharashtra', 'Delhi', 'Karnataka', 'Telangana', 'Tamil Nadu', 'West Bengal', 'Gujarat', 'Rajasthan',
  'Uttar Pradesh', 'Madhya Pradesh', 'Bihar', 'Andhra Pradesh', 'Haryana', 'Punjab', 'Odisha'
];

const productNames = [
  'Rudraksha Mala 108 Beads', 'Crystal Healing Stone Set', 'Yantra for Wealth', 'Ganesha Idol Brass', 'Shri Yantra Crystal',
  'Evil Eye Protection Bracelet', 'Navgraha Stone Ring', 'Hanuman Chalisa Book', 'Meditation Cushion', 'Incense Sticks Sandalwood',
  'Om Wall Hanging', 'Chakra Balancing Stones', 'Feng Shui Laughing Buddha', 'Tarot Card Deck', 'Numerology Chart',
  'Palmistry Hand Model', 'Astrology Calendar 2025', 'Gemstone Consultation Kit', 'Vastu Compass', 'Spiritual Healing Oil',
  'Mahamrityunjaya Yantra', 'Rose Quartz Heart', 'Black Tourmaline Pendant', 'Amethyst Cluster', 'Citrine Tree',
  'Red Coral Ring', 'Pearl Mala', 'Emerald Pendant', 'Blue Sapphire Ring', 'Yellow Sapphire Earrings',
  'Silver Om Pendant', 'Copper Kalash', 'Brass Diya Set', 'Camphor Tablets', 'Gangajal Holy Water',
  'Tulsi Mala 108 Beads', 'Sphatik Shivling', 'Gomti Chakra Set', 'Conch Shell Shankh', 'Kauri Shells Set',
  'Abhimantrit Yantra', 'Energized Bracelet', 'Blessed Rudraksha', 'Consecrated Ring', 'Sacred Thread Kalawa',
  'Astrology Software CD', 'Kundli Making Book', 'Horoscope Analysis Guide', 'Vastu Tips Manual', 'Numerology Handbook'
];

const productCategories = [
  'Gemstones & Jewelry', 'Yantras & Spiritual Items', 'Books & Guides', 'Healing Crystals', 'Religious Idols',
  'Meditation Accessories', 'Protection Items', 'Feng Shui Products', 'Astrology Tools', 'Sacred Items'
];

const productDescriptions = [
  'Authentic and energized for maximum spiritual benefit',
  'Handcrafted by experienced artisans with traditional methods',
  'Blessed by learned pandits for enhanced positive energy',
  'Made from genuine materials sourced from sacred places',
  'Perfect for daily worship and spiritual practices',
  'Ideal gift for festivals and special occasions',
  'Helps in meditation and spiritual growth',
  'Brings prosperity and good fortune to your home',
  'Protects from negative energies and evil eye',
  'Enhances peace, happiness and spiritual well-being'
];

async function seedDatabase() {
  const client = new MongoClient(MONGODB_URL);
  
  try {
    console.log('🔗 Connecting to database...');
    await client.connect();
    const db = client.db(DB_NAME);
    
    // Clear existing test data (optional)
    console.log('🗑️ Clearing existing test astrologers and products...');
    await db.collection('users').deleteMany({ 
      email_address: { $regex: /^astro\d+@trueastrotalk\.com$/ } 
    });
    await db.collection('products').deleteMany({ 
      name: { $in: productNames } 
    });
    
    // Get media files for profile images and product images
    console.log('📸 Fetching media files...');
    const mediaFiles = await db.collection('media_files').find({
      file_type: 'image',
      status: 'active'
    }).limit(50).toArray();
    
    if (mediaFiles.length === 0) {
      console.log('⚠️ No media files found. Creating some sample media records...');
      const sampleMedia = [];
      for (let i = 1; i <= 20; i++) {
        sampleMedia.push({
          _id: new ObjectId(),
          original_filename: `sample-${i}.jpg`,
          file_path: `/uploads/sample-${i}.jpg`,
          file_type: 'image',
          file_size: Math.floor(Math.random() * 1000000) + 100000,
          mime_type: 'image/jpeg',
          status: 'active',
          uploaded_by: 'system',
          created_at: new Date(),
          updated_at: new Date()
        });
      }
      await db.collection('media_files').insertMany(sampleMedia);
      console.log(`✅ Created ${sampleMedia.length} sample media files`);
    }
    
    // Refresh media files list
    const availableMedia = await db.collection('media_files').find({
      file_type: 'image',
      status: 'active'
    }).toArray();
    
    // Seed Astrologers
    console.log('👨‍🏫 Creating 100 astrologers...');
    const hashedPassword = await bcrypt.hash('Astro243@#$', 12);
    const astrologers = [];
    
    for (let i = 1; i <= 100; i++) {
      const nameIndex = (i - 1) % astrologerNames.length;
      const name = i <= astrologerNames.length ? astrologerNames[nameIndex] : `${astrologerNames[nameIndex]} ${Math.ceil(i / astrologerNames.length)}`;
      
      const profileImage = availableMedia[Math.floor(Math.random() * availableMedia.length)];
      const randomSkills = skills.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 5) + 3);
      const randomLanguages = languages.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 4) + 2);
      const randomQualifications = qualifications.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 3) + 1);
      const city = cities[Math.floor(Math.random() * cities.length)];
      const state = states[Math.floor(Math.random() * states.length)];
      
      const astrologer = {
        _id: new ObjectId(),
        full_name: name,
        email_address: `astro${i}@trueastrotalk.com`,
        password: hashedPassword,
        phone_number: `+91${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        user_type: 'astrologer',
        account_status: 'active',
        verification_status: 'verified',
        is_verified: true,
        auth_type: 'email',
        
        // Profile image
        profile_image_id: profileImage._id,
        profile_image: `${process.env.BASE_URL || 'http://localhost:4000'}${profileImage.file_path}`,
        
        // Professional details
        experience_years: Math.floor(Math.random() * 25) + 5,
        bio: `Experienced ${randomSkills[0]} practitioner with over ${Math.floor(Math.random() * 25) + 5} years of expertise. Specializing in providing accurate predictions and effective solutions for life's challenges.`,
        skills: randomSkills.join(', '),
        languages: randomLanguages.join(', '),
        qualifications: randomQualifications,
        specializations: randomSkills.slice(0, 3),
        
        // Rates
        call_rate: Math.floor(Math.random() * 500) + 100, // 100-600 per minute
        chat_rate: Math.floor(Math.random() * 200) + 50,  // 50-250 per minute
        video_rate: Math.floor(Math.random() * 700) + 150, // 150-850 per minute
        
        // Ratings and reviews
        rating: (Math.random() * 1.5 + 3.5).toFixed(1), // 3.5-5.0 rating
        total_reviews: Math.floor(Math.random() * 500) + 10,
        total_consultations: Math.floor(Math.random() * 1000) + 50,
        
        // Location
        city: city,
        state: state,
        country: 'India',
        address: `${Math.floor(Math.random() * 999) + 1}, ${city}, ${state}`,
        
        // Status
        is_online: Math.random() > 0.3, // 70% online
        available_for_call: true,
        available_for_chat: true,
        available_for_video: true,
        
        // Timestamps
        created_at: new Date(Date.now() - Math.random() * 31536000000), // Random date within last year
        updated_at: new Date(),
        last_login: new Date(Date.now() - Math.random() * 7776000000), // Random within last 3 months
        
        // Additional fields
        consultation_fee: Math.floor(Math.random() * 1000) + 200,
        years_of_experience: Math.floor(Math.random() * 25) + 5,
        client_satisfaction: Math.floor(Math.random() * 20) + 80, // 80-100%
        response_time: Math.floor(Math.random() * 30) + 5, // 5-35 minutes
      };
      
      astrologers.push(astrologer);
    }
    
    await db.collection('users').insertMany(astrologers);
    console.log('✅ Successfully created 100 astrologers');
    
    // Seed Products
    console.log('🛍️ Creating 100 astrology products...');
    const products = [];
    
    for (let i = 1; i <= 100; i++) {
      const nameIndex = (i - 1) % productNames.length;
      const productName = i <= productNames.length ? productNames[nameIndex] : `${productNames[nameIndex]} - ${Math.ceil(i / productNames.length)}`;
      
      const productImage = availableMedia[Math.floor(Math.random() * availableMedia.length)];
      const category = productCategories[Math.floor(Math.random() * productCategories.length)];
      const description = productDescriptions[Math.floor(Math.random() * productDescriptions.length)];
      
      const product = {
        _id: new ObjectId(),
        name: productName,
        description: `${description} This ${productName.toLowerCase()} is carefully crafted to bring positive energy and spiritual benefits to your life.`,
        price: Math.floor(Math.random() * 9000) + 500, // 500-9500 INR
        original_price: Math.floor(Math.random() * 2000) + Math.floor(Math.random() * 9000) + 500,
        category: category,
        subcategory: category.split(' ')[0],
        
        // Images
        images: [productImage._id],
        primary_image: productImage._id,
        image_urls: [`${process.env.BASE_URL || 'http://localhost:4000'}${productImage.file_path}`],
        
        // Inventory
        stock_quantity: Math.floor(Math.random() * 100) + 10,
        sku: `AST-${String(i).padStart(4, '0')}`,
        
        // Product details
        weight: Math.floor(Math.random() * 500) + 50, // 50-550 grams
        dimensions: {
          length: Math.floor(Math.random() * 20) + 5,
          width: Math.floor(Math.random() * 20) + 5,
          height: Math.floor(Math.random() * 20) + 5
        },
        material: ['Silver', 'Gold', 'Brass', 'Crystal', 'Stone', 'Wood', 'Cotton'][Math.floor(Math.random() * 7)],
        
        // Status
        status: 'active',
        is_featured: Math.random() > 0.7, // 30% featured
        is_bestseller: Math.random() > 0.8, // 20% bestseller
        
        // Ratings
        rating: (Math.random() * 1.5 + 3.5).toFixed(1), // 3.5-5.0 rating
        total_reviews: Math.floor(Math.random() * 200) + 5,
        total_sales: Math.floor(Math.random() * 500) + 10,
        
        // SEO
        slug: productName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        meta_title: productName,
        meta_description: `Buy ${productName} online. ${description}`,
        
        // Tags
        tags: skills.slice(0, 3).concat([category.split(' ')[0], 'spiritual', 'authentic']),
        
        // Shipping
        shipping_weight: Math.floor(Math.random() * 500) + 100,
        shipping_cost: Math.floor(Math.random() * 200) + 50,
        free_shipping: Math.random() > 0.5,
        
        // Timestamps
        created_at: new Date(Date.now() - Math.random() * 31536000000), // Random date within last year
        updated_at: new Date(),
        
        // Additional fields
        brand: 'TrueAstroTalk',
        warranty: `${Math.floor(Math.random() * 12) + 1} months`,
        return_policy: '7 days return policy',
        care_instructions: 'Handle with care. Keep in clean and dry place.',
      };
      
      products.push(product);
    }
    
    await db.collection('products').insertMany(products);
    console.log('✅ Successfully created 100 products');
    
    // Create some sample categories if they don't exist
    console.log('📂 Creating product categories...');
    const existingCategories = await db.collection('categories').find().toArray();
    
    if (existingCategories.length === 0) {
      const categories = productCategories.map(cat => ({
        _id: new ObjectId(),
        name: cat,
        slug: cat.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: `Authentic ${cat.toLowerCase()} for spiritual and astrological purposes`,
        status: 'active',
        sort_order: productCategories.indexOf(cat) + 1,
        created_at: new Date(),
        updated_at: new Date()
      }));
      
      await db.collection('categories').insertMany(categories);
      console.log(`✅ Created ${categories.length} product categories`);
    }
    
    // Summary
    console.log('\n🎉 Database seeding completed successfully!');
    console.log('📊 Summary:');
    console.log(`   👨‍🏫 Astrologers: 100 (astro1@trueastrotalk.com to astro100@trueastrotalk.com)`);
    console.log(`   🔑 Password: Astro243@#$ (for all astrologers)`);
    console.log(`   🛍️ Products: 100 (across ${productCategories.length} categories)`);
    console.log(`   📂 Categories: ${productCategories.length}`);
    console.log(`   📸 Media files: ${availableMedia.length} available`);
    console.log('\n✅ Your Flutter app now has plenty of test data to work with!');
    
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Run the seeding script
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('🏁 Seeding script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding script failed:', error);
      process.exit(1);
    });
}

module.exports = { seedDatabase };