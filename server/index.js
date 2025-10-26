const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const axios = require('axios');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 10000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Database setup
const db = new sqlite3.Database('./database.db');

// Initialize database tables
db.serialize(() => {
  // Admin table
  db.run(`CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Students table
  db.run(`CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Subjects table
  db.run(`CREATE TABLE IF NOT EXISTS subjects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    subcategory_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subcategory_id) REFERENCES subcategories (id)
  )`);

  // Subcategories table
  db.run(`CREATE TABLE IF NOT EXISTS subcategories (
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
  )`);

  // Questions table
  db.run(`CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject_id INTEGER,
    category_id INTEGER,
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_answer TEXT NOT NULL,
    youtube_link TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subject_id) REFERENCES subjects (id),
    FOREIGN KEY (category_id) REFERENCES question_categories (id)
  )`);

  // Question Categories table
  db.run(`CREATE TABLE IF NOT EXISTS question_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject_id INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#667eea',
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subject_id) REFERENCES subjects (id) ON DELETE CASCADE,
    UNIQUE(subject_id, name)
  )`);

  // API Keys table with enhanced provider support
  db.run(`CREATE TABLE IF NOT EXISTS api_keys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key_name TEXT NOT NULL,
    api_key TEXT NOT NULL,
    provider TEXT NOT NULL DEFAULT 'openrouter',
    base_url TEXT,
    model_name TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Exams table for scheduled exams
  db.run(`CREATE TABLE IF NOT EXISTS exams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    subject_id INTEGER,
    category TEXT DEFAULT 'general',
    start_time DATETIME,
    end_time DATETIME,
    duration_minutes INTEGER DEFAULT 60,
    total_questions INTEGER DEFAULT 10,
    status TEXT DEFAULT 'draft',
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subject_id) REFERENCES subjects (id),
    FOREIGN KEY (created_by) REFERENCES admins (id)
  )`);

  // Student activity tracking
  db.run(`CREATE TABLE IF NOT EXISTS student_activity (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER,
    activity_type TEXT NOT NULL,
    activity_data TEXT,
    ip_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students (id)
  )`);

  // Update students table to add last_login tracking
  db.run(`ALTER TABLE students ADD COLUMN last_login DATETIME`, (err) => {
    // Ignore error if column already exists
  });

  // Update students table to add status
  db.run(`ALTER TABLE students ADD COLUMN status TEXT DEFAULT 'active'`, (err) => {
    // Ignore error if column already exists
  });

  // Update students table to add mobile number
  db.run(`ALTER TABLE students ADD COLUMN mobile_number TEXT`, (err) => {
    // Ignore error if column already exists
  });

  // Update students table to add name field
  db.run(`ALTER TABLE students ADD COLUMN name VARCHAR(255)`, (err) => {
    // Ignore error if column already exists
  });

  // Update students table to add surname field
  db.run(`ALTER TABLE students ADD COLUMN surname VARCHAR(255)`, (err) => {
    // Ignore error if column already exists
  });

  // Update students table to add email field
  db.run(`ALTER TABLE students ADD COLUMN email VARCHAR(255)`, (err) => {
    // Ignore error if column already exists
  });

  // Create unique index on email for students (only if email is not null)
  db.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_students_email ON students(email) WHERE email IS NOT NULL`, (err) => {
    // Ignore error if index already exists
  });

  // Add category_id to questions table (migration)
  db.run(`ALTER TABLE questions ADD COLUMN category_id INTEGER`, (err) => {
    // Ignore error if column already exists
  });

  // Add foreign key constraint for category_id (this will only work if the column doesn't exist)
  db.run(`CREATE INDEX IF NOT EXISTS idx_questions_category_id ON questions(category_id)`, (err) => {
    // Ignore error if index already exists
  });

  // Add explanation_summary to questions table for AI-generated summaries
  db.run(`ALTER TABLE questions ADD COLUMN explanation_summary TEXT`, (err) => {
    // Ignore error if column already exists
  });

  // Exam Results table
db.run(`CREATE TABLE IF NOT EXISTS exam_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  exam_id INTEGER, -- ✅ add this line
  student_id INTEGER,
  subject_id INTEGER,
  total_questions INTEGER,
  correct_answers INTEGER,
  score REAL,
  answers TEXT, -- JSON string of answers
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (exam_id) REFERENCES exams (id),
  FOREIGN KEY (student_id) REFERENCES students (id),
  FOREIGN KEY (subject_id) REFERENCES subjects (id)
)`);


  // Exam Questions table - junction table for exam-question relationship
  db.run(`CREATE TABLE IF NOT EXISTS exam_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exam_id INTEGER,
    question_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (exam_id) REFERENCES exams (id),
    FOREIGN KEY (question_id) REFERENCES questions (id)
  )`);

  // Video Watch Analytics table - track student video engagement
  db.run(`CREATE TABLE IF NOT EXISTS video_watch_analytics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    question_id INTEGER NOT NULL,
    exam_result_id INTEGER,
    video_url TEXT NOT NULL,
    session_id TEXT NOT NULL,
    watch_duration_seconds REAL DEFAULT 0,
    video_total_duration_seconds REAL DEFAULT 0,
    completion_percentage REAL DEFAULT 0,
    watch_count INTEGER DEFAULT 1,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_watched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_completed BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions (id) ON DELETE CASCADE,
    FOREIGN KEY (exam_result_id) REFERENCES exam_results (id) ON DELETE CASCADE,
    UNIQUE(session_id)
  )`);

  // Create indexes for video watch analytics
  db.run(`CREATE INDEX IF NOT EXISTS idx_video_watch_student_id ON video_watch_analytics(student_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_video_watch_question_id ON video_watch_analytics(question_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_video_watch_result_id ON video_watch_analytics(exam_result_id)`);
  
  // Additional indexes for time-series queries and data retention
  db.run(`CREATE INDEX IF NOT EXISTS idx_video_watch_created_at ON video_watch_analytics(created_at)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_video_watch_student_date ON video_watch_analytics(student_id, created_at)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_video_watch_video_date ON video_watch_analytics(video_url, created_at)`);

  // Create default admin
  const defaultPassword = bcrypt.hashSync('admin123', 10);
  db.run(`INSERT OR IGNORE INTO admins (username, password) VALUES (?, ?)`, ['admin', defaultPassword]);
});

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Admin auth routes
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;

  db.get('SELECT * FROM admins WHERE username = ?', [username], (err, admin) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!admin || !bcrypt.compareSync(password, admin.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: admin.id, username: admin.username, role: 'admin' }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: admin.id, username: admin.username, role: 'admin' } });
  });
});

// Student exam routes
app.get('/api/student/exams', authenticateToken, (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ error: 'Student access required' });
  }

  // Fetch all exams that are not in draft status, along with attempt status
  const query = `
    SELECT 
      e.id,
      e.title,
      e.description,
      e.category,
      e.start_time,
      e.end_time,
      e.duration_minutes,
      e.total_questions,
      e.status,
      e.created_at,
      er.id as attempt_id,
      er.score as attempt_score,
      er.created_at as attempt_date
    FROM exams e
    LEFT JOIN exam_results er ON e.id = er.exam_id AND er.student_id = ?
    WHERE e.status != 'draft'
    ORDER BY e.created_at DESC
  `;

  db.all(query, [req.user.id], (err, exams) => {
    if (err) {
      console.error('Error fetching exams for student:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(exams);
  });
});

// Get exam questions for a specific exam
app.get('/api/exam/:examId/questions', authenticateToken, (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ error: 'Student access required' });
  }

  const { examId } = req.params;
  const studentId = req.user.id;

  // First check if student has already taken this exam
  db.get(
    'SELECT id, score FROM exam_results WHERE exam_id = ? AND student_id = ?',
    [examId, studentId],
    (err, existingResult) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (existingResult) {
        return res.status(403).json({ 
          error: 'You have already taken this exam',
          hasAttempt: true,
          score: existingResult.score
        });
      }
      
      // Get exam details and questions
      const examQuery = `
        SELECT 
          e.id,
          e.title,
          e.description,
          e.duration_minutes,
          e.total_questions,
          q.id as question_id,
          q.subject_id,
          q.question_text,
          q.option_a,
          q.option_b,
          q.option_c,
          q.option_d,
          q.youtube_link,
          s.name as subject_name
        FROM exams e
        JOIN exam_questions eq ON e.id = eq.exam_id
        JOIN questions q ON eq.question_id = q.id
        JOIN subjects s ON q.subject_id = s.id
        WHERE e.id = ?
        ORDER BY s.name, eq.id ASC
      `;
      
      db.all(examQuery, [examId], (err, results) => {
        if (err) {
          console.error('Error fetching exam questions:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        
        if (results.length === 0) {
          return res.status(404).json({ error: 'Exam not found or no questions available' });
        }
        
        // Extract exam info from first result
        const examInfo = {
          id: results[0].id,
          title: results[0].title,
          description: results[0].description,
          duration_minutes: results[0].duration_minutes,
          total_questions: results[0].total_questions
        };
        
        // Group questions by subject
        const questionsBySubject = {};
        const subjects = [];
        
        results.forEach(row => {
          const subjectName = row.subject_name;
          const subjectId = row.subject_id;
          
          if (!questionsBySubject[subjectId]) {
            questionsBySubject[subjectId] = {
              id: subjectId,
              name: subjectName,
              questions: []
            };
            subjects.push(questionsBySubject[subjectId]);
          }
          
          questionsBySubject[subjectId].questions.push({
            id: row.question_id,
            question_text: row.question_text,
            option_a: row.option_a,
            option_b: row.option_b,
            option_c: row.option_c,
            option_d: row.option_d,
            youtube_link: row.youtube_link,
            subject_id: row.subject_id,
            subject_name: row.subject_name
          });
        });
        
        // Also provide a flat list of questions for backwards compatibility
        const questions = results.map(row => ({
          id: row.question_id,
          question_text: row.question_text,
          option_a: row.option_a,
          option_b: row.option_b,
          option_c: row.option_c,
          option_d: row.option_d,
          youtube_link: row.youtube_link,
          subject_id: row.subject_id,
          subject_name: row.subject_name
        }));
        
        res.json({
          exam: examInfo,
          questions: questions,
          subjects: subjects
        });
      });
    }
  );
});

