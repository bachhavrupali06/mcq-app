import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { UserPlus } from 'lucide-react';

const StudentRegister = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    mobile_number: ''
  });
  const [loading, setLoading] = useState(false);
  const { register, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && user.role === 'student') {
      navigate('/student/dashboard');
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.username || formData.username.trim() === '') {
      toast.error('Username is required');
      return;
    }

    // Validate username length (minimum 8 characters)
    if (formData.username.trim().length < 8) {
      toast.error('Username must be at least 8 characters long');
      return;
    }

    // Validate username contains at least one special character
    const specialCharRegex = /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\/;'`~]/;
    if (!specialCharRegex.test(formData.username)) {
      toast.error('Username must contain at least one special character (!@#$%^&*(),.?":{}|<>_-+=[]\\\\/ etc.)');
      return;
    }

    if (!formData.mobile_number || formData.mobile_number.trim() === '') {
      toast.error('Mobile number is required');
      return;
    }

    // Validate mobile number is exactly 10 digits
    const mobileRegex = /^[0-9]{10}$/;
    if (!mobileRegex.test(formData.mobile_number.trim())) {
      toast.error('Mobile number must be exactly 10 digits');
      return;
    }

    if (!formData.password || formData.password.trim() === '') {
      toast.error('Password is required');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    const result = await register({
      username: formData.username,
      password: formData.password,
      mobile_number: formData.mobile_number
    });
    
    if (result.success) {
      toast.success('Registration successful! Please login.');
      navigate('/student/login');
    } else {
      toast.error(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <UserPlus size={48} style={{ color: '#667eea', margin: '0 auto 1rem' }} />
          <h1>Student Registration</h1>
          <p>Create your account to start taking exams</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">
              Username <span style={{ color: '#dc3545' }}>*</span>
            </label>
            <input
              type="text"
              id="username"
              name="username"
              className="form-control"
              value={formData.username}
              onChange={handleChange}
              required
              placeholder="Choose a username (min 8 chars)"
              minLength={8}
            />
            <small style={{ color: '#666', fontSize: '0.85rem', display: 'block', marginTop: '0.25rem' }}>
              Must be at least 8 characters and contain a special character (!@#$%^&* etc.)
            </small>
          </div>
          
          <div className="form-group">
            <label htmlFor="mobile_number">
              Mobile Number <span style={{ color: '#dc3545' }}>*</span>
            </label>
            <input
              type="tel"
              id="mobile_number"
              name="mobile_number"
              className="form-control"
              value={formData.mobile_number}
              onChange={handleChange}
              required
              placeholder="Enter 10-digit mobile number"
              pattern="[0-9]{10}"
              minLength={10}
              maxLength={10}
            />
            <small style={{ color: '#666', fontSize: '0.85rem', display: 'block', marginTop: '0.25rem' }}>
              Must be exactly 10 digits (e.g., 9876543210)
            </small>
          </div>
          
          <div className="form-group">
            <label htmlFor="password">
              Password <span style={{ color: '#dc3545' }}>*</span>
            </label>
            <input
              type="password"
              id="password"
              name="password"
              className="form-control"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Choose a password (min 6 characters)"
              minLength={6}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">
              Confirm Password <span style={{ color: '#dc3545' }}>*</span>
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              className="form-control"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="Confirm your password"
            />
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>
        
        <div className="auth-links">
          <p>
            Already have an account? <Link to="/student/login">Login here</Link>
          </p>
          <p>
            <Link to="/admin/login">Admin Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default StudentRegister;