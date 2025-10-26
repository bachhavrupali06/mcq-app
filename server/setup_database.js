const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database connection
const dbPath = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath);

console.log('Setting up database tables...');

async function createTables() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Create exam_results table
      db.run(`CREATE TABLE IF NOT EXISTS exam_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        exam_id INTEGER,
        subject_id INTEGER,
        total_questions INTEGER NOT NULL,
        correct_answers INTEGER NOT NULL,
        score REAL NOT NULL,
        answers TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students (id),
        FOREIGN KEY (exam_id) REFERENCES exams (id),
        FOREIGN KEY (subject_id) REFERENCES subjects (id)
      )`, (err) => {
        if (err) {
          console.error('Error creating exam_results table:', err);
        } else {
          console.log('✓ exam_results table ready');
        }
      });

      // Create exams table if it doesn't exist
      db.run(`CREATE TABLE IF NOT EXISTS exams (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100) DEFAULT 'general',
        start_time DATETIME,
        end_time DATETIME,
        duration_minutes INTEGER DEFAULT 60,
        total_questions INTEGER DEFAULT 0,
        status VARCHAR(50) DEFAULT 'draft',
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES admins (id)
      )`, (err) => {
        if (err) {
          console.error('Error creating exams table:', err);
        } else {
          console.log('✓ exams table ready');
        }
      });

      // Create exam_questions junction table
      db.run(`CREATE TABLE IF NOT EXISTS exam_questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        exam_id INTEGER NOT NULL,
        question_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (exam_id) REFERENCES exams (id) ON DELETE CASCADE,
        FOREIGN KEY (question_id) REFERENCES questions (id) ON DELETE CASCADE,
        UNIQUE(exam_id, question_id)
      )`, (err) => {
        if (err) {
          console.error('Error creating exam_questions table:', err);
        } else {
          console.log('✓ exam_questions table ready');
        }
      });

      // Check if exam_id column exists in exam_results
      db.all("PRAGMA table_info(exam_results)", (err, columns) => {
        if (err) {
          console.error('Error checking table info:', err);
          reject(err);
          return;
        }
        
        const hasExamId = columns.some(col => col.name === 'exam_id');
        if (!hasExamId) {
          db.run('ALTER TABLE exam_results ADD COLUMN exam_id INTEGER', (err) => {
            if (err) {
              console.error('Error adding exam_id column:', err);
            } else {
              console.log('✓ Added exam_id column to exam_results');
            }
            resolve();
          });
        } else {
          console.log('✓ exam_id column already exists in exam_results');
          resolve();
        }
      });
    });
  });
}

// List all tables
function listTables() {
  return new Promise((resolve, reject) => {
    db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
      if (err) {
        reject(err);
      } else {
        console.log('\nExisting tables:');
        tables.forEach(table => {
          console.log(`  - ${table.name}`);
        });
        resolve();
      }
    });
  });
}

// Run setup
createTables()
  .then(() => listTables())
  .then(() => {
    console.log('\n✅ Database setup completed successfully!');
    db.close();
  })
  .catch((error) => {
    console.error('❌ Database setup failed:', error);
    db.close();
    process.exit(1);
  });