// Student auth routes
app.post('/api/student/register', (req, res) => {
  const { username, password, mobile_number } = req.body;

  // Validate required fields
  if (!username || username.trim() === '') {
    return res.status(400).json({ error: 'Username is required' });
  }

  if (!password || password.trim() === '') {
    return res.status(400).json({ error: 'Password is required' });
  }

  if (!mobile_number || mobile_number.trim() === '') {
    return res.status(400).json({ error: 'Mobile number is required' });
  }

  // Validate username length (minimum 8 characters)
  if (username.trim().length < 8) {
    return res.status(400).json({ error: 'Username must be at least 8 characters long' });
  }

  // Validate username contains at least one special character
  const specialCharRegex = /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\/;'`~]/;
  if (!specialCharRegex.test(username)) {
    return res.status(400).json({ error: 'Username must contain at least one special character' });
  }

  // Validate password length
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  // Validate mobile number format (exactly 10 digits)
  if (!/^[0-9]{10}$/.test(mobile_number.trim())) {
    return res.status(400).json({ error: 'Mobile number must be exactly 10 digits' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  db.run('INSERT INTO students (username, password, mobile_number) VALUES (?, ?, ?)', [username.trim(), hashedPassword, mobile_number.trim()], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: 'Username already exists' });
      }
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ message: 'Student registered successfully', id: this.lastID });
  });
});

app.post('/api/student/login', (req, res) => {
  const { username, password } = req.body;
  const ipAddress = req.ip || req.connection.remoteAddress;

  db.get('SELECT * FROM students WHERE username = ?', [username], (err, student) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!student || !bcrypt.compareSync(password, student.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    db.run('UPDATE students SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [student.id]);
    
    // Log activity
    db.run(
      'INSERT INTO student_activity (student_id, activity_type, activity_data, ip_address) VALUES (?, ?, ?, ?)',
      [student.id, 'login', JSON.stringify({ username }), ipAddress]
    );

    const token = jwt.sign({ id: student.id, username: student.username, role: 'student' }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: student.id, username: student.username, role: 'student' } });
  });
});

// Student Profile Management
app.get('/api/student/profile', authenticateToken, (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ error: 'Student access required' });
  }

  db.get(
    'SELECT id, username, name, surname, email, mobile_number, created_at, last_login FROM students WHERE id = ?',
    [req.user.id],
    (err, student) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (!student) {
        return res.status(404).json({ error: 'Student not found' });
      }
      
      res.json(student);
    }
  );
});

app.put('/api/student/profile', authenticateToken, (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ error: 'Student access required' });
  }

  const { name, surname, email } = req.body;

  // Validate email format if provided
  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Check if email is already taken by another user
    db.get(
      'SELECT id FROM students WHERE email = ? AND id != ?',
      [email, req.user.id],
      (err, existingStudent) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        
        if (existingStudent) {
          return res.status(400).json({ error: 'Email already in use' });
        }
        
        // Update profile
        updateProfile();
      }
    );
  } else {
    // Update profile without email check
    updateProfile();
  }

  function updateProfile() {
    db.run(
      'UPDATE students SET name = ?, surname = ?, email = ? WHERE id = ?',
      [name || null, surname || null, email || null, req.user.id],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to update profile' });
        }
        
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Student not found' });
        }
        
        res.json({ message: 'Profile updated successfully' });
      }
    );
  }
});

app.post('/api/student/password/change', authenticateToken, (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ error: 'Student access required' });
  }

  const { currentPassword, newPassword, confirmPassword } = req.body;

  // Validate input
  if (!currentPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({ error: 'All password fields are required' });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ error: 'New passwords do not match' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters long' });
  }

  // Get current student
  db.get(
    'SELECT password FROM students WHERE id = ?',
    [req.user.id],
    (err, student) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (!student) {
        return res.status(404).json({ error: 'Student not found' });
      }

      // Verify current password
      if (!bcrypt.compareSync(currentPassword, student.password)) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }

      // Hash new password
      const hashedPassword = bcrypt.hashSync(newPassword, 10);

      // Update password
      db.run(
        'UPDATE students SET password = ? WHERE id = ?',
        [hashedPassword, req.user.id],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to update password' });
          }
          
          res.json({ message: 'Password changed successfully' });
        }
      );
    }
  );
});

// Student Analytics endpoints
app.get('/api/admin/analytics/students', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  // Get comprehensive student analytics
  const queries = {
    total: 'SELECT COUNT(*) as count FROM students',
    active: `SELECT COUNT(*) as count FROM students WHERE status = 'active'`,
    recentlyActive: `SELECT COUNT(*) as count FROM students WHERE last_login > datetime('now', '-7 days')`,
    examTaken: `SELECT COUNT(DISTINCT student_id) as count FROM exam_results`,
    totalExams: 'SELECT COUNT(*) as count FROM exam_results',
    averageScore: 'SELECT AVG(score) as average FROM exam_results'
  };

  const analytics = {};
  let completed = 0;
  const total = Object.keys(queries).length;

  Object.entries(queries).forEach(([key, query]) => {
    db.get(query, (err, result) => {
      if (!err) {
        if (key === 'averageScore') {
          analytics[key] = result.average ? Math.round(result.average * 100) / 100 : 0;
        } else {
          analytics[key] = result.count || 0;
        }
      } else {
        analytics[key] = 0;
      }
      
      completed++;
      if (completed === total) {
        res.json(analytics);
      }
    });
  });
});

// Note: Main students endpoint is at line ~1836 with SELECT s.*

app.get('/api/admin/recent-activity', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const query = `
    SELECT 
      sa.activity_type,
      sa.created_at,
      s.username,
      sa.activity_data
    FROM student_activity sa
    JOIN students s ON sa.student_id = s.id
    ORDER BY sa.created_at DESC
    LIMIT 50
  `;

  db.all(query, (err, activities) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(activities);
  });
});

// Get detailed student information
app.get('/api/admin/students/:studentId', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { studentId } = req.params;

  // Get student basic info
  const studentQuery = `
    SELECT 
      id,
      username,
      name,
      surname,
      email,
      mobile_number,
      status,
      last_login,
      created_at
    FROM students 
    WHERE id = ?
  `;

  // Get student's exam results with exam details
  const examResultsQuery = `
    SELECT 
      er.id,
      er.score,
      er.total_questions,
      er.correct_answers,
      er.created_at as attempt_date,
      e.title as exam_title,
      e.category,
      e.duration_minutes
    FROM exam_results er
    JOIN exams e ON er.exam_id = e.id
    WHERE er.student_id = ?
    ORDER BY er.created_at DESC
  `;

  // Get student activity
  const activityQuery = `
    SELECT 
      activity_type,
      created_at,
      ip_address
    FROM student_activity
    WHERE student_id = ?
    ORDER BY created_at DESC
    LIMIT 20
  `;

  db.get(studentQuery, [studentId], (err, student) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Get exam results
    db.all(examResultsQuery, [studentId], (err, examResults) => {
      if (err) {
        return res.status(500).json({ error: 'Database error fetching exam results' });
      }

      // Get activity
      db.all(activityQuery, [studentId], (err, activities) => {
        if (err) {
          return res.status(500).json({ error: 'Database error fetching activities' });
        }

        // Calculate statistics
        const stats = {
          totalExams: examResults.length,
          averageScore: examResults.length > 0 ? 
            Math.round((examResults.reduce((sum, result) => sum + result.score, 0) / examResults.length) * 100) / 100 : 0,
          highestScore: examResults.length > 0 ? Math.max(...examResults.map(r => r.score)) : 0,
          lowestScore: examResults.length > 0 ? Math.min(...examResults.map(r => r.score)) : 0,
          totalCorrectAnswers: examResults.reduce((sum, result) => sum + result.correct_answers, 0),
          totalQuestions: examResults.reduce((sum, result) => sum + result.total_questions, 0)
        };

        res.json({
          student,
          examResults,
          activities,
          statistics: stats
        });
      });
    });
  });
});

// Subject routes
app.get('/api/subjects', (req, res) => {
  db.all('SELECT * FROM subjects ORDER BY name', (err, subjects) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(subjects);
  });
});

app.post('/api/subjects', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { name, description, subcategory_id } = req.body;
  db.run('INSERT INTO subjects (name, description, subcategory_id) VALUES (?, ?, ?)', [name, description, subcategory_id || null], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: 'Subject already exists' });
      }
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ message: 'Subject created successfully', id: this.lastID });
  });
});

// Subcategory routes
app.get('/api/subcategories', (req, res) => {
  const { subject_id } = req.query;
  
  let query = `
    SELECT 
      sc.*,
      parent.name as parent_name,
      COUNT(child.id) as children_count
    FROM subcategories sc
    LEFT JOIN subcategories parent ON sc.parent_id = parent.id
    LEFT JOIN subcategories child ON sc.id = child.parent_id
    WHERE sc.is_active = 1
  `;
  
  const params = [];
  if (subject_id) {
    query += ' AND sc.subject_id = ?';
    params.push(subject_id);
  }
  
  query += ' GROUP BY sc.id ORDER BY sc.level, sc.name';
  
  db.all(query, params, (err, subcategories) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(subcategories);
  });
});

app.get('/api/subcategories/tree/:subjectId', (req, res) => {
  const { subjectId } = req.params;
  
  db.all(`
    SELECT * FROM subcategories 
    WHERE subject_id = ? AND is_active = 1 
    ORDER BY level, name
  `, [subjectId], (err, subcategories) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    // Build tree structure
    const buildTree = (parentId = null) => {
      return subcategories
        .filter(cat => cat.parent_id === parentId)
        .map(cat => ({
          ...cat,
          children: buildTree(cat.id)
        }));
    };
    
    const tree = buildTree();
    res.json(tree);
  });
});

