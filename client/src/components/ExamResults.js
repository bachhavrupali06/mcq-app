import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import axios from 'axios';
import { ArrowLeft, CheckCircle, XCircle, Youtube, Award, RotateCcw, Target, TrendingUp, Star, BookOpen, Zap, Trophy } from 'lucide-react';
import TopNavbar from './TopNavbar';
import Sidebar from './Sidebar';
import { loadYouTubeAPI, createTrackedPlayer, cleanupAllPlayers, cleanupPlayer, getYouTubeVideoId } from '../utils/videoTracking';

// Video Player Component with tracking
const VideoPlayer = ({ containerId, videoUrl, questionId, examResultId }) => {
  const playerRef = useRef(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initializePlayer = async () => {
      try {
        const playerInfo = await createTrackedPlayer(
          containerId,
          videoUrl,
          questionId,
          examResultId,
          () => setIsReady(true)
        );
        playerRef.current = playerInfo;
      } catch (error) {
        console.error('Failed to initialize video player:', error);
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(initializePlayer, 100);

    return () => {
      clearTimeout(timer);
      if (playerRef.current) {
        cleanupPlayer(playerRef.current.sessionId);
      }
    };
  }, [containerId, videoUrl, questionId, examResultId]);

  return (
    <div style={{ 
      marginTop: '1.5rem',
      borderRadius: 'var(--border-radius-sm)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-md)',
      border: '2px solid var(--border-color)'
    }}>
      <div style={{
        background: 'var(--danger-gradient)',
        color: 'white',
        padding: '0.75rem 1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        fontWeight: '600',
        fontSize: '0.95rem'
      }}>
        <Youtube size={18} />
        <span>Explanation Video</span>
      </div>
      <div style={{ 
        position: 'relative',
        paddingBottom: '56.25%',
        height: 0,
        overflow: 'hidden',
        background: '#000'
      }}>
        <div 
          id={containerId}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%'
          }}
        />
      </div>
    </div>
  );
};

const ExamResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { resultId } = useParams();
  const { user, logout } = useAuth();
  const [results, setResults] = useState(null);
  const [examTitle, setExamTitle] = useState('');
  const [showAllQuestions, setShowAllQuestions] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab] = useState('results');

