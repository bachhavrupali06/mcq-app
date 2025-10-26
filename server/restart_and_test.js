const { spawn } = require('child_process');
const axios = require('axios');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'your-secret-key';
const PORT = process.env.PORT || 5000;
const SERVER_URL = `http://localhost:${PORT}`;

async function waitForServer(maxAttempts = 10) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await axios.get(`${SERVER_URL}/api/subjects`, { timeout: 1000 });
      return true;
    } catch (error) {
      console.log(`Waiting for server... (${i + 1}/${maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  return false;
}

async function testExamEndpoints() {
  console.log('🧪 Testing exam endpoints...\n');
  
  try {
    // Test admin login first
    console.log('1. Testing admin login...');
    const loginResponse = await axios.post(`${SERVER_URL}/api/admin/login`, {
      username: 'admin',
      password: 'admin123'
    });
    
    if (loginResponse.status === 200) {
      console.log('✅ Admin login successful');
      const { token } = loginResponse.data;
      
      // Test admin exams endpoint
      console.log('2. Testing admin exams endpoint...');
      const adminResponse = await axios.get(`${SERVER_URL}/api/exams`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log(`✅ Admin API Response (${adminResponse.status}):`);
      console.log(`Found ${adminResponse.data.length} exams:`);
      adminResponse.data.forEach((exam, index) => {
        console.log(`   ${index + 1}. "${exam.title}" - ${exam.question_count || 0} questions, Status: ${exam.status}`);
      });
      
    } else {
      console.log('❌ Admin login failed');
    }
    
    // Test subjects endpoint
    console.log('\n3. Testing subjects endpoint...');
    const subjectsResponse = await axios.get(`${SERVER_URL}/api/subjects`);
    console.log(`✅ Found ${subjectsResponse.data.length} subjects:`);
    subjectsResponse.data.forEach((subject, index) => {
      console.log(`   ${index + 1}. "${subject.name}": ${subject.description || 'No description'}`);
    });
    
  } catch (error) {
    if (error.response) {
      console.log(`❌ API Error (${error.response.status}):`, error.response.data);
    } else {
      console.log('❌ API Error:', error.message);
    }
  }
}

async function main() {
  console.log('🔧 Server Restart and Test Script\n');
  
  // Check if server is already running
  console.log(`Checking if server is running on port ${PORT}...`);
  
  try {
    await axios.get(`${SERVER_URL}/api/subjects`, { timeout: 2000 });
    console.log('✅ Server is already running');
  } catch (error) {
    console.log('❌ Server not responding');
    console.log('Please restart your server manually:');
    console.log(`   cd "F:\\Finel Exam App\\Exam App\\server"`);
    console.log(`   npm start`);
    console.log('Then run this script again.');
    return;
  }
  
  // Test the endpoints
  await testExamEndpoints();
  
  console.log('\n🎯 Next Steps:');
  console.log('1. If no exams were found, the database might not be synchronized');
  console.log('2. Try refreshing your admin dashboard');
  console.log('3. Check browser console for any errors');
  console.log(`4. Make sure you're accessing: ${SERVER_URL.replace('localhost', 'localhost:3000')}/admin/dashboard`);
}

main().catch(console.error);