app.post('/api/subcategories', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { name, description, parent_id, subject_id } = req.body;
  
  if (!name || !subject_id) {
    return res.status(400).json({ error: 'Name and subject_id are required' });
  }
  
  // Calculate level based on parent
  let level = 1;
  if (parent_id) {
    // Get parent level and increment
    db.get('SELECT level FROM subcategories WHERE id = ?', [parent_id], (err, parent) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!parent) {
        return res.status(400).json({ error: 'Parent category not found' });
      }
      
      level = parent.level + 1;
      insertSubcategory();
    });
  } else {
    insertSubcategory();
  }
  
  function insertSubcategory() {
    db.run(
      'INSERT INTO subcategories (name, description, parent_id, subject_id, level) VALUES (?, ?, ?, ?, ?)',
      [name, description, parent_id || null, subject_id, level],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        res.json({ message: 'Subcategory created successfully', id: this.lastID });
      }
    );
  }
});

app.put('/api/subcategories/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { id } = req.params;
  const { name, description, parent_id, is_active } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }
  
  // Prevent circular reference
  if (parent_id) {
    const checkCircular = (checkId, targetId) => {
      return new Promise((resolve, reject) => {
        if (checkId == targetId) {
          resolve(true);
          return;
        }
        
        db.get('SELECT parent_id FROM subcategories WHERE id = ?', [checkId], (err, row) => {
          if (err) reject(err);
          else if (!row || !row.parent_id) resolve(false);
          else checkCircular(row.parent_id, targetId).then(resolve).catch(reject);
        });
      });
    };
    
    checkCircular(parent_id, id)
      .then(isCircular => {
        if (isCircular) {
          return res.status(400).json({ error: 'Cannot create circular reference' });
        }
        updateSubcategory();
      })
      .catch(err => {
        return res.status(500).json({ error: 'Database error' });
      });
  } else {
    updateSubcategory();
  }
  
  function updateSubcategory() {
    // Calculate new level if parent changed
    let level = 1;
    if (parent_id) {
      db.get('SELECT level FROM subcategories WHERE id = ?', [parent_id], (err, parent) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        if (!parent) {
          return res.status(400).json({ error: 'Parent category not found' });
        }
        
        level = parent.level + 1;
        performUpdate();
      });
    } else {
      performUpdate();
    }
    
    function performUpdate() {
      db.run(
        'UPDATE subcategories SET name = ?, description = ?, parent_id = ?, level = ?, is_active = ? WHERE id = ?',
        [name, description, parent_id || null, level, is_active !== undefined ? is_active : 1, id],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }
          if (this.changes === 0) {
            return res.status(404).json({ error: 'Subcategory not found' });
          }
          res.json({ message: 'Subcategory updated successfully' });
        }
      );
    }
  }
});

app.delete('/api/subcategories/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { id } = req.params;
  
  // Check if subcategory has children
  db.get('SELECT COUNT(*) as count FROM subcategories WHERE parent_id = ?', [id], (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (result.count > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete subcategory with child categories. Please delete or move child categories first.' 
      });
    }
    
    // Check if any subjects are assigned to this subcategory
    db.get('SELECT COUNT(*) as count FROM subjects WHERE subcategory_id = ?', [id], (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (result.count > 0) {
        return res.status(400).json({ 
          error: 'Cannot delete subcategory with assigned subjects. Please reassign subjects first.' 
        });
      }
      
      // Safe to delete
      db.run('DELETE FROM subcategories WHERE id = ?', [id], function(err) {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Subcategory not found' });
        }
        res.json({ message: 'Subcategory deleted successfully' });
      });
    });
  });
});

// Question Categories routes
app.get('/api/question-categories/:subjectId', (req, res) => {
  const { subjectId } = req.params;
  
  db.all(
    'SELECT * FROM question_categories WHERE subject_id = ? AND is_active = 1 ORDER BY name',
    [subjectId],
    (err, categories) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(categories);
    }
  );
});

app.post('/api/question-categories', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { subject_id, name, description, color } = req.body;
  
  if (!name || !subject_id) {
    return res.status(400).json({ error: 'Name and subject_id are required' });
  }
  
  db.run(
    'INSERT INTO question_categories (subject_id, name, description, color) VALUES (?, ?, ?, ?)',
    [subject_id, name.trim(), description || '', color || '#667eea'],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'Category name already exists for this subject' });
        }
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ message: 'Question category created successfully', id: this.lastID });
    }
  );
});

app.put('/api/question-categories/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { id } = req.params;
  const { name, description, color, is_active } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }
  
  db.run(
    'UPDATE question_categories SET name = ?, description = ?, color = ?, is_active = ? WHERE id = ?',
    [name.trim(), description || '', color || '#667eea', is_active !== undefined ? is_active : 1, id],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'Category name already exists for this subject' });
        }
        return res.status(500).json({ error: 'Database error' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Question category not found' });
      }
      res.json({ message: 'Question category updated successfully' });
    }
  );
});

app.delete('/api/question-categories/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { id } = req.params;
  
  // Check if any questions are assigned to this category
  db.get('SELECT COUNT(*) as count FROM questions WHERE category_id = ?', [id], (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (result.count > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete category with assigned questions. Please reassign questions first.' 
      });
    }
    
    // Safe to delete
    db.run('DELETE FROM question_categories WHERE id = ?', [id], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Question category not found' });
      }
      res.json({ message: 'Question category deleted successfully' });
    });
  });
});

// Question routes
app.get('/api/questions/:subjectId', (req, res) => {
  const { subjectId } = req.params;
  const { category_id } = req.query;
  
  let query = `
    SELECT 
      q.*,
      qc.name as category_name,
      qc.color as category_color
    FROM questions q
    LEFT JOIN question_categories qc ON q.category_id = qc.id
    WHERE q.subject_id = ?
  `;
  const params = [subjectId];
  
  if (category_id) {
    query += ' AND q.category_id = ?';
    params.push(category_id);
  }
  
  query += ' ORDER BY q.id';
  
  db.all(query, params, (err, questions) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(questions);
  });
});

app.post('/api/questions', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { subject_id, category_id, question_text, option_a, option_b, option_c, option_d, correct_answer, youtube_link } = req.body;
  
  db.run(
    'INSERT INTO questions (subject_id, category_id, question_text, option_a, option_b, option_c, option_d, correct_answer, youtube_link) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [subject_id, category_id || null, question_text, option_a, option_b, option_c, option_d, correct_answer, youtube_link],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ message: 'Question created successfully', id: this.lastID });
    }
  );
});

// Update subject
app.put('/api/subjects/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { id } = req.params;
  const { name, description, subcategory_id } = req.body;
  
  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'Subject name is required' });
  }
  
  db.run(
    'UPDATE subjects SET name = ?, description = ?, subcategory_id = ? WHERE id = ?',
    [name.trim(), description || '', subcategory_id || null, id],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'Subject name already exists' });
        }
        return res.status(500).json({ error: 'Database error' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Subject not found' });
      }
      res.json({ message: 'Subject updated successfully' });
    }
  );
});

// Update question
app.put('/api/questions/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { id } = req.params;
  const { subject_id, category_id, question_text, option_a, option_b, option_c, option_d, correct_answer, youtube_link } = req.body;
  
  // Validation
  if (!question_text || question_text.trim() === '') {
    return res.status(400).json({ error: 'Question text is required' });
  }
  if (!option_a || !option_b || !option_c || !option_d) {
    return res.status(400).json({ error: 'All options are required' });
  }
  if (!['A', 'B', 'C', 'D'].includes(correct_answer)) {
    return res.status(400).json({ error: 'Correct answer must be A, B, C, or D' });
  }
  
  db.run(
    'UPDATE questions SET subject_id = ?, category_id = ?, question_text = ?, option_a = ?, option_b = ?, option_c = ?, option_d = ?, correct_answer = ?, youtube_link = ? WHERE id = ?',
    [subject_id, category_id || null, question_text.trim(), option_a.trim(), option_b.trim(), option_c.trim(), option_d.trim(), correct_answer, youtube_link || '', id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Question not found' });
      }
      res.json({ message: 'Question updated successfully' });
    }
  );
});

// Delete subject
app.delete('/api/subjects/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { id } = req.params;
  
  // First, delete all questions related to this subject
  db.run('DELETE FROM questions WHERE subject_id = ?', [id], function(questionsErr) {
    if (questionsErr) {
      return res.status(500).json({ error: 'Failed to delete related questions' });
    }
    
    // Delete subcategories related to this subject
    db.run('DELETE FROM subcategories WHERE subject_id = ?', [id], function(subcategoriesErr) {
      if (subcategoriesErr) {
        return res.status(500).json({ error: 'Failed to delete related subcategories' });
      }
      
      // Then delete the subject
      db.run('DELETE FROM subjects WHERE id = ?', [id], function(subjectErr) {
        if (subjectErr) {
          return res.status(500).json({ error: 'Database error' });
        }
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Subject not found' });
        }
        res.json({ 
          message: 'Subject and all related questions and subcategories deleted successfully',
          deletedQuestions: questionsErr ? 0 : this.changes
        });
      });
    });
  });
});

