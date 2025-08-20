const { MongoClient } = require('mongodb');

const url = 'mongodb://localhost:27017';
const dbName = 'trueastrotalkDB';

async function checkQualifications() {
  const client = new MongoClient(url);
  
  try {
    await client.connect();
    const db = client.db(dbName);
    const usersCollection = db.collection('users');
    
    // Get ALL astrologers (both real and test)
    const allAstrologers = await usersCollection.find({
      user_type: 'astrologer'
    }).toArray();
    
    console.log(`Found ${allAstrologers.length} total astrologers to check for qualifications`);
    
    let astrologersWithoutQualifications = [];
    let astrologersWithQualifications = [];
    
    allAstrologers.forEach(astrologer => {
      const hasQualifications = astrologer.qualifications && 
                               Array.isArray(astrologer.qualifications) && 
                               astrologer.qualifications.length > 0;
      
      if (hasQualifications) {
        astrologersWithQualifications.push({
          name: astrologer.full_name,
          email: astrologer.email_address,
          qualifications: astrologer.qualifications,
          isTest: astrologer.email_address.includes('@trueastrotalk.com')
        });
      } else {
        astrologersWithoutQualifications.push({
          _id: astrologer._id,
          name: astrologer.full_name,
          email: astrologer.email_address,
          isTest: astrologer.email_address.includes('@trueastrotalk.com')
        });
      }
    });
    
    console.log(`\n✅ Astrologers WITH qualifications: ${astrologersWithQualifications.length}`);
    console.log(`❌ Astrologers WITHOUT qualifications: ${astrologersWithoutQualifications.length}`);
    
    if (astrologersWithQualifications.length > 0) {
      console.log('\nAstrologers with qualifications:');
      astrologersWithQualifications.forEach((astrologer, index) => {
        const type = astrologer.isTest ? '(TEST)' : '(REAL)';
        console.log(`${index + 1}. ${astrologer.name} ${type}`);
        console.log(`   Qualifications: ${astrologer.qualifications.join(', ')}`);
      });
    }
    
    if (astrologersWithoutQualifications.length > 0) {
      console.log('\n⚠️  Astrologers missing qualifications:');
      const realCount = astrologersWithoutQualifications.filter(a => !a.isTest).length;
      const testCount = astrologersWithoutQualifications.filter(a => a.isTest).length;
      
      console.log(`- Real astrologers: ${realCount}`);
      console.log(`- Test astrologers: ${testCount}`);
      
      astrologersWithoutQualifications.forEach((astrologer, index) => {
        const type = astrologer.isTest ? '(TEST)' : '(REAL)';
        console.log(`${index + 1}. ${astrologer.name} ${type} - ${astrologer.email}`);
      });
      
      console.log('\n❓ Should I add qualifications to these astrologers?');
      console.log('Note: You mentioned qualifications are subjective, but if they\'re required...');
    }
    
  } catch (error) {
    console.error('Error checking qualifications:', error);
  } finally {
    await client.close();
    console.log('\nDatabase connection closed');
  }
}

checkQualifications();