const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database connection
const dbPath = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath);

console.log('🔧 Fixing database schema...\n');

async function fixDatabaseSchema() {
  try {
    // First, check what tables currently exist
    console.log('1. Checking existing tables...');
    const existingTables = await new Promise((resolve, reject) => {
      db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
        if (err) reject(err);
        else resolve(tables.map(t => t.name));
      });
    });
    
    console.log('Existing tables:', existingTables.join(', '));
    
    // Create missing tables
    console.log('\n2. Creating missing tables...');
    
    // Create admins table
    if (!existingTables.includes('admins')) {
      await new Promise((resolve, reject) => {
        db.run(`CREATE TABLE admins (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username VARCHAR(50) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          email VARCHAR(100),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
          if (err) {
            console.error('Error creating admins table:', err);
            reject(err);
          } else {
            console.log('✓ Created admins table');
            resolve();
          }
        });
      });
      
      // Insert default admin
      await new Promise((resolve, reject) => {
        const bcrypt = require('bcryptjs');
        const hashedPassword = bcrypt.hashSync('admin123', 10);
        db.run('INSERT INTO admins (username, password, email) VALUES (?, ?, ?)', 
               ['admin', hashedPassword, 'admin@example.com'], (err) => {
          if (err) {
            console.error('Error creating default admin:', err);
          } else {
            console.log('✓ Created default admin (username: admin, password: admin123)');
          }
          resolve();
        });
      });
    }
    
    // Create students table
    if (!existingTables.includes('students')) {
      await new Promise((resolve, reject) => {
        db.run(`CREATE TABLE students (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username VARCHAR(50) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          email VARCHAR(100),
          status VARCHAR(20) DEFAULT 'active',
          last_login DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
          if (err) {
            console.error('Error creating students table:', err);
            reject(err);
          } else {
            console.log('✓ Created students table');
            resolve();
          }
        });
      });
    }
    
    // Create subjects table
    if (!existingTables.includes('subjects')) {
      await new Promise((resolve, reject) => {
        db.run(`CREATE TABLE subjects (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name VARCHAR(100) NOT NULL,
          description TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
          if (err) {
            console.error('Error creating subjects table:', err);
            reject(err);
          } else {
            console.log('✓ Created subjects table');
            resolve();
          }
        });
      });
    }
    
    // Create questions table
    if (!existingTables.includes('questions')) {
      await new Promise((resolve, reject) => {
        db.run(`CREATE TABLE questions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          subject_id INTEGER NOT NULL,
          question_text TEXT NOT NULL,
          option_a TEXT NOT NULL,
          option_b TEXT NOT NULL,
          option_c TEXT NOT NULL,
          option_d TEXT NOT NULL,
          correct_answer VARCHAR(1) NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
          youtube_link TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (subject_id) REFERENCES subjects (id) ON DELETE CASCADE
        )`, (err) => {
          if (err) {
            console.error('Error creating questions table:', err);
            reject(err);
          } else {
            console.log('✓ Created questions table');
            resolve();
          }
        });
      });
    }
    
    // Create student_activity table
    if (!existingTables.includes('student_activity')) {
      await new Promise((resolve, reject) => {
        db.run(`CREATE TABLE student_activity (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          student_id INTEGER NOT NULL,
          activity_type VARCHAR(50) NOT NULL,
          activity_data TEXT,
          ip_address VARCHAR(45),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE
        )`, (err) => {
          if (err) {
            console.error('Error creating student_activity table:', err);
            reject(err);
          } else {
            console.log('✓ Created student_activity table');
            resolve();
          }
        });
      });
    }
    
    // Create api_keys table
    if (!existingTables.includes('api_keys')) {
      await new Promise((resolve, reject) => {
        db.run(`CREATE TABLE api_keys (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          key_name VARCHAR(100) NOT NULL,
          api_key TEXT NOT NULL,
          provider VARCHAR(50) DEFAULT 'openrouter',
          base_url VARCHAR(255) DEFAULT 'https://openrouter.ai/api/v1',
          model_name VARCHAR(100) DEFAULT 'meta-llama/llama-3.1-8b-instruct:free',
          is_active INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
          if (err) {
            console.error('Error creating api_keys table:', err);
            reject(err);
          } else {
            console.log('✓ Created api_keys table');
            resolve();
          }
        });
      });
    }
    
    console.log('\n3. Verifying table creation...');
    const finalTables = await new Promise((resolve, reject) => {
      db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
        if (err) reject(err);
        else resolve(tables.map(t => t.name));
      });
    });
    
    console.log('Final tables:', finalTables.join(', '));
    
    // Create some sample data for testing
    console.log('\n4. Creating sample data for testing...');
    
    // Create sample subject
    const subjectId = await new Promise((resolve, reject) => {
      db.run('INSERT OR IGNORE INTO subjects (name, description) VALUES (?, ?)', 
             ['Mathematics', 'Basic mathematics questions'], function(err) {
        if (err) {
          console.error('Error creating sample subject:', err);
          resolve(null);
        } else {
          if (this.lastID) {
            console.log('✓ Created sample subject: Mathematics');
            resolve(this.lastID);
          } else {
            // Subject already exists, get its ID
            db.get('SELECT id FROM subjects WHERE name = ?', ['Mathematics'], (err, row) => {
              resolve(row ? row.id : null);
            });
          }
        }
      });
    });
    
    // Create sample questions if subject was created
    if (subjectId) {
      const sampleQuestions = [
        {
          text: 'What is 2 + 2?',
          a: '3', b: '4', c: '5', d: '6',
          correct: 'B'
        },
        {
          text: 'What is 5 × 3?',
          a: '12', b: '13', c: '15', d: '18',
          correct: 'C'
        },
        {
          text: 'What is 10 ÷ 2?',
          a: '4', b: '5', c: '6', d: '8',
          correct: 'B'
        }
      ];
      
      for (const q of sampleQuestions) {
        await new Promise((resolve, reject) => {
          db.run('INSERT OR IGNORE INTO questions (subject_id, question_text, option_a, option_b, option_c, option_d, correct_answer) VALUES (?, ?, ?, ?, ?, ?, ?)',
                 [subjectId, q.text, q.a, q.b, q.c, q.d, q.correct], function(err) {
            if (err) {
              console.error('Error creating sample question:', err);
            } else if (this.lastID) {
              console.log(`✓ Created sample question: ${q.text}`);
            }
            resolve();
          });
        });
      }
    }
    
    console.log('\n✅ Database schema fixed successfully!');
    console.log('\nYou can now:');
    console.log('1. Login as admin (username: admin, password: admin123)');
    console.log('2. Create exams using the sample questions');
    console.log('3. Register students to test the exam system');
    
  } catch (error) {
    console.error('❌ Error fixing database schema:', error);
    throw error;
  }
}

// Run the fix
fixDatabaseSchema()
  .then(() => {
    console.log('\nClosing database connection...');
    db.close();
  })
  .catch((error) => {
    console.error('❌ Schema fix failed:', error);
    db.close();
    process.exit(1);
  });