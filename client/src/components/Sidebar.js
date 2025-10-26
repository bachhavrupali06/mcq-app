import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  BookOpen, 
  HelpCircle, 
  Key, 
  List,
  FileQuestion,
  Award,
  UserCircle,
  ClipboardList,
  Youtube
} from 'lucide-react';

const Sidebar = ({ isOpen, activeTab, setActiveTab, userRole, onClose }) => {
  const adminMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'exams', label: 'Exams', icon: Calendar },
    { id: 'subjects', label: 'Subjects', icon: BookOpen },
    { id: 'subcategories', label: 'Categories', icon: List },
    { id: 'questions', label: 'Questions', icon: HelpCircle },
    { id: 'question-categories', label: 'Question Categories', icon: FileQuestion },
    { id: 'videoAnalytics', label: 'Video Analytics', icon: Youtube },
    { id: 'api-keys', label: 'API Keys', icon: Key }
  ];

  const studentMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'exams', label: 'My Exams', icon: Calendar },
    { id: 'results', label: 'My Results', icon: Award },
    { id: 'profile', label: 'Profile', icon: UserCircle }
  ];

  const menuItems = userRole === 'admin' ? adminMenuItems : studentMenuItems;

  const handleOverlayClick = () => {
    if (onClose) {
      onClose();
    }
  };

  const handleMenuItemClick = (itemId) => {
    if (setActiveTab) {
      setActiveTab(itemId);
    }
    // Close sidebar on mobile when menu item is clicked
    if (onClose && window.innerWidth <= 1024) {
      onClose();
    }
  };

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'active' : ''}`} onClick={handleOverlayClick}></div>
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <ClipboardList size={32} className="logo-icon" />
            <span className="logo-text">Exam Portal</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <ul className="nav-menu">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id} className="nav-item">
                  <button
                    className={`nav-link ${activeTab === item.id ? 'active' : ''}`}
                    onClick={() => handleMenuItemClick(item.id)}
                  >
                    <Icon size={20} className="nav-icon" />
                    <span className="nav-label">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