// Exam Management routes
// Get all exams
app.get('/api/exams', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const query = `
    SELECT 
      e.*,
      COUNT(DISTINCT er.id) as attempts_count,
      COUNT(DISTINCT eq.question_id) as question_count
    FROM exams e
    LEFT JOIN exam_results er ON e.id = er.exam_id
    LEFT JOIN exam_questions eq ON e.id = eq.exam_id
    GROUP BY e.id
    ORDER BY e.created_at DESC
  `;

  db.all(query, (err, exams) => {
    if (err) {
      console.error('Error fetching exams for admin:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    console.log(`Fetched ${exams.length} exams for admin dashboard`);
    res.json(exams);
  });
});

// Create exam
app.post('/api/exams', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { 
    title, 
    description, 
    selectedQuestions,
    category, 
    start_date,
    start_time, 
    end_date,
    end_time, 
    duration_minutes, 
    total_questions,
    status 
  } = req.body;
  
  console.log('Creating exam with data:', { title, selectedQuestions: selectedQuestions?.length, category, start_date, start_time, end_date, end_time });
  
  if (!title || !selectedQuestions || selectedQuestions.length === 0) {
    return res.status(400).json({ error: 'Title and selected questions are required' });
  }

  // Combine date and time for database storage
  const startDateTime = start_date && start_time ? `${start_date} ${start_time}` : null;
  const endDateTime = end_date && end_time ? `${end_date} ${end_time}` : null;

  db.run(
    `INSERT INTO exams (
      title, description, category, start_time, end_time, 
      duration_minutes, total_questions, status, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      title, description, category || 'general', 
      startDateTime, endDateTime, duration_minutes || 60, 
      selectedQuestions.length, status || 'draft', req.user.id
    ],
    function(err) {
      if (err) {
        console.error('Error creating exam:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      const examId = this.lastID;
      
      // Insert exam questions
      const insertQuestionPromises = selectedQuestions.map(questionId => {
        return new Promise((resolve, reject) => {
          db.run(
            'INSERT INTO exam_questions (exam_id, question_id) VALUES (?, ?)',
            [examId, questionId],
            (err) => {
              if (err) reject(err);
              else resolve();
            }
          );
        });
      });
      
      Promise.all(insertQuestionPromises)
        .then(() => {
          res.json({ message: 'Exam created successfully', id: examId });
        })
        .catch(err => {
          console.error('Error inserting exam questions:', err);
          res.status(500).json({ error: 'Failed to create exam questions' });
        });
    }
  );
});

// Update exam
app.put('/api/exams/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { id } = req.params;
  const { 
    title, 
    description, 
    selectedQuestions,
    category, 
    start_date,
    start_time, 
    end_date,
    end_time, 
    duration_minutes, 
    total_questions,
    status 
  } = req.body;
  
  console.log('Updating exam with data:', { 
    id, title, selectedQuestions: selectedQuestions?.length, category, 
    start_date, start_time, end_date, end_time, status 
  });
  
  // Validate required fields
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }
  
  // If status is changing to active, validate questions and dates
  if (status === 'active') {
    // Check if questions are provided in the request OR check existing questions in database
    if (!selectedQuestions || selectedQuestions.length === 0) {
      // Check if exam already has questions in database
      db.get('SELECT COUNT(*) as count FROM exam_questions WHERE exam_id = ?', [id], (err, result) => {
        if (err || !result || result.count === 0) {
          return res.status(400).json({ error: 'Cannot activate exam without questions. Please add questions first.' });
        }
        // Has questions in DB, continue with update
        performExamUpdate();
      });
      return; // Exit here and let the callback handle it
    }
    
    if (!start_date || !start_time || !end_date || !end_time) {
      return res.status(400).json({ error: 'Cannot activate exam without start/end dates and times.' });
    }
  }
  
  // Perform the update
  performExamUpdate();
  
  function performExamUpdate() {
  
  // Combine date and time for database storage
  const startDateTime = start_date && start_time ? `${start_date} ${start_time}` : null;
  const endDateTime = end_date && end_time ? `${end_date} ${end_time}` : null;
  
  // Start transaction
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    // Update exam basic info
    db.run(
      `UPDATE exams SET 
        title = ?, description = ?, category = ?, 
        start_time = ?, end_time = ?, duration_minutes = ?, 
        total_questions = ?, status = ?
      WHERE id = ?`,
      [
        title, description, category || 'general', 
        startDateTime, endDateTime, duration_minutes || 60, 
        selectedQuestions?.length || 0, status || 'draft', id
      ],
      function(err) {
        if (err) {
          console.error('Error updating exam:', err);
          db.run('ROLLBACK');
          return res.status(500).json({ error: 'Database error updating exam' });
        }
        
        if (this.changes === 0) {
          db.run('ROLLBACK');
          return res.status(404).json({ error: 'Exam not found' });
        }
        
        // If selectedQuestions are provided, update the exam_questions table
        if (selectedQuestions && selectedQuestions.length > 0) {
          // First delete existing question associations
          db.run('DELETE FROM exam_questions WHERE exam_id = ?', [id], (err) => {
            if (err) {
              console.error('Error deleting existing exam questions:', err);
              db.run('ROLLBACK');
              return res.status(500).json({ error: 'Database error updating questions' });
            }
            
            // Insert new question associations
            const insertQuestionPromises = selectedQuestions.map(questionId => {
              return new Promise((resolve, reject) => {
                db.run(
                  'INSERT INTO exam_questions (exam_id, question_id) VALUES (?, ?)',
                  [id, questionId],
                  (err) => {
                    if (err) reject(err);
                    else resolve();
                  }
                );
              });
            });
            
            Promise.all(insertQuestionPromises)
              .then(() => {
                db.run('COMMIT');
                console.log(`Exam ${id} updated successfully with ${selectedQuestions.length} questions`);
                res.json({ 
                  message: 'Exam updated successfully', 
                  id: id,
                  questionCount: selectedQuestions.length 
                });
              })
              .catch(err => {
                console.error('Error inserting exam questions:', err);
                db.run('ROLLBACK');
                res.status(500).json({ error: 'Failed to update exam questions' });
              });
          });
        } else {
          // No questions to update, just commit the basic info changes
          db.run('COMMIT');
          res.json({ message: 'Exam updated successfully', id: id });
        }
      }
    );
  });
  }
});

// Get exam details for editing
app.get('/api/exams/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { id } = req.params;
  
  // Get exam basic info
  db.get('SELECT * FROM exams WHERE id = ?', [id], (err, exam) => {
    if (err) {
      console.error('Error fetching exam:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }
    
    // Get associated questions
    db.all(
      'SELECT question_id FROM exam_questions WHERE exam_id = ? ORDER BY id',
      [id],
      (err, examQuestions) => {
        if (err) {
          console.error('Error fetching exam questions:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        
        // Extract start and end date/time
        let startDate = '', startTime = '', endDate = '', endTime = '';
        
        if (exam.start_time) {
          const startDateTime = new Date(exam.start_time);
          startDate = startDateTime.toISOString().split('T')[0];
          startTime = startDateTime.toTimeString().slice(0, 5);
        }
        
        if (exam.end_time) {
          const endDateTime = new Date(exam.end_time);
          endDate = endDateTime.toISOString().split('T')[0];
          endTime = endDateTime.toTimeString().slice(0, 5);
        }
        
        res.json({
          ...exam,
          selectedQuestions: examQuestions.map(eq => eq.question_id),
          start_date: startDate,
          start_time: startTime,
          end_date: endDate,
          end_time: endTime
        });
      }
    );
  });
});

// Delete exam
app.delete('/api/exams/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { id } = req.params;
  
  // Delete in order: exam_results -> exam_questions -> exams
  db.serialize(() => {
    db.run('DELETE FROM exam_results WHERE exam_id = ?', [id], (err) => {
      if (err) {
        console.error('Error deleting exam results:', err);
      }
    });
    
    db.run('DELETE FROM exam_questions WHERE exam_id = ?', [id], (err) => {
      if (err) {
        console.error('Error deleting exam questions:', err);
      }
    });
    
    db.run('DELETE FROM exams WHERE id = ?', [id], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Exam not found' });
      }
      res.json({ message: 'Exam and all related data deleted successfully' });
    });
  });
});

// Get exam categories
app.get('/api/exam-categories', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  db.all('SELECT DISTINCT category FROM exams ORDER BY category', (err, categories) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    const categoryList = categories.map(c => c.category).filter(Boolean);
    // Add default categories if none exist
    const defaultCategories = ['general', 'midterm', 'final', 'quiz', 'assignment'];
    const allCategories = [...new Set([...categoryList, ...defaultCategories])];
    
    res.json(allCategories);
  });
});

// Delete question
app.delete('/api/questions/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { id } = req.params;
  
  db.run('DELETE FROM questions WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }
    res.json({ message: 'Question deleted successfully' });
  });
});

// API Key routes
app.get('/api/api-keys', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  db.all('SELECT id, key_name, provider, base_url, model_name, is_active, created_at FROM api_keys ORDER BY created_at DESC', (err, keys) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(keys);
  });
});

app.post('/api/api-keys', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { key_name, api_key, provider, base_url, model_name } = req.body;
  
  console.log('Received API key data:', { key_name, provider, base_url, model_name, api_key: api_key ? '***' : 'empty' });
  
  if (!key_name || !api_key || !provider) {
    return res.status(400).json({ error: 'Key name, API key, and provider are required' });
  }
  
  db.run(
    'INSERT INTO api_keys (key_name, api_key, provider, base_url, model_name, is_active) VALUES (?, ?, ?, ?, ?, ?)',
    [key_name, api_key, provider, base_url, model_name, 1],
    function(err) {
      if (err) {
        console.error('Database error inserting API key:', err);
        console.error('SQL parameters:', [key_name, api_key ? '***' : 'empty', provider, base_url, model_name, 1]);
        return res.status(500).json({ error: `Database error: ${err.message}` });
      }
      console.log('API key inserted successfully with ID:', this.lastID);
      res.json({ message: 'API key saved successfully', id: this.lastID });
    }
  );
});

// Update API key
app.put('/api/api-keys/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { id } = req.params;
  const { key_name, api_key, provider, base_url, model_name, is_active } = req.body;
  
  db.run(
    'UPDATE api_keys SET key_name = ?, api_key = ?, provider = ?, base_url = ?, model_name = ?, is_active = ? WHERE id = ?',
    [key_name, api_key, provider, base_url, model_name, is_active, id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'API key not found' });
      }
      res.json({ message: 'API key updated successfully' });
    }
  );
});

// Delete API key
app.delete('/api/api-keys/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { id } = req.params;
  
  db.run('DELETE FROM api_keys WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'API key not found' });
    }
    res.json({ message: 'API key deleted successfully' });
  });
});

// Admin analytics endpoints
app.get('/api/admin/analytics/students', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  // Get student analytics
  db.all(`
    SELECT 
      COUNT(*) as totalStudents,
      COUNT(CASE WHEN last_login IS NOT NULL THEN 1 END) as activeStudents
    FROM students
  `, (err, studentStats) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    // Get exam attempts count
    db.get(`
      SELECT COUNT(*) as totalExams, AVG(score) as averageScore
      FROM exam_results
    `, (err, examStats) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.json({
        totalStudents: studentStats[0]?.totalStudents || 0,
        activeStudents: studentStats[0]?.activeStudents || 0,
        totalExams: examStats?.totalExams || 0,
        averageScore: Math.round(examStats?.averageScore || 0)
      });
    });
  });
});

app.get('/api/admin/students', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  db.all(`
    SELECT 
      s.*,
      COUNT(er.id) as exams_taken,
      ROUND(AVG(er.score), 2) as average_score
    FROM students s
    LEFT JOIN exam_results er ON s.id = er.student_id
    GROUP BY s.id
    ORDER BY s.created_at DESC
  `, (err, students) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(students);
  });
});

app.get('/api/admin/recent-activity', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  db.all(`
    SELECT 
      sa.activity_type,
      sa.created_at,
      s.username as student_name
    FROM student_activity sa
    LEFT JOIN students s ON sa.student_id = s.id
    ORDER BY sa.created_at DESC
    LIMIT 10
  `, (err, activities) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(activities || []);
  });
});

// Get supported providers
app.get('/api/providers', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const providers = [
    {
      id: 'openrouter',
      name: 'OpenRouter',
      base_url: 'https://openrouter.ai/api/v1',
      default_model: 'meta-llama/llama-3.1-8b-instruct:free',
      models: [
        'meta-llama/llama-3.1-8b-instruct:free',
        'meta-llama/llama-3.2-3b-instruct:free',
        'google/gemma-2-9b-it:free',
        'nousresearch/hermes-3-llama-3.1-405b:free',
        'microsoft/phi-3-mini-128k-instruct:free'
      ],
      auth_type: 'bearer',
      requires_referer: true
    },
    {
      id: 'perplexity',
      name: 'Perplexity',
      base_url: 'https://api.perplexity.ai',
      default_model: 'llama-3.1-sonar-small-128k-online',
      models: [
        'llama-3.1-sonar-small-128k-online',
        'llama-3.1-sonar-large-128k-online',
        'llama-3.1-sonar-huge-128k-online'
      ],
      auth_type: 'bearer',
      requires_referer: false
    }
  ];

  res.json(providers);
});

// Generate questions using AI
app.post('/api/generate-questions', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { subject_id, category_id, topic, count, api_key_id, language } = req.body;

  try {
    // Get API key details
    const apiKeyData = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM api_keys WHERE id = ?', [api_key_id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!apiKeyData) {
      return res.status(404).json({ error: 'API key not found' });
    }

    // Determine the language for generation
    const questionLanguage = language || 'English';
    
    // Create language-specific prompt
    let languageInstruction = '';
    if (questionLanguage === 'Marathi') {
      languageInstruction = 'Generate all questions, options, and text in MARATHI language (मराठी). ';
    } else if (questionLanguage === 'Hindi') {
      languageInstruction = 'Generate all questions, options, and text in HINDI language (हिंदी). ';
    } else {
      languageInstruction = 'Generate all questions, options, and text in ENGLISH language. ';
    }
    
    const prompt = `${languageInstruction}Generate ${count} multiple choice questions about ${topic}. Each question should have 4 options (A, B, C, D) and indicate the correct answer. Format as JSON array with fields: question_text, option_a, option_b, option_c, option_d, correct_answer (A/B/C/D). IMPORTANT: All text including questions and options must be in ${questionLanguage} language.`;

    // Build headers based on provider
    const headers = {
      'Authorization': `Bearer ${apiKeyData.api_key}`,
      'Content-Type': 'application/json'
    };

    // Add OpenRouter-specific headers
    if (apiKeyData.provider === 'openrouter' || apiKeyData.base_url.includes('openrouter')) {
      headers['HTTP-Referer'] = 'http://localhost:3000';
      headers['X-Title'] = 'MCQ Exam App';
    }

    const response = await axios.post(
      `${apiKeyData.base_url}/chat/completions`,
      {
        model: apiKeyData.model_name,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2000
      },
      {
        headers,
        timeout: 30000
      }
    );

    const generatedContent = response.data.choices[0].message.content;
    let questions;
    
    try {
      questions = JSON.parse(generatedContent);
    } catch (parseErr) {
      // Try to extract JSON from the response
      const jsonMatch = generatedContent.match(/\[.*\]/s);
      if (jsonMatch) {
        questions = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Could not parse generated questions');
      }
    }

    // Save generated questions to database
    const savedQuestions = [];
    for (const q of questions) {
      await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO questions (subject_id, category_id, question_text, option_a, option_b, option_c, option_d, correct_answer, youtube_link) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [subject_id, category_id || null, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_answer, ''],
          function(err) {
            if (err) reject(err);
            else {
              savedQuestions.push({ id: this.lastID, ...q });
              resolve();
            }
          }
        );
      });
    }

    res.json({ message: 'Questions generated successfully', questions: savedQuestions });
  } catch (error) {
    console.error('Error generating questions:', error);
    res.status(500).json({ error: 'Failed to generate questions', details: error.message });
  }
});

// Generate content/summary using AI (for question explanations)
app.post('/api/generate-content', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { prompt, api_key_id, question_id } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  if (!api_key_id) {
    return res.status(400).json({ error: 'API key ID is required' });
  }

  try {
    // Get API key details
    const apiKeyData = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM api_keys WHERE id = ? AND is_active = 1', [api_key_id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!apiKeyData) {
      return res.status(404).json({ error: 'API key not found or inactive' });
    }

    console.log('Generating content with API key:', apiKeyData.key_name);
    console.log('Using model:', apiKeyData.model_name);
    console.log('Base URL:', apiKeyData.base_url);
    console.log('Provider:', apiKeyData.provider);

    // Build headers based on provider
    const headers = {
      'Authorization': `Bearer ${apiKeyData.api_key}`,
      'Content-Type': 'application/json'
    };

    // Add OpenRouter-specific headers
    if (apiKeyData.provider === 'openrouter' || apiKeyData.base_url.includes('openrouter')) {
      headers['HTTP-Referer'] = 'http://localhost:3000';
      headers['X-Title'] = 'MCQ Exam App';
    }

    // Make request to LLM API
    const response = await axios.post(
      `${apiKeyData.base_url}/chat/completions`,
      {
        model: apiKeyData.model_name,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1500,
        temperature: 0.7
      },
      {
        headers,
        timeout: 30000 // 30 second timeout
      }
    );

    const generatedContent = response.data.choices[0].message.content;
    
    // Save summary to database if question_id is provided
    if (question_id) {
      await new Promise((resolve, reject) => {
        db.run(
          'UPDATE questions SET explanation_summary = ? WHERE id = ?',
          [generatedContent, question_id],
          function(err) {
            if (err) {
              console.error('Error saving summary to database:', err);
              reject(err);
            } else {
              console.log(`Summary saved for question ${question_id}`);
              resolve();
            }
          }
        );
      });
    }
    
    res.json({ 
      content: generatedContent,
      success: true 
    });
  } catch (error) {
    console.error('Error generating content:', error.response?.data || error.message);
    
    if (error.response) {
      // API returned an error
      return res.status(error.response.status || 500).json({ 
        error: 'Failed to generate content',
        details: error.response.data?.error?.message || error.message
      });
    }
    
    // Network or other error
    res.status(500).json({ 
      error: 'Failed to generate content',
      details: error.message 
    });
  }
});

// Submit exam
app.post('/api/submit-exam', authenticateToken, (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ error: 'Student access required' });
  }

  const { exam_id, answers } = req.body;
  const student_id = req.user.id;

  // Check if student has already taken this exam
  db.get(
    'SELECT id FROM exam_results WHERE exam_id = ? AND student_id = ?',
    [exam_id, student_id],
    (err, existingResult) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (existingResult) {
        return res.status(403).json({ error: 'You have already taken this exam' });
      }
      
      // Get all questions for the exam
      const examQuery = `
        SELECT 
          q.id,
          q.question_text,
          q.option_a,
          q.option_b,
          q.option_c,
          q.option_d,
          q.correct_answer,
          q.youtube_link,
          e.title as exam_title
        FROM questions q
        JOIN exam_questions eq ON q.id = eq.question_id
        JOIN exams e ON eq.exam_id = e.id
        WHERE e.id = ?
        ORDER BY eq.id ASC
      `;
      
      db.all(examQuery, [exam_id], (err, questions) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        if (questions.length === 0) {
          return res.status(404).json({ error: 'Exam not found or no questions available' });
        }

        let correctAnswers = 0;
        const results = [];

        questions.forEach(question => {
          const studentAnswer = answers[question.id];
          const isCorrect = studentAnswer === question.correct_answer;
          if (isCorrect) correctAnswers++;

          results.push({
            question_id: question.id,
            question_text: question.question_text,
            student_answer: studentAnswer,
            correct_answer: question.correct_answer,
            is_correct: isCorrect,
            youtube_link: question.youtube_link,
            options: {
              A: question.option_a,
              B: question.option_b,
              C: question.option_c,
              D: question.option_d
            }
          });
        });

        const score = (correctAnswers / questions.length) * 100;

        // Save exam result
        db.run(
          'INSERT INTO exam_results (student_id, exam_id, total_questions, correct_answers, score, answers) VALUES (?, ?, ?, ?, ?, ?)',
          [student_id, exam_id, questions.length, correctAnswers, score, JSON.stringify(answers)],
          function(err) {
            if (err) {
              return res.status(500).json({ error: 'Database error' });
            }

            res.json({
              score,
              total_questions: questions.length,
              correct_answers: correctAnswers,
              results,
              exam_title: questions[0].exam_title,
              result_id: this.lastID
            });
          }
        );
      });
    }
  );
});

// Get exam history for student
app.get('/api/exam-history', authenticateToken, (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ error: 'Student access required' });
  }

  const student_id = req.user.id;
  
  db.all(
    `SELECT 
      er.*,
      e.title as subject_name,
      e.title as exam_title,
      e.category as exam_category
     FROM exam_results er 
     LEFT JOIN exams e ON er.exam_id = e.id 
     WHERE er.student_id = ? 
     ORDER BY er.created_at DESC`,
    [student_id],
    (err, results) => {
      if (err) {
        console.error('Error fetching exam history:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      // Process results to handle cases where exam_id might be null (legacy data)
      const processedResults = results.map(result => ({
        ...result,
        subject_name: result.subject_name || 'Unknown Exam',
        exam_title: result.exam_title || result.subject_name || 'Unknown Exam'
      }));
      
      console.log(`Found ${processedResults.length} exam history records for student ${student_id}`);
      res.json(processedResults);
    }
  );
});

// Get specific exam result by ID
app.get('/api/exam-results/:resultId', authenticateToken, (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ error: 'Student access required' });
  }

  const { resultId } = req.params;
  const studentId = req.user.id;
  
  // First get the exam result
  db.get(
    'SELECT * FROM exam_results WHERE id = ? AND student_id = ?',
    [resultId, studentId],
    (err, examResult) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (!examResult) {
        return res.status(404).json({ error: 'Exam result not found' });
      }
      
      // Get the exam info and questions
      const questionsQuery = `
        SELECT 
          e.title as exam_title,
          q.id,
          q.question_text,
          q.option_a,
          q.option_b,
          q.option_c,
          q.option_d,
          q.correct_answer,
          q.youtube_link
        FROM exam_results er
        JOIN exams e ON er.exam_id = e.id
        JOIN exam_questions eq ON e.id = eq.exam_id
        JOIN questions q ON eq.question_id = q.id
        WHERE er.id = ?
        ORDER BY eq.id ASC
      `;
      
      db.all(questionsQuery, [resultId], (err, questions) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        
        // Parse the student's answers
        const studentAnswers = JSON.parse(examResult.answers || '{}');
        
        // Build the response in the same format as submit-exam
        const results = questions.map(q => ({
          question_id: q.id,
          question_text: q.question_text,
          student_answer: studentAnswers[q.id] || null,
          correct_answer: q.correct_answer,
          is_correct: (studentAnswers[q.id] || '') === q.correct_answer,
          youtube_link: q.youtube_link,
          options: {
            A: q.option_a,
            B: q.option_b,
            C: q.option_c,
            D: q.option_d
          }
        }));
        
        res.json({
          score: examResult.score,
          total_questions: examResult.total_questions,
          correct_answers: examResult.correct_answers,
          results,
          exam_title: questions.length > 0 ? questions[0].exam_title : 'Unknown Exam',
          result_id: examResult.id,
          created_at: examResult.created_at
        });
      });
    }
  );
});

// Video tracking endpoint
app.post('/api/video-watch-tracking', authenticateToken, (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ error: 'Student access required' });
  }

  const {
    question_id,
    exam_result_id,
    video_url,
    session_id,
    watch_duration_seconds,
    video_total_duration_seconds,
    completion_percentage,
    event_type
  } = req.body;

  const student_id = req.user.id;

  if (!question_id || !video_url || !session_id || !event_type) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  db.get(
    'SELECT * FROM video_watch_analytics WHERE session_id = ?',
    [session_id],
    (err, existingSession) => {
      if (err) {
        console.error('Error checking existing session:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (event_type === 'start') {
        if (existingSession) {
          db.run(
            `UPDATE video_watch_analytics 
             SET watch_count = watch_count + 1, 
                 last_watched_at = CURRENT_TIMESTAMP 
             WHERE session_id = ?`,
            [session_id],
            function(err) {
              if (err) {
                console.error('Error updating watch count:', err);
                return res.status(500).json({ error: 'Database error' });
              }
              res.json({ success: true, message: 'Watch count incremented' });
            }
          );
        } else {
          db.run(
            `INSERT INTO video_watch_analytics (
              student_id, question_id, exam_result_id, video_url, session_id,
              watch_duration_seconds, video_total_duration_seconds, completion_percentage,
              watch_count, started_at, last_watched_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
            [
              student_id,
              question_id,
              exam_result_id || null,
              video_url,
              session_id,
              watch_duration_seconds || 0,
              video_total_duration_seconds || 0,
              completion_percentage || 0
            ],
            function(err) {
              if (err) {
                console.error('Error creating watch session:', err);
                return res.status(500).json({ error: 'Database error' });
              }
              res.json({ success: true, message: 'Watch session created', id: this.lastID });
            }
          );
        }
      } else if (event_type === 'progress' || event_type === 'end') {
        if (!existingSession) {
          return res.status(404).json({ error: 'Session not found' });
        }

        const isCompleted = completion_percentage >= 90 ? 1 : 0;

        db.run(
          `UPDATE video_watch_analytics 
           SET watch_duration_seconds = ?, 
               video_total_duration_seconds = ?,
               completion_percentage = ?,
               is_completed = ?,
               last_watched_at = CURRENT_TIMESTAMP
           WHERE session_id = ?`,
          [
            watch_duration_seconds,
            video_total_duration_seconds,
            completion_percentage,
            isCompleted,
            session_id
          ],
          function(err) {
            if (err) {
              console.error('Error updating watch progress:', err);
              return res.status(500).json({ error: 'Database error' });
            }
            res.json({ success: true, message: 'Watch progress updated' });
          }
        );
      } else {
        res.status(400).json({ error: 'Invalid event_type' });
      }
    }
  );
});

