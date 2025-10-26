const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database connection
const dbPath = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 Debugging exam visibility issues...\n');

async function debugExams() {
  try {
    // Check if exams table exists and has data
    console.log('1. Checking exams table...');
    const exams = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM exams ORDER BY created_at DESC', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    if (exams.length === 0) {
      console.log('❌ No exams found in the database');
      console.log('   This could mean:');
      console.log('   - Exam creation failed silently');
      console.log('   - Exams are being inserted into wrong table');
      console.log('   - Database connection issues');
    } else {
      console.log(`✓ Found ${exams.length} exams in database:`);
      exams.forEach((exam, index) => {
        console.log(`   ${index + 1}. ID: ${exam.id}, Title: "${exam.title}", Status: ${exam.status}, Created: ${exam.created_at}`);
      });
    }

    // Check exam_questions table
    console.log('\n2. Checking exam_questions table...');
    const examQuestions = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM exam_questions', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    if (examQuestions.length === 0) {
      console.log('❌ No exam questions found');
      console.log('   This could indicate exam creation didn\'t complete properly');
    } else {
      console.log(`✓ Found ${examQuestions.length} exam-question relationships:`);
      examQuestions.forEach((eq, index) => {
        console.log(`   ${index + 1}. Exam ID: ${eq.exam_id}, Question ID: ${eq.question_id}`);
      });
    }

    // Check questions table
    console.log('\n3. Checking questions table...');
    const questions = await new Promise((resolve, reject) => {
      db.all('SELECT COUNT(*) as count FROM questions', (err, rows) => {
        if (err) reject(err);
        else resolve(rows[0].count);
      });
    });
    console.log(`✓ Found ${questions} total questions available`);

    // Check subjects table
    console.log('\n4. Checking subjects table...');
    const subjects = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM subjects', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    console.log(`✓ Found ${subjects.length} subjects:`);
    subjects.forEach((subject, index) => {
      console.log(`   ${index + 1}. ID: ${subject.id}, Name: "${subject.name}"`);
    });

    // Check if there are any students
    console.log('\n5. Checking students table...');
    const students = await new Promise((resolve, reject) => {
      db.all('SELECT COUNT(*) as count FROM students', (err, rows) => {
        if (err) reject(err);
        else resolve(rows[0].count);
      });
    });
    console.log(`✓ Found ${students} students registered`);

    // Test the /api/exams endpoint logic
    console.log('\n6. Testing exam retrieval logic...');
    if (exams.length > 0) {
      // Simulate the API query
      const apiExams = await new Promise((resolve, reject) => {
        db.all(`
          SELECT 
            e.*,
            COUNT(eq.question_id) as question_count
          FROM exams e
          LEFT JOIN exam_questions eq ON e.id = eq.exam_id
          GROUP BY e.id
          ORDER BY e.created_at DESC
        `, (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
      
      console.log(`✓ API query would return ${apiExams.length} exams:`);
      apiExams.forEach((exam, index) => {
        console.log(`   ${index + 1}. "${exam.title}" - ${exam.question_count} questions, Status: ${exam.status}`);
      });
    }

  } catch (error) {
    console.error('❌ Error during debugging:', error);
  }
}

// Run debug
debugExams()
  .then(() => {
    console.log('\n🔍 Debug completed. Check the output above for issues.');
    db.close();
  })
  .catch((error) => {
    console.error('❌ Debug failed:', error);
    db.close();
    process.exit(1);
  });