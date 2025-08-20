const { MongoClient } = require('mongodb');

async function testDatabase() {
  // MongoDB connection string - adjust if needed
  const uri = 'mongodb://localhost:27017';
  
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    // List all databases
    const adminDb = client.db().admin();
    const databases = await adminDb.listDatabases();
    console.log('\n📚 Available databases:');
    databases.databases.forEach(db => {
      console.log(`- ${db.name}`);
    });
    
    // Check ALL databases found
    const possibleDbNames = databases.databases
      .map(db => db.name)
      .filter(name => !['admin', 'config', 'local'].includes(name)); // Skip system databases
    
    for (const dbName of possibleDbNames) {
      try {
        const db = client.db(dbName);
        const collections = await db.listCollections().toArray();
        
        if (collections.length > 0) {
          console.log(`\n🗃️ Collections in database '${dbName}':`);
          collections.forEach(col => {
            console.log(`- ${col.name}`);
          });
          
          // Check ALL collections for user data
          for (const collection of collections) {
            const userCollection = db.collection(collection.name);
            
            // Try to find documents that look like users (have email fields)
            const sampleDocs = await userCollection.find({
              $or: [
                { email_address: { $exists: true } },
                { email: { $exists: true } },
                { emailAddress: { $exists: true } }
              ]
            }).limit(3).toArray();
            
            if (sampleDocs.length > 0) {
                console.log(`\n👥 Found user-like documents in '${dbName}.${collection.name}':`);
                sampleDocs.forEach(user => {
                  console.log(`- Email: ${user.email_address || user.email || user.emailAddress || 'N/A'}`);
                  console.log(`  Name: ${user.full_name || user.name || user.fullName || 'N/A'}`);
                  console.log(`  Auth: ${user.auth_type || user.authType || 'N/A'}`);
                });
                
                // Look for your specific email
                const yourUser = await userCollection.findOne({
                  $or: [
                    { email_address: 'akash@denaurlen.com' },
                    { email: 'akash@denaurlen.com' },
                    { emailAddress: 'akash@denaurlen.com' }
                  ]
                });
                
                if (yourUser) {
                  console.log(`\n🎯 FOUND YOUR USER in '${dbName}.${collection.name}'!`);
                  console.log('📧 Email:', yourUser.email_address || yourUser.email || yourUser.emailAddress);
                  console.log('👤 Name:', yourUser.full_name || yourUser.name || yourUser.fullName);
                  console.log('🔐 Auth Type:', yourUser.auth_type || yourUser.authType);
                  console.log('🖼️ Profile Picture:', yourUser.profile_picture || yourUser.profilePicture);
                  console.log('🖼️ Profile Image:', yourUser.profile_image || yourUser.profileImage);
                  console.log('🌐 Google Photo URL:', yourUser.google_photo_url || yourUser.googlePhotoUrl);
                  
                  console.log('\n📋 All profile-related fields:');
                  const profileFields = {};
                  Object.keys(yourUser).forEach(key => {
                    if (key.toLowerCase().includes('photo') || 
                        key.toLowerCase().includes('image') || 
                        key.toLowerCase().includes('picture') ||
                        key.toLowerCase().includes('avatar')) {
                      profileFields[key] = yourUser[key];
                    }
                  });
                  console.log(profileFields);
                  
                  return; // Found the user, exit
                }
            }
          }
        }
      } catch (error) {
        // Skip if database doesn't exist
      }
    }
    
    console.log('\n❌ User akash@denaurlen.com not found in any database/collection');
    
  } catch (error) {
    console.error('❌ Database error:', error);
  } finally {
    await client.close();
    console.log('\n🔚 Database connection closed');
  }
}

testDatabase().catch(console.error);