// Admin Video Analytics - Overview
app.get('/api/admin/video-analytics/overview', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const queries = {
    totalViews: 'SELECT SUM(watch_count) as count FROM video_watch_analytics',
    uniqueVideos: 'SELECT COUNT(DISTINCT video_url) as count FROM video_watch_analytics',
    totalWatchTime: 'SELECT SUM(watch_duration_seconds) as total FROM video_watch_analytics',
    avgCompletionRate: 'SELECT AVG(completion_percentage) as average FROM video_watch_analytics',
    studentsEngaged: 'SELECT COUNT(DISTINCT student_id) as count FROM video_watch_analytics',
    completedVideos: 'SELECT COUNT(*) as count FROM video_watch_analytics WHERE is_completed = 1'
  };

  const analytics = {};
  let completed = 0;
  const total = Object.keys(queries).length;

  Object.entries(queries).forEach(([key, query]) => {
    db.get(query, (err, result) => {
      if (!err && result) {
        if (key === 'avgCompletionRate') {
          analytics[key] = result.average ? Math.round(result.average * 100) / 100 : 0;
        } else if (key === 'totalWatchTime') {
          analytics[key] = result.total || 0;
        } else {
          analytics[key] = result.count || 0;
        }
      } else {
        analytics[key] = 0;
      }
      
      completed++;
      if (completed === total) {
        res.json(analytics);
      }
    });
  });
});

