import React from 'react';
import { Menu, Sun, Moon, LogOut, User, BookOpen } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const TopNavbar = ({ user, onLogout, onToggleSidebar }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="top-navbar">
      <div className="top-navbar-left">
        <button className="sidebar-toggle-btn" onClick={onToggleSidebar}>
          <Menu size={24} />
        </button>
        <div className="navbar-brand">
          <BookOpen size={24} className="brand-icon" style={{ color: '#667eea', marginRight: '0.5rem' }} />
          <span className="brand-text">MCQ Exam System</span>
        </div>
      </div>

      <div className="top-navbar-right">
        <button
          className="icon-btn theme-toggle-btn" 
          onClick={toggleTheme}
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>

        <div className="user-info">
          <div className="user-avatar">
            <User size={18} />
          </div>
          <div className="user-details">
            <span className="user-name">{user?.username || 'User'}</span>
            <span className="user-role">{user?.role || 'Guest'}</span>
          </div>
        </div>

        <button className="btn-logout" onClick={onLogout} title="Logout">
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </nav>
  );
};

export default TopNavbar;
