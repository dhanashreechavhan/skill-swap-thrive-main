// Database cleanup utility to fix skill matches with invalid skill references
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const SkillMatch = require('./models/SkillMatch');
const Skill = require('./models/Skill');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Connect to MongoDB
async function connectDB() {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/skillswap';
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    throw error;
  }
}

async function cleanupSkillMatches() {
  try {
    console.log('Starting skill match cleanup...');
    
    // Find all skill matches
    const allMatches = await SkillMatch.find({});
    console.log(`Found ${allMatches.length} skill matches to check`);
    
    let invalidMatches = 0;
    let fixedMatches = 0;
    let deletedMatches = 0;
    
    for (const match of allMatches) {
      try {
        // Try to populate the skill
        await match.populate('skill');
        
        // If skill is null or undefined, this match has an invalid skill reference
        if (!match.skill) {
          console.log(`Match ${match._id} has invalid skill reference: ${match.skill}`);
          invalidMatches++;
          
          // Delete this invalid match
          await SkillMatch.deleteOne({ _id: match._id });
          deletedMatches++;
          console.log(`Deleted invalid match ${match._id}`);
        }
      } catch (error) {
        console.log(`Error processing match ${match._id}:`, error.message);
        invalidMatches++;
        
        // Delete matches that cause errors
        await SkillMatch.deleteOne({ _id: match._id });
        deletedMatches++;
        console.log(`Deleted problematic match ${match._id}`);
      }
    }
    
    console.log('\nCleanup Summary:');
    console.log(`Total matches processed: ${allMatches.length}`);
    console.log(`Invalid matches found: ${invalidMatches}`);
    console.log(`Matches deleted: ${deletedMatches}`);
    console.log(`Valid matches remaining: ${allMatches.length - deletedMatches}`);
    
    console.log('\nCleanup completed successfully!');
    
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}

module.exports = { cleanupSkillMatches };

// Run cleanup if this file is executed directly
if (require.main === module) {
  (async () => {
    try {
      await connectDB();
      await cleanupSkillMatches();
      process.exit(0);
    } catch (error) {
      console.error('Cleanup failed:', error);
      process.exit(1);
    }
  })();
}