// Admin Video Analytics - Per-Question Metrics
app.get('/api/admin/video-analytics/questions', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const query = `
    SELECT 
      q.id as question_id,
      q.question_text,
      q.youtube_link,
      s.name as subject_name,
      SUM(vwa.watch_count) as total_views,
      COUNT(DISTINCT vwa.student_id) as unique_viewers,
      AVG(vwa.watch_duration_seconds) as avg_watch_duration,
      AVG(vwa.completion_percentage) as avg_completion_rate,
      SUM(vwa.watch_duration_seconds) as total_watch_time,
      COUNT(CASE WHEN vwa.is_completed = 1 THEN 1 END) as completed_views
    FROM video_watch_analytics vwa
    JOIN questions q ON vwa.question_id = q.id
    LEFT JOIN subjects s ON q.subject_id = s.id
    GROUP BY q.id, q.question_text, q.youtube_link, s.name
    ORDER BY total_views DESC
  `;

  db.all(query, (err, results) => {
    if (err) {
      console.error('Error fetching question analytics:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    const processed = results.map(r => ({
      ...r,
      avg_watch_duration: Math.round(r.avg_watch_duration * 100) / 100,
      avg_completion_rate: Math.round(r.avg_completion_rate * 100) / 100
    }));
    
    res.json(processed);
  });
});

// Admin Video Analytics - Per-Student Engagement
app.get('/api/admin/video-analytics/students', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const query = `
    SELECT 
      s.id as student_id,
      s.username as student_name,
      COUNT(DISTINCT vwa.video_url) as videos_watched,
      SUM(vwa.watch_duration_seconds) as total_watch_time,
      AVG(vwa.completion_percentage) as avg_completion_rate,
      MAX(vwa.last_watched_at) as last_watched,
      COUNT(CASE WHEN vwa.is_completed = 1 THEN 1 END) as completed_videos
    FROM video_watch_analytics vwa
    JOIN students s ON vwa.student_id = s.id
    GROUP BY s.id, s.username
    ORDER BY total_watch_time DESC
  `;

  db.all(query, (err, results) => {
    if (err) {
      console.error('Error fetching student engagement:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    const processed = results.map(r => ({
      ...r,
      total_watch_time: Math.round(r.total_watch_time * 100) / 100,
      avg_completion_rate: Math.round(r.avg_completion_rate * 100) / 100
    }));
    
    res.json(processed);
  });
});

