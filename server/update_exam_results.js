const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database connection
const dbPath = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath);

console.log('Checking and updating exam_results table schema...');

// Function to check if a column exists
function columnExists(tableName, columnName) {
  return new Promise((resolve, reject) => {
    db.all(`PRAGMA table_info(${tableName})`, (err, columns) => {
      if (err) {
        reject(err);
      } else {
        const exists = columns.some(col => col.name === columnName);
        resolve(exists);
      }
    });
  });
}

async function updateExamResultsTable() {
  try {
    // Check if exam_id column exists
    const examIdExists = await columnExists('exam_results', 'exam_id');
    
    if (!examIdExists) {
      console.log('Adding exam_id column to exam_results table...');
      
      // Add exam_id column
      await new Promise((resolve, reject) => {
        db.run('ALTER TABLE exam_results ADD COLUMN exam_id INTEGER', (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      
      console.log('✓ Added exam_id column');
    } else {
      console.log('✓ exam_id column already exists');
    }
    
    // Check if we need to migrate data from subject_id to exam_id
    // First, let's see if there are any exams created
    const examCount = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM exams', (err, result) => {
        if (err) reject(err);
        else resolve(result.count);
      });
    });
    
    console.log(`Found ${examCount} exams in the database`);
    
    // Check current exam_results structure
    const columns = await new Promise((resolve, reject) => {
      db.all('PRAGMA table_info(exam_results)', (err, columns) => {
        if (err) reject(err);
        else resolve(columns);
      });
    });
    
    console.log('Current exam_results table structure:');
    columns.forEach(col => {
      console.log(`  - ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
    });
    
    // Count existing exam results
    const resultCount = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM exam_results', (err, result) => {
        if (err) reject(err);
        else resolve(result.count);
      });
    });
    
    console.log(`Found ${resultCount} existing exam results`);
    
    if (resultCount > 0 && examCount > 0) {
      console.log('Note: You may need to manually update existing exam_results records to link them to specific exams');
      console.log('This script does not automatically migrate existing data as it requires business logic decisions');
    }
    
    console.log('\n✅ Database schema update completed successfully!');
    
  } catch (error) {
    console.error('❌ Error updating database schema:', error);
    throw error;
  }
}

// Run the update
updateExamResultsTable()
  .then(() => {
    console.log('Closing database connection...');
    db.close();
  })
  .catch((error) => {
    console.error('Failed to update database:', error);
    db.close();
    process.exit(1);
  });