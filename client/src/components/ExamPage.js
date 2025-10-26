import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import axios from 'axios';
import { Clock, CheckCircle, AlertCircle, ArrowLeft, Trophy, Target, BarChart3, Zap, ChevronDown, ChevronUp } from 'lucide-react';

const ExamPage = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [exam, setExam] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [alreadyTaken, setAlreadyTaken] = useState(false);
  const [resultScore, setResultScore] = useState(null);
  const [isNavigatorCollapsed, setIsNavigatorCollapsed] = useState(true); // Navigator collapsed by default on mobile

  useEffect(() => {
    fetchExamData();
  }, [examId]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const fetchExamData = async () => {
    try {
      const response = await axios.get(`/api/exam/${examId}/questions`);
      
      const { exam: examData, questions: questionsData, subjects: subjectsData } = response.data;
      
      if (questionsData.length === 0) {
        toast.error('No questions available for this exam');
        navigate('/student/dashboard');
        return;
      }

      setQuestions(questionsData);
      setSubjects(subjectsData || []);
      setExam(examData);
      
      // Set timer based on exam duration
      setTimeLeft(examData.duration_minutes * 60);
      
      setLoading(false);
    } catch (error) {
      // Handle case where student has already taken the exam
      if (error.response?.data?.hasAttempt) {
        setAlreadyTaken(true);
        setResultScore(error.response.data.score);
        setLoading(false);
        return;
      }
      
      toast.error(error.response?.data?.error || 'Failed to load exam');
      navigate('/student/dashboard');
    }
  };

  const handleAnswerChange = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSubmitExam = async () => {
    setSubmitting(true);
    
    try {
      const response = await axios.post('/api/submit-exam', {
        exam_id: parseInt(examId),
        answers
      });

      // Navigate to results page with the exam results
      navigate('/exam-results', { 
        state: { 
          results: response.data,
          examTitle: exam?.title
        } 
      });
    } catch (error) {
      toast.error('Failed to submit exam');
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getAnsweredCount = () => {
    return Object.keys(answers).length;
  };

  const goToQuestion = (index) => {
    setCurrentQuestion(index);
  };

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  if (loading) {
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
              <Target size={16} color="white" />
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
              Preparing Your Exam
            </h3>
            <p style={{ 
              margin: 0,
              color: 'var(--text-secondary)',
              fontSize: '1rem'
            }}>
              Loading questions and setting up your exam environment...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (alreadyTaken) {
    return (
      <div className="dashboard">
        <nav className="navbar">
          <div className="navbar-brand">
            <button 
              className="btn" 
              onClick={() => navigate('/student/dashboard')}
              style={{ 
                marginRight: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                fontSize: '0.9rem',
                fontWeight: '500',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                color: '#1f2937',
                background: '#f3f4f6',
                border: '1px solid #d1d5db',
                WebkitTextFillColor: '#1f2937',
                WebkitBackgroundClip: 'initial',
                backgroundClip: 'initial'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#e5e7eb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#f3f4f6';
              }}
            >
              <ArrowLeft size={16} color="#1f2937" /> 
              <span style={{ 
                color: '#1f2937',
                WebkitTextFillColor: '#1f2937',
                WebkitBackgroundClip: 'initial',
                backgroundClip: 'initial'
              }}>Back</span>
            </button>
            Exam Already Taken
          </div>
          <div className="navbar-user">
            <span>{user?.username}</span>
          </div>
        </nav>

        <div className="container">
          <div className="card">
            <div className="card-body" style={{ textAlign: 'center', padding: '3rem' }}>
              <CheckCircle size={64} style={{ color: '#28a745', marginBottom: '1rem' }} />
              <h2>Exam Already Completed</h2>
              <p style={{ fontSize: '1.2rem', margin: '1rem 0' }}>You have already taken this exam.</p>
              <div style={{ background: '#d4edda', padding: '1rem', borderRadius: '5px', marginBottom: '2rem' }}>
                <h3 style={{ color: '#155724', margin: '0 0 0.5rem 0' }}>Your Score: {resultScore.toFixed(1)}%</h3>
              </div>
              <button 
                className="btn btn-primary"
                onClick={() => navigate('/student/dashboard')}
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];
  const isAnswered = answers[currentQ?.id] !== undefined;

  return (
    <div className="dashboard">
        <nav className="navbar">
        <div className="navbar-brand">
          <button 
            className="btn" 
            onClick={() => navigate('/student/dashboard')}
            style={{ 
              marginRight: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              fontSize: '0.9rem',
              fontWeight: '500',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              color: '#1f2937',
              background: '#f3f4f6',
              border: '1px solid #d1d5db',
              WebkitTextFillColor: '#1f2937',
              WebkitBackgroundClip: 'initial',
              backgroundClip: 'initial'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#e5e7eb';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#f3f4f6';
            }}
          >
            <ArrowLeft size={16} color="#1f2937" /> 
            <span style={{ 
              color: '#1f2937',
              WebkitTextFillColor: '#1f2937',
              WebkitBackgroundClip: 'initial',
              backgroundClip: 'initial'
            }}>Back to Dashboard</span>
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Target size={24} style={{ color: 'var(--primary-color)' }} />
            <span>{exam?.title || 'Exam'}</span>
          </div>
        </div>
        <div className="navbar-user">
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem',
              padding: '0.75rem 1.25rem',
              background: timeLeft < 300 ? 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)' : 'linear-gradient(135deg, rgba(248, 250, 252, 0.8) 0%, rgba(241, 245, 249, 0.8) 100%)',
              borderRadius: '25px',
              border: `2px solid ${timeLeft < 300 ? 'var(--danger-color)' : 'rgba(226, 232, 240, 0.8)'}`,
              color: timeLeft < 300 ? 'var(--danger-color)' : 'var(--text-primary)',
              animation: timeLeft < 300 ? 'pulse 1s infinite' : 'none'
            }}>
              <Clock size={18} />
              <span style={{ fontWeight: '800', fontSize: '1.1rem' }}>{formatTime(timeLeft)}</span>
              {timeLeft < 300 && (
                <span style={{ fontSize: '0.75rem', fontWeight: '600' }}>HURRY!</span>
              )}
            </div>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              color: 'var(--text-secondary)'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 'var(--success-color)',
                boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.3)'
              }}></div>
              <span style={{ fontWeight: '600' }}>{user?.username}</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="container">
        {/* Enhanced Progress Bar */}
        <div className="progress-container slide-in-up">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Target size={20} style={{ color: 'var(--primary-color)' }} />
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Progress: {getAnsweredCount()} / {questions.length} answered</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Trophy size={16} style={{ color: 'var(--warning-color)' }} />
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Question {currentQuestion + 1} of {questions.length}</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BarChart3 size={16} style={{ color: 'var(--success-color)' }} />
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--success-color)' }}>
                {Math.round((getAnsweredCount() / questions.length) * 100)}% Complete
              </span>
            </div>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{
                width: `${((currentQuestion + 1) / questions.length) * 100}%`,
              }}
            />
          </div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            marginTop: '0.75rem',
            fontSize: '0.85rem',
            color: 'var(--text-secondary)'
          }}>
            <span>Question Progress</span>
            <span>{Math.round(((currentQuestion + 1) / questions.length) * 100)}%</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '2rem' }}>
          {/* Enhanced Question Area */}
          <div className="question-card scale-in">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="question-number bounce">{currentQuestion + 1}</div>
              <div style={{ flex: 1 }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.75rem',
                  marginBottom: '0.5rem'
                }}>
                  <span style={{ 
                    fontSize: '0.85rem', 
                    fontWeight: 600, 
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Question {currentQuestion + 1} of {questions.length}
                  </span>
                  {isAnswered && (
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.25rem',
                      padding: '0.25rem 0.75rem',
                      background: 'var(--success-gradient)',
                      color: 'white',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      fontWeight: 700
                    }}>
                      <CheckCircle size={12} />
                      ANSWERED
                    </div>
                  )}
                </div>
                <div style={{ 
                  height: '4px', 
                  background: 'rgba(226, 232, 240, 0.5)', 
                  borderRadius: '2px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${((currentQuestion + 1) / questions.length) * 100}%`,
                    height: '100%',
                    background: 'var(--primary-gradient)',
                    borderRadius: '2px',
                    transition: 'width 0.5s ease'
                  }} />
                </div>
              </div>
            </div>
            
            {/* Current Question Subject Indicator */}
            {currentQ?.subject_name && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1rem',
                backgroundColor: '#f8f9fa',
                border: '1px solid #e9ecef',
                borderRadius: '8px',
                marginBottom: '1rem',
                fontSize: '0.9rem'
              }}>
                <div style={{
                  backgroundColor: '#667eea',
                  color: 'white',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: 'bold'
                }}>
                  📚 Subject
                </div>
                <span style={{ fontWeight: '600', color: '#333' }}>{currentQ.subject_name}</span>
                <span style={{ color: '#666', fontSize: '0.8rem' }}>Question {currentQuestion + 1} of {questions.length}</span>
              </div>
            )}
            
            <div className="question-text">{currentQ?.question_text}</div>
            
            <div className="options">
              {['A', 'B', 'C', 'D'].map((option, index) => {
                const optionText = currentQ[`option_${option.toLowerCase()}`];
                const isSelected = answers[currentQ.id] === option;
                
                return (
                  <div 
                    key={option}
                    className={`option ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleAnswerChange(currentQ.id, option)}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <input
                      type="radio"
                      name={`question_${currentQ.id}`}
                      value={option}
                      checked={isSelected}
                      onChange={() => handleAnswerChange(currentQ.id, option)}
                    />
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: isSelected ? 'white' : 'var(--primary-gradient)',
                        color: isSelected ? 'var(--primary-color)' : 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        fontSize: '0.9rem',
                        transition: 'all 0.3s ease'
                      }}>
                        {option}
                      </div>
                      <span style={{ flex: 1 }}>{optionText}</span>
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Enhanced Navigation Buttons */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginTop: '2.5rem',
              paddingTop: '1.5rem',
              borderTop: '1px solid rgba(226, 232, 240, 0.6)'
            }}>
              <button 
                className="btn btn-secondary"
                onClick={prevQuestion}
                disabled={currentQuestion === 0}
                style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  opacity: currentQuestion === 0 ? 0.5 : 1
                }}
              >
                <ArrowLeft size={16} />
                Previous
              </button>
              
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.75rem',
                color: 'var(--text-secondary)',
                fontSize: '0.9rem'
              }}>
                <Zap size={16} style={{ color: 'var(--warning-color)' }} />
                <span>Keep going! You're doing great!</span>
              </div>
              
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                {currentQuestion === questions.length - 1 ? (
                  <button 
                    className="btn btn-success"
                    onClick={() => setShowConfirmModal(true)}
                    disabled={submitting}
                    style={{ 
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    <Trophy size={16} />
                    {submitting ? 'Submitting...' : 'Submit Exam'}
                  </button>
                ) : (
                  <button 
                    className="btn btn-primary"
                    onClick={nextQuestion}
                    style={{ 
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    Next
                    <ArrowLeft size={16} style={{ transform: 'rotate(180deg)' }} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Enhanced Question Navigator - Organized by Subjects */}
          <div className={`card slide-in-right question-navigator ${isNavigatorCollapsed ? 'navigator-collapsed' : 'navigator-expanded'}`}>
            <div className="card-header" style={{ cursor: 'pointer' }} onClick={() => setIsNavigatorCollapsed(!isNavigatorCollapsed)}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <BarChart3 size={20} style={{ color: 'var(--primary-color)' }} />
                  <h4 className="card-title" style={{ margin: 0, fontSize: '1.1rem' }}>Question Navigator</h4>
                </div>
                <div className="mobile-toggle-icon" style={{ display: 'none' }}>
                  {isNavigatorCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                </div>
              </div>
            </div>
            <div className={`card-body navigator-content ${isNavigatorCollapsed ? 'collapsed' : 'expanded'}`}>
              {subjects.length > 0 ? (
                // Show questions organized by subjects
                <div style={{ marginBottom: '1.5rem' }}>
                  {subjects.map((subject, subjectIndex) => {
                    const subjectQuestions = subject.questions;
                    const firstQuestionIndex = questions.findIndex(q => q.subject_id === subject.id);
                    
                    return (
                      <div key={subject.id} style={{ marginBottom: '1.5rem' }}>
                        {/* Subject Header */}
                        <div style={{
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: 'white',
                          padding: '0.75rem 1rem',
                          borderRadius: '8px 8px 0 0',
                          fontWeight: 'bold',
                          fontSize: '0.9rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}>
                          <span>📚 {subject.name}</span>
                          <span>({subjectQuestions.length} questions)</span>
                        </div>
                        
                        {/* Subject Questions Grid */}
                        <div style={{ 
                          display: 'grid', 
                          gridTemplateColumns: 'repeat(5, 1fr)', 
                          gap: '0.5rem',
                          padding: '1rem',
                          backgroundColor: '#f8f9fa',
                          borderRadius: '0 0 8px 8px',
                          border: '1px solid #e9ecef',
                          borderTop: 'none'
                        }}>
                          {subjectQuestions.map((question, questionIndex) => {
                            const globalIndex = questions.findIndex(q => q.id === question.id);
                            const isAnswered = answers[question.id] !== undefined;
                            const isCurrent = globalIndex === currentQuestion;
                            
                            return (
                              <button
                                key={question.id}
                                className={`btn ${
                                  isCurrent ? 'btn-primary' : 
                                  isAnswered ? 'btn-success' : 'btn-outline'
                                }`}
                                onClick={() => goToQuestion(globalIndex)}
                                style={{ 
                                  padding: '0.5rem',
                                  fontSize: '0.8rem',
                                  minWidth: '36px',
                                  height: '36px',
                                  position: 'relative',
                                  fontWeight: '600',
                                  transition: 'all 0.3s ease',
                                  transform: isCurrent ? 'scale(1.1)' : 'scale(1)',
                                  boxShadow: isCurrent ? 'var(--shadow-lg)' : isAnswered ? 'var(--shadow)' : 'var(--shadow-sm)'
                                }}
                              >
                                {questionIndex + 1}
                                {isAnswered && !isCurrent && (
                                  <div style={{
                                    position: 'absolute',
                                    top: '-3px',
                                    right: '-3px',
                                    width: '14px',
                                    height: '14px',
                                    borderRadius: '50%',
                                    background: 'var(--success-color)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}>
                                    <CheckCircle size={8} color="white" />
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                // Fallback: Show all questions in a single grid (backwards compatibility)
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(5, 1fr)', 
                  gap: '0.75rem',
                  marginBottom: '1.5rem'
                }}>
                  {questions.map((q, index) => {
                    const isAnswered = answers[q.id] !== undefined;
                    const isCurrent = index === currentQuestion;
                    
                    return (
                      <button
                        key={q.id}
                        className={`btn ${
                          isCurrent ? 'btn-primary' : 
                          isAnswered ? 'btn-success' : 'btn-outline'
                        }`}
                        onClick={() => goToQuestion(index)}
                        style={{ 
                          padding: '0.75rem 0.5rem',
                          fontSize: '0.85rem',
                          minWidth: '42px',
                          height: '42px',
                          position: 'relative',
                          fontWeight: '700',
                          transition: 'all 0.3s ease',
                          transform: isCurrent ? 'scale(1.1)' : 'scale(1)',
                          boxShadow: isCurrent ? 'var(--shadow-lg)' : isAnswered ? 'var(--shadow)' : 'var(--shadow-sm)'
                        }}
                      >
                        {index + 1}
                        {isAnswered && !isCurrent && (
                          <div style={{
                            position: 'absolute',
                            top: '-4px',
                            right: '-4px',
                            width: '16px',
                            height: '16px',
                            borderRadius: '50%',
                            background: 'var(--success-color)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <CheckCircle size={10} color="white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
              
              {/* Enhanced Stats */}
              <div style={{ 
                background: 'linear-gradient(135deg, rgba(248, 250, 252, 0.8) 0%, rgba(241, 245, 249, 0.8) 100%)',
                padding: '1.25rem',
                borderRadius: 'var(--border-radius)',
                border: '1px solid rgba(226, 232, 240, 0.5)',
                marginBottom: '1rem'
              }}>
                <h5 style={{ 
                  margin: '0 0 1rem 0', 
                  color: 'var(--text-primary)',
                  fontSize: '1rem',
                  fontWeight: '700'
                }}>Progress Overview</h5>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ 
                      width: '12px', 
                      height: '12px', 
                      background: 'var(--success-gradient)', 
                      borderRadius: '50%',
                      boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.2)'
                    }}></div>
                    <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>Answered ({getAnsweredCount()})</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ 
                      width: '12px', 
                      height: '12px', 
                      background: 'rgba(226, 232, 240, 0.8)', 
                      borderRadius: '50%'
                    }}></div>
                    <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>Remaining ({questions.length - getAnsweredCount()})</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ 
                      width: '12px', 
                      height: '12px', 
                      background: 'var(--primary-gradient)', 
                      borderRadius: '50%',
                      boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.2)'
                    }}></div>
                    <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>Current Question</span>
                  </div>
                </div>
              </div>

              {/* Motivational Message */}
              {getAnsweredCount() < questions.length && (
                <div style={{
                  padding: '1rem',
                  background: 'linear-gradient(135deg, rgba(219, 234, 254, 0.8) 0%, rgba(191, 219, 254, 0.8) 100%)',
                  borderRadius: 'var(--border-radius)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem'
                }}>
                  <AlertCircle size={16} style={{ color: 'var(--info-color)', marginTop: '2px' }} />
                  <div>
                    <div style={{ fontWeight: '600', color: 'var(--info-color)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                      Keep Going!
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {questions.length - getAnsweredCount()} questions remaining
                    </div>
                  </div>
                </div>
              )}
              
              {getAnsweredCount() === questions.length && (
                <div style={{
                  padding: '1rem',
                  background: 'linear-gradient(135deg, rgba(209, 250, 229, 0.8) 0%, rgba(167, 243, 208, 0.8) 100%)',
                  borderRadius: 'var(--border-radius)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  animation: 'pulse 2s infinite'
                }}>
                  <Trophy size={16} style={{ color: 'var(--success-color)', marginTop: '2px' }} />
                  <div>
                    <div style={{ fontWeight: '700', color: 'var(--success-color)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                      All Questions Answered!
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Ready to submit your exam?
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">Submit Exam</h3>
              <button className="close-btn" onClick={() => setShowConfirmModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>Are you sure you want to submit your exam?</p>
              <div style={{ 
                background: 'linear-gradient(135deg, rgba(248, 250, 252, 0.8) 0%, rgba(241, 245, 249, 0.8) 100%)',
                padding: '1.5rem',
                borderRadius: 'var(--border-radius)',
                border: '1px solid rgba(226, 232, 240, 0.5)',
                marginBottom: '1.5rem'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>{questions.length}</div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Total Questions</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--success-color)' }}>{getAnsweredCount()}</div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Answered</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--warning-color)' }}>{questions.length - getAnsweredCount()}</div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Unanswered</div>
                  </div>
                </div>
              </div>
              {questions.length - getAnsweredCount() > 0 && (
                <div className="alert alert-error" style={{ 
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '1rem 1.25rem',
                  background: 'linear-gradient(135deg, rgba(254, 226, 226, 0.8) 0%, rgba(252, 165, 165, 0.8) 100%)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: 'var(--border-radius)',
                  color: 'var(--danger-color)'
                }}>
                  <AlertCircle size={20} />
                  <div>
                    <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Warning: Incomplete Exam</div>
                    <div style={{ fontSize: '0.9rem' }}>You have {questions.length - getAnsweredCount()} unanswered questions. These will be marked as incorrect.</div>
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => setShowConfirmModal(false)}
                  disabled={submitting}
                  style={{ minWidth: '120px' }}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-success" 
                  onClick={handleSubmitExam}
                  disabled={submitting}
                  style={{ minWidth: '160px' }}
                >
                  {submitting ? 'Submitting...' : 'Submit Exam'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamPage;