// Admin Video Analytics - Detailed Question Analytics
app.get('/api/admin/video-analytics/question/:questionId', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { questionId } = req.params;

  const summaryQuery = `
    SELECT 
      q.id as question_id,
      q.question_text,
      q.youtube_link,
      q.correct_answer,
      s.name as subject_name,
      SUM(vwa.watch_count) as total_views,
      COUNT(DISTINCT vwa.student_id) as unique_viewers,
      AVG(vwa.watch_duration_seconds) as avg_watch_duration,
      AVG(vwa.completion_percentage) as avg_completion_rate
    FROM video_watch_analytics vwa
    JOIN questions q ON vwa.question_id = q.id
    LEFT JOIN subjects s ON q.subject_id = s.id
    WHERE q.id = ?
    GROUP BY q.id
  `;

  const studentsQuery = `
    SELECT 
      s.id as student_id,
      s.username as student_name,
      vwa.watch_count,
      vwa.watch_duration_seconds,
      vwa.completion_percentage,
      vwa.is_completed,
      vwa.last_watched_at
    FROM video_watch_analytics vwa
    JOIN students s ON vwa.student_id = s.id
    WHERE vwa.question_id = ?
    ORDER BY vwa.watch_duration_seconds DESC
  `;

  db.get(summaryQuery, [questionId], (err, summary) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!summary) {
      return res.status(404).json({ error: 'No analytics found for this question' });
    }

    db.all(studentsQuery, [questionId], (err, students) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({
        summary: {
          ...summary,
          avg_watch_duration: Math.round(summary.avg_watch_duration * 100) / 100,
          avg_completion_rate: Math.round(summary.avg_completion_rate * 100) / 100
        },
        students: students.map(s => ({
          ...s,
          watch_duration_seconds: Math.round(s.watch_duration_seconds * 100) / 100,
          completion_percentage: Math.round(s.completion_percentage * 100) / 100
        }))
      });
    });
  });
});

// Admin Video Analytics - Detailed Student Analytics
app.get('/api/admin/video-analytics/student/:studentId', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { studentId } = req.params;

  const summaryQuery = `
    SELECT 
      s.id as student_id,
      s.username as student_name,
      COUNT(DISTINCT vwa.video_url) as videos_watched,
      SUM(vwa.watch_duration_seconds) as total_watch_time,
      AVG(vwa.completion_percentage) as avg_completion_rate,
      COUNT(CASE WHEN vwa.is_completed = 1 THEN 1 END) as completed_videos
    FROM video_watch_analytics vwa
    JOIN students s ON vwa.student_id = s.id
    WHERE s.id = ?
    GROUP BY s.id
  `;

  const videosQuery = `
    SELECT 
      q.id as question_id,
      q.question_text,
      q.youtube_link,
      subj.name as subject_name,
      vwa.watch_count,
      vwa.watch_duration_seconds,
      vwa.completion_percentage,
      vwa.is_completed,
      vwa.last_watched_at
    FROM video_watch_analytics vwa
    JOIN questions q ON vwa.question_id = q.id
    LEFT JOIN subjects subj ON q.subject_id = subj.id
    WHERE vwa.student_id = ?
    ORDER BY vwa.last_watched_at DESC
  `;

  db.get(summaryQuery, [studentId], (err, summary) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!summary) {
      return res.status(404).json({ error: 'No analytics found for this student' });
    }

    db.all(videosQuery, [studentId], (err, videos) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({
        summary: {
          ...summary,
          total_watch_time: Math.round(summary.total_watch_time * 100) / 100,
          avg_completion_rate: Math.round(summary.avg_completion_rate * 100) / 100
        },
        videos: videos.map(v => ({
          ...v,
          watch_duration_seconds: Math.round(v.watch_duration_seconds * 100) / 100,
          completion_percentage: Math.round(v.completion_percentage * 100) / 100
        }))
      });
    });
  });
});

// Admin Video Analytics - Export CSV
app.get('/api/admin/video-analytics/export', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const query = `
    SELECT 
      vwa.id,
      s.username as student_name,
      q.question_text,
      subj.name as subject_name,
      vwa.video_url,
      vwa.watch_count,
      vwa.watch_duration_seconds,
      vwa.video_total_duration_seconds,
      vwa.completion_percentage,
      vwa.is_completed,
      vwa.started_at,
      vwa.last_watched_at
    FROM video_watch_analytics vwa
    JOIN students s ON vwa.student_id = s.id
    JOIN questions q ON vwa.question_id = q.id
    LEFT JOIN subjects subj ON q.subject_id = subj.id
    ORDER BY vwa.last_watched_at DESC
  `;

  db.all(query, (err, results) => {
    if (err) {
      console.error('Error exporting analytics:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    // Create CSV content
    const headers = [
      'ID', 'Student', 'Question', 'Subject', 'Video URL', 
      'Watch Count', 'Watch Duration (s)', 'Total Duration (s)', 
      'Completion %', 'Completed', 'First Watched', 'Last Watched'
    ];
    
    const csvRows = [
      headers.join(','),
      ...results.map(row => [
        row.id,
        `"${row.student_name}"`,
        `"${row.question_text.substring(0, 50)}..."`,
        `"${row.subject_name || 'N/A'}"`,
        `"${row.video_url}"`,
        row.watch_count,
        Math.round(row.watch_duration_seconds * 100) / 100,
        Math.round(row.video_total_duration_seconds * 100) / 100,
        Math.round(row.completion_percentage * 100) / 100,
        row.is_completed ? 'Yes' : 'No',
        row.started_at,
        row.last_watched_at
      ].join(','))
    ];

    const csv = csvRows.join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=video-analytics-export.csv');
    res.send(csv);
  });
});

// Admin Video Analytics - Time Series Data
app.get('/api/admin/video-analytics/time-series', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { period = 'day', limit = 30 } = req.query;
  const validPeriods = ['day', 'week', 'month', 'year'];
  
  if (!validPeriods.includes(period)) {
    return res.status(400).json({ error: 'Invalid period. Must be day, week, month, or year' });
  }

  let query, dateFormat, dateRange;
  
  switch(period) {
    case 'day':
      dateFormat = '%Y-%m-%d';
      dateRange = `DATE('now', '-${limit} days')`;
      break;
    case 'week':
      dateFormat = '%Y-W%W';
      dateRange = `DATE('now', '-${limit * 7} days')`;
      break;
    case 'month':
      dateFormat = '%Y-%m';
      dateRange = `DATE('now', '-${limit} months')`;
      break;
    case 'year':
      dateFormat = '%Y';
      dateRange = `DATE('now', '-${limit} years')`;
      break;
  }

  query = `
    SELECT 
      strftime('${dateFormat}', created_at) as period,
      SUM(watch_duration_seconds) as total_seconds,
      ROUND(SUM(watch_duration_seconds) / 3600.0, 2) as total_hours,
      COUNT(DISTINCT session_id) as total_sessions,
      COUNT(DISTINCT student_id) as unique_students,
      ROUND(AVG(completion_percentage), 2) as avg_completion
    FROM video_watch_analytics
    WHERE created_at >= ${dateRange}
    GROUP BY strftime('${dateFormat}', created_at)
    ORDER BY period DESC
    LIMIT ${parseInt(limit)}
  `;

  db.all(query, (err, results) => {
    if (err) {
      console.error('Error fetching time-series data:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    // Calculate summary statistics
    const totalHours = results.reduce((sum, r) => sum + parseFloat(r.total_hours || 0), 0);
    const avgHoursPerPeriod = results.length > 0 ? totalHours / results.length : 0;
    
    // Calculate growth percentage (comparing most recent to previous period)
    let growthPercentage = 0;
    if (results.length >= 2) {
      const recent = parseFloat(results[0].total_hours || 0);
      const previous = parseFloat(results[1].total_hours || 0);
      if (previous > 0) {
        growthPercentage = ((recent - previous) / previous * 100).toFixed(2);
      }
    }

    res.json({
      success: true,
      period,
      data: results.reverse(), // Reverse to show oldest to newest
      summary: {
        totalHours: totalHours.toFixed(2),
        avgHoursPerPeriod: avgHoursPerPeriod.toFixed(2),
        growthPercentage: parseFloat(growthPercentage),
        periodCount: results.length
      }
    });
  });
});

// Admin Video Analytics - Watch Hours Summary
app.get('/api/admin/video-analytics/watch-hours-summary', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const queries = {
    today: `
      SELECT 
        ROUND(SUM(watch_duration_seconds) / 3600.0, 2) as hours,
        COUNT(DISTINCT session_id) as sessions,
        COUNT(DISTINCT student_id) as students
      FROM video_watch_analytics
      WHERE DATE(created_at) = DATE('now')
    `,
    thisWeek: `
      SELECT 
        ROUND(SUM(watch_duration_seconds) / 3600.0, 2) as hours,
        COUNT(DISTINCT session_id) as sessions,
        COUNT(DISTINCT student_id) as students
      FROM video_watch_analytics
      WHERE created_at >= DATE('now', '-7 days')
    `,
    thisMonth: `
      SELECT 
        ROUND(SUM(watch_duration_seconds) / 3600.0, 2) as hours,
        COUNT(DISTINCT session_id) as sessions,
        COUNT(DISTINCT student_id) as students
      FROM video_watch_analytics
      WHERE created_at >= DATE('now', 'start of month')
    `,
    thisYear: `
      SELECT 
        ROUND(SUM(watch_duration_seconds) / 3600.0, 2) as hours,
        COUNT(DISTINCT session_id) as sessions,
        COUNT(DISTINCT student_id) as students
      FROM video_watch_analytics
      WHERE created_at >= DATE('now', 'start of year')
    `,
    allTime: `
      SELECT 
        ROUND(SUM(watch_duration_seconds) / 3600.0, 2) as hours,
        COUNT(DISTINCT session_id) as sessions,
        COUNT(DISTINCT student_id) as students
      FROM video_watch_analytics
    `
  };

  const summary = {};
  let completed = 0;
  const total = Object.keys(queries).length;

  Object.entries(queries).forEach(([key, query]) => {
    db.get(query, (err, result) => {
      if (!err && result) {
        summary[key] = {
          hours: result.hours || 0,
          sessions: result.sessions || 0,
          students: result.students || 0
        };
      } else {
        summary[key] = { hours: 0, sessions: 0, students: 0 };
      }
      
      completed++;
      if (completed === total) {
        res.json({
          success: true,
          ...summary
        });
      }
    });
  });
});

// Admin Video Analytics - Data Retention Summary
app.get('/api/admin/video-analytics/data-retention/summary', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const queries = {
    oldestRecord: `SELECT MIN(created_at) as date FROM video_watch_analytics`,
    newestRecord: `SELECT MAX(created_at) as date FROM video_watch_analytics`,
    totalRecords: `SELECT COUNT(*) as count FROM video_watch_analytics`,
    last7Days: `SELECT COUNT(*) as count FROM video_watch_analytics WHERE created_at >= DATE('now', '-7 days')`,
    last30Days: `SELECT COUNT(*) as count FROM video_watch_analytics WHERE created_at >= DATE('now', '-30 days') AND created_at < DATE('now', '-7 days')`,
    last90Days: `SELECT COUNT(*) as count FROM video_watch_analytics WHERE created_at >= DATE('now', '-90 days') AND created_at < DATE('now', '-30 days')`,
    last180Days: `SELECT COUNT(*) as count FROM video_watch_analytics WHERE created_at >= DATE('now', '-180 days') AND created_at < DATE('now', '-90 days')`,
    older180Days: `SELECT COUNT(*) as count FROM video_watch_analytics WHERE created_at < DATE('now', '-180 days')`
  };

  const summary = {};
  let completed = 0;
  const total = Object.keys(queries).length;

  Object.entries(queries).forEach(([key, query]) => {
    db.get(query, (err, result) => {
      if (!err && result) {
        if (key === 'oldestRecord' || key === 'newestRecord') {
          summary[key] = result.date || null;
        } else {
          summary[key] = result.count || 0;
        }
      } else {
        summary[key] = key.includes('Record') ? null : 0;
      }
      
      completed++;
      if (completed === total) {
        res.json({
          success: true,
          oldestRecord: summary.oldestRecord,
          newestRecord: summary.newestRecord,
          totalRecords: summary.totalRecords,
          recordsByAge: [
            { ageInDays: '0-7', count: summary.last7Days },
            { ageInDays: '8-30', count: summary.last30Days },
            { ageInDays: '31-90', count: summary.last90Days },
            { ageInDays: '91-180', count: summary.last180Days },
            { ageInDays: '180+', count: summary.older180Days }
          ]
        });
      }
    });
  });
});

