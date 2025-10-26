import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { toast } from 'react-toastify';
import axios from 'axios';
import { 
  LogOut, Plus, Settings, BookOpen, Key, Zap, Edit2, Trash2, Check, X, Youtube, CheckCircle,
  Users, Activity, BarChart3, Calendar, TrendingUp, Clock, UserCheck, Award, Eye, Download,
  Sparkles, ChevronDown, ChevronUp, FileText, Copy, FileSpreadsheet
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import TopNavbar from './TopNavbar';
import Sidebar from './Sidebar';
import Modal from './Modal';
import WatchHoursTrendChart from './charts/WatchHoursTrendChart';
import GrowthRateChart from './charts/GrowthRateChart';
import EngagementPieChart from './charts/EngagementPieChart';
import DataRetentionManager from './DataRetentionManager';


const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [apiKeys, setApiKeys] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // New state for enhanced features
  const [students, setStudents] = useState([]);
  const [exams, setExams] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [recentActivity, setRecentActivity] = useState([]);
  const [providers, setProviders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [selectedSubcategoryTree, setSelectedSubcategoryTree] = useState([]);
  const [questionCategories, setQuestionCategories] = useState([]);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');
  
  // Modal states
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showEditSubjectModal, setShowEditSubjectModal] = useState(false);
  const [showEditQuestionModal, setShowEditQuestionModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showExamModal, setShowExamModal] = useState(false);
  const [showEditExamModal, setShowEditExamModal] = useState(false);
  const [showStudentDetailsModal, setShowStudentDetailsModal] = useState(false);
  const [showQuestionSelectionModal, setShowQuestionSelectionModal] = useState(false);
  const [availableQuestions, setAvailableQuestions] = useState([]);
  const [questionSelectionFilters, setQuestionSelectionFilters] = useState({}); // {subjectId: categoryId}
  const [showSubcategoryModal, setShowSubcategoryModal] = useState(false);
  const [showEditSubcategoryModal, setShowEditSubcategoryModal] = useState(false);
  const [showQuestionCategoryModal, setShowQuestionCategoryModal] = useState(false);
  const [showEditQuestionCategoryModal, setShowEditQuestionCategoryModal] = useState(false);
  
  // Form states
  const [subjectForm, setSubjectForm] = useState({ name: '', description: '', subcategory_id: '' });
  const [subcategoryForm, setSubcategoryForm] = useState({ name: '', description: '', parent_id: '', subject_id: '' });
  const [editSubcategoryForm, setEditSubcategoryForm] = useState({ id: '', name: '', description: '', parent_id: '', subject_id: '', is_active: true });
  const [questionForm, setQuestionForm] = useState({
    subject_id: '',
    category_id: '',
    question_text: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_answer: 'A',
    youtube_link: ''
  });
  const [apiKeyForm, setApiKeyForm] = useState({
    key_name: '',
    api_key: '',
    provider: '',
    base_url: '',
    model_name: ''
  });
  const [generateForm, setGenerateForm] = useState({
    subject_id: '',
    category_id: '',
    topic: '',
    count: 5,
    difficulty: 'medium',
    language: 'English',
    instructions: '',
    api_key_id: ''
  });
  const [editSubjectForm, setEditSubjectForm] = useState({ id: '', name: '', description: '', subcategory_id: '' });
  const [editQuestionForm, setEditQuestionForm] = useState({
    id: '',
    subject_id: '',
    category_id: '',
    question_text: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_answer: 'A',
    youtube_link: ''
  });
  const [examForm, setExamForm] = useState({
    title: '',
    description: '',
    subjects: [], // Array of {subject_id, questions_count}
    selectedQuestions: [], // Array of selected question IDs
    selectedSubjectFilter: '',
    selectedCategoryFilter: '',
    category: 'general',
    start_date: '',
    start_time: '',
    end_date: '',
    end_time: '',
    duration_minutes: 60,
    total_questions: 0,
    status: 'draft'
  });
  const [editExamForm, setEditExamForm] = useState({
    id: '',
    title: '',
    description: '',
    subjects: [], // Array of {subject_id, questions_count}
    selectedQuestions: [], // Array of selected question IDs
    category: 'general',
    start_date: '',
    start_time: '',
    end_date: '',
    end_time: '',
    duration_minutes: 60,
    total_questions: 0,
    status: 'draft'
  });
  const [deleteItem, setDeleteItem] = useState({ type: '', id: '', name: '' });
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [questionCategoryForm, setQuestionCategoryForm] = useState({ name: '', description: '', subject_id: '', color: '#667eea' });
  const [editQuestionCategoryForm, setEditQuestionCategoryForm] = useState({ id: '', name: '', description: '', subject_id: '', color: '#667eea', is_active: true });

  // Video Analytics state
  const [videoAnalytics, setVideoAnalytics] = useState({
    overview: {},
    questions: [],
    students: [],
    loading: true
  });
  const [videoAnalyticsSort, setVideoAnalyticsSort] = useState({
    field: 'total_views',
    direction: 'desc'
  });
  const [selectedVideoQuestion, setSelectedVideoQuestion] = useState(null);
  const [selectedVideoStudent, setSelectedVideoStudent] = useState(null);
  
  // Advanced Video Analytics state
  const [timeSeriesData, setTimeSeriesData] = useState([]);
  const [watchHoursSummary, setWatchHoursSummary] = useState({});
  const [selectedTimePeriod, setSelectedTimePeriod] = useState('day');
  const [timeSeriesLoading, setTimeSeriesLoading] = useState(false);

  // Question Summary Generation state
  const [summaryConfig, setSummaryConfig] = useState({}); // {questionId: {language, length, apiKeyId, isGenerating, summary}}
  const [expandedSummaries, setExpandedSummaries] = useState(new Set()); // Set of question IDs with expanded summary section

  // Student Export state
  const [exportFilters, setExportFilters] = useState({
    startDate: '',
    endDate: '',
    format: 'xlsx' // xlsx or csv
  });
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchSubjects();
      fetchProviders();
      fetchSubcategories();
      // Only fetch admin-specific data
      fetchApiKeys();
      fetchAnalytics();
      fetchStudents();
      fetchExams();
      fetchCategories();
      fetchRecentActivity();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // Only depend on user

  useEffect(() => {
    if (selectedSubject) {
      // Reset category filter when subject changes
      setSelectedCategoryFilter('');
      fetchQuestions(selectedSubject.id, ''); // Pass empty filter explicitly
      fetchQuestionCategories(selectedSubject.id);
    } else {
      // Clear questions and categories when no subject is selected
      setQuestions([]);
      setQuestionCategories([]);
      setSelectedCategoryFilter('');
    }
  }, [selectedSubject]);

  // Initialize API key form when providers are loaded
  useEffect(() => {
    if (providers.length > 0 && !apiKeyForm.provider) {
      const openrouterProvider = providers.find(p => p.id === 'openrouter') || providers[0];
      setApiKeyForm({
        key_name: '',
        api_key: '',
        provider: openrouterProvider.id,
        base_url: openrouterProvider.base_url,
        model_name: 'meta-llama/llama-3.1-8b-instruct:free'
      });
    }
  }, [providers]);

  // Fetch video analytics when tab becomes active
  useEffect(() => {
    if (activeTab === 'videoAnalytics') {
      fetchVideoAnalytics();
      fetchWatchHoursSummary();
      fetchTimeSeriesData(selectedTimePeriod);
    }
  }, [activeTab, selectedTimePeriod]);

  const fetchSubjects = async () => {
    try {
      const response = await axios.get('/api/subjects');
      setSubjects(response.data);
    } catch (error) {
      toast.error('Failed to fetch subjects');
    }
  };

  const fetchQuestions = async (subjectId, categoryFilter = '') => {
    try {
      const filterParam = categoryFilter ? `?category_id=${categoryFilter}` : '';
      const response = await axios.get(`/api/questions/${subjectId}${filterParam}`);
      setQuestions(response.data);
      
      // Initialize summaryConfig from database for questions that have summaries
      const newSummaryConfig = {};
      response.data.forEach(question => {
        if (question.explanation_summary) {
          newSummaryConfig[question.id] = {
            language: 'English',
            length: 'Medium',
            apiKeyId: apiKeys.length > 0 ? apiKeys[0].id : '',
            summary: question.explanation_summary
          };
        }
      });
      
      // Merge with existing config (preserve user selections)
      setSummaryConfig(prev => ({ ...newSummaryConfig, ...prev }));
    } catch (error) {
      toast.error('Failed to fetch questions');
    }
  };

  const fetchQuestionCategories = async (subjectId) => {
    try {
      const response = await axios.get(`/api/question-categories/${subjectId}`);
      setQuestionCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch question categories:', error);
      setQuestionCategories([]);
    }
  };

  const fetchSubcategories = async (subjectId = null) => {
    try {
      const url = subjectId ? `/api/subcategories?subject_id=${subjectId}` : '/api/subcategories';
      const response = await axios.get(url);
      setSubcategories(response.data);
    } catch (error) {
      console.error('Failed to fetch subcategories:', error);
      setSubcategories([]);
    }
  };

  const fetchSubcategoryTree = async (subjectId) => {
    try {
      const response = await axios.get(`/api/subcategories/tree/${subjectId}`);
      setSelectedSubcategoryTree(response.data);
    } catch (error) {
      console.error('Failed to fetch subcategory tree:', error);
      setSelectedSubcategoryTree([]);
    }
  };

  const fetchApiKeys = async () => {
    try {
      const response = await axios.get('/api/api-keys');
      setApiKeys(response.data);
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
      setApiKeys([]); // Set empty array on error
    }
  };

  const fetchProviders = async () => {
    try {
      const response = await axios.get('/api/providers');
      setProviders(response.data);
    } catch (error) {
      console.error('Failed to fetch providers:', error);
      setProviders([]); // Set empty array on error
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get('/api/admin/analytics/students');
      setAnalytics(response.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      setAnalytics({}); // Set empty object on error
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await axios.get('/api/admin/students');
      setStudents(response.data);
    } catch (error) {
      console.error('Failed to fetch students:', error);
      setStudents([]); // Set empty array on error
    }
  };

  const handleExportStudents = () => {
    setExportLoading(true);
    
    try {
      // Filter students by date range
      let filteredStudents = [...students];
      
      if (exportFilters.startDate) {
        const startDate = new Date(exportFilters.startDate);
        startDate.setHours(0, 0, 0, 0);
        filteredStudents = filteredStudents.filter(student => {
          const createdDate = new Date(student.created_at);
          return createdDate >= startDate;
        });
      }
      
      if (exportFilters.endDate) {
        const endDate = new Date(exportFilters.endDate);
        endDate.setHours(23, 59, 59, 999);
        filteredStudents = filteredStudents.filter(student => {
          const createdDate = new Date(student.created_at);
          return createdDate <= endDate;
        });
      }
      
      if (filteredStudents.length === 0) {
        toast.warning('No students found in the selected date range');
        setExportLoading(false);
        return;
      }
      
      // Prepare data for export
      const exportData = filteredStudents.map(student => ({
        'User ID': student.id,
        'Username': student.username,
        'Name': student.name || '',
        'Surname': student.surname || '',
        'Email': student.email || '',
        'Mobile Number': student.mobile_number || '',
        'Status': student.status,
        'Exams Taken': student.exams_taken,
        'Average Score (%)': student.exams_taken > 0 ? student.average_score : '',
        'Registration Date': new Date(student.created_at).toLocaleDateString(),
        'Last Login': student.last_login ? new Date(student.last_login).toLocaleString() : 'Never'
      }));
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const filename = `students_export_${timestamp}`;
      
      if (exportFilters.format === 'xlsx') {
        // Create Excel file
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        
        // Set column widths
        const columnWidths = [
          { wch: 10 },  // User ID
          { wch: 15 },  // Username
          { wch: 15 },  // Name
          { wch: 15 },  // Surname
          { wch: 25 },  // Email
          { wch: 15 },  // Mobile Number
          { wch: 10 },  // Status
          { wch: 12 },  // Exams Taken
          { wch: 18 },  // Average Score
          { wch: 15 },  // Registration Date
          { wch: 20 }   // Last Login
        ];
        worksheet['!cols'] = columnWidths;
        
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');
        
        // Generate Excel file and trigger download
        XLSX.writeFile(workbook, `${filename}.xlsx`);
        
        toast.success(`Exported ${filteredStudents.length} student(s) to Excel`);
      } else {
        // Create CSV file
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const csv = XLSX.utils.sheet_to_csv(worksheet);
        
        // Create blob and trigger download
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success(`Exported ${filteredStudents.length} student(s) to CSV`);
      }
      
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export students');
    } finally {
      setExportLoading(false);
    }
  };

  const clearExportFilters = () => {
    setExportFilters({
      startDate: '',
      endDate: '',
      format: 'xlsx'
    });
  };

  const getFilteredStudentsCount = () => {
    let count = students.length;
    
    if (exportFilters.startDate || exportFilters.endDate) {
      let filtered = [...students];
      
      if (exportFilters.startDate) {
        const startDate = new Date(exportFilters.startDate);
        startDate.setHours(0, 0, 0, 0);
        filtered = filtered.filter(student => {
          const createdDate = new Date(student.created_at);
          return createdDate >= startDate;
        });
      }
      
      if (exportFilters.endDate) {
        const endDate = new Date(exportFilters.endDate);
        endDate.setHours(23, 59, 59, 999);
        filtered = filtered.filter(student => {
          const createdDate = new Date(student.created_at);
          return createdDate <= endDate;
        });
      }
      
      count = filtered.length;
    }
    
    return count;
  };

  const fetchExams = async () => {
    try {
      console.log('Fetching exams for admin dashboard...');
      
      // Get the current token to ensure authentication
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        toast.error('Authentication required. Please log in again.');
        logout();
        return;
      }

      const response = await axios.get('/api/exams', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Exams fetched successfully:', response.data);
      setExams(response.data);
      
      if (response.data.length === 0) {
        console.log('No exams found in response');
      }
    } catch (error) {
      console.error('Failed to fetch exams:', error);
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        toast.error('Authentication failed. Please log in again.');
        logout();
      } else {
        toast.error('Failed to load exams. Please try refreshing the page.');
      }
      
      setExams([]); // Set empty array on error
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/exam-categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      setCategories(['general', 'midterm', 'final', 'quiz', 'assignment']); // Set defaults on error
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const response = await axios.get('/api/admin/recent-activity');
      setRecentActivity(response.data);
    } catch (error) {
      console.error('Failed to fetch recent activity:', error);
      setRecentActivity([]); // Set empty array on error
    }
  };

  const fetchVideoAnalytics = async () => {
    try {
      setVideoAnalytics(prev => ({ ...prev, loading: true }));
      
      const [overviewRes, questionsRes, studentsRes] = await Promise.all([
        axios.get('/api/admin/video-analytics/overview'),
        axios.get('/api/admin/video-analytics/questions'),
        axios.get('/api/admin/video-analytics/students')
      ]);

      setVideoAnalytics({
        overview: overviewRes.data,
        questions: questionsRes.data,
        students: studentsRes.data,
        loading: false
      });
    } catch (error) {
      console.error('Failed to fetch video analytics:', error);
      setVideoAnalytics({
        overview: {},
        questions: [],
        students: [],
        loading: false
      });
      toast.error('Failed to load video analytics');
    }
  };

  const fetchTimeSeriesData = async (period = 'day', limit = 30) => {
    try {
      setTimeSeriesLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5000/api/admin/video-analytics/time-series?period=${period}&limit=${limit}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setTimeSeriesData(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch time-series data:', error);
      toast.error('Failed to load time-series analytics');
    } finally {
      setTimeSeriesLoading(false);
    }
  };

  const fetchWatchHoursSummary = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        'http://localhost:5000/api/admin/video-analytics/watch-hours-summary',
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setWatchHoursSummary(response.data || {});
    } catch (error) {
      console.error('Failed to fetch watch hours summary:', error);
    }
  };

  const handlePeriodChange = (period) => {
    setSelectedTimePeriod(period);
    const limits = { day: 30, week: 12, month: 12, year: 5 };
    fetchTimeSeriesData(period, limits[period]);
  };

  const handleExportVideoAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/video-analytics/export', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `video-analytics-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Analytics exported successfully');
    } catch (error) {
      console.error('Failed to export analytics:', error);
      toast.error('Failed to export analytics');
    }
  };

  const fetchQuestionsForExam = async (subjectId, categoryId = '') => {
    try {
      const filterParam = categoryId ? `?category_id=${categoryId}` : '';
      const response = await axios.get(`/api/questions/${subjectId}${filterParam}`);
      setAvailableQuestions(response.data);
      
      // Also fetch categories for the selected subject
      if (subjectId) {
        fetchQuestionCategories(subjectId);
      }
    } catch (error) {
      console.error('Failed to fetch questions for exam:', error);
      setAvailableQuestions([]);
    }
  };

  // Handler functions for buttons
  const handleSubjectSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await axios.post('/api/subjects', subjectForm);
      toast.success('Subject created successfully');
      setShowSubjectModal(false);
      setSubjectForm({ name: '', description: '', subcategory_id: '' });
      fetchSubjects();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create subject');
    }
    
    setLoading(false);
  };

  const handleQuestionSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await axios.post('/api/questions', questionForm);
      const categoryName = questionForm.category_id ? 
        questionCategories.find(c => c.id == questionForm.category_id)?.name : null;
      
      if (categoryName) {
        toast.success(`Question created successfully and assigned to category "${categoryName}"`);
      } else {
        toast.success('Question created successfully (no category assigned)');
      }
      
      setShowQuestionModal(false);
      setQuestionForm({
        subject_id: '',
        category_id: '',
        question_text: '',
        option_a: '',
        option_b: '',
        option_c: '',
        option_d: '',
        correct_answer: 'A',
        youtube_link: ''
      });
      if (selectedSubject) {
        fetchQuestions(selectedSubject.id);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create question');
    }
    
    setLoading(false);
  };

  const handleApiKeySubmit = async (e) => {
    e.preventDefault();
    
    if (!apiKeyForm.key_name || !apiKeyForm.api_key || !apiKeyForm.provider) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    setLoading(true);
    
    try {
      await axios.post('/api/api-keys', apiKeyForm);
      toast.success('API key saved successfully');
      setShowApiKeyModal(false);
      // Reset form to openrouter defaults
      const openrouterProvider = providers.find(p => p.id === 'openrouter') || providers[0] || {};
      setApiKeyForm({
        key_name: '',
        api_key: '',
        provider: openrouterProvider.id || 'openrouter',
        base_url: openrouterProvider.base_url || 'https://openrouter.ai/api/v1',
        model_name: 'meta-llama/llama-3.1-8b-instruct:free'
      });
      fetchApiKeys();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save API key');
    }
    
    setLoading(false);
  };

  const handleGenerateSubmit = async (e) => {
    e.preventDefault();
    
    if (!generateForm.subject_id || !generateForm.topic || !generateForm.count || !generateForm.api_key_id) {
      if (!generateForm.api_key_id) {
        toast.error('Please select an API key');
      } else {
        toast.error('Please fill in all required fields');
      }
      return;
    }
    
    if (apiKeys.length === 0) {
      toast.error('Please configure an API key first');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await axios.post('/api/generate-questions', {
        subject_id: generateForm.subject_id,
        category_id: generateForm.category_id || null,
        topic: generateForm.topic,
        count: generateForm.count,
        difficulty: generateForm.difficulty,
        language: generateForm.language || 'English',
        instructions: generateForm.instructions || '',
        api_key_id: generateForm.api_key_id
      });
      
      toast.success(`Successfully generated ${response.data.count} questions!`);
      setShowGenerateModal(false);
      
      // Reset form
      setGenerateForm({
        subject_id: '',
        category_id: '',
        topic: '',
        count: 5,
        difficulty: 'medium',
        language: 'English',
        instructions: '',
        api_key_id: ''
      });
      
      // Refresh questions if we're on the questions tab
      if (selectedSubject && selectedSubject.id === parseInt(generateForm.subject_id)) {
        fetchQuestions(selectedSubject.id, selectedCategoryFilter);
      }
      
    } catch (error) {
      console.error('Failed to generate questions:', error);
      toast.error(error.response?.data?.error || 'Failed to generate questions. Please check your API key and try again.');
    }
    
    setLoading(false);
  };

  const handleQuestionCategorySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await axios.post('/api/question-categories', questionCategoryForm);
      toast.success('Question category created successfully');
      setShowQuestionCategoryModal(false);
      setQuestionCategoryForm({ name: '', description: '', subject_id: '', color: '#667eea' });
      if (selectedSubject) {
        fetchQuestionCategories(selectedSubject.id);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create question category');
    }
    
    setLoading(false);
  };

  const openQuestionModal = (subjectId = '') => {
    setQuestionForm({ ...questionForm, subject_id: subjectId, category_id: '' });
    setShowQuestionModal(true);
    if (subjectId) {
      fetchQuestionCategories(subjectId);
    }
  };

  const openQuestionCategoryModal = (subjectId = '') => {
    setQuestionCategoryForm({ name: '', description: '', subject_id: subjectId, color: '#667eea' });
    setShowQuestionCategoryModal(true);
  };

  const openEditSubjectModal = (subject) => {
    setEditSubjectForm({ 
      id: subject.id, 
      name: subject.name, 
      description: subject.description || '',
      subcategory_id: subject.subcategory_id || ''
    });
    setShowEditSubjectModal(true);
  };

  const openDeleteConfirm = (type, id, name) => {
    setDeleteItem({ type, id, name });
    setShowDeleteConfirm(true);
  };

  const openExamModal = () => {
    setExamForm({
      title: '',
      description: '',
      subjects: [],
      selectedQuestions: [],
      selectedSubjectFilter: '',
      selectedCategoryFilter: '',
      category: 'general',
      start_date: '',
      start_time: '',
      end_date: '',
      end_time: '',
      duration_minutes: 60,
      total_questions: 0,
      status: 'draft'
    });
    setAvailableQuestions([]);
    setQuestionCategories([]);
    setShowExamModal(true);
  };

  const handleDeleteConfirm = async () => {
    setLoading(true);
    
    try {
      if (deleteItem.type === 'subject') {
        await axios.delete(`/api/subjects/${deleteItem.id}`);
        toast.success('Subject deleted successfully');
        fetchSubjects();
        if (selectedSubject && selectedSubject.id === parseInt(deleteItem.id)) {
          setSelectedSubject(null);
          setQuestions([]);
        }
      } else if (deleteItem.type === 'question') {
        await axios.delete(`/api/questions/${deleteItem.id}`);
        toast.success('Question deleted successfully');
        if (selectedSubject) {
          fetchQuestions(selectedSubject.id, selectedCategoryFilter);
        }
      } else if (deleteItem.type === 'api-key') {
        await axios.delete(`/api/api-keys/${deleteItem.id}`);
        toast.success('API key deleted successfully');
        fetchApiKeys();
      } else if (deleteItem.type === 'question-category') {
        await axios.delete(`/api/question-categories/${deleteItem.id}`);
        toast.success('Question category deleted successfully');
        if (selectedSubject) {
          fetchQuestionCategories(selectedSubject.id);
          fetchQuestions(selectedSubject.id, selectedCategoryFilter);
        }
      } else if (deleteItem.type === 'subcategory') {
        await axios.delete(`/api/subcategories/${deleteItem.id}`);
        toast.success('Category deleted successfully');
        fetchSubcategories();
      } else if (deleteItem.type === 'exam') {
        await axios.delete(`/api/exams/${deleteItem.id}`);
        toast.success('Exam deleted successfully');
        fetchExams();
      }
      setShowDeleteConfirm(false);
      setDeleteItem({ type: '', id: '', name: '' });
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete item');
    }
    
    setLoading(false);
  };

  const handleSubcategorySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await axios.post('/api/subcategories', subcategoryForm);
      toast.success('Category created successfully');
      setShowSubcategoryModal(false);
      setSubcategoryForm({ name: '', description: '', parent_id: '', subject_id: '' });
      fetchSubcategories();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create category');
    }
    
    setLoading(false);
  };

  const handleEditSubjectSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await axios.put(`/api/subjects/${editSubjectForm.id}`, {
        name: editSubjectForm.name,
        description: editSubjectForm.description,
        subcategory_id: editSubjectForm.subcategory_id || null
      });
      toast.success('Subject updated successfully');
      setShowEditSubjectModal(false);
      setEditSubjectForm({ id: '', name: '', description: '', subcategory_id: '' });
      fetchSubjects();
      // Update selectedSubject if it was the one being edited
      if (selectedSubject && selectedSubject.id === editSubjectForm.id) {
        const updatedSubject = subjects.find(s => s.id === editSubjectForm.id);
        if (updatedSubject) {
          setSelectedSubject(updatedSubject);
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update subject');
    }
    
    setLoading(false);
  };

  const handleEditQuestionSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await axios.put(`/api/questions/${editQuestionForm.id}`, editQuestionForm);
      toast.success('Question updated successfully');
      setShowEditQuestionModal(false);
      setEditQuestionForm({
        id: '',
        subject_id: '',
        category_id: '',
        question_text: '',
        option_a: '',
        option_b: '',
        option_c: '',
        option_d: '',
        correct_answer: 'A',
        youtube_link: ''
      });
      if (selectedSubject) {
        fetchQuestions(selectedSubject.id, selectedCategoryFilter);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update question');
    }
    
    setLoading(false);
  };

  // Generate question summary using LLM
  const generateQuestionSummary = async (question) => {
    // Get current config or use defaults
    const currentConfig = summaryConfig[question.id];
    const config = {
      language: currentConfig?.language || 'English',
      length: currentConfig?.length || 'Medium',
      apiKeyId: currentConfig?.apiKeyId || (apiKeys.length > 0 ? apiKeys[0].id : '')
    };

    console.log('Generating summary with config:', config);
    console.log('Available API keys:', apiKeys.length);

    if (!config.apiKeyId || apiKeys.length === 0) {
      toast.error('Please add an API key first in the API Keys tab');
      return;
    }

    // Update state to show loading
    setSummaryConfig(prev => ({
      ...prev,
      [question.id]: { ...config, isGenerating: true }
    }));

    try {
      const prompt = `You are an educational expert. Analyze the following multiple-choice question and provide a comprehensive explanation in ${config.language}.

Question: ${question.question_text}

Options:
A) ${question.option_a}
B) ${question.option_b}
C) ${question.option_c}
D) ${question.option_d}

Correct Answer: ${question.correct_answer}

Please provide a ${config.length.toLowerCase()} length summary that includes:
1. A brief explanation of the topic
2. The reasoning behind the correct answer (why it is correct)
3. Any key concept or fact that supports the correct answer
4. Why the other options are incorrect (if space permits)

Write the summary in ${config.language} language. Keep the tone educational and easy to understand.`;

      const response = await axios.post('/api/generate-content', {
        prompt: prompt,
        api_key_id: config.apiKeyId,
        question_id: question.id
      });

      const summary = response.data.content || response.data.response || 'Summary generated successfully.';

      // Update state with the generated summary
      setSummaryConfig(prev => ({
        ...prev,
        [question.id]: { ...config, isGenerating: false, summary: summary }
      }));

      toast.success('Summary generated successfully!');
    } catch (error) {
      console.error('Error generating summary:', error);
      toast.error(error.response?.data?.error || 'Failed to generate summary');
      
      // Reset generating state
      setSummaryConfig(prev => ({
        ...prev,
        [question.id]: { ...config, isGenerating: false }
      }));
    }
  };

  // Copy summary to clipboard
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Summary copied to clipboard!');
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        toast.success('Summary copied to clipboard!');
      } catch (err) {
        toast.error('Failed to copy summary');
      }
      document.body.removeChild(textArea);
    }
  };

  // Toggle summary section for a question
  const toggleSummarySection = (questionId) => {
    setExpandedSummaries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
        // Initialize config with defaults if not exists
        if (!summaryConfig[questionId] && apiKeys.length > 0) {
          setSummaryConfig(prevConfig => ({
            ...prevConfig,
            [questionId]: {
              language: 'English',
              length: 'Medium',
              apiKeyId: apiKeys[0].id
            }
          }));
        }
      }
      return newSet;
    });
  };

  // Update summary configuration for a question
  const updateSummaryConfig = (questionId, field, value) => {
    setSummaryConfig(prev => ({
      ...prev,
      [questionId]: {
        ...(prev[questionId] || { language: 'English', length: 'Medium', apiKeyId: '' }),
        [field]: value
      }
    }));
  };

  // Exam handlers
  const handleExamSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Check if user is still authenticated
      if (!user || user.role !== 'admin') {
        toast.error('Authentication required. Please log in again.');
        logout();
        return;
      }

      // Validate exam form
      if (!examForm.title.trim()) {
        toast.error('Exam title is required');
        setLoading(false);
        return;
      }

      if (!examForm.selectedQuestions || examForm.selectedQuestions.length === 0) {
        toast.error('Please select at least one question for the exam');
        setLoading(false);
        return;
      }

      // Get the current token
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication token not found. Please log in again.');
        logout();
        return;
      }

      // Make the API call with explicit headers
      const response = await axios.post('/api/exams', examForm, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      toast.success('Exam created successfully');
      setShowExamModal(false);
      setExamForm({
        title: '',
        description: '',
        subjects: [],
        selectedQuestions: [],
        selectedSubjectFilter: '',
        selectedCategoryFilter: '',
        category: 'general',
        start_date: '',
        start_time: '',
        end_date: '',
        end_time: '',
        duration_minutes: 60,
        total_questions: 0,
        status: 'draft'
      });
      setAvailableQuestions([]);
      setQuestionCategories([]);
      fetchExams();
    } catch (error) {
      console.error('Error creating exam:', error);
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        toast.error('Authentication failed. Please log in again.');
        logout();
      } else {
        toast.error(error.response?.data?.error || 'Failed to create exam');
      }
    }
    
    setLoading(false);
  };

  const handleEditExamSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Check if user is still authenticated
      if (!user || user.role !== 'admin') {
        toast.error('Authentication required. Please log in again.');
        logout();
        return;
      }

      // Get the current token
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication token not found. Please log in again.');
        logout();
        return;
      }

      // Make the API call with explicit headers
      await axios.put(`/api/exams/${editExamForm.id}`, editExamForm, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      toast.success('Exam updated successfully');
      setShowEditExamModal(false);
      setEditExamForm({
        id: '',
        title: '',
        description: '',
        subjects: [],
        selectedQuestions: [],
        category: 'general',
        start_date: '',
        start_time: '',
        end_date: '',
        end_time: '',
        duration_minutes: 60,
        total_questions: 0,
        status: 'draft'
      });
      fetchExams();
    } catch (error) {
      console.error('Error updating exam:', error);
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        toast.error('Authentication failed. Please log in again.');
        logout();
      } else {
        toast.error(error.response?.data?.error || 'Failed to update exam');
      }
    }
    
    setLoading(false);
  };

  const openEditExamModal = (exam) => {
    const startDateTime = exam.start_time ? exam.start_time.split(' ') : ['', ''];
    const endDateTime = exam.end_time ? exam.end_time.split(' ') : ['', ''];
    
    setEditExamForm({
      id: exam.id,
      title: exam.title,
      description: exam.description || '',
      subjects: [],
      selectedQuestions: [],
      category: exam.category || 'general',
      start_date: startDateTime[0] || '',
      start_time: startDateTime[1] || '',
      end_date: endDateTime[0] || '',
      end_time: endDateTime[1] || '',
      duration_minutes: exam.duration_minutes || 60,
      total_questions: exam.total_questions || 0,
      status: exam.status || 'draft'
    });
    setShowEditExamModal(true);
  };

  return (
    <>
      <div className="dashboard-with-sidebar">
      <Sidebar 
        isOpen={sidebarOpen} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        onClose={() => setSidebarOpen(false)}
        userRole="admin"
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
                <h2 style={{ marginBottom: '2rem', color: 'var(--text-primary)' }}>Admin Dashboard</h2>
                
                {/* Modern Analytics Cards with Gradient Icons */}
                <div className="grid grid-4" style={{ marginBottom: '2rem' }}>
                  <div className="analytics-card">
                    <div className="analytics-icon students">
                      <Users size={32} />
                    </div>
                    <div className="analytics-content">
                      <div className="analytics-number">{analytics.total || 0}</div>
                      <div className="analytics-label">Total Students</div>
                    </div>
                  </div>
                  
                  <div className="analytics-card">
                    <div className="analytics-icon active">
                      <UserCheck size={32} />
                    </div>
                    <div className="analytics-content">
                      <div className="analytics-number">{analytics.recentlyActive || 0}</div>
                      <div className="analytics-label">Active This Week</div>
                    </div>
                  </div>
                  
                  <div className="analytics-card">
                    <div className="analytics-icon exams">
                      <Award size={32} />
                    </div>
                    <div className="analytics-content">
                      <div className="analytics-number">{analytics.totalExams || 0}</div>
                      <div className="analytics-label">Total Attempts</div>
                    </div>
                  </div>
                  
                  <div className="analytics-card">
                    <div className="analytics-icon score">
                      <TrendingUp size={32} />
                    </div>
                    <div className="analytics-content">
                      <div className="analytics-number">{analytics.averageScore || 0}%</div>
                      <div className="analytics-label">Average Score</div>
                    </div>
                  </div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-2" style={{ marginBottom: '2rem' }}>
                  <div className="card">
                    <div className="card-header">
                      <h4>Exam Attempts Over Time</h4>
                    </div>
                    <div className="card-body">
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={[
                          { month: 'Jan', attempts: 65 },
                          { month: 'Feb', attempts: 78 },
                          { month: 'Mar', attempts: 90 },
                          { month: 'Apr', attempts: 81 },
                          { month: 'May', attempts: 95 },
                          { month: 'Jun', attempts: 110 }
                        ]}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                          <XAxis dataKey="month" stroke="var(--text-secondary)" />
                          <YAxis stroke="var(--text-secondary)" />
                          <Tooltip contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }} />
                          <Legend />
                          <Line type="monotone" dataKey="attempts" stroke="#667eea" strokeWidth={3} dot={{ fill: '#667eea', r: 5 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="card">
                    <div className="card-header">
                      <h4>Average Score per Subject</h4>
                    </div>
                    <div className="card-body">
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={subjects.slice(0, 5).map(subject => ({
                          name: subject.name.length > 15 ? subject.name.substring(0, 15) + '...' : subject.name,
                          score: Math.floor(Math.random() * 40) + 60
                        }))}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                          <XAxis dataKey="name" stroke="var(--text-secondary)" />
                          <YAxis stroke="var(--text-secondary)" />
                          <Tooltip contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }} />
                          <Legend />
                          <Bar dataKey="score" fill="#667eea" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
                
                {/* Recent Activity */}
                <div className="card" style={{ marginBottom: '2rem' }}>
                  <div className="card-header">
                    <h4><Activity size={20} /> Recent Activity</h4>
                  </div>
                  <div className="card-body">
                    {recentActivity.length > 0 ? (
                      <div>
                        {recentActivity.slice(0, 10).map((activity, index) => (
                          <div key={index} style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            padding: '1rem 0',
                            borderBottom: index < 9 ? '1px solid #eee' : 'none'
                          }}>
                            <div>
                              <strong>{activity.username}</strong> - {activity.activity_type}
                            </div>
                            <div style={{ color: '#666', fontSize: '0.9rem' }}>
                              {new Date(activity.created_at).toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ color: '#666', textAlign: 'center', padding: '2rem' }}>
                        No recent activity found.
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Quick Actions */}
                <div className="card">
                  <div className="card-header">
                    <h4>Quick Actions</h4>
                  </div>
                  <div className="card-body">
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                      <button 
                        className="btn btn-primary"
                        onClick={() => setActiveTab('subjects')}
                      >
                        <Plus size={16} /> Add Subject
                      </button>
                      <button 
                        className="btn btn-success"
                        onClick={() => setActiveTab('exams')}
                      >
                        <Calendar size={16} /> Schedule Exam
                      </button>
                      <button 
                        className="btn btn-secondary"
                        onClick={() => setActiveTab('students')}
                      >
                        <Users size={16} /> View Students
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'students' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3>Student Management</h3>
                  <button 
                    className="btn btn-secondary"
                    onClick={fetchStudents}
                  >
                    <Download size={16} /> Refresh Data
                  </button>
                </div>

                {/* Export Controls Card */}
                <div className="card" style={{ marginBottom: '1.5rem', background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                  <div className="card-header" style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                      <FileSpreadsheet size={20} />
                      Export Student Data
                    </h4>
                  </div>
                  <div className="card-body">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                      {/* Date Range Filters */}
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500', color: 'var(--text-primary)' }}>
                          From Date
                        </label>
                        <input
                          type="date"
                          className="form-input"
                          value={exportFilters.startDate}
                          onChange={(e) => setExportFilters({ ...exportFilters, startDate: e.target.value })}
                          style={{ width: '100%', padding: '0.5rem', borderRadius: '5px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
                        />
                      </div>
                      
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500', color: 'var(--text-primary)' }}>
                          To Date
                        </label>
                        <input
                          type="date"
                          className="form-input"
                          value={exportFilters.endDate}
                          onChange={(e) => setExportFilters({ ...exportFilters, endDate: e.target.value })}
                          style={{ width: '100%', padding: '0.5rem', borderRadius: '5px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
                        />
                      </div>
                      
                      {/* Format Selector */}
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500', color: 'var(--text-primary)' }}>
                          Export Format
                        </label>
                        <select
                          className="form-input"
                          value={exportFilters.format}
                          onChange={(e) => setExportFilters({ ...exportFilters, format: e.target.value })}
                          style={{ width: '100%', padding: '0.5rem', borderRadius: '5px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
                        >
                          <option value="xlsx">Excel (.xlsx)</option>
                          <option value="csv">CSV (.csv)</option>
                        </select>
                      </div>
                    </div>
                    
                    {/* Export Info and Actions */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                      <div style={{ 
                        padding: '0.75rem 1rem', 
                        background: 'var(--primary-light)', 
                        borderRadius: '5px', 
                        fontSize: '0.9rem',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--primary-color)'
                      }}>
                        <strong>{getFilteredStudentsCount()}</strong> student(s) will be exported
                        {(exportFilters.startDate || exportFilters.endDate) && (
                          <span style={{ marginLeft: '0.5rem', color: 'var(--text-secondary)' }}>
                            ({exportFilters.startDate ? `from ${new Date(exportFilters.startDate).toLocaleDateString()}` : 'all'}
                            {exportFilters.endDate ? ` to ${new Date(exportFilters.endDate).toLocaleDateString()}` : ''})
                          </span>
                        )}
                      </div>
                      
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {(exportFilters.startDate || exportFilters.endDate) && (
                          <button
                            className="btn btn-secondary"
                            onClick={clearExportFilters}
                            style={{ fontSize: '0.9rem' }}
                          >
                            <X size={16} /> Clear Filters
                          </button>
                        )}
                        
                        <button
                          className="btn btn-success"
                          onClick={handleExportStudents}
                          disabled={exportLoading || students.length === 0}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}
                        >
                          {exportLoading ? (
                            <>
                              <div style={{ width: '16px', height: '16px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                              Exporting...
                            </>
                          ) : (
                            <>
                              <FileSpreadsheet size={16} />
                              Export {exportFilters.format.toUpperCase()}
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="card">
                  <div className="card-body">
                    {students.length > 0 ? (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                          <thead>
                            <tr>
                              <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid var(--border-color)', fontWeight: '600', color: 'var(--text-primary)' }}>Username</th>
                              <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid var(--border-color)', fontWeight: '600', color: 'var(--text-primary)' }}>Name</th>
                              <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid var(--border-color)', fontWeight: '600', color: 'var(--text-primary)' }}>Surname</th>
                              <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid var(--border-color)', fontWeight: '600', color: 'var(--text-primary)' }}>Email</th>
                              <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid var(--border-color)', fontWeight: '600', color: 'var(--text-primary)' }}>Status</th>
                              <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid var(--border-color)', fontWeight: '600', color: 'var(--text-primary)' }}>Exams Taken</th>
                              <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid var(--border-color)', fontWeight: '600', color: 'var(--text-primary)' }}>Avg Score</th>
                              <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid var(--border-color)', fontWeight: '600', color: 'var(--text-primary)' }}>Joined</th>
                            </tr>
                          </thead>
                          <tbody>
                            {students.map(student => (
                              <tr key={student.id} style={{ cursor: 'pointer' }} onClick={() => {
                                setSelectedStudent(student);
                                setShowStudentDetailsModal(true);
                              }}>
                                <td style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>{student.username}</td>
                                <td style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>{student.name || '-'}</td>
                                <td style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>{student.surname || '-'}</td>
                                <td style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{student.email || 'Not provided'}</td>
                                <td style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                                  <span className={`status-badge ${student.status}`}>
                                    {student.status}
                                  </span>
                                </td>
                                <td style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)', textAlign: 'center' }}>{student.exams_taken}</td>
                                <td style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
                                  {student.exams_taken > 0 ? `${student.average_score}%` : '-'}
                                </td>
                                <td style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                  {new Date(student.created_at).toLocaleDateString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                        No students found.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'exams' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3>Exam Management</h3>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      className="btn btn-secondary"
                      onClick={() => {
                        console.log('Manually refreshing exams...');
                        fetchExams();
                      }}
                    >
                      <Download size={16} /> Refresh
                    </button>
                    <button 
                      className="btn btn-primary"
                      onClick={() => openExamModal()}
                    >
                      <Plus size={16} /> Create Exam
                    </button>
                  </div>
                </div>
                
                {/* Debug info */}
                <div style={{ 
                  background: '#f8f9fa', 
                  padding: '0.75rem', 
                  borderRadius: '4px', 
                  marginBottom: '1rem',
                  fontSize: '0.9rem',
                  color: '#666'
                }}>
                  📊 Found {exams.length} exam(s) in dashboard
                </div>
                
                <div className="grid grid-2">
                  {exams.map(exam => (
                    <div key={exam.id} className="card">
                      <div className="card-body">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                          <h4>{exam.title}</h4>
                          <span className={`status-badge ${exam.status}`}>
                            {exam.status}
                          </span>
                        </div>
                        <p style={{ color: '#666', marginBottom: '1rem' }}>{exam.description}</p>
                        <div style={{ fontSize: '0.9rem', color: '#666' }}>
                          <div><strong>Duration:</strong> {exam.duration_minutes} minutes</div>
                          <div><strong>Questions:</strong> {exam.total_questions}</div>
                          <div><strong>Attempts:</strong> {exam.attempts_count}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                          <button 
                            className="btn btn-secondary"
                            onClick={() => openEditExamModal(exam)}
                          >
                            <Edit2 size={16} /> Edit
                          </button>
                          <button 
                            className="btn btn-danger"
                            onClick={() => openDeleteConfirm('exam', exam.id, exam.title)}
                          >
                            <Trash2 size={16} /> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {exams.length === 0 && (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '3rem 2rem', 
                    color: '#666',
                    background: '#f8f9fa',
                    borderRadius: '8px',
                    border: '1px solid #dee2e6'
                  }}>
                    <Calendar size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                    <h4 style={{ margin: '0 0 0.5rem 0' }}>No Exams Found</h4>
                    <p style={{ margin: '0 0 1.5rem 0' }}>
                      It looks like there are no exams in your dashboard yet.
                    </p>
                    <div style={{ 
                      background: '#fff3cd', 
                      padding: '1rem', 
                      borderRadius: '6px',
                      marginBottom: '1rem',
                      border: '1px solid #ffeaa7'
                    }}>
                      <p style={{ margin: '0', fontSize: '0.9rem' }}>
                        🔍 If you just created an exam, try clicking the <strong>Refresh</strong> button above.
                      </p>
                    </div>
                    <button 
                      className="btn btn-primary"
                      onClick={() => openExamModal()}
                    >
                      <Plus size={16} /> Create Your First Exam
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'subjects' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3>Subjects</h3>
                  <button 
                    className="btn btn-primary"
                    onClick={() => setShowSubjectModal(true)}
                  >
                    <Plus size={16} /> Add Subject
                  </button>
                </div>
                
                <div className="grid grid-3">
                  {subjects.map(subject => (
                    <div key={subject.id} className="card">
                      <div className="card-body">
                        <h4>{subject.name}</h4>
                        <p style={{ color: '#666' }}>{subject.description}</p>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                          <button 
                            className="btn btn-primary"
                            onClick={() => {
                              setSelectedSubject(subject);
                              setActiveTab('questions');
                            }}
                          >
                            View Questions
                          </button>
                          <button 
                            className="btn btn-success"
                            onClick={() => openQuestionModal(subject.id)}
                          >
                            <Plus size={16} /> Add Question
                          </button>
                          <button 
                            className="btn btn-secondary"
                            onClick={() => openEditSubjectModal(subject)}
                          >
                            <Edit2 size={16} /> Edit
                          </button>
                          <button 
                            className="btn btn-danger"
                            onClick={() => openDeleteConfirm('subject', subject.id, subject.name)}
                          >
                            <Trash2 size={16} /> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'subcategories' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3>Categories</h3>
                  <button 
                    className="btn btn-primary"
                    onClick={() => setShowSubcategoryModal(true)}
                  >
                    <Plus size={16} /> Add Category
                  </button>
                </div>
                
                <div className="card">
                  <div className="card-body">
                    {subcategories.length > 0 ? (
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr>
                            <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #eee' }}>Name</th>
                            <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #eee' }}>Description</th>
                            <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #eee' }}>Subject</th>
                            <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #eee' }}>Status</th>
                            <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #eee' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {subcategories.map(subcategory => (
                            <tr key={subcategory.id}>
                              <td style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>{subcategory.name}</td>
                              <td style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>{subcategory.description || 'No description'}</td>
                              <td style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>{subcategory.subject_name || 'No subject'}</td>
                              <td style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>
                                <span className={`status-badge ${subcategory.is_active ? 'active' : 'inactive'}`}>
                                  {subcategory.is_active ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                  <button 
                                    className="btn btn-secondary"
                                    onClick={() => {
                                      setEditSubcategoryForm({
                                        id: subcategory.id,
                                        name: subcategory.name,
                                        description: subcategory.description || '',
                                        parent_id: subcategory.parent_id || '',
                                        subject_id: subcategory.subject_id || '',
                                        is_active: subcategory.is_active
                                      });
                                      setShowEditSubcategoryModal(true);
                                    }}
                                  >
                                    <Edit2 size={16} />
                                  </button>
                                  <button 
                                    className="btn btn-danger"
                                    onClick={() => openDeleteConfirm('subcategory', subcategory.id, subcategory.name)}
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                        No categories found. Create your first category!
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'questions' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3>Questions {selectedSubject && `- ${selectedSubject.name}`}</h3>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    {selectedSubject && (
                      <>
                        <button 
                          className="btn btn-primary"
                          onClick={() => setShowGenerateModal(true)}
                          disabled={apiKeys.length === 0}
                          title={apiKeys.length === 0 ? 'Configure API keys first to generate questions' : 'Generate questions using AI'}
                        >
                          <Zap size={16} /> Generate Questions
                        </button>
                        <button 
                          className="btn btn-success"
                          onClick={() => openQuestionModal(selectedSubject.id)}
                        >
                          <Plus size={16} /> Add Question
                        </button>
                        <button 
                          className="btn btn-secondary"
                          onClick={() => openQuestionCategoryModal(selectedSubject.id)}
                        >
                          <Plus size={16} /> Add Category
                        </button>
                      </>
                    )}
                  </div>
                </div>
                
                {/* Subject Selection Filter */}
                <div className="card" style={{ marginBottom: '1rem' }}>
                  <div className="card-body">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                      <label style={{ fontWeight: '600', color: '#444' }}>Filter by Subject:</label>
                      <select 
                        value={selectedSubject?.id || ''} 
                        onChange={(e) => {
                          const subject = subjects.find(s => s.id === parseInt(e.target.value));
                          setSelectedSubject(subject || null);
                          setSelectedCategoryFilter(''); // Reset category filter when subject changes
                        }}
                        style={{ 
                          padding: '0.5rem 1rem', 
                          border: '2px solid #e1e5e9', 
                          borderRadius: '6px',
                          fontSize: '0.95rem',
                          minWidth: '200px'
                        }}
                      >
                        <option value="">Select a Subject</option>
                        {subjects.map(subject => (
                          <option key={subject.id} value={subject.id}>
                            {subject.name}
                          </option>
                        ))}
                      </select>
                      {selectedSubject && (
                        <button 
                          className="btn btn-outline"
                          onClick={() => {
                            setSelectedSubject(null);
                            setSelectedCategoryFilter('');
                            setQuestions([]);
                            setQuestionCategories([]);
                          }}
                          style={{ fontSize: '0.9rem' }}
                        >
                          Clear Selection
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                
                {!selectedSubject ? (
                  <div className="card">
                    <div className="card-body" style={{ textAlign: 'center', padding: '2rem' }}>
                      <p style={{ color: '#666', marginBottom: '1rem' }}>Please select a subject first</p>
                      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                        {subjects.map(subject => (
                          <button 
                            key={subject.id}
                            className="btn btn-primary"
                            onClick={() => setSelectedSubject(subject)}
                          >
                            {subject.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    {/* Category Filter */}
                    {questionCategories.length > 0 && (
                      <div className="card" style={{ marginBottom: '1rem', border: '2px solid #e3f2fd' }}>
                        <div className="card-body" style={{ background: 'linear-gradient(135deg, #f8f9ff 0%, #e3f2fd 100%)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                            <label style={{ fontWeight: '600', color: '#1565c0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <Settings size={16} />
                              Filter by Category:
                            </label>
                            <select 
                              value={selectedCategoryFilter} 
                              onChange={(e) => {
                                setSelectedCategoryFilter(e.target.value);
                                fetchQuestions(selectedSubject.id, e.target.value);
                              }}
                              style={{ 
                                padding: '0.5rem 1rem', 
                                border: '2px solid #1976d2', 
                                borderRadius: '6px',
                                fontSize: '0.95rem',
                                minWidth: '200px',
                                backgroundColor: 'white'
                              }}
                            >
                              <option value="">All Categories</option>
                              {questionCategories.map(category => (
                                <option key={category.id} value={category.id}>
                                  {category.name}
                                </option>
                              ))}
                            </select>
                            {selectedCategoryFilter && (
                              <button 
                                className="btn btn-outline"
                                onClick={() => {
                                  setSelectedCategoryFilter('');
                                  fetchQuestions(selectedSubject.id, '');
                                }}
                                style={{ fontSize: '0.9rem' }}
                              >
                                <X size={14} /> Clear Filter
                              </button>
                            )}
                            <div style={{ 
                              fontSize: '0.85rem', 
                              color: '#666',
                              padding: '0.25rem 0.75rem',
                              background: 'rgba(25, 118, 210, 0.1)',
                              borderRadius: '12px',
                              border: '1px solid rgba(25, 118, 210, 0.2)'
                            }}>
                              📊 {questions.length} question(s) displayed
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Questions List */}
                    <div className="card">
                      <div className="card-body">
                        {questions.length > 0 ? (
                          <div>
                            {questions.map(question => (
                              <div key={question.id} className="card" style={{ marginBottom: '1rem' }}>
                                <div className="card-body">
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                    <div style={{ flex: 1 }}>
                                      <h5>{question.question_text}</h5>
                                      {question.category_name && (
                                        <span style={{ 
                                          display: 'inline-block', 
                                          background: question.category_color || '#667eea', 
                                          color: 'white', 
                                          padding: '0.25rem 0.75rem', 
                                          borderRadius: '1rem', 
                                          fontSize: '0.8rem',
                                          marginBottom: '0.5rem'
                                        }}>
                                          {question.category_name}
                                        </span>
                                      )}
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                      <button 
                                        className="btn btn-secondary"
                                        onClick={() => {
                                          setEditQuestionForm({
                                            id: question.id,
                                            subject_id: question.subject_id,
                                            category_id: question.category_id || '',
                                            question_text: question.question_text,
                                            option_a: question.option_a,
                                            option_b: question.option_b,
                                            option_c: question.option_c,
                                            option_d: question.option_d,
                                            correct_answer: question.correct_answer,
                                            youtube_link: question.youtube_link || ''
                                          });
                                          setShowEditQuestionModal(true);
                                        }}
                                      >
                                        <Edit2 size={16} />
                                      </button>
                                      <button 
                                        className="btn btn-danger"
                                        onClick={() => openDeleteConfirm('question', question.id, question.question_text.substring(0, 50) + '...')}
                                      >
                                        <Trash2 size={16} />
                                      </button>
                                    </div>
                                  </div>
                                  
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                                    <div style={{ 
                                      padding: '0.5rem', 
                                      background: question.correct_answer === 'A' ? (theme === 'dark' ? '#064e3b' : '#d1fae5') : (theme === 'dark' ? '#1e293b' : '#f3f4f6'),
                                      border: question.correct_answer === 'A' ? '2px solid #10b981' : (theme === 'dark' ? '1px solid #334155' : '1px solid #d1d5db'),
                                      borderRadius: '6px',
                                      color: theme === 'dark' ? '#f1f5f9' : '#111827'
                                    }}>
                                      <strong style={{ color: question.correct_answer === 'A' ? '#10b981' : (theme === 'dark' ? '#94a3b8' : '#6b7280') }}>A:</strong> {question.option_a}
                                    </div>
                                    <div style={{ 
                                      padding: '0.5rem', 
                                      background: question.correct_answer === 'B' ? (theme === 'dark' ? '#064e3b' : '#d1fae5') : (theme === 'dark' ? '#1e293b' : '#f3f4f6'),
                                      border: question.correct_answer === 'B' ? '2px solid #10b981' : (theme === 'dark' ? '1px solid #334155' : '1px solid #d1d5db'),
                                      borderRadius: '6px',
                                      color: theme === 'dark' ? '#f1f5f9' : '#111827'
                                    }}>
                                      <strong style={{ color: question.correct_answer === 'B' ? '#10b981' : (theme === 'dark' ? '#94a3b8' : '#6b7280') }}>B:</strong> {question.option_b}
                                    </div>
                                    <div style={{ 
                                      padding: '0.5rem', 
                                      background: question.correct_answer === 'C' ? (theme === 'dark' ? '#064e3b' : '#d1fae5') : (theme === 'dark' ? '#1e293b' : '#f3f4f6'),
                                      border: question.correct_answer === 'C' ? '2px solid #10b981' : (theme === 'dark' ? '1px solid #334155' : '1px solid #d1d5db'),
                                      borderRadius: '6px',
                                      color: theme === 'dark' ? '#f1f5f9' : '#111827'
                                    }}>
                                      <strong style={{ color: question.correct_answer === 'C' ? '#10b981' : (theme === 'dark' ? '#94a3b8' : '#6b7280') }}>C:</strong> {question.option_c}
                                    </div>
                                    <div style={{ 
                                      padding: '0.5rem', 
                                      background: question.correct_answer === 'D' ? (theme === 'dark' ? '#064e3b' : '#d1fae5') : (theme === 'dark' ? '#1e293b' : '#f3f4f6'),
                                      border: question.correct_answer === 'D' ? '2px solid #10b981' : (theme === 'dark' ? '1px solid #334155' : '1px solid #d1d5db'),
                                      borderRadius: '6px',
                                      color: theme === 'dark' ? '#f1f5f9' : '#111827'
                                    }}>
                                      <strong style={{ color: question.correct_answer === 'D' ? '#10b981' : (theme === 'dark' ? '#94a3b8' : '#6b7280') }}>D:</strong> {question.option_d}
                                    </div>
                                  </div>
                                  
                                  <div style={{ 
                                    fontSize: '0.9rem', 
                                    padding: '0.75rem',
                                    background: theme === 'dark' ? '#1e293b' : '#f9fafb',
                                    borderRadius: '6px',
                                    marginTop: '0.5rem',
                                    border: theme === 'dark' ? '1px solid #334155' : '1px solid #e5e7eb'
                                  }}>
                                    <strong style={{ color: theme === 'dark' ? '#f1f5f9' : '#111827', marginRight: '0.5rem' }}>Correct Answer:</strong>
                                    <span className="correct-answer-badge-override" style={{ 
                                      fontWeight: '700',
                                      padding: '0.4rem 0.9rem',
                                      backgroundColor: '#10b981',
                                      color: '#ffffff',
                                      borderRadius: '6px',
                                      fontSize: '1rem',
                                      boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)',
                                      display: 'inline-block',
                                      minWidth: '36px',
                                      textAlign: 'center',
                                      letterSpacing: '0.05em'
                                    }}>
                                      {question.correct_answer}
                                    </span>
                                    {question.youtube_link && (
                                      <span style={{ marginLeft: '1rem' }}>
                                        <Youtube size={16} style={{ verticalAlign: 'middle', marginRight: '0.25rem' }} />
                                        <a 
                                          href={question.youtube_link} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          style={{ color: 'var(--primary-color)' }}
                                        >
                                          Watch Explanation
                                        </a>
                                      </span>
                                    )}
                                  </div>

                                  {/* Question Summary Generation Section */}
                                  <div style={{ marginTop: '0.75rem' }}>
                                    <button
                                      className="btn btn-outline"
                                      onClick={() => toggleSummarySection(question.id)}
                                      style={{
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '0.75rem 1rem',
                                        background: summaryConfig[question.id]?.summary 
                                          ? (theme === 'dark' ? '#064e3b' : '#d1fae5')
                                          : (theme === 'dark' ? '#1e293b' : '#f9fafb'),
                                        border: summaryConfig[question.id]?.summary 
                                          ? (theme === 'dark' ? '2px solid #10b981' : '2px solid #10b981')
                                          : (theme === 'dark' ? '1px solid #334155' : '1px solid #e5e7eb'),
                                        borderRadius: '6px',
                                        color: summaryConfig[question.id]?.summary 
                                          ? (theme === 'dark' ? '#a7f3d0' : '#065f46')
                                          : (theme === 'dark' ? '#f1f5f9' : '#111827'),
                                        fontWeight: summaryConfig[question.id]?.summary ? '600' : '500',
                                        transition: 'all 0.3s ease',
                                        boxShadow: summaryConfig[question.id]?.summary 
                                          ? '0 2px 8px rgba(16, 185, 129, 0.3)' 
                                          : 'none'
                                      }}
                                    >
                                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Sparkles size={18} style={{ color: '#10b981' }} />
                                        Generate Explanation Summary
                                        {summaryConfig[question.id]?.summary && (
                                          <span style={{
                                            fontSize: '0.7rem',
                                            padding: '0.15rem 0.5rem',
                                            background: '#10b981',
                                            color: 'white',
                                            borderRadius: '12px',
                                            fontWeight: '700',
                                            marginLeft: '0.25rem'
                                          }}>
                                            ✓ Generated
                                          </span>
                                        )}
                                      </span>
                                      {expandedSummaries.has(question.id) ? 
                                        <ChevronUp size={18} /> : <ChevronDown size={18} />
                                      }
                                    </button>

                                    {expandedSummaries.has(question.id) && (
                                      <div style={{
                                        marginTop: '0.75rem',
                                        padding: '1rem',
                                        background: theme === 'dark' ? '#0f172a' : '#ffffff',
                                        border: theme === 'dark' ? '1px solid #334155' : '1px solid #e5e7eb',
                                        borderRadius: '8px'
                                      }}>
                                        <div style={{ 
                                          display: 'grid', 
                                          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                                          gap: '1rem',
                                          marginBottom: '1rem'
                                        }}>
                                          {/* Language Selection */}
                                          <div>
                                            <label style={{ 
                                              display: 'block', 
                                              marginBottom: '0.5rem',
                                              fontWeight: '500',
                                              fontSize: '0.9rem',
                                              color: theme === 'dark' ? '#f1f5f9' : '#374151'
                                            }}>
                                              Language
                                            </label>
                                            <select
                                              value={summaryConfig[question.id]?.language || 'English'}
                                              onChange={(e) => updateSummaryConfig(question.id, 'language', e.target.value)}
                                              style={{
                                                width: '100%',
                                                padding: '0.5rem',
                                                background: theme === 'dark' ? '#1e293b' : '#f9fafb',
                                                border: theme === 'dark' ? '1px solid #334155' : '1px solid #d1d5db',
                                                borderRadius: '6px',
                                                color: theme === 'dark' ? '#f1f5f9' : '#111827',
                                                fontSize: '0.9rem'
                                              }}
                                            >
                                              <option value="English">English</option>
                                              <option value="Hindi">Hindi</option>
                                              <option value="Marathi">Marathi</option>
                                            </select>
                                          </div>

                                          {/* Summary Length Selection */}
                                          <div>
                                            <label style={{ 
                                              display: 'block', 
                                              marginBottom: '0.5rem',
                                              fontWeight: '500',
                                              fontSize: '0.9rem',
                                              color: theme === 'dark' ? '#f1f5f9' : '#374151'
                                            }}>
                                              Summary Length
                                            </label>
                                            <select
                                              value={summaryConfig[question.id]?.length || 'Medium'}
                                              onChange={(e) => updateSummaryConfig(question.id, 'length', e.target.value)}
                                              style={{
                                                width: '100%',
                                                padding: '0.5rem',
                                                background: theme === 'dark' ? '#1e293b' : '#f9fafb',
                                                border: theme === 'dark' ? '1px solid #334155' : '1px solid #d1d5db',
                                                borderRadius: '6px',
                                                color: theme === 'dark' ? '#f1f5f9' : '#111827',
                                                fontSize: '0.9rem'
                                              }}
                                            >
                                              <option value="Short">Short</option>
                                              <option value="Medium">Medium</option>
                                              <option value="Long">Long</option>
                                            </select>
                                          </div>

                                          {/* API Key Selection */}
                                          <div>
                                            <label style={{ 
                                              display: 'block', 
                                              marginBottom: '0.5rem',
                                              fontWeight: '500',
                                              fontSize: '0.9rem',
                                              color: theme === 'dark' ? '#f1f5f9' : '#374151'
                                            }}>
                                              API Key / Model
                                            </label>
                                            <select
                                              value={summaryConfig[question.id]?.apiKeyId || (apiKeys.length > 0 ? apiKeys[0].id : '')}
                                              onChange={(e) => updateSummaryConfig(question.id, 'apiKeyId', e.target.value)}
                                              style={{
                                                width: '100%',
                                                padding: '0.5rem',
                                                background: theme === 'dark' ? '#1e293b' : '#f9fafb',
                                                border: theme === 'dark' ? '1px solid #334155' : '1px solid #d1d5db',
                                                borderRadius: '6px',
                                                color: theme === 'dark' ? '#f1f5f9' : '#111827',
                                                fontSize: '0.9rem'
                                              }}
                                            >
                                              {apiKeys.length === 0 ? (
                                                <option value="">No API keys available</option>
                                              ) : (
                                                apiKeys.map(key => (
                                                  <option key={key.id} value={key.id}>
                                                    {key.key_name} ({key.model_name})
                                                  </option>
                                                ))
                                              )}
                                            </select>
                                          </div>
                                        </div>

                                        {/* Generate Button */}
                                        <button
                                          className="btn btn-primary"
                                          onClick={() => generateQuestionSummary(question)}
                                          disabled={summaryConfig[question.id]?.isGenerating || apiKeys.length === 0}
                                          style={{
                                            width: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.5rem',
                                            padding: '0.75rem',
                                            fontSize: '1rem',
                                            fontWeight: '600'
                                          }}
                                        >
                                          {summaryConfig[question.id]?.isGenerating ? (
                                            <>
                                              <div className="loading-spinner" style={{ 
                                                width: '18px', 
                                                height: '18px',
                                                border: '2px solid rgba(255,255,255,0.3)',
                                                borderTop: '2px solid white',
                                                borderRadius: '50%',
                                                animation: 'spin 1s linear infinite'
                                              }}></div>
                                              Generating Summary...
                                            </>
                                          ) : (
                                            <>
                                              <Sparkles size={20} />
                                              Generate Explanation
                                            </>
                                          )}
                                        </button>

                                        {/* Display Generated Summary */}
                                        {summaryConfig[question.id]?.summary && (
                                          <div style={{
                                            marginTop: '1rem',
                                            padding: '1rem',
                                            background: theme === 'dark' ? '#1e293b' : '#f0fdf4',
                                            border: theme === 'dark' ? '1px solid #334155' : '1px solid #bbf7d0',
                                            borderRadius: '8px',
                                            borderLeft: '4px solid #10b981'
                                          }}>
                                            <div style={{ 
                                              display: 'flex', 
                                              alignItems: 'center', 
                                              justifyContent: 'space-between',
                                              marginBottom: '0.75rem'
                                            }}>
                                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <FileText size={18} style={{ color: '#10b981' }} />
                                                <strong style={{ 
                                                  color: theme === 'dark' ? '#f1f5f9' : '#065f46',
                                                  fontSize: '1rem'
                                                }}>
                                                  Generated Explanation:
                                                </strong>
                                              </div>
                                              <button
                                                onClick={() => copyToClipboard(summaryConfig[question.id].summary)}
                                                style={{
                                                  background: '#10b981',
                                                  color: 'white',
                                                  border: 'none',
                                                  borderRadius: '6px',
                                                  padding: '0.5rem 0.75rem',
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  gap: '0.5rem',
                                                  fontSize: '0.875rem',
                                                  fontWeight: '500',
                                                  cursor: 'pointer',
                                                  transition: 'all 0.2s ease',
                                                  boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)'
                                                }}
                                                onMouseEnter={(e) => {
                                                  e.currentTarget.style.background = '#059669';
                                                  e.currentTarget.style.transform = 'translateY(-2px)';
                                                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(16, 185, 129, 0.3)';
                                                }}
                                                onMouseLeave={(e) => {
                                                  e.currentTarget.style.background = '#10b981';
                                                  e.currentTarget.style.transform = 'translateY(0)';
                                                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(16, 185, 129, 0.2)';
                                                }}
                                                title="Copy summary to clipboard"
                                              >
                                                <Copy size={16} />
                                                Copy
                                              </button>
                                            </div>
                                            <div style={{ 
                                              color: theme === 'dark' ? '#e5e7eb' : '#047857',
                                              fontSize: '0.95rem',
                                              lineHeight: '1.6',
                                              whiteSpace: 'pre-wrap'
                                            }}>
                                              {summaryConfig[question.id].summary}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                            {selectedCategoryFilter ? 
                              'No questions found in this category. Try a different category or clear the filter.' :
                              'No questions found for this subject. Add your first question!'
                            }
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'question-categories' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3>Question Categories {selectedSubject && `- ${selectedSubject.name}`}</h3>
                  {selectedSubject && (
                    <button 
                      className="btn btn-primary"
                      onClick={() => openQuestionCategoryModal(selectedSubject.id)}
                    >
                      <Plus size={16} /> Add Category
                    </button>
                  )}
                </div>
                
                {/* Subject Selection Filter */}
                <div className="card" style={{ marginBottom: '1rem' }}>
                  <div className="card-body">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                      <label style={{ fontWeight: '600', color: '#444' }}>Filter by Subject:</label>
                      <select 
                        value={selectedSubject?.id || ''} 
                        onChange={(e) => {
                          const subject = subjects.find(s => s.id === parseInt(e.target.value));
                          setSelectedSubject(subject || null);
                          if (subject) {
                            fetchQuestionCategories(subject.id);
                          } else {
                            setQuestionCategories([]);
                          }
                        }}
                        style={{ 
                          padding: '0.5rem 1rem', 
                          border: '2px solid #e1e5e9', 
                          borderRadius: '6px',
                          fontSize: '0.95rem',
                          minWidth: '200px'
                        }}
                      >
                        <option value="">Select a Subject</option>
                        {subjects.map(subject => (
                          <option key={subject.id} value={subject.id}>
                            {subject.name}
                          </option>
                        ))}
                      </select>
                      {selectedSubject && (
                        <button 
                          className="btn btn-outline"
                          onClick={() => {
                            setSelectedSubject(null);
                            setQuestionCategories([]);
                          }}
                          style={{ fontSize: '0.9rem' }}
                        >
                          Clear Selection
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                
                {!selectedSubject ? (
                  <div className="card">
                    <div className="card-body" style={{ textAlign: 'center', padding: '2rem' }}>
                      <p style={{ color: '#666', marginBottom: '1rem' }}>Please select a subject first</p>
                      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                        {subjects.map(subject => (
                          <button 
                            key={subject.id}
                            className="btn btn-primary"
                            onClick={() => setSelectedSubject(subject)}
                          >
                            {subject.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="card">
                    <div className="card-body">
                      {questionCategories.length > 0 ? (
                        <div className="question-categories-grid">
                          {questionCategories.map(category => (
                            <div key={category.id} className="card">
                              <div className="card-body">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                  <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                      <div 
                                        className="category-color-circle"
                                        style={{ 
                                          backgroundColor: category.color
                                        }}
                                      ></div>
                                      <h5 style={{ margin: 0 }}>{category.name}</h5>
                                    </div>
                                    <p style={{ color: '#666', margin: 0 }}>{category.description || 'No description'}</p>
                                  </div>
                                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button 
                                      className="btn btn-secondary"
                                      onClick={() => {
                                        setEditQuestionCategoryForm({
                                          id: category.id,
                                          name: category.name,
                                          description: category.description || '',
                                          subject_id: category.subject_id,
                                          color: category.color,
                                          is_active: category.is_active
                                        });
                                        setShowEditQuestionCategoryModal(true);
                                      }}
                                    >
                                      <Edit2 size={16} />
                                    </button>
                                    <button 
                                      className="btn btn-danger"
                                      onClick={() => openDeleteConfirm('question-category', category.id, category.name)}
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                </div>
                                <div style={{ fontSize: '0.9rem', color: '#666' }}>
                                  <div><strong>Questions:</strong> {category.questions_count || 0}</div>
                                  <div><strong>Status:</strong> 
                                    <span className={`status-badge ${category.is_active ? 'active' : 'inactive'}`} style={{ marginLeft: '0.5rem' }}>
                                      {category.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                          No question categories found for this subject. Create your first category!
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'api-keys' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3>API Keys</h3>
                  <button 
                    className="btn btn-primary"
                    onClick={() => setShowApiKeyModal(true)}
                  >
                    <Plus size={16} /> Add API Key
                  </button>
                </div>
                
                <div className="card">
                  <div className="card-body">
                    {apiKeys.length > 0 ? (
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr>
                            <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #eee' }}>Name</th>
                            <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #eee' }}>Provider</th>
                            <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #eee' }}>Model</th>
                            <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #eee' }}>Status</th>
                            <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #eee' }}>Created</th>
                            <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #eee' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {apiKeys.map(apiKey => (
                            <tr key={apiKey.id}>
                              <td style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>{apiKey.key_name}</td>
                              <td style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>
                                <span style={{ textTransform: 'capitalize' }}>{apiKey.provider}</span>
                              </td>
                              <td style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>{apiKey.model_name}</td>
                              <td style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>
                                <span className={`status-badge ${apiKey.is_active ? 'active' : 'inactive'}`}>
                                  {apiKey.is_active ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>
                                {new Date(apiKey.created_at).toLocaleDateString()}
                              </td>
                              <td style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                  <button 
                                    className="btn btn-secondary"
                                    onClick={() => {
                                      const provider = providers.find(p => p.id === apiKey.provider) || {};
                                      setApiKeyForm({
                                        id: apiKey.id,
                                        key_name: apiKey.key_name,
                                        api_key: '', // Don't show the actual key for security
                                        provider: apiKey.provider,
                                        base_url: apiKey.base_url || provider.base_url || '',
                                        model_name: apiKey.model_name
                                      });
                                      setShowApiKeyModal(true);
                                    }}
                                  >
                                    <Edit2 size={16} />
                                  </button>
                                  <button 
                                    className="btn btn-danger"
                                    onClick={() => openDeleteConfirm('api-key', apiKey.id, apiKey.key_name)}
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                        No API keys configured. Add your first API key to enable AI question generation!
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'videoAnalytics' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600' }}>
                    <Youtube size={24} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
                    Video Analytics
                  </h3>
                  <button 
                    className="btn btn-primary"
                    onClick={handleExportVideoAnalytics}
                    disabled={videoAnalytics.loading}
                  >
                    <Download size={16} /> Export CSV
                  </button>
                </div>

                {videoAnalytics.loading ? (
                  <div style={{ textAlign: 'center', padding: '3rem' }}>
                    <div className="spinner"></div>
                    <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading analytics...</p>
                  </div>
                ) : (
                  <>
                    {/* Time Period Selector */}
                    <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                      {['day', 'week', 'month', 'year'].map((period) => (
                        <button
                          key={period}
                          onClick={() => handlePeriodChange(period)}
                          style={{
                            padding: '0.75rem 1.5rem',
                            borderRadius: '0.5rem',
                            border: '2px solid',
                            borderColor: selectedTimePeriod === period ? '#667eea' : '#e2e8f0',
                            backgroundColor: selectedTimePeriod === period ? '#667eea' : 'white',
                            color: selectedTimePeriod === period ? 'white' : '#4a5568',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            textTransform: 'capitalize'
                          }}
                        >
                          {period}
                        </button>
                      ))}
                    </div>

                    {/* Quick Stats Cards */}
                    {watchHoursSummary && Object.keys(watchHoursSummary).length > 0 && (
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                        gap: '1rem', 
                        marginBottom: '2rem' 
                      }}>
                        {['today', 'thisWeek', 'thisMonth', 'thisYear', 'allTime'].map((key) => (
                          <div
                            key={key}
                            className="card"
                            style={{
                              backgroundColor: 'white',
                              border: '1px solid #e2e8f0'
                            }}
                          >
                            <div className="card-body">
                              <p style={{ 
                                fontSize: '0.875rem', 
                                color: '#718096', 
                                marginBottom: '0.5rem',
                                textTransform: 'capitalize'
                              }}>
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                              </p>
                              <p style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#2d3748', margin: 0 }}>
                                {watchHoursSummary[key]?.hours?.toFixed(1) || 0} hrs
                              </p>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#a0aec0', marginTop: '0.5rem' }}>
                                <span>{watchHoursSummary[key]?.sessions || 0} sessions</span>
                                <span>{watchHoursSummary[key]?.students || 0} students</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Charts Section */}
                    <div style={{ marginBottom: '2rem' }}>
                      <h4 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
                        Watch Hours Trend
                      </h4>
                      <div className="card">
                        <div className="card-body">
                          {timeSeriesLoading ? (
                            <div style={{ textAlign: 'center', padding: '3rem' }}>
                              <p>Loading chart data...</p>
                            </div>
                          ) : (
                            <WatchHoursTrendChart data={timeSeriesData} period={selectedTimePeriod} />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Growth Rate Chart */}
                    <div style={{ marginBottom: '2rem' }}>
                      <h4 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
                        Growth Analysis
                      </h4>
                      <div className="card">
                        <div className="card-body">
                          <GrowthRateChart data={timeSeriesData} period={selectedTimePeriod} />
                        </div>
                      </div>
                    </div>

                    {/* Engagement Distribution */}
                    <div style={{ marginBottom: '2rem' }}>
                      <h4 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
                        Engagement Distribution
                      </h4>
                      <div className="card">
                        <div className="card-body">
                          <EngagementPieChart analyticsData={videoAnalytics.questions} />
                        </div>
                      </div>
                    </div>

                    {/* Overview Cards */}
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                      gap: '1rem', 
                      marginBottom: '2rem' 
                    }}>
                      <div className="card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none' }}>
                        <div className="card-body">
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.9rem', opacity: 0.9 }}>Total Video Views</span>
                            <Eye size={20} style={{ opacity: 0.8 }} />
                          </div>
                          <div style={{ fontSize: '2rem', fontWeight: '700' }}>
                            {videoAnalytics.overview.totalViews || 0}
                          </div>
                        </div>
                      </div>

                      <div className="card" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white', border: 'none' }}>
                        <div className="card-body">
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.9rem', opacity: 0.9 }}>Unique Videos</span>
                            <Youtube size={20} style={{ opacity: 0.8 }} />
                          </div>
                          <div style={{ fontSize: '2rem', fontWeight: '700' }}>
                            {videoAnalytics.overview.uniqueVideos || 0}
                          </div>
                        </div>
                      </div>

                      <div className="card" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white', border: 'none' }}>
                        <div className="card-body">
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.9rem', opacity: 0.9 }}>Avg Completion</span>
                            <CheckCircle size={20} style={{ opacity: 0.8 }} />
                          </div>
                          <div style={{ fontSize: '2rem', fontWeight: '700' }}>
                            {videoAnalytics.overview.avgCompletionRate ? 
                              `${Math.round(videoAnalytics.overview.avgCompletionRate)}%` : '0%'}
                          </div>
                        </div>
                      </div>

                      <div className="card" style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white', border: 'none' }}>
                        <div className="card-body">
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.9rem', opacity: 0.9 }}>Total Watch Time</span>
                            <Clock size={20} style={{ opacity: 0.8 }} />
                          </div>
                          <div style={{ fontSize: '2rem', fontWeight: '700' }}>
                            {videoAnalytics.overview.totalWatchTime ? 
                              `${Math.floor(videoAnalytics.overview.totalWatchTime / 3600)}h ${Math.floor((videoAnalytics.overview.totalWatchTime % 3600) / 60)}m` : '0h'}
                          </div>
                        </div>
                      </div>

                      <div className="card" style={{ background: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)', color: 'white', border: 'none' }}>
                        <div className="card-body">
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.9rem', opacity: 0.9 }}>Students Engaged</span>
                            <Users size={20} style={{ opacity: 0.8 }} />
                          </div>
                          <div style={{ fontSize: '2rem', fontWeight: '700' }}>
                            {videoAnalytics.overview.studentsEngaged || 0}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Top Videos Table */}
                    <div className="card" style={{ marginBottom: '2rem' }}>
                      <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <TrendingUp size={20} />
                          Top Watched Videos
                        </h4>
                      </div>
                      <div className="card-body" style={{ padding: 0 }}>
                        {videoAnalytics.questions && videoAnalytics.questions.length > 0 ? (
                          <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                              <thead>
                                <tr style={{ background: 'var(--bg-secondary)' }}>
                                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Question</th>
                                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Subject</th>
                                  <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600' }}>Total Views</th>
                                  <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600' }}>Unique Viewers</th>
                                  <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600' }}>Avg Duration</th>
                                  <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600' }}>Completion Rate</th>
                                  <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600' }}>Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {videoAnalytics.questions.slice(0, 10).map((video, index) => (
                                  <tr key={video.question_id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '1rem', maxWidth: '300px' }}>
                                      <div style={{ fontWeight: '500', marginBottom: '0.25rem' }}>
                                        {video.question_text.substring(0, 60)}...
                                      </div>
                                      <a 
                                        href={video.youtube_link} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        style={{ fontSize: '0.85rem', color: 'var(--primary-color)', textDecoration: 'none' }}
                                      >
                                        <Youtube size={14} style={{ verticalAlign: 'middle', marginRight: '0.25rem' }} />
                                        View Video
                                      </a>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                      <span style={{ 
                                        padding: '0.25rem 0.75rem', 
                                        background: 'var(--primary-color)', 
                                        color: 'white', 
                                        borderRadius: '1rem',
                                        fontSize: '0.85rem'
                                      }}>
                                        {video.subject_name || 'N/A'}
                                      </span>
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'center', fontWeight: '600' }}>
                                      {video.total_views}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                                      {video.unique_viewers}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                                      {Math.floor(video.avg_watch_duration / 60)}m {Math.floor(video.avg_watch_duration % 60)}s
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                                      <div style={{ 
                                        display: 'inline-block',
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '1rem',
                                        background: video.avg_completion_rate >= 80 ? '#28a745' : 
                                                   video.avg_completion_rate >= 50 ? '#ffc107' : '#dc3545',
                                        color: 'white',
                                        fontWeight: '600',
                                        fontSize: '0.85rem'
                                      }}>
                                        {Math.round(video.avg_completion_rate)}%
                                      </div>
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                                      <button 
                                        className="btn btn-secondary"
                                        style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                                        onClick={() => {
                                          toast.info('Detailed analytics coming soon!');
                                        }}
                                      >
                                        <Eye size={14} /> Details
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            <Youtube size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                            <p>No video analytics data yet. Videos will appear here once students start watching them.</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Student Engagement Table */}
                    <div className="card">
                      <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Users size={20} />
                          Student Engagement
                        </h4>
                      </div>
                      <div className="card-body" style={{ padding: 0 }}>
                        {videoAnalytics.students && videoAnalytics.students.length > 0 ? (
                          <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                              <thead>
                                <tr style={{ background: 'var(--bg-secondary)' }}>
                                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Student</th>
                                  <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600' }}>Videos Watched</th>
                                  <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600' }}>Total Watch Time</th>
                                  <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600' }}>Avg Completion</th>
                                  <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600' }}>Completed Videos</th>
                                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Last Watched</th>
                                </tr>
                              </thead>
                              <tbody>
                                {videoAnalytics.students.map((student, index) => (
                                  <tr key={student.student_id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '1rem', fontWeight: '500' }}>
                                      <UserCheck size={16} style={{ verticalAlign: 'middle', marginRight: '0.5rem', color: 'var(--primary-color)' }} />
                                      {student.student_name}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'center', fontWeight: '600' }}>
                                      {student.videos_watched}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                                      {Math.floor(student.total_watch_time / 3600)}h {Math.floor((student.total_watch_time % 3600) / 60)}m
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                                      <div style={{ 
                                        display: 'inline-block',
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '1rem',
                                        background: student.avg_completion_rate >= 80 ? '#28a745' : 
                                                   student.avg_completion_rate >= 50 ? '#ffc107' : '#dc3545',
                                        color: 'white',
                                        fontWeight: '600',
                                        fontSize: '0.85rem'
                                      }}>
                                        {Math.round(student.avg_completion_rate)}%
                                      </div>
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                                      {student.completed_videos} / {student.videos_watched}
                                    </td>
                                    <td style={{ padding: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                      {student.last_watched ? new Date(student.last_watched).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      }) : 'N/A'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            <Users size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                            <p>No student engagement data yet. Data will appear here once students start watching videos.</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Data Retention Management Section */}
                    <div style={{ marginTop: '3rem' }}>
                      <DataRetentionManager />
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <Modal isOpen={showSubjectModal} onClose={() => setShowSubjectModal(false)} title="Create New Subject" size="md">
        <form onSubmit={handleSubjectSubmit}>
          <div className="form-group">
            <label>Subject Name</label>
            <input
              type="text"
              value={subjectForm.name}
              onChange={(e) => setSubjectForm({...subjectForm, name: e.target.value})}
              placeholder="Enter subject name"
              required
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={subjectForm.description}
              onChange={(e) => setSubjectForm({...subjectForm, description: e.target.value})}
              placeholder="Enter subject description"
              rows="3"
            />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setShowSubjectModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Subject'}
            </button>
          </div>
        </form>
      </Modal>

      {showQuestionModal && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Add New Question</h3>
              <button className="btn-close" onClick={() => setShowQuestionModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleQuestionSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Subject *</label>
                  <select
                    value={questionForm.subject_id}
                    onChange={(e) => {
                      setQuestionForm({...questionForm, subject_id: e.target.value, category_id: ''});
                      if (e.target.value) {
                        fetchQuestionCategories(e.target.value);
                      }
                    }}
                    required
                  >
                    <option value="">Select a subject</option>
                    {subjects.map(subject => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                </div>
                {questionCategories.length > 0 && (
                  <div className="form-group">
                    <label>Category</label>
                    <select
                      value={questionForm.category_id}
                      onChange={(e) => setQuestionForm({...questionForm, category_id: e.target.value})}
                    >
                      <option value="">No category</option>
                      {questionCategories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="form-group">
                  <label>Question Text *</label>
                  <textarea
                    value={questionForm.question_text}
                    onChange={(e) => setQuestionForm({...questionForm, question_text: e.target.value})}
                    rows="3"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Option A *</label>
                  <input
                    type="text"
                    value={questionForm.option_a}
                    onChange={(e) => setQuestionForm({...questionForm, option_a: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Option B *</label>
                  <input
                    type="text"
                    value={questionForm.option_b}
                    onChange={(e) => setQuestionForm({...questionForm, option_b: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Option C *</label>
                  <input
                    type="text"
                    value={questionForm.option_c}
                    onChange={(e) => setQuestionForm({...questionForm, option_c: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Option D *</label>
                  <input
                    type="text"
                    value={questionForm.option_d}
                    onChange={(e) => setQuestionForm({...questionForm, option_d: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Correct Answer *</label>
                  <select
                    value={questionForm.correct_answer}
                    onChange={(e) => setQuestionForm({...questionForm, correct_answer: e.target.value})}
                    required
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>YouTube Link (optional)</label>
                  <input
                    type="url"
                    value={questionForm.youtube_link}
                    onChange={(e) => setQuestionForm({...questionForm, youtube_link: e.target.value})}
                    placeholder="https://youtube.com/watch?v=..."
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowQuestionModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Modal isOpen={showQuestionCategoryModal} onClose={() => setShowQuestionCategoryModal(false)} title="Add Question Category" size="md">
        <form onSubmit={handleQuestionCategorySubmit}>
          <div className="form-group">
            <label>Subject *</label>
            <select
              value={questionCategoryForm.subject_id}
              onChange={(e) => setQuestionCategoryForm({...questionCategoryForm, subject_id: e.target.value})}
              required
            >
              <option value="">Select a subject</option>
              {subjects.map(subject => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Category Name *</label>
            <input
              type="text"
              value={questionCategoryForm.name}
              onChange={(e) => setQuestionCategoryForm({...questionCategoryForm, name: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={questionCategoryForm.description}
              onChange={(e) => setQuestionCategoryForm({...questionCategoryForm, description: e.target.value})}
              rows="3"
            />
          </div>
          <div className="form-group">
            <label>Color</label>
            <input
              type="color"
              value={questionCategoryForm.color}
              onChange={(e) => setQuestionCategoryForm({...questionCategoryForm, color: e.target.value})}
            />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setShowQuestionCategoryModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Category'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showApiKeyModal} onClose={() => setShowApiKeyModal(false)} title={apiKeyForm.id ? 'Edit API Key' : 'Add API Key'} size="md">
        <form onSubmit={handleApiKeySubmit}>
          <div className="form-group">
            <label>Key Name *</label>
            <input
              type="text"
              value={apiKeyForm.key_name}
              onChange={(e) => setApiKeyForm({...apiKeyForm, key_name: e.target.value})}
              placeholder="My API Key"
              required
            />
            <small style={{ color: '#666', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
              Give your API key a memorable name (e.g., "OpenRouter Free", "Perplexity Pro")
            </small>
          </div>
          <div className="form-group">
            <label>Provider *</label>
            <select
              value={apiKeyForm.provider}
              onChange={(e) => {
                const provider = providers.find(p => p.id === e.target.value) || {};
                setApiKeyForm({
                  ...apiKeyForm,
                  provider: e.target.value,
                  base_url: provider.base_url || '',
                  model_name: provider.default_model || ''
                });
              }}
              required
            >
              <option value="">Select a provider</option>
              {providers.map(provider => (
                <option key={provider.id} value={provider.id}>
                  {provider.name}
                </option>
              ))}
            </select>
            <small style={{ color: '#666', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
              Choose between OpenRouter or Perplexity API
            </small>
          </div>
          <div className="form-group">
            <label>API Key *</label>
            <input
              type="password"
              value={apiKeyForm.api_key}
              onChange={(e) => setApiKeyForm({...apiKeyForm, api_key: e.target.value})}
              placeholder={apiKeyForm.id ? "Leave empty to keep existing key" : "Enter your API key"}
              required={!apiKeyForm.id}
            />
            <small style={{ color: '#666', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
              Your API key will be stored securely
            </small>
          </div>
          <div className="form-group">
            <label>Base URL *</label>
            <input
              type="text"
              value={apiKeyForm.base_url}
              onChange={(e) => setApiKeyForm({...apiKeyForm, base_url: e.target.value})}
              placeholder="https://openrouter.ai/api/v1"
              required
            />
            <small style={{ color: '#666', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
              Auto-fills based on provider. You can edit if needed.
            </small>
          </div>
          <div className="form-group">
            <label>Model Name *</label>
            <input
              type="text"
              value={apiKeyForm.model_name}
              onChange={(e) => setApiKeyForm({...apiKeyForm, model_name: e.target.value})}
              placeholder="Enter model name"
              required
            />
            <small style={{ color: '#666', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
              {apiKeyForm.provider === 'openrouter' && 'Examples: meta-llama/llama-3.1-8b-instruct:free, google/gemma-2-9b-it:free'}
              {apiKeyForm.provider === 'perplexity' && 'Examples: llama-3.1-sonar-small-128k-online, llama-3.1-sonar-large-128k-online'}
              {!apiKeyForm.provider && 'Select a provider to see model examples'}
            </small>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setShowApiKeyModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? (apiKeyForm.id ? 'Updating...' : 'Saving...') : (apiKeyForm.id ? 'Update Key' : 'Save Key')}
            </button>
          </div>
        </form>
      </Modal>

      {showGenerateModal && (
        <div className="modal">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3>
                <Zap size={20} style={{ color: '#fbbf24', marginRight: '0.5rem' }} />
                Generate Questions with AI
              </h3>
              <button className="btn-close" onClick={() => setShowGenerateModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleGenerateSubmit}>
              <div className="modal-body">
                {apiKeys.length === 0 ? (
                  <div style={{ 
                    background: '#fff3cd', 
                    border: '1px solid #ffeaa7', 
                    padding: '1rem', 
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>
                    <p style={{ margin: '0 0 1rem 0', color: '#856404' }}>
                      ⚠️ No API keys configured. You need to add an API key first.
                    </p>
                    <button 
                      type="button"
                      className="btn btn-primary"
                      onClick={() => {
                        setShowGenerateModal(false);
                        setShowApiKeyModal(true);
                      }}
                    >
                      <Key size={16} /> Configure API Key
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="form-group">
                      <label>API Key *</label>
                      <select
                        value={generateForm.api_key_id}
                        onChange={(e) => setGenerateForm({...generateForm, api_key_id: e.target.value})}
                        required
                        style={{ 
                          padding: '0.5rem 1rem', 
                          border: '2px solid #e1e5e9', 
                          borderRadius: '6px',
                          fontSize: '0.95rem'
                        }}
                      >
                        <option value="">Select an API Key</option>
                        {apiKeys.filter(key => key.is_active).map(apiKey => (
                          <option key={apiKey.id} value={apiKey.id}>
                            {apiKey.key_name} ({apiKey.provider})
                          </option>
                        ))}
                      </select>
                      <small style={{ color: '#666', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
                        Only active API keys are shown. Configure more in the API Keys section.
                      </small>
                    </div>
                    
                    <div className="form-group">
                      <label>Subject *</label>
                      <select
                        value={generateForm.subject_id}
                        onChange={(e) => {
                          setGenerateForm({...generateForm, subject_id: e.target.value, category_id: ''});
                          if (e.target.value) {
                            fetchQuestionCategories(e.target.value);
                          }
                        }}
                        required
                      >
                        <option value="">Select a subject</option>
                        {subjects.map(subject => (
                          <option key={subject.id} value={subject.id}>
                            {subject.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    {questionCategories.length > 0 && (
                      <div className="form-group">
                        <label>Category (optional)</label>
                        <select
                          value={generateForm.category_id}
                          onChange={(e) => setGenerateForm({...generateForm, category_id: e.target.value})}
                        >
                          <option value="">No specific category</option>
                          {questionCategories.map(category => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    
                    <div className="form-group">
                      <label>Topic/Theme *</label>
                      <input
                        type="text"
                        value={generateForm.topic}
                        onChange={(e) => setGenerateForm({...generateForm, topic: e.target.value})}
                        placeholder="e.g., Algebra basics, World War II, Cell biology"
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Number of Questions *</label>
                      <input
                        type="number"
                        value={generateForm.count}
                        onChange={(e) => setGenerateForm({...generateForm, count: parseInt(e.target.value) || 1})}
                        min="1"
                        max="20"
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Difficulty Level</label>
                      <select
                        value={generateForm.difficulty}
                        onChange={(e) => setGenerateForm({...generateForm, difficulty: e.target.value})}
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                    
                    <div className="form-group">
                      <label>Question Language *</label>
                      <select
                        value={generateForm.language}
                        onChange={(e) => setGenerateForm({...generateForm, language: e.target.value})}
                        required
                        style={{ 
                          padding: '0.5rem 1rem', 
                          border: '2px solid #e1e5e9', 
                          borderRadius: '6px',
                          fontSize: '0.95rem',
                          fontWeight: '500'
                        }}
                      >
                        <option value="English">English</option>
                        <option value="Marathi">Marathi (मराठी)</option>
                        <option value="Hindi">Hindi (हिंदी)</option>
                      </select>
                      <small style={{ color: '#666', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
                        Questions and options will be generated in the selected language
                      </small>
                    </div>
                    
                    <div className="form-group">
                      <label>Additional Instructions (optional)</label>
                      <textarea
                        value={generateForm.instructions}
                        onChange={(e) => setGenerateForm({...generateForm, instructions: e.target.value})}
                        rows="3"
                        placeholder="Any specific requirements or focus areas..."
                      />
                    </div>
                    
                    <div style={{ 
                      background: '#e3f2fd', 
                      border: '1px solid #bbdefb', 
                      padding: '1rem', 
                      borderRadius: '8px',
                      fontSize: '0.9rem'
                    }}>
                      <p style={{ margin: '0 0 0.5rem 0', fontWeight: '600', color: '#1565c0' }}>
                        🤖 AI Generation Info:
                      </p>
                      <ul style={{ margin: '0', paddingLeft: '1.5rem', color: '#1976d2' }}>
                        <li>Questions will be generated using your selected API key and model</li>
                        <li>Each question will have 4 multiple choice options</li>
                        <li>The AI will determine the correct answer for each question</li>
                        <li>Generation may take 30-60 seconds depending on the number of questions</li>
                        <li>Make sure you have sufficient API credits for generation</li>
                      </ul>
                    </div>
                  </>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowGenerateModal(false)}>
                  Cancel
                </button>
                {apiKeys.length > 0 && (
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? (
                      <>
                        <div className="spinner" style={{ width: '16px', height: '16px', marginRight: '0.5rem' }}></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <Zap size={16} /> Generate Questions
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {showSubcategoryModal && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Add Category</h3>
              <button className="btn-close" onClick={() => setShowSubcategoryModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubcategorySubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Category Name *</label>
                  <input
                    type="text"
                    value={subcategoryForm.name}
                    onChange={(e) => setSubcategoryForm({...subcategoryForm, name: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={subcategoryForm.description}
                    onChange={(e) => setSubcategoryForm({...subcategoryForm, description: e.target.value})}
                    rows="3"
                  />
                </div>
                <div className="form-group">
                  <label>Subject</label>
                  <select
                    value={subcategoryForm.subject_id}
                    onChange={(e) => setSubcategoryForm({...subcategoryForm, subject_id: e.target.value})}
                  >
                    <option value="">Select a subject (optional)</option>
                    {subjects.map(subject => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowSubcategoryModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditSubjectModal && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Edit Subject</h3>
              <button className="btn-close" onClick={() => setShowEditSubjectModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEditSubjectSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Subject Name *</label>
                  <input
                    type="text"
                    value={editSubjectForm.name}
                    onChange={(e) => setEditSubjectForm({...editSubjectForm, name: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={editSubjectForm.description}
                    onChange={(e) => setEditSubjectForm({...editSubjectForm, description: e.target.value})}
                    rows="3"
                  />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={editSubjectForm.subcategory_id}
                    onChange={(e) => setEditSubjectForm({...editSubjectForm, subcategory_id: e.target.value})}
                  >
                    <option value="">Select a category (optional)</option>
                    {subcategories.map(subcategory => (
                      <option key={subcategory.id} value={subcategory.id}>
                        {subcategory.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditSubjectModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditQuestionModal && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Edit Question</h3>
              <button className="btn-close" onClick={() => setShowEditQuestionModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEditQuestionSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Subject *</label>
                  <select
                    value={editQuestionForm.subject_id}
                    onChange={(e) => {
                      setEditQuestionForm({...editQuestionForm, subject_id: e.target.value, category_id: ''});
                      if (e.target.value) {
                        fetchQuestionCategories(e.target.value);
                      }
                    }}
                    required
                  >
                    <option value="">Select a subject</option>
                    {subjects.map(subject => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                </div>
                {questionCategories.length > 0 && (
                  <div className="form-group">
                    <label>Category</label>
                    <select
                      value={editQuestionForm.category_id}
                      onChange={(e) => setEditQuestionForm({...editQuestionForm, category_id: e.target.value})}
                    >
                      <option value="">No category</option>
                      {questionCategories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="form-group">
                  <label>Question Text *</label>
                  <textarea
                    value={editQuestionForm.question_text}
                    onChange={(e) => setEditQuestionForm({...editQuestionForm, question_text: e.target.value})}
                    rows="3"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Option A *</label>
                  <input
                    type="text"
                    value={editQuestionForm.option_a}
                    onChange={(e) => setEditQuestionForm({...editQuestionForm, option_a: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Option B *</label>
                  <input
                    type="text"
                    value={editQuestionForm.option_b}
                    onChange={(e) => setEditQuestionForm({...editQuestionForm, option_b: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Option C *</label>
                  <input
                    type="text"
                    value={editQuestionForm.option_c}
                    onChange={(e) => setEditQuestionForm({...editQuestionForm, option_c: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Option D *</label>
                  <input
                    type="text"
                    value={editQuestionForm.option_d}
                    onChange={(e) => setEditQuestionForm({...editQuestionForm, option_d: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Correct Answer *</label>
                  <select
                    value={editQuestionForm.correct_answer}
                    onChange={(e) => setEditQuestionForm({...editQuestionForm, correct_answer: e.target.value})}
                    required
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>YouTube Link (optional)</label>
                  <input
                    type="url"
                    value={editQuestionForm.youtube_link}
                    onChange={(e) => setEditQuestionForm({...editQuestionForm, youtube_link: e.target.value})}
                    placeholder="https://youtube.com/watch?v=..."
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditQuestionModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Exam Modal */}
      {showExamModal && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Create New Exam</h3>
              <button className="btn-close" onClick={() => setShowExamModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleExamSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Exam Title *</label>
                  <input
                    type="text"
                    value={examForm.title}
                    onChange={(e) => setExamForm({...examForm, title: e.target.value})}
                    required
                    placeholder="Enter exam title"
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={examForm.description}
                    onChange={(e) => setExamForm({...examForm, description: e.target.value})}
                    rows="3"
                    placeholder="Enter exam description"
                  />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={examForm.category}
                    onChange={(e) => setExamForm({...examForm, category: e.target.value})}
                  >
                    <option value="general">General</option>
                    <option value="test">Test</option>
                    <option value="quiz">Quiz</option>
                    <option value="practice">Practice</option>
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Start Date *</label>
                    <input
                      type="date"
                      value={examForm.start_date}
                      onChange={(e) => setExamForm({...examForm, start_date: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Start Time *</label>
                    <input
                      type="time"
                      value={examForm.start_time}
                      onChange={(e) => setExamForm({...examForm, start_time: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>End Date *</label>
                    <input
                      type="date"
                      value={examForm.end_date}
                      onChange={(e) => setExamForm({...examForm, end_date: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>End Time *</label>
                    <input
                      type="time"
                      value={examForm.end_time}
                      onChange={(e) => setExamForm({...examForm, end_time: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Duration (minutes) *</label>
                  <input
                    type="number"
                    value={examForm.duration_minutes}
                    onChange={(e) => setExamForm({...examForm, duration_minutes: parseInt(e.target.value) || 60})}
                    min="1"
                    max="480"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={examForm.status}
                    onChange={(e) => setExamForm({...examForm, status: e.target.value})}
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                
                {/* Question Selection Section */}
                <div className="form-group">
                  <label>Select Questions *</label>
                  <div style={{ 
                    border: '2px dashed #ddd', 
                    padding: '1rem', 
                    borderRadius: '8px', 
                    textAlign: 'center',
                    background: '#f8f9fa'
                  }}>
                    <div style={{ marginBottom: '1rem' }}>
                      <h4 style={{ margin: '0 0 0.5rem 0', color: '#666' }}>Selected Questions: {examForm.selectedQuestions.length}</h4>
                      <p style={{ margin: '0', fontSize: '0.9rem', color: '#666' }}>
                        Click the button below to select questions from your question bank
                      </p>
                    </div>
                    
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => {
                        setShowQuestionSelectionModal(true);
                        setAvailableQuestions([]);
                        setQuestionSelectionFilters({ subjectId: '', categoryId: '' });
                      }}
                      style={{ marginBottom: '1rem' }}
                    >
                      <Plus size={16} /> Select Questions
                    </button>
                    
                    {examForm.selectedQuestions.length > 0 && (
                      <div>
                        <div style={{ 
                          background: '#e3f2fd', 
                          padding: '0.75rem', 
                          borderRadius: '6px',
                          marginBottom: '0.5rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <span style={{ fontWeight: '600', color: '#1976d2' }}>
                            ✓ {examForm.selectedQuestions.length} question{examForm.selectedQuestions.length !== 1 ? 's' : ''} selected
                          </span>
                          <button
                            type="button"
                            onClick={() => setExamForm({...examForm, selectedQuestions: [], total_questions: 0})}
                            style={{ 
                              padding: '0.25rem 0.5rem', 
                              fontSize: '0.8rem',
                              background: '#dc3545',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            Clear All
                          </button>
                        </div>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => {
                            setShowQuestionSelectionModal(true);
                            // Keep existing selections
                          }}
                        >
                          <Edit2 size={16} /> Modify Selection
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '8px', marginTop: '1rem' }}>
                  <p style={{ margin: '0', color: '#666', fontSize: '0.9rem' }}>
                    📝 <strong>Important:</strong> Please select at least one question from the list above. Choose a subject first to see available questions.
                  </p>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowExamModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Exam'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Exam Modal */}
      {showEditExamModal && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Edit Exam</h3>
              <button className="btn-close" onClick={() => setShowEditExamModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEditExamSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Exam Title *</label>
                  <input
                    type="text"
                    value={editExamForm.title}
                    onChange={(e) => setEditExamForm({...editExamForm, title: e.target.value})}
                    required
                    placeholder="Enter exam title"
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={editExamForm.description}
                    onChange={(e) => setEditExamForm({...editExamForm, description: e.target.value})}
                    rows="3"
                    placeholder="Enter exam description"
                  />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={editExamForm.category}
                    onChange={(e) => setEditExamForm({...editExamForm, category: e.target.value})}
                  >
                    <option value="general">General</option>
                    <option value="test">Test</option>
                    <option value="quiz">Quiz</option>
                    <option value="practice">Practice</option>
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Start Date *</label>
                    <input
                      type="date"
                      value={editExamForm.start_date}
                      onChange={(e) => setEditExamForm({...editExamForm, start_date: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Start Time *</label>
                    <input
                      type="time"
                      value={editExamForm.start_time}
                      onChange={(e) => setEditExamForm({...editExamForm, start_time: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>End Date *</label>
                    <input
                      type="date"
                      value={editExamForm.end_date}
                      onChange={(e) => setEditExamForm({...editExamForm, end_date: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>End Time *</label>
                    <input
                      type="time"
                      value={editExamForm.end_time}
                      onChange={(e) => setEditExamForm({...editExamForm, end_time: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Duration (minutes) *</label>
                  <input
                    type="number"
                    value={editExamForm.duration_minutes}
                    onChange={(e) => setEditExamForm({...editExamForm, duration_minutes: parseInt(e.target.value) || 60})}
                    min="1"
                    max="480"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={editExamForm.status}
                    onChange={(e) => setEditExamForm({...editExamForm, status: e.target.value})}
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '8px', marginTop: '1rem' }}>
                  <p style={{ margin: '0', color: '#666', fontSize: '0.9rem' }}>
                    📝 <strong>Note:</strong> To modify questions, use the Questions section after saving.
                  </p>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditExamModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Exam'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Question Selection Modal */}
      {showQuestionSelectionModal && (
        <div className="modal" style={{ zIndex: 1050 }}>
          <div className="modal-content">
            <div className="modal-header">
              <h3>Select Questions for Exam</h3>
              <button className="btn-close" onClick={() => setShowQuestionSelectionModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              {/* Subject and Category Filters */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '1rem', 
                marginBottom: '1.5rem',
                padding: '1rem',
                background: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #dee2e6'
              }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>Filter by Subject *</label>
                  <select
                    value={questionSelectionFilters.subjectId || ''}
                    onChange={(e) => {
                      const subjectId = e.target.value;
                      setQuestionSelectionFilters({ subjectId, categoryId: '' });
                      if (subjectId) {
                        fetchQuestionsForExam(subjectId, '');
                        fetchQuestionCategories(subjectId);
                      } else {
                        setAvailableQuestions([]);
                        setQuestionCategories([]);
                      }
                    }}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ced4da' }}
                  >
                    <option value="">Choose a subject...</option>
                    {subjects.map(subject => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>Filter by Category</label>
                  <select
                    value={questionSelectionFilters.categoryId || ''}
                    onChange={(e) => {
                      const categoryId = e.target.value;
                      setQuestionSelectionFilters({ 
                        ...questionSelectionFilters, 
                        categoryId 
                      });
                      if (questionSelectionFilters.subjectId) {
                        fetchQuestionsForExam(questionSelectionFilters.subjectId, categoryId);
                      }
                    }}
                    style={{ 
                      width: '100%', 
                      padding: '0.75rem', 
                      borderRadius: '4px', 
                      border: '1px solid #ced4da',
                      opacity: !questionSelectionFilters.subjectId ? 0.6 : 1 
                    }}
                    disabled={!questionSelectionFilters.subjectId}
                  >
                    <option value="">All Categories</option>
                    {questionCategories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Questions List */}
              <div style={{ minHeight: '300px' }}>
                {!questionSelectionFilters.subjectId ? (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '3rem 1rem',
                    color: '#666',
                    background: '#f8f9fa',
                    borderRadius: '8px',
                    border: '2px dashed #dee2e6'
                  }}>
                    <BookOpen size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                    <h4 style={{ margin: '0 0 0.5rem 0' }}>Select a Subject First</h4>
                    <p style={{ margin: 0 }}>Choose a subject from the dropdown above to view available questions</p>
                  </div>
                ) : availableQuestions.length === 0 ? (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '3rem 1rem',
                    color: '#666',
                    background: '#fff3cd',
                    borderRadius: '8px',
                    border: '1px solid #ffeaa7'
                  }}>
                    <h4 style={{ margin: '0 0 0.5rem 0' }}>No Questions Found</h4>
                    <p style={{ margin: 0 }}>No questions available for the selected subject{questionSelectionFilters.categoryId ? ' and category' : ''}. Please try different filters or add questions first.</p>
                  </div>
                ) : (
                  <div>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: '1rem',
                      padding: '0.75rem',
                      background: '#e3f2fd',
                      borderRadius: '6px',
                      border: '1px solid #bbdefb'
                    }}>
                      <span style={{ fontWeight: '600', color: '#1976d2' }}>
                        📄 Found {availableQuestions.length} question{availableQuestions.length !== 1 ? 's' : ''}
                      </span>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          type="button"
                          onClick={() => {
                            const allQuestionIds = availableQuestions.map(q => q.id);
                            const newSelected = [...new Set([...examForm.selectedQuestions, ...allQuestionIds])];
                            setExamForm({
                              ...examForm,
                              selectedQuestions: newSelected,
                              total_questions: newSelected.length
                            });
                          }}
                          style={{ 
                            padding: '0.25rem 0.75rem',
                            fontSize: '0.8rem',
                            background: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          Select All
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const currentQuestionIds = availableQuestions.map(q => q.id);
                            const newSelected = examForm.selectedQuestions.filter(id => !currentQuestionIds.includes(id));
                            setExamForm({
                              ...examForm,
                              selectedQuestions: newSelected,
                              total_questions: newSelected.length
                            });
                          }}
                          style={{ 
                            padding: '0.25rem 0.75rem',
                            fontSize: '0.8rem',
                            background: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          Deselect All
                        </button>
                      </div>
                    </div>
                    
                    <div style={{ 
                      maxHeight: '400px', 
                      overflowY: 'auto', 
                      border: '1px solid #dee2e6', 
                      borderRadius: '8px',
                      background: 'white'
                    }}>
                      {availableQuestions.map((question, index) => (
                        <div key={question.id} style={{ 
                          padding: '1rem', 
                          borderBottom: index < availableQuestions.length - 1 ? '1px solid #f0f0f0' : 'none',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '0.75rem',
                          background: examForm.selectedQuestions.includes(question.id) ? '#f0f8ff' : 'transparent',
                          transition: 'background-color 0.2s ease'
                        }}>                          
                          <input
                            type="checkbox"
                            checked={examForm.selectedQuestions.includes(question.id)}
                            onChange={(e) => {
                              const questionId = question.id;
                              let newSelected;
                              if (e.target.checked) {
                                newSelected = [...examForm.selectedQuestions, questionId];
                              } else {
                                newSelected = examForm.selectedQuestions.filter(id => id !== questionId);
                              }
                              setExamForm({
                                ...examForm, 
                                selectedQuestions: newSelected,
                                total_questions: newSelected.length
                              });
                            }}
                            style={{ 
                              marginTop: '0.25rem',
                              transform: 'scale(1.2)',
                              cursor: 'pointer'
                            }}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ 
                              fontSize: '1rem', 
                              fontWeight: '500', 
                              marginBottom: '0.5rem',
                              lineHeight: '1.4',
                              color: '#333'
                            }}>
                              {question.question_text}
                            </div>
                            <div style={{ 
                              fontSize: '0.85rem', 
                              color: '#666',
                              display: 'flex',
                              gap: '1rem',
                              flexWrap: 'wrap'
                            }}>
                              <span><strong>Subject:</strong> {question.subject_name}</span>
                              {question.category_name && (
                                <span><strong>Category:</strong> {question.category_name}</span>
                              )}
                              <span><strong>Answer:</strong> {question.correct_answer}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer" style={{ 
              background: '#f8f9fa',
              borderTop: '1px solid #dee2e6',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>
                <strong>{examForm.selectedQuestions.length}</strong> question{examForm.selectedQuestions.length !== 1 ? 's' : ''} selected for this exam
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowQuestionSelectionModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={() => {
                    setShowQuestionSelectionModal(false);
                    toast.success(`Selected ${examForm.selectedQuestions.length} questions for the exam`);
                  }}
                  disabled={examForm.selectedQuestions.length === 0}
                >
                  ✓ Confirm Selection ({examForm.selectedQuestions.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div 
            onClick={(e) => e.stopPropagation()} 
            style={{ 
              maxWidth: '520px',
              width: '92%',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
              background: '#ffffff',
              position: 'relative',
              zIndex: 1050
            }}
          >
            <div 
              style={{ 
                background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
                color: 'white',
                padding: '1.5rem 2rem',
                borderBottom: 'none',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderRadius: '16px 16px 0 0'
              }}
            >
              <h3 style={{ 
                margin: 0, 
                color: 'white',
                fontSize: '1.25rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <Trash2 size={22} />
                Confirm Delete
              </h3>
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                style={{ 
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  color: 'white',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  fontSize: '1.5rem'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
              >
                <X size={20} />
              </button>
            </div>
            
            <div style={{ padding: '2rem', background: '#ffffff' }}>
              {/* Warning Box */}
              <div style={{ 
                padding: '1.5rem',
                textAlign: 'center',
                background: 'linear-gradient(135deg, #fff3cd 0%, #ffe69c 100%)',
                border: '2px solid #ffc107',
                borderRadius: '12px',
                marginBottom: '1.5rem',
                boxShadow: '0 4px 12px rgba(255, 193, 7, 0.2)'
              }}>
                <div style={{ 
                  fontSize: '3.5rem', 
                  marginBottom: '0.75rem',
                  filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))'
                }}>
                  ⚠️
                </div>
                <h4 style={{ 
                  marginBottom: '0.5rem', 
                  color: '#856404',
                  fontSize: '1.25rem',
                  fontWeight: '600'
                }}>
                  Are you sure?
                </h4>
                <p style={{ 
                  margin: 0, 
                  color: '#856404',
                  fontSize: '0.95rem',
                  fontWeight: '500'
                }}>
                  This action cannot be undone.
                </p>
              </div>
              
              {/* Item Details */}
              <div style={{ 
                padding: '1.25rem',
                background: '#f8f9fa',
                borderRadius: '10px',
                marginBottom: '1.25rem',
                border: '1px solid #e9ecef'
              }}>
                <div style={{ 
                  marginBottom: '0.75rem',
                  fontSize: '0.95rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <strong style={{ 
                    color: '#495057',
                    minWidth: '60px'
                  }}>Type:</strong>
                  <span style={{ 
                    textTransform: 'capitalize',
                    color: '#6c757d',
                    background: '#e9ecef',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}>
                    {deleteItem.type?.replace('-', ' ')}
                  </span>
                </div>
                <div style={{ 
                  fontSize: '0.95rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.5rem'
                }}>
                  <strong style={{ 
                    color: '#495057',
                    minWidth: '60px',
                    paddingTop: '0.1rem'
                  }}>Name:</strong>
                  <span style={{ 
                    color: '#212529',
                    fontWeight: '500',
                    wordBreak: 'break-word',
                    flex: 1
                  }}>
                    {deleteItem.name}
                  </span>
                </div>
              </div>
              
              {/* Warning Message */}
              <div style={{ 
                padding: '1rem',
                background: '#fff5f5',
                border: '1px solid #feb2b2',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem'
              }}>
                <div style={{ 
                  color: '#e53e3e',
                  fontSize: '1.25rem',
                  paddingTop: '0.1rem'
                }}>
                  ⚠️
                </div>
                <p style={{ 
                  color: '#742a2a',
                  marginBottom: '0',
                  fontSize: '0.9rem',
                  lineHeight: '1.6',
                  flex: 1
                }}>
                  You are about to permanently delete this <strong>{deleteItem.type?.replace('-', ' ')}</strong>. 
                  This will remove all associated data and cannot be recovered.
                </p>
              </div>
            </div>
            
            <div 
              style={{ 
                background: '#f8f9fa',
                borderTop: '1px solid #dee2e6',
                padding: '1.25rem 2rem',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.75rem',
                borderRadius: '0 0 16px 16px'
              }}
            >
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setShowDeleteConfirm(false)}
                disabled={loading}
                style={{
                  padding: '0.75rem 1.5rem',
                  fontSize: '0.95rem',
                  fontWeight: '500',
                  borderRadius: '8px',
                  transition: 'all 0.2s'
                }}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-danger" 
                onClick={handleDeleteConfirm}
                disabled={loading}
                style={{ 
                  minWidth: '140px',
                  padding: '0.75rem 1.5rem',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  borderRadius: '8px',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                {loading ? (
                  <>
                    <span style={{ 
                      display: 'inline-block',
                      width: '16px',
                      height: '16px',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite'
                    }}></span>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={18} />
                    Delete Permanently
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminDashboard;
