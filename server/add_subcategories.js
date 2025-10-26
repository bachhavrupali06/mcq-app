const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database connection
const dbPath = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath);

console.log('Adding subcategories functionality to the database...\n');

async function addSubcategoriesTable() {
  try {
    // Check if subcategories table already exists
    const tableExists = await new Promise((resolve, reject) => {
      db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='subcategories'", (err, row) => {
        if (err) reject(err);
        else resolve(!!row);
      });
    });

    if (tableExists) {
      console.log('✓ Subcategories table already exists');
    } else {
      // Create subcategories table
      await new Promise((resolve, reject) => {
        db.run(`CREATE TABLE subcategories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name VARCHAR(100) NOT NULL,
          description TEXT,
          parent_id INTEGER,
          subject_id INTEGER,
          level INTEGER DEFAULT 1,
          is_active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (parent_id) REFERENCES subcategories (id) ON DELETE CASCADE,
          FOREIGN KEY (subject_id) REFERENCES subjects (id) ON DELETE CASCADE
        )`, (err) => {
          if (err) {
            console.error('Error creating subcategories table:', err);
            reject(err);
          } else {
            console.log('✓ Created subcategories table');
            resolve();
          }
        });
      });
    }

    // Add subcategory_id column to subjects table if it doesn't exist
    const subjectHasSubcategoryColumn = await new Promise((resolve, reject) => {
      db.all('PRAGMA table_info(subjects)', (err, columns) => {
        if (err) reject(err);
        else resolve(columns.some(col => col.name === 'subcategory_id'));
      });
    });

    if (!subjectHasSubcategoryColumn) {
      await new Promise((resolve, reject) => {
        db.run('ALTER TABLE subjects ADD COLUMN subcategory_id INTEGER REFERENCES subcategories (id)', (err) => {
          if (err) {
            console.error('Error adding subcategory_id to subjects:', err);
            reject(err);
          } else {
            console.log('✓ Added subcategory_id column to subjects table');
            resolve();
          }
        });
      });
    } else {
      console.log('✓ Subjects table already has subcategory_id column');
    }

    // Create some sample subcategories for testing
    console.log('\n2. Creating sample subcategories...');
    
    // Get the first subject to create sample subcategories
    const firstSubject = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM subjects LIMIT 1', (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (firstSubject) {
      // Create main categories
      const mathCategory = await new Promise((resolve, reject) => {
        db.run('INSERT OR IGNORE INTO subcategories (name, description, subject_id, level) VALUES (?, ?, ?, ?)', 
               ['Algebra', 'Basic algebraic concepts and operations', firstSubject.id, 1], function(err) {
          if (err) {
            console.error('Error creating algebra category:', err);
            resolve(null);
          } else {
            if (this.lastID) {
              console.log('✓ Created Algebra subcategory');
              resolve(this.lastID);
            } else {
              // Already exists, get its ID
              db.get('SELECT id FROM subcategories WHERE name = ? AND subject_id = ?', 
                     ['Algebra', firstSubject.id], (err, row) => {
                resolve(row ? row.id : null);
              });
            }
          }
        });
      });

      const geometryCategory = await new Promise((resolve, reject) => {
        db.run('INSERT OR IGNORE INTO subcategories (name, description, subject_id, level) VALUES (?, ?, ?, ?)', 
               ['Geometry', 'Shapes, angles, and spatial relationships', firstSubject.id, 1], function(err) {
          if (err) {
            console.error('Error creating geometry category:', err);
            resolve(null);
          } else {
            if (this.lastID) {
              console.log('✓ Created Geometry subcategory');
              resolve(this.lastID);
            } else {
              // Already exists, get its ID
              db.get('SELECT id FROM subcategories WHERE name = ? AND subject_id = ?', 
                     ['Geometry', firstSubject.id], (err, row) => {
                resolve(row ? row.id : null);
              });
            }
          }
        });
      });

      // Create sub-subcategories (level 2)
      if (mathCategory) {
        await new Promise((resolve, reject) => {
          db.run('INSERT OR IGNORE INTO subcategories (name, description, parent_id, subject_id, level) VALUES (?, ?, ?, ?, ?)', 
                 ['Linear Equations', 'Solving equations with one variable', mathCategory, firstSubject.id, 2], function(err) {
            if (err) {
              console.error('Error creating linear equations subcategory:', err);
            } else if (this.lastID) {
              console.log('✓ Created Linear Equations sub-subcategory');
            }
            resolve();
          });
        });

        await new Promise((resolve, reject) => {
          db.run('INSERT OR IGNORE INTO subcategories (name, description, parent_id, subject_id, level) VALUES (?, ?, ?, ?, ?)', 
                 ['Quadratic Equations', 'Solving quadratic equations and factoring', mathCategory, firstSubject.id, 2], function(err) {
            if (err) {
              console.error('Error creating quadratic equations subcategory:', err);
            } else if (this.lastID) {
              console.log('✓ Created Quadratic Equations sub-subcategory');
            }
            resolve();
          });
        });
      }

      if (geometryCategory) {
        await new Promise((resolve, reject) => {
          db.run('INSERT OR IGNORE INTO subcategories (name, description, parent_id, subject_id, level) VALUES (?, ?, ?, ?, ?)', 
                 ['Triangles', 'Properties and calculations for triangular shapes', geometryCategory, firstSubject.id, 2], function(err) {
            if (err) {
              console.error('Error creating triangles subcategory:', err);
            } else if (this.lastID) {
              console.log('✓ Created Triangles sub-subcategory');
            }
            resolve();
          });
        });
      }
    } else {
      console.log('⚠ No subjects found. Create a subject first to test subcategories.');
    }

    console.log('\n✅ Subcategories functionality added successfully!');
    console.log('\nNow you can:');
    console.log('1. Create hierarchical subcategories for better organization');
    console.log('2. Assign subjects to specific subcategories');
    console.log('3. Create unlimited levels of nested categories');
    console.log('4. Organize questions by topic and subtopic');
    
  } catch (error) {
    console.error('❌ Error adding subcategories functionality:', error);
    throw error;
  }
}

// Run the migration
addSubcategoriesTable()
  .then(() => {
    console.log('\n🎯 Next Steps:');
    console.log('1. Restart your server to load the new API endpoints');
    console.log('2. Access the admin dashboard to manage subcategories');
    console.log('3. Create nested categories for better content organization');
    db.close();
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    db.close();
    process.exit(1);
  });