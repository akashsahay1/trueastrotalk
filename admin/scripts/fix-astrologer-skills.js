const { MongoClient } = require('mongodb');

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const DB_NAME = 'trueastrotalkDB';

// The correct 12 predefined skills from Admin -> Settings -> Astrologer Options
const VALID_SKILLS = [
  'Vedic',
  'Palmistry', 
  'Numerology',
  'Vastu',
  'Lal kitab',
  'Loshu grid',
  'Prashana',
  'Tarot',
  'Psychic',
  'Nadi',
  'Kp',
  'Etc'
];

async function fixAstrologerSkills() {
  const client = new MongoClient(MONGODB_URL);
  
  try {
    console.log('🔗 Connecting to database...');
    await client.connect();
    const db = client.db(DB_NAME);
    
    const usersCollection = db.collection('users');
    
    // Get all astrologers
    const astrologers = await usersCollection.find({
      user_type: 'astrologer'
    }).toArray();
    
    console.log(`👨‍🏫 Found ${astrologers.length} astrologers to update`);
    console.log(`✅ Valid skills: ${VALID_SKILLS.join(', ')}\n`);
    
    let updatedCount = 0;
    
    for (const astrologer of astrologers) {
      const currentSkills = astrologer.skills || [];
      
      // Handle case where skills might be a string instead of array
      let skillsArray = currentSkills;
      if (typeof currentSkills === 'string') {
        skillsArray = currentSkills.split(',').map(s => s.trim()).filter(s => s.length > 0);
      }
      
      // Map current skills to valid skills (best match)
      const mappedSkills = [];
      
      for (const skill of skillsArray) {
        // Try exact match first
        const exactMatch = VALID_SKILLS.find(validSkill => 
          validSkill.toLowerCase() === skill.toLowerCase()
        );
        
        if (exactMatch) {
          if (!mappedSkills.includes(exactMatch)) {
            mappedSkills.push(exactMatch);
          }
          continue;
        }
        
        // Try partial match
        const partialMatch = VALID_SKILLS.find(validSkill => 
          validSkill.toLowerCase().includes(skill.toLowerCase()) ||
          skill.toLowerCase().includes(validSkill.toLowerCase())
        );
        
        if (partialMatch) {
          if (!mappedSkills.includes(partialMatch)) {
            mappedSkills.push(partialMatch);
          }
          continue;
        }
        
        // For skills we can't map, assign some default valid skills
        console.log(`⚠️  Unknown skill "${skill}" for ${astrologer.full_name}`);
      }
      
      // If no skills mapped or less than 3, add some default skills
      if (mappedSkills.length < 3) {
        const defaultSkills = ['Vedic', 'Palmistry', 'Numerology'];
        for (const defaultSkill of defaultSkills) {
          if (!mappedSkills.includes(defaultSkill)) {
            mappedSkills.push(defaultSkill);
            if (mappedSkills.length >= 3) break;
          }
        }
      }
      
      // Update astrologer skills
      if (JSON.stringify(skillsArray) !== JSON.stringify(mappedSkills)) {
        await usersCollection.updateOne(
          { _id: astrologer._id },
          {
            $set: {
              skills: mappedSkills,
              updated_at: new Date()
            }
          }
        );
        
        console.log(`✅ Updated ${astrologer.full_name}:`);
        console.log(`   Old: ${Array.isArray(skillsArray) ? skillsArray.join(', ') : skillsArray}`);
        console.log(`   New: ${mappedSkills.join(', ')}`);
        updatedCount++;
      } else {
        console.log(`✅ ${astrologer.full_name}: Skills already correct (${mappedSkills.join(', ')})`);
      }
    }
    
    console.log(`\n🎉 Updated ${updatedCount} astrologers with correct skills!`);
    console.log('✅ All astrologer skills now match Admin -> Settings -> Astrologer Options');
    
  } catch (error) {
    console.error('❌ Error fixing astrologer skills:', error);
  } finally {
    await client.close();
    console.log('🔒 Database connection closed');
  }
}

// Run the script
fixAstrologerSkills();