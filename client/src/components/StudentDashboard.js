import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { LogOut, BookOpen, Clock, Award, Play, Target, Zap, TrendingUp, Star, User, Lock, Mail, Save, Eye, EyeOff } from 'lucide-react';
import TopNavbar from './TopNavbar';
import Sidebar from './Sidebar';

const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [examHistory, setExamHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Profile state
  const [profileData, setProfileData] = useState({
    name: '',
    surname: '',
    email: '',
    username: ''
  });
  const [profileLoading, setProfileLoading] = useState(false);
  
  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  useEffect(() => {
    fetchExams();
    fetchExamHistory();
    if (activeTab === 'profile') {
      fetchProfile();
    }
  }, [activeTab]);

  const fetchExams = async () => {
    try {
      const response = await axios.get('/api/student/exams');
      setExams(response.data);
    } catch (error) {
      console.error('Failed to fetch exams:', error);
      setExams([]);
    }
  };

  const fetchExamHistory = async () => {
    try {
      const response = await axios.get('/api/exam-history');
      setExamHistory(response.data);
    } catch (error) {
      toast.error('Failed to fetch exam history');
    }
  };

  const fetchProfile = async () => {
    try {
      const response = await axios.get('/api/student/profile');
      setProfileData({
        name: response.data.name || '',
        surname: response.data.surname || '',
        email: response.data.email || '',
        username: response.data.username || ''
      });
    } catch (error) {
      toast.error('Failed to fetch profile data');
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!profileData.name || !profileData.surname) {
      toast.error('Name and Surname are required');
      return;
    }
    
    if (profileData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    setProfileLoading(true);
    try {
      await axios.put('/api/student/profile', {
        name: profileData.name,
        surname: profileData.surname,
        email: profileData.email
      });
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error('All password fields are required');
      return;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }
    
    setPasswordLoading(true);
    try {
      await axios.post('/api/student/password/change', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword
      });
      toast.success('Password changed successfully!');
      // Clear password fields
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const startExam = async (examId) => {
    setLoading(true);
    try {
      // Navigate to exam page with exam ID
      navigate(`/exam/${examId}`);
    } catch (error) {
      toast.error('Failed to start exam');
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#28a745';
    if (score >= 60) return '#ffc107';
    return '#dc3545';
  };

  const getScoreGrade = (score) => {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    if (score >= 50) return 'D';
    return 'F';
  };

  return (
    <div className="dashboard-with-sidebar">
      <Sidebar 
        isOpen={sidebarOpen} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        onClose={() => setSidebarOpen(false)}
        userRole="student"
      />
      <TopNavbar 
        user={user} 
        onLogout={logout}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />
      
      <div className="dashboard-main">
        <div className="tab-content">
            {activeTab === 'dashboard' && (
              <div>
                <h2 style={{ marginBottom: '2rem', color: 'var(--text-primary)' }}>Student Dashboard</h2>
                
                {/* Summary Cards */}
                <div className="grid grid-3" style={{ marginBottom: '2rem' }}>
                  <div className="analytics-card">
                    <div className="analytics-icon exams">
                      <BookOpen size={32} />
                    </div>
                    <div className="analytics-content">
                      <div className="analytics-number">{exams.length}</div>
                      <div className="analytics-label">Available Exams</div>
                    </div>
                  </div>
                  
                  <div className="analytics-card">
                    <div className="analytics-icon active">
                      <Award size={32} />
                    </div>
                    <div className="analytics-content">
                      <div className="analytics-number">{examHistory.length}</div>
                      <div className="analytics-label">Completed Exams</div>
                    </div>
                  </div>
                  
                  <div className="analytics-card">
                    <div className="analytics-icon score">
                      <Star size={32} />
                    </div>
                    <div className="analytics-content">
                      <div className="analytics-number">
                        {examHistory.length > 0 ? (examHistory.reduce((sum, exam) => sum + exam.score, 0) / examHistory.length).toFixed(1) : 0}%
                      </div>
                      <div className="analytics-label">Average Score</div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="card" style={{ marginBottom: '2rem' }}>
                  <div className="card-header">
                    <h4>Quick Actions</h4>
                  </div>
                  <div className="card-body">
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                      <button 
                        className="btn btn-primary"
                        onClick={() => setActiveTab('exams')}
                      >
                        <BookOpen size={16} /> View Available Exams
                      </button>
                      <button 
                        className="btn btn-secondary"
                        onClick={() => setActiveTab('results')}
                      >
                        <Award size={16} /> View Exam History
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Recent Exams */}
                {exams.length > 0 && (
                  <div className="card">
                    <div className="card-header">
                      <h4>Available Exams</h4>
                    </div>
                    <div className="card-body">
                      <div className="grid grid-2">
                        {exams.slice(0, 4).map(exam => {
                          const examDate = new Date(exam.start_time);
                          const endDate = new Date(exam.end_time);
                          const now = new Date();
                          const isActive = now >= examDate && now <= endDate && exam.status === 'active';
                          const isPending = now < examDate;
                          const isExpired = now > endDate;
                          const hasAttempt = exam.attempt_id !== null;
                          
                          return (
                            <div key={exam.id} className="exam-card scale-in">
                              <div className="card-body">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                  <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{exam.title}</h4>
                                  <span className={`status-badge ${
                                    isActive ? 'active' : 
                                    isPending ? 'pending' : 
                                    isExpired ? 'expired' : 'draft'
                                  }`}>
                                    {isActive ? 'ACTIVE' : isPending ? 'UPCOMING' : isExpired ? 'EXPIRED' : 'DRAFT'}
                                  </span>
                                </div>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>{exam.description}</p>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                                  <div><strong>Duration:</strong> {exam.duration_minutes} min</div>
                                  <div><strong>Questions:</strong> {exam.total_questions}</div>
                                </div>
                                <button 
                                  className="btn btn-primary"
                                  onClick={() => startExam(exam.id)}
                                  disabled={loading || !isActive || hasAttempt}
                                  style={{ width: '100%', fontSize: '0.9rem' }}
                                >
                                  <Play size={16} /> {hasAttempt ? 'Completed' : isActive ? 'Start Exam' : 'Not Available'}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'exams' && (
              <div>
                <h3 style={{ 
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  <Zap size={24} style={{ color: 'var(--warning-color)' }} />
                  <span className="text-gradient">Available Exams</span>
                </h3>
                
                {exams.length > 0 ? (
                  <div className="grid grid-2">
                    {exams.map(exam => {
                      const examDate = new Date(exam.start_time);
                      const endDate = new Date(exam.end_time);
                      const now = new Date();
                      const isActive = now >= examDate && now <= endDate && exam.status === 'active';
                      const isPending = now < examDate;
                      const isExpired = now > endDate;
                      const hasAttempt = exam.attempt_id !== null;
                      
                      return (
                        <div key={exam.id} className="exam-card scale-in">
                          <div className="card-body">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                              <h4 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700' }}>{exam.title}</h4>
                              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <span className={`status-badge ${
                                  isActive ? 'active' : 
                                  isPending ? 'pending' : 
                                  isExpired ? 'expired' : 'draft'
                                }`}>
                                  {isActive ? (
                                    <><Zap size={12} style={{ marginRight: '0.25rem' }} />ACTIVE</>
                                  ) : isPending ? (
                                    <><Clock size={12} style={{ marginRight: '0.25rem' }} />UPCOMING</>
                                  ) : isExpired ? (
                                    'EXPIRED'
                                  ) : 'DRAFT'}
                                </span>
                                {hasAttempt && (
                                  <span className="status-badge completed">
                                    <Award size={12} style={{ marginRight: '0.25rem' }} />
                                    COMPLETED
                                  </span>
                                )}
                              </div>
                            </div>
                            <p style={{ color: '#666', marginBottom: '1rem', fontSize: '0.9rem' }}>{exam.description}</p>
                            
                            <div style={{ 
                              background: '#f8f9fa', 
                              padding: '0.75rem', 
                              borderRadius: '5px', 
                              marginBottom: '1rem',
                              fontSize: '0.85rem'
                            }}>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                <div><strong>Duration:</strong> {exam.duration_minutes} min</div>
                                <div><strong>Questions:</strong> {exam.total_questions}</div>
                                <div><strong>Category:</strong> {exam.category}</div>
                                <div><strong>Start:</strong> {examDate.toLocaleString()}</div>
                                {hasAttempt && (
                                  <div style={{ gridColumn: '1 / -1', marginTop: '0.5rem', padding: '0.5rem', background: '#d4edda', borderRadius: '3px', color: '#155724' }}>
                                    <strong>Score:</strong> {exam.attempt_score.toFixed(1)}% &bull; <strong>Taken:</strong> {new Date(exam.attempt_date).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {hasAttempt ? (
                              <button 
                                className="btn btn-secondary"
                                onClick={() => navigate(`/exam-results/${exam.attempt_id}`)}
                                style={{ width: '100%' }}
                              >
                                <Award size={16} /> View Results
                              </button>
                            ) : (
                              <button 
                                className="btn btn-primary"
                                onClick={() => startExam(exam.id)}
                                disabled={loading || !isActive}
                                style={{ width: '100%' }}
                                title={!isActive ? (isPending ? 'Exam not yet started' : isExpired ? 'Exam has ended' : 'Exam not active') : ''}
                              >
                                <Play size={16} /> 
                                {isActive ? 'Start Exam' : 
                                 isPending ? 'Not Started' : 
                                 isExpired ? 'Expired' : 'Unavailable'}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
                    <BookOpen size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                    <h4>No Exams Available</h4>
                    <p>Please check back later for scheduled exams.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'results' && (
              <div>
                <h3 style={{ 
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  <TrendingUp size={24} style={{ color: 'var(--info-color)' }} />
                  <span className="text-gradient">Your Exam History</span>
                </h3>
                
                {examHistory.length > 0 ? (
                  <div>
                    {/* Enhanced Summary Stats */}
                    <div className="grid grid-3" style={{ marginBottom: '2rem' }}>
                      <div className="analytics-card">
                        <div className="analytics-icon exams">
                          <BookOpen size={24} />
                        </div>
                        <div className="analytics-content">
                          <div className="analytics-number">{examHistory.length}</div>
                          <div className="analytics-label">Total Exams</div>
                        </div>
                      </div>
                      <div className="analytics-card">
                        <div className="analytics-icon score">
                          <Star size={24} />
                        </div>
                        <div className="analytics-content">
                          <div className="analytics-number">{(examHistory.reduce((sum, exam) => sum + exam.score, 0) / examHistory.length).toFixed(1)}%</div>
                          <div className="analytics-label">Average Score</div>
                        </div>
                      </div>
                      <div className="analytics-card">
                        <div className="analytics-icon active">
                          <Award size={24} />
                        </div>
                        <div className="analytics-content">
                          <div className="analytics-number">{Math.max(...examHistory.map(exam => exam.score)).toFixed(1)}%</div>
                          <div className="analytics-label">Best Score</div>
                        </div>
                      </div>
                    </div>

                    {/* Exam History Table */}
                    <div className="card">
                      <div className="card-body">
                        <table className="table">
                          <thead>
                            <tr>
                              <th>Subject</th>
                              <th>Score</th>
                              <th>Grade</th>
                              <th>Questions</th>
                              <th>Correct</th>
                              <th>Date</th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {examHistory.map(exam => (
                              <tr key={exam.id}>
                                <td>{exam.subject_name}</td>
                                <td>
                                  <span style={{ 
                                    fontWeight: 'bold', 
                                    color: getScoreColor(exam.score)
                                  }}>
                                    {exam.score.toFixed(1)}%
                                  </span>
                                </td>
                                <td>
                                  <span style={{ 
                                    padding: '0.25rem 0.5rem',
                                    borderRadius: '3px',
                                    fontSize: '0.8rem',
                                    fontWeight: 'bold',
                                    color: 'white',
                                    backgroundColor: getScoreColor(exam.score)
                                  }}>
                                    {getScoreGrade(exam.score)}
                                  </span>
                                </td>
                                <td>{exam.total_questions}</td>
                                <td>{exam.correct_answers}</td>
                                <td>{new Date(exam.created_at).toLocaleDateString()}</td>
                                <td>
                                  <button 
                                    className="btn btn-secondary"
                                    onClick={() => navigate(`/exam-results/${exam.id}`)}
                                    style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                                  >
                                    View Details
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
                    <Clock size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                    <h4>No Exam History</h4>
                    <p>You haven't taken any exams yet. Start with an available subject!</p>
                    <button 
                      className="btn btn-primary"
                      onClick={() => setActiveTab('subjects')}
                      style={{ marginTop: '1rem' }}
                    >
                      View Available Exams
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'profile' && (
              <div>
                <h3 style={{ 
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  <User size={24} style={{ color: 'var(--primary-color)' }} />
                  <span className="text-gradient">My Profile</span>
                </h3>
                
                <div className="grid grid-2" style={{ gap: '2rem' }}>
                  {/* Personal Information Card */}
                  <div className="card">
                    <div className="card-header">
                      <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <User size={20} />
                        Personal Information
                      </h4>
                    </div>
                    <div className="card-body">
                      <form onSubmit={handleProfileUpdate}>
                        <div style={{ marginBottom: '1.5rem' }}>
                          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-primary)' }}>
                            Username (Read-only)
                          </label>
                          <div style={{
                            padding: '0.75rem',
                            background: 'var(--card-bg)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '5px',
                            color: 'var(--text-secondary)'
                          }}>
                            {profileData.username}
                          </div>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                          <label htmlFor="name" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-primary)' }}>
                            Name <span style={{ color: '#dc3545' }}>*</span>
                          </label>
                          <input
                            type="text"
                            id="name"
                            className="form-input"
                            value={profileData.name}
                            onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                            placeholder="Enter your name"
                            required
                            style={{ width: '100%', padding: '0.75rem', fontSize: '1rem' }}
                          />
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                          <label htmlFor="surname" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-primary)' }}>
                            Surname <span style={{ color: '#dc3545' }}>*</span>
                          </label>
                          <input
                            type="text"
                            id="surname"
                            className="form-input"
                            value={profileData.surname}
                            onChange={(e) => setProfileData({ ...profileData, surname: e.target.value })}
                            placeholder="Enter your surname"
                            required
                            style={{ width: '100%', padding: '0.75rem', fontSize: '1rem' }}
                          />
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                          <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-primary)' }}>
                            Email
                          </label>
                          <div style={{ position: 'relative' }}>
                            <Mail size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                            <input
                              type="email"
                              id="email"
                              className="form-input"
                              value={profileData.email}
                              onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                              placeholder="Enter your email"
                              style={{ width: '100%', padding: '0.75rem', paddingLeft: '2.5rem', fontSize: '1rem' }}
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          className="btn btn-primary"
                          disabled={profileLoading}
                          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                        >
                          {profileLoading ? (
                            <>
                              <div style={{ width: '16px', height: '16px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save size={18} />
                              Save Changes
                            </>
                          )}
                        </button>
                      </form>
                    </div>
                  </div>

                  {/* Change Password Card */}
                  <div className="card">
                    <div className="card-header">
                      <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Lock size={20} />
                        Change Password
                      </h4>
                    </div>
                    <div className="card-body">
                      <form onSubmit={handlePasswordChange}>
                        <div style={{ marginBottom: '1.5rem' }}>
                          <label htmlFor="currentPassword" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-primary)' }}>
                            Current Password <span style={{ color: '#dc3545' }}>*</span>
                          </label>
                          <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                            <input
                              type={showPasswords.current ? "text" : "password"}
                              id="currentPassword"
                              className="form-input"
                              value={passwordData.currentPassword}
                              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                              placeholder="Enter current password"
                              required
                              style={{ width: '100%', padding: '0.75rem', paddingLeft: '2.5rem', paddingRight: '2.5rem', fontSize: '1rem' }}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                              style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                            >
                              {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                          <label htmlFor="newPassword" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-primary)' }}>
                            New Password <span style={{ color: '#dc3545' }}>*</span>
                          </label>
                          <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                            <input
                              type={showPasswords.new ? "text" : "password"}
                              id="newPassword"
                              className="form-input"
                              value={passwordData.newPassword}
                              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                              placeholder="Enter new password (min 6 characters)"
                              required
                              style={{ width: '100%', padding: '0.75rem', paddingLeft: '2.5rem', paddingRight: '2.5rem', fontSize: '1rem' }}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                              style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                            >
                              {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                          <label htmlFor="confirmPassword" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-primary)' }}>
                            Confirm New Password <span style={{ color: '#dc3545' }}>*</span>
                          </label>
                          <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                            <input
                              type={showPasswords.confirm ? "text" : "password"}
                              id="confirmPassword"
                              className="form-input"
                              value={passwordData.confirmPassword}
                              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                              placeholder="Confirm new password"
                              required
                              style={{ width: '100%', padding: '0.75rem', paddingLeft: '2.5rem', paddingRight: '2.5rem', fontSize: '1rem' }}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                              style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                            >
                              {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                        </div>

                        <button
                          type="submit"
                          className="btn btn-primary"
                          disabled={passwordLoading}
                          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                        >
                          {passwordLoading ? (
                            <>
                              <div style={{ width: '16px', height: '16px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                              Changing Password...
                            </>
                          ) : (
                            <>
                              <Lock size={18} />
                              Change Password
                            </>
                          )}
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
    </div>
  );
};

export default StudentDashboard;
