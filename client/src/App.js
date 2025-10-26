import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import AdminLogin from './components/AdminLogin';
import StudentLogin from './components/StudentLogin';
import StudentRegister from './components/StudentRegister';
import AdminDashboard from './components/AdminDashboard';
import StudentDashboard from './components/StudentDashboard';
import ExamPage from './components/ExamPage';
import ExamResults from './components/ExamResults';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';
// Import modal fixes last to ensure they override all other styles
import './MODAL_FIX.css';
import './MODAL_OVERRIDE.css';
import './ModalPortal.css';
import './DROPDOWN_FIX.css';
import './INPUT_TEXTBOX_FIX.css';
import './QUESTION_SELECTION_FIX.css';
import './ADMIN_DASHBOARD_DARK_MODE_FIX.css';
import './UNIVERSAL_DARK_MODE_FIX.css';
import './EXAM_PAGE_MOBILE_FIX.css';
import './EXAM_RESULTS_MOBILE_FIX.css';
import './SUBMIT_MODAL_FIX.css';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="App">
            <Routes>
            <Route path="/" element={<Navigate to="/student/login" />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/student/login" element={<StudentLogin />} />
            <Route path="/student/register" element={<StudentRegister />} />
            <Route 
              path="/admin/dashboard" 
              element={
                <ProtectedRoute role="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/student/dashboard" 
              element={
                <ProtectedRoute role="student">
                  <StudentDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/exam/:examId" 
              element={
                <ProtectedRoute role="student">
                  <ExamPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/exam-results" 
              element={
                <ProtectedRoute role="student">
                  <ExamResults />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/exam-results/:resultId" 
              element={
                <ProtectedRoute role="student">
                  <ExamResults />
                </ProtectedRoute>
              } 
            />
            </Routes>
            <ToastContainer
              position="top-right"
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
            />
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;