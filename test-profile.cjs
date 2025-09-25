const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test user credentials
const testUser = { email: 'alice@example.com', password: 'password123', name: 'Alice' };

let authToken = '';

// Login and get profile
const testProfile = async () => {
  try {
    console.log('🔐 Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    
    authToken = loginResponse.data.token;
    console.log('✅ Login successful');
    console.log('Token:', authToken.substring(0, 20) + '...');
    
    console.log('\n👤 Fetching profile...');
    const profileResponse = await axios.get(`${BASE_URL}/users/profile`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Profile fetched successfully');
    console.log('Profile data:');
    console.log('Name:', profileResponse.data.name);
    console.log('Email:', profileResponse.data.email);
    console.log('Skills Teaching:', profileResponse.data.skillsTeaching);
    console.log('Skills Learning:', profileResponse.data.skillsLearning);
    console.log('Profile Completion:', profileResponse.data.profile?.profileCompletion);
    
    // Test updating profile with skills
    console.log('\n📝 Updating profile with skills...');
    const updateData = new FormData();
    updateData.append('name', profileResponse.data.name);
    updateData.append('email', profileResponse.data.email);
    updateData.append('bio', profileResponse.data.profile?.bio || 'Test bio');
    updateData.append('skillsTeaching', JSON.stringify(['JavaScript', 'Python']));
    updateData.append('skillsLearning', JSON.stringify(['React', 'Node.js']));
    
    // For this test, we'll just check the current data
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.log('Error details:', error.response.data);
    }
  }
};

testProfile();