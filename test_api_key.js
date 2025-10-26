const axios = require('axios');

async function testApiKey() {
  try {
    // First login as admin to get token
    console.log('Logging in as admin...');
    const loginResponse = await axios.post('http://localhost:5000/api/admin/login', {
      username: 'admin',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('Login successful, got token');
    
    // Set default authorization header
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    // Test fetching providers
    console.log('Fetching providers...');
    const providersResponse = await axios.get('http://localhost:5000/api/providers');
    console.log('Providers:', providersResponse.data.map(p => p.name));
    
    // Test creating an API key
    console.log('Creating API key...');
    const apiKeyData = {
      key_name: 'Test API Key',
      api_key: 'test-key-123',
      provider: 'openai',
      base_url: 'https://api.openai.com/v1',
      model_name: 'gpt-4o'
    };
    
    const createResponse = await axios.post('http://localhost:5000/api/api-keys', apiKeyData);
    console.log('API key created:', createResponse.data);
    
    // Test fetching API keys
    console.log('Fetching API keys...');
    const apiKeysResponse = await axios.get('http://localhost:5000/api/api-keys');
    console.log('API keys:', apiKeysResponse.data);
    
    console.log('All tests passed!');
  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
  }
}

testApiKey();