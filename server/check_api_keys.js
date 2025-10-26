const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.db');

console.log('=== Checking API Keys ===\n');

db.all('SELECT * FROM api_keys', [], (err, rows) => {
  if (err) {
    console.error('Error:', err);
    return;
  }
  
  if (rows.length === 0) {
    console.log('❌ No API keys found in database!');
    console.log('\nPlease add an API key through the Admin Dashboard:');
    console.log('1. Go to API Keys tab');
    console.log('2. Click "Add API Key"');
    console.log('3. Fill in:');
    console.log('   - Key Name: My OpenRouter Key');
    console.log('   - API Key: sk-or-v1-...');
    console.log('   - Provider: openrouter');
    console.log('   - Base URL: https://openrouter.ai/api/v1');
    console.log('   - Model: meta-llama/llama-3.1-8b-instruct:free');
  } else {
    rows.forEach((row, index) => {
      console.log(`\n--- API Key #${index + 1} ---`);
      console.log(`ID: ${row.id}`);
      console.log(`Name: ${row.key_name}`);
      console.log(`Provider: ${row.provider}`);
      console.log(`Base URL: ${row.base_url}`);
      console.log(`Model: ${row.model_name}`);
      console.log(`Active: ${row.is_active ? '✅ Yes' : '❌ No'}`);
      console.log(`API Key: ${row.api_key.substring(0, 15)}...${row.api_key.substring(row.api_key.length - 4)}`);
      console.log(`Key Length: ${row.api_key.length} characters`);
      
      // Check if key format looks correct
      if (row.provider === 'openrouter') {
        if (!row.api_key.startsWith('sk-or-v1-')) {
          console.log('⚠️  WARNING: OpenRouter API keys should start with "sk-or-v1-"');
        }
        if (row.base_url !== 'https://openrouter.ai/api/v1') {
          console.log('⚠️  WARNING: Base URL should be "https://openrouter.ai/api/v1"');
        }
      }
    });
    
    console.log('\n=== Summary ===');
    console.log(`Total API Keys: ${rows.length}`);
    console.log(`Active Keys: ${rows.filter(r => r.is_active).length}`);
  }
  
  db.close();
});
