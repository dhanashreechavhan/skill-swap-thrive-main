#!/usr/bin/env node

const mongoose = require('mongoose');
const User = require('./models/UserEnhanced');
const Skill = require('./models/Skill');
const SkillMatch = require('./models/SkillMatch');
require('dotenv').config();

const checkRealData = async () => {
  try {
    console.log('🔍 Checking Real Database Data...\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas\n');
    
    // Check users
    const users = await User.find({}).select('name email skillsTeaching skillsLearning profile.location').limit(10);
    console.log(`📊 Found ${users.length} users:`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email})`);
      console.log(`   Teaching: ${user.skillsTeaching?.map(s => typeof s === 'string' ? s : s.skill).join(', ') || 'None'}`);
      console.log(`   Learning: ${user.skillsLearning?.map(s => typeof s === 'string' ? s : s.skill).join(', ') || 'None'}`);
      console.log(`   Location: ${user.profile?.location || 'Not specified'}\n`);
    });
    
    // Check skills
    const skills = await Skill.find({}).limit(10);
    console.log(`🎯 Found ${skills.length} skills:`);
    skills.forEach((skill, index) => {
      console.log(`${index + 1}. ${skill.name} (${skill.category}) - Level: ${skill.level}`);
    });
    
    // Check existing matches
    const matches = await SkillMatch.find({}).populate('student', 'name email').populate('teacher', 'name email').limit(5);
    console.log(`\n🤝 Found ${matches.length} existing matches:`);
    matches.forEach((match, index) => {
      console.log(`${index + 1}. ${match.student?.name} ↔ ${match.teacher?.name} (Score: ${match.matchScore})`);
    });
    
    console.log('\n✨ Ready to test matching with real users!');
    console.log('\n📝 Sample test accounts you can use:');
    users.slice(0, 3).forEach(user => {
      console.log(`   Email: ${user.email} (you may need to reset password or create test account)`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    mongoose.disconnect();
  }
};

checkRealData();