useEffect(() => {
    const fetchResults = async () => {
      try {
        if (location.state?.results) {
          // Results passed via navigation state (after exam submission)
          setResults(location.state.results);
          setExamTitle(location.state.examTitle || location.state.subjectName || 'Unknown Exam');
          setLoading(false);
        } else if (resultId) {
          // Fetch results by ID (View Results button)
          const response = await axios.get(`/api/exam-results/${resultId}`);
          setResults(response.data);
          setExamTitle(response.data.exam_title || 'Unknown Exam');
          setLoading(false);
        } else {
          // No results data and no ID, redirect to dashboard
          toast.error('No exam results found');
          navigate('/student/dashboard');
        }
      } catch (error) {
        console.error('Failed to fetch exam results:', error);
        toast.error('Failed to load exam results');
        navigate('/student/dashboard');
      }
    };

    fetchResults();
  }, [location.state, resultId, navigate]);

  // Load YouTube API and cleanup on unmount
  useEffect(() => {
    loadYouTubeAPI().catch(err => {
      console.error('Failed to load YouTube API:', err);
    });

    return () => {
      cleanupAllPlayers();
    };
  }, []);

  if (loading || !results) {
    return (
      <div className="loading">
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          gap: '2rem',
          padding: '3rem'
        }}>
          <div style={{ position: 'relative' }}>
            <div className="spinner"></div>
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '30px',
              height: '30px',
              background: 'var(--primary-gradient)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Trophy size={16} color="white" />
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ 
              margin: '0 0 0.5rem 0',
              background: 'var(--primary-gradient)',
              '-webkit-background-clip': 'text',
              '-webkit-text-fill-color': 'transparent',
              'background-clip': 'text',
              fontSize: '1.5rem',
              fontWeight: '700'
            }}>
              Loading Your Results
            </h3>
            <p style={{ 
              margin: 0,
              color: 'var(--text-secondary)',
              fontSize: '1rem'
            }}>
              Calculating your score and preparing detailed feedback...
            </p>
          </div>
        </div>
      </div>
    );
  }

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

  const getPerformanceMessage = (score) => {
    if (score >= 90) return 'Excellent work! Outstanding performance!';
    if (score >= 80) return 'Great job! You did very well!';
    if (score >= 70) return 'Good work! Keep it up!';
    if (score >= 60) return 'Not bad! There\'s room for improvement.';
    if (score >= 50) return 'You passed, but consider reviewing the material.';
    return 'Don\'t worry! Review the material and try again.';
  };

  const incorrectAnswers = results.results.filter(result => !result.is_correct);
  const correctAnswers = results.results.filter(result => result.is_correct);
  const questionsToShow = showAllQuestions ? results.results : incorrectAnswers;
  const accuracy = ((correctAnswers.length / results.total_questions) * 100).toFixed(1);

  return (
    <>
      <style>{`
        /* Force white color for Study Recommendations header */
        .study-recommendations-card .card-header {
          color: white !important;
          background: transparent !important;
        }
        
        .study-recommendations-card .card-header * {
          color: white !important;
        }
        
        .study-recommendations-card .card-header h3,
        .study-recommendations-card .card-header .card-title {
          color: white !important;
          -webkit-text-fill-color: white !important;
          opacity: 1 !important;
        }
        
        .study-recommendations-card .card-header svg,
        .study-recommendations-card .card-header svg path,
        .study-recommendations-card .card-header svg line,
        .study-recommendations-card .card-header svg polyline {
          color: white !important;
          stroke: white !important;
          fill: white !important;
        }
        
        .study-recommendations-card .card-body,
        .study-recommendations-card .card-body * {
          color: white !important;
        }
      `}</style>
      <div className="dashboard-with-sidebar">
        <Sidebar 
          isOpen={sidebarOpen} 
          activeTab={activeTab} 
          setActiveTab={() => {}}
          onClose={() => setSidebarOpen(false)}
          userRole="student"
        />
        <TopNavbar 
          user={user} 
          onLogout={logout}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
      
      <div className="dashboard-main">
        <div className="results-header-section slide-in-up">
          <button 
            className="btn btn-secondary" 
            onClick={() => navigate('/student/dashboard')}
            style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1rem'
            }}
          >
            <ArrowLeft size={18} /> Back to Dashboard
          </button>
          <h2 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
            Exam Results
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
            {examTitle}
          </p>
        </div>
        {/* Hero Score Card */}
        <div className="results-hero-card scale-in" style={{
          background: getScoreColor(results.score) === '#28a745' 
            ? 'var(--success-gradient)' 
            : getScoreColor(results.score) === '#ffc107' 
            ? 'var(--warning-gradient)' 
            : 'var(--danger-gradient)',
          padding: '3rem 2rem',
          borderRadius: 'var(--border-radius-lg)',
          textAlign: 'center',
          color: 'white',
          marginBottom: '2rem',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-xl)'
        }}>
          <div style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: '200px',
            height: '200px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '50%'
          }}></div>
          <div style={{
            position: 'absolute',
            bottom: '-30px',
            left: '-30px',
            width: '150px',
            height: '150px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '50%'
          }}></div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <Trophy size={48} style={{ marginRight: '0.5rem' }} />
            </div>
            <div style={{ fontSize: '4rem', fontWeight: '800', marginBottom: '0.5rem', lineHeight: 1 }}>
              {results.score.toFixed(1)}%
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '600', marginBottom: '0.5rem', opacity: 0.95 }}>
              Grade: {getScoreGrade(results.score)}
            </div>
            <div style={{ fontSize: '1.2rem', marginBottom: '1.5rem', opacity: 0.9 }}>
              {getPerformanceMessage(results.score)}
            </div>
            <div style={{ 
              display: 'inline-block',
              padding: '0.75rem 2rem',
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: 'var(--border-radius)',
              backdropFilter: 'blur(10px)',
              fontSize: '1.1rem',
              fontWeight: '600'
            }}>
              {results.correct_answers} / {results.total_questions} Questions Correct
            </div>
          </div>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-4" style={{ marginBottom: '2rem' }}>
          <div className="analytics-card slide-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="analytics-icon success">
              <CheckCircle size={28} />
            </div>
            <div className="analytics-content">
              <div className="analytics-number">{correctAnswers.length}</div>
              <div className="analytics-label">Correct</div>
            </div>
          </div>
          
          <div className="analytics-card slide-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="analytics-icon danger">
              <XCircle size={28} />
            </div>
            <div className="analytics-content">
              <div className="analytics-number">{incorrectAnswers.length}</div>
              <div className="analytics-label">Incorrect</div>
            </div>
          </div>
          
          <div className="analytics-card slide-in-up" style={{ animationDelay: '0.3s' }}>
            <div className="analytics-icon exams">
              <Target size={28} />
            </div>
            <div className="analytics-content">
              <div className="analytics-number">{accuracy}%</div>
              <div className="analytics-label">Accuracy</div>
            </div>
          </div>
          
          <div className="analytics-card slide-in-up" style={{ animationDelay: '0.4s' }}>
            <div className="analytics-icon active">
              <BookOpen size={28} />
            </div>
            <div className="analytics-content">
              <div className="analytics-number">{results.total_questions}</div>
              <div className="analytics-label">Total Questions</div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="card slide-in-up" style={{ marginBottom: '2rem' }}>
          <div className="card-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div className="tab-buttons" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button 
                  className={`btn ${!showAllQuestions ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setShowAllQuestions(false)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <XCircle size={16} /> Incorrect Only ({incorrectAnswers.length})
                </button>
                <button 
                  className={`btn ${showAllQuestions ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setShowAllQuestions(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <BookOpen size={16} /> All Questions ({results.total_questions})
                </button>
              </div>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                color: 'var(--text-secondary)', 
                fontSize: '0.9rem',
                padding: '0.5rem 1rem',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--border-radius-sm)'
              }}>
                <Award size={16} />
                <span>Completed: {new Date(results.created_at || Date.now()).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric', 
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Questions Review */}
        <div className="card slide-in-up">
          <div className="card-header" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem',
            borderBottom: '2px solid var(--border-color)'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: showAllQuestions ? 'var(--primary-gradient)' : 'var(--danger-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}>
              {showAllQuestions ? <BookOpen size={20} /> : <XCircle size={20} />}
            </div>
            <div>
              <h3 className="card-title" style={{ margin: 0 }}>
                {showAllQuestions ? 'All Questions Review' : 'Questions to Review'}
                {!showAllQuestions && incorrectAnswers.length === 0 && ' - Perfect Score!'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {showAllQuestions 
                  ? `Reviewing all ${results.total_questions} questions from your exam` 
                  : `Focus on improving these ${incorrectAnswers.length} areas`}
              </p>
            </div>
          </div>
          <div className="card-body">
            {questionsToShow.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '4rem 2rem',
                background: 'var(--success-gradient)',
                borderRadius: 'var(--border-radius)',
                color: 'white'
              }}>
                <div style={{ 
                  display: 'inline-flex',
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.2)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.5rem'
                }}>
                  <Trophy size={48} />
                </div>
                <h3 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Perfect Score!</h3>
                <p style={{ fontSize: '1.1rem', margin: 0, opacity: 0.9 }}>
                  Outstanding! You answered all questions correctly. Keep up the excellent work!
                </p>
              </div>
            ) : (
              <div>
                {questionsToShow.map((result, index) => (
                  <div key={result.question_id} className="question-card scale-in" style={{ 
                    animationDelay: `${index * 0.05}s`,
                    marginBottom: '1.5rem',
                    padding: '1.5rem',
                    background: 'var(--card-bg)',
                    border: `2px solid ${result.is_correct ? 'var(--success-color)' : 'var(--danger-color)'}`,
                    borderRadius: 'var(--border-radius)',
                    transition: 'var(--transition)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                      <div style={{
                        minWidth: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background: result.is_correct ? 'var(--success-gradient)' : 'var(--danger-gradient)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: '700',
                        fontSize: '1.1rem',
                        flexShrink: 0
                      }}>
                        {results.results.findIndex(r => r.question_id === result.question_id) + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ 
                          fontSize: '1.1rem',
                          fontWeight: '600',
                          color: 'var(--text-primary)',
                          marginBottom: '1.5rem',
                          lineHeight: 1.6
                        }}>
                          {result.question_text}
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {['A', 'B', 'C', 'D'].map(option => {
                            const optionText = result.options[option];
                            const isCorrect = result.correct_answer === option;
                            const isStudentAnswer = result.student_answer === option;
                            
                            return (
                              <div 
                                key={option} 
                                style={{
                                  padding: '1rem 1.25rem',
                                  borderRadius: 'var(--border-radius-sm)',
                                  border: `2px solid ${
                                    isCorrect ? 'var(--success-color)' : 
                                    isStudentAnswer && !isCorrect ? 'var(--danger-color)' : 
                                    'var(--border-color)'
                                  }`,
                                  background: isCorrect 
                                    ? 'rgba(16, 185, 129, 0.1)' 
                                    : isStudentAnswer && !isCorrect 
                                    ? 'rgba(239, 68, 68, 0.1)' 
                                    : 'var(--bg)',
                                  transition: 'var(--transition)'
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <span style={{ 
                                    flex: 1,
                                    color: 'var(--text-primary)',
                                    fontWeight: isCorrect || isStudentAnswer ? '600' : '400'
                                  }}>
                                    <strong style={{ 
                                      display: 'inline-flex',
                                      width: '28px',
                                      height: '28px',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      borderRadius: '50%',
                                      background: isCorrect 
                                        ? 'var(--success-color)' 
                                        : isStudentAnswer && !isCorrect 
                                        ? 'var(--danger-color)'
                                        : 'var(--bg-secondary)',
                                      color: isCorrect || (isStudentAnswer && !isCorrect) ? 'white' : 'var(--text-primary)',
                                      marginRight: '0.75rem',
                                      fontSize: '0.9rem',
                                      fontWeight: '700'
                                    }}>
                                      {option}
                                    </strong>
                                    {optionText}
                                  </span>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: '1rem' }}>
                                    {isCorrect && (
                                      <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.4rem',
                                        padding: '0.25rem 0.75rem',
                                        background: 'var(--success-color)',
                                        borderRadius: 'var(--border-radius-sm)',
                                        color: 'white',
                                        fontSize: '0.8rem',
                                        fontWeight: '600'
                                      }}>
                                        <CheckCircle size={14} />
                                        Correct
                                      </div>
                                    )}
                                    {isStudentAnswer && !isCorrect && (
                                      <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.4rem',
                                        padding: '0.25rem 0.75rem',
                                        background: 'var(--danger-color)',
                                        borderRadius: 'var(--border-radius-sm)',
                                        color: 'white',
                                        fontSize: '0.8rem',
                                        fontWeight: '600'
                                      }}>
                                        <XCircle size={14} />
                                        Your Answer
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        
                        {/* Embedded YouTube Video for all answers with tracking */}
                        {result.youtube_link && (() => {
                          const videoId = getYouTubeVideoId(result.youtube_link);
                          if (!videoId) return null;
                          
                          const containerId = `youtube-player-${result.question_id}`;
                          const examResultId = results.result_id || null;
                          
                          return (
                            <VideoPlayer
                              key={result.question_id}
                              containerId={containerId}
                              videoUrl={result.youtube_link}
                              questionId={result.question_id}
                              examResultId={examResultId}
                            />
                          );
                        })()}
                        
                        {!result.youtube_link && (
                          <div style={{ 
                            marginTop: '1.5rem', 
                            padding: '1rem 1.25rem', 
                            background: 'rgba(245, 158, 11, 0.1)',
                            borderRadius: 'var(--border-radius-sm)',
                            border: '1px solid rgba(245, 158, 11, 0.3)',
                            fontSize: '0.9rem',
                            color: 'var(--warning-color)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem'
                          }}>
                            <Zap size={18} />
                            <span>Review this topic in your study materials for better understanding.</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Study Recommendations */}
        {incorrectAnswers.length > 0 && (
          <div className="card slide-in-up study-recommendations-card" style={{ 
            marginTop: '2rem',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none'
          }}>
            <div className="card-header" style={{ 
              borderBottom: '2px solid rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              color: 'white'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <TrendingUp size={20} color="white" strokeWidth={2.5} />
              </div>
              <h3 
                className="card-title" 
                style={{ 
                  margin: 0, 
                  color: 'white',
                  WebkitTextFillColor: 'white',
                  backgroundClip: 'initial',
                  WebkitBackgroundClip: 'initial',
                  background: 'transparent',
                  opacity: 1,
                  fontWeight: 600
                }}
              >
                Study Recommendations
              </h3>
            </div>
            <div className="card-body" style={{ color: 'white' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ color: 'white', marginBottom: '1rem', fontSize: '1.1rem' }}>Areas for Improvement:</h4>
                <ul style={{ marginBottom: 0, paddingLeft: '1.5rem', lineHeight: 1.8, color: 'white' }}>
                  <li>Review the {incorrectAnswers.length} question{incorrectAnswers.length !== 1 ? 's' : ''} you got wrong</li>
                  <li>Watch the explanation videos provided for better understanding</li>
                  <li>Practice similar questions to reinforce your knowledge</li>
                  <li>Use this feedback to improve in future exams</li>
                  <li>Focus on understanding concepts rather than memorizing answers</li>
                </ul>
              </div>
              
              {incorrectAnswers.filter(q => q.youtube_link).length > 0 && (
                <div style={{ 
                  marginTop: '1.5rem',
                  padding: '1.25rem',
                  background: 'rgba(255, 255, 255, 0.15)',
                  borderRadius: 'var(--border-radius-sm)',
                  backdropFilter: 'blur(10px)'
                }}>
                  <h5 style={{ 
                    color: 'white', 
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <Youtube size={20} />
                    Available Video Explanations:
                  </h5>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                    {incorrectAnswers
                      .filter(q => q.youtube_link)
                      .map((result, index) => (
                        <a 
                          key={result.question_id}
                          href={result.youtube_link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            padding: '0.5rem 1rem',
                            background: '#FF0000',
                            color: 'white',
                            textDecoration: 'none',
                            borderRadius: 'var(--border-radius-sm)',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            transition: 'var(--transition)',
                            boxShadow: 'var(--shadow)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'var(--shadow)';
                          }}
                        >
                          <Youtube size={16} /> 
                          Q{results.results.findIndex(r => r.question_id === result.question_id) + 1}
                        </a>
                      ))
                    }
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
};

export default ExamResults;