// Admin Video Analytics - Data Retention Preview
app.get('/api/admin/video-analytics/data-retention/preview', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { olderThanDays } = req.query;
  
  if (!olderThanDays || isNaN(olderThanDays)) {
    return res.status(400).json({ error: 'olderThanDays parameter is required and must be a number' });
  }

  const days = parseInt(olderThanDays);
  
  if (days < 1) {
    return res.status(400).json({ error: 'olderThanDays must be greater than 0' });
  }

  const previewQueries = {
    wouldDelete: `
      SELECT COUNT(*) as count 
      FROM video_watch_analytics 
      WHERE created_at < DATE('now', '-${days} days')
    `,
    wouldRetain: `
      SELECT COUNT(*) as count 
      FROM video_watch_analytics 
      WHERE created_at >= DATE('now', '-${days} days')
    `,
    dateRange: `
      SELECT 
        MIN(created_at) as from_date,
        MAX(created_at) as to_date
      FROM video_watch_analytics 
      WHERE created_at < DATE('now', '-${days} days')
    `
  };

  const preview = {};
  let completed = 0;
  const total = Object.keys(previewQueries).length;

  Object.entries(previewQueries).forEach(([key, query]) => {
    db.get(query, (err, result) => {
      if (!err && result) {
        if (key === 'dateRange') {
          preview.affectedDateRange = {
            from: result.from_date || null,
            to: result.to_date || null
          };
        } else {
          preview[key] = result.count || 0;
        }
      } else {
        if (key === 'dateRange') {
          preview.affectedDateRange = { from: null, to: null };
        } else {
          preview[key] = 0;
        }
      }
      
      completed++;
      if (completed === total) {
        res.json({
          success: true,
          ...preview
        });
      }
    });
  });
});

// Admin Video Analytics - Data Retention Delete
app.post('/api/admin/video-analytics/data-retention/delete', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { deleteOlderThanDays, confirm } = req.body;
  
  if (!deleteOlderThanDays || isNaN(deleteOlderThanDays)) {
    return res.status(400).json({ error: 'deleteOlderThanDays is required and must be a number' });
  }
  
  if (!confirm) {
    return res.status(400).json({ error: 'confirm must be true to proceed with deletion' });
  }

  const days = parseInt(deleteOlderThanDays);
  
  if (days < 1) {
    return res.status(400).json({ error: 'deleteOlderThanDays must be greater than 0' });
  }

  // First, get information about what will be deleted
  const infoQuery = `
    SELECT 
      COUNT(*) as delete_count,
      MIN(created_at) as from_date,
      MAX(created_at) as to_date
    FROM video_watch_analytics 
    WHERE created_at < DATE('now', '-${days} days')
  `;

  db.get(infoQuery, (err, info) => {
    if (err) {
      console.error('Error getting deletion info:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (info.delete_count === 0) {
      return res.json({
        success: true,
        deletedRecords: 0,
        message: 'No records found to delete'
      });
    }

    // Proceed with deletion
    const deleteQuery = `
      DELETE FROM video_watch_analytics 
      WHERE created_at < DATE('now', '-${days} days')
    `;

    db.run(deleteQuery, function(err) {
      if (err) {
        console.error('Error deleting old records:', err);
        return res.status(500).json({ error: 'Database error during deletion' });
      }

      // Get remaining count
      db.get('SELECT COUNT(*) as count FROM video_watch_analytics', (err, remaining) => {
        if (err) {
          console.error('Error getting remaining count:', err);
        }

        res.json({
          success: true,
          deletedRecords: this.changes,
          remainingRecords: remaining ? remaining.count : 0,
          deletedDateRange: {
            from: info.from_date,
            to: info.to_date
          }
        });
      });
    });
  });
});

// Admin Video Analytics - Custom Date Range Preview
app.get('/api/admin/video-analytics/data-retention/custom-preview', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { startDate, endDate } = req.query;
  
  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'startDate and endDate are required' });
  }

  const previewQueries = {
    wouldDelete: `
      SELECT COUNT(*) as count 
      FROM video_watch_analytics 
      WHERE created_at >= ? AND created_at <= ?
    `,
    wouldRetain: `
      SELECT COUNT(*) as count 
      FROM video_watch_analytics 
      WHERE created_at < ? OR created_at > ?
    `,
    dateRange: `
      SELECT 
        MIN(created_at) as from_date,
        MAX(created_at) as to_date
      FROM video_watch_analytics 
      WHERE created_at >= ? AND created_at <= ?
    `
  };

  const preview = {};
  let completed = 0;
  const total = Object.keys(previewQueries).length;

  Object.entries(previewQueries).forEach(([key, query]) => {
    const params = key === 'wouldRetain' ? [startDate, endDate] : [startDate, endDate];
    
    db.get(query, params, (err, result) => {
      if (!err && result) {
        if (key === 'dateRange') {
          preview.affectedDateRange = {
            from: result.from_date || null,
            to: result.to_date || null
          };
        } else {
          preview[key] = result.count || 0;
        }
      } else {
        if (key === 'dateRange') {
          preview.affectedDateRange = { from: null, to: null };
        } else {
          preview[key] = 0;
        }
      }
      
      completed++;
      if (completed === total) {
        res.json({
          success: true,
          ...preview
        });
      }
    });
  });
});

// Admin Video Analytics - Custom Date Range Delete
app.post('/api/admin/video-analytics/data-retention/custom-delete', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { startDate, endDate, confirm } = req.body;
  
  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'startDate and endDate are required' });
  }
  
  if (!confirm) {
    return res.status(400).json({ error: 'confirm must be true to proceed with deletion' });
  }

  // First, get information about what will be deleted
  const infoQuery = `
    SELECT 
      COUNT(*) as delete_count,
      MIN(created_at) as from_date,
      MAX(created_at) as to_date
    FROM video_watch_analytics 
    WHERE created_at >= ? AND created_at <= ?
  `;

  db.get(infoQuery, [startDate, endDate], (err, info) => {
    if (err) {
      console.error('Error getting deletion info:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (info.delete_count === 0) {
      return res.json({
        success: true,
        deletedRecords: 0,
        message: 'No records found to delete in the specified date range'
      });
    }

    // Proceed with deletion
    const deleteQuery = `
      DELETE FROM video_watch_analytics 
      WHERE created_at >= ? AND created_at <= ?
    `;

    db.run(deleteQuery, [startDate, endDate], function(err) {
      if (err) {
        console.error('Error deleting records:', err);
        return res.status(500).json({ error: 'Database error during deletion' });
      }

      // Get remaining count
      db.get('SELECT COUNT(*) as count FROM video_watch_analytics', (err, remaining) => {
        if (err) {
          console.error('Error getting remaining count:', err);
        }

        res.json({
          success: true,
          deletedRecords: this.changes,
          remainingRecords: remaining ? remaining.count : 0,
          deletedDateRange: {
            from: info.from_date,
            to: info.to_date
          }
        });
      });
    });
  });
});
// ✅ Serve React build files when deployed on Render
app.use(express.static(path.join(__dirname, "public")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
