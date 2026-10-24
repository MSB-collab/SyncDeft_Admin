import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { useAdmin } from '../context/AdminContext';
import BlogManagement from './BlogManagement';
import JobManagement from './JobManagement';
import ProjectManagement from './ProjectManagement';
import ApplicationsManagement from './ApplicationsManagement';
import ContactMessages from './ContactMessages';
import Settings from './Settings';
import TestimonialManagement from './TestimonialManagement';
import CaseStudyManagement from './CaseStudyManagement';
import NewsletterManagement from './NewsletterManagement';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { admin, logout } = useAdmin();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const menuItems = [
    { path: '', label: 'Dashboard', icon: 'fa-tachometer-alt' },
    { path: 'projects', label: 'Projects', icon: 'fa-project-diagram' },
    { path: 'blogs', label: 'Blogs', icon: 'fa-blog' },
    { path: 'jobs', label: 'Careers', icon: 'fa-briefcase' },
    { path: 'applications', label: 'Applications', icon: 'fa-file-signature' },
    { path: 'messages', label: 'Messages', icon: 'fa-envelope' },
    { path: 'testimonials', label: 'Testimonials', icon: 'fa-comments' },
    { path: 'case-studies', label: 'Case Studies', icon: 'fa-video' },
    { path: 'newsletter', label: 'Newsletter', icon: 'fa-paper-plane' },
    { path: 'settings', label: 'Settings', icon: 'fa-cog' },
  ];

  const isActive = (path) => {
    // For dashboard (empty path)
    if (path === '') {
      return location.pathname === '/admin' || location.pathname === '/admin/';
    }
    return location.pathname === `/admin/${path}`;
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="admin-dashboard-modern">
      {/* Mobile Nav Toggle */}
      <button 
        className={`mobile-toggle ${isMobileMenuOpen ? 'active' : ''}`}
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Sidebar */}
      <nav className={`admin-nav-modern ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="admin-nav-brand">
          <div className="brand-icon">
            <span style={{ fontSize:23, fontWeight:900, textAlign:'center', fontFamily:'serif'}}>tdc<span style={{color:'#f9c349', fontSize:20}}>.</span></span>
          </div>
          <div className="brand-text">
            <h2>Sync<span>Deft</span></h2>
            <p>Admin Panel</p>
          </div>
        </div>

        

        <ul className="admin-nav-menu">
          {menuItems.map((item) => {
            const active = isActive(item.path);
            return (
              <li key={item.path}>
                <Link 
                  to={`/admin/${item.path}`}
                  className={active ? 'active' : ''}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span className={`nav-icon ${active ? 'active-icon' : ''}`}>
                    <i className={`fas ${item.icon}`}></i>
                    {active && <span className="icon-glow"></span>}
                  </span>
                  <span className="nav-label">{item.label}</span>
                  {active && (
                    <span className="nav-active-indicator"></span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="admin-nav-footer">
          <button onClick={logout} className="logout-btn">
            <i className="fas fa-sign-out-alt"></i>
            <span>Logout</span>
            <span className="logout-icon">
              <i className="fas fa-arrow-right"></i>
            </span>
          </button>
          <div className="footer-version">
            <span>v2.0.1</span>
            <span className="footer-dot">•</span>
            <span>© 2024 TDC.USA</span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="admin-content-modern">
        {/* Header */}
        <header className="admin-header-modern">
          <div className="header-left">
            <div className="header-greeting">
              <h1>
                <span className="greeting-text">Welcome back,</span>
                <span className="greeting-name">{admin?.name || 'Admin'}!</span>
              </h1>
              <p>Here's what's happening with your projects today</p>
            </div>
          </div>
          <div className="header-right">
            <div className="header-datetime">
              <div className="date-display">
                <i className="fas fa-calendar-alt"></i>
                <span>{formatDate(currentTime)}</span>
              </div>
              <div className="time-display">
                <i className="fas fa-clock"></i>
                <span>{formatTime(currentTime)}</span>
              </div>
            </div>
            <div className="header-actions">
              <button className="header-btn notification-btn">
                <i className="fas fa-bell"></i>
                <span className="notification-badge">3</span>
              </button>
              <button className="header-btn">
                <i className="fas fa-question-circle"></i>
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="admin-content-body">
          <Routes>
            <Route index element={<DashboardOverview />} />
            <Route path="projects" element={<ProjectManagement />} />
            <Route path="blogs" element={<BlogManagement />} />
            <Route path="jobs" element={<JobManagement />} />
            <Route path="applications" element={<ApplicationsManagement />} />
            <Route path="messages" element={<ContactMessages />} />
            <Route path="testimonials" element={<TestimonialManagement />} />
            <Route path="case-studies" element={<CaseStudyManagement />} />
            <Route path="newsletter" element={<NewsletterManagement />} />
            <Route path="settings" element={<Settings />} />
            {/* Redirect any unknown admin routes to dashboard */}
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

// Dashboard Overview Component
const DashboardOverview = () => {
  const [stats] = useState([
    { label: 'Total Projects', value: '24', icon: 'fa-project-diagram', change: '+12%' },
    { label: 'Active Blogs', value: '18', icon: 'fa-blog', change: '+8%' },
    { label: 'Job Postings', value: '12', icon: 'fa-briefcase', change: '+5%' },
    { label: 'Applications', value: '156', icon: 'fa-file-signature', change: '+23%' },
    { label: 'Messages', value: '43', icon: 'fa-envelope', change: '+15%' },
    { label: 'Newsletter', value: '1,284', icon: 'fa-paper-plane', change: '+7%' },
  ]);

  const [recentActivities] = useState([
    { user: 'John Doe', action: 'added a new project', time: '2 minutes ago', project: 'E-Commerce Platform' },
    { user: 'Jane Smith', action: 'updated blog post', time: '15 minutes ago', project: 'Tech Trends 2024' },
    { user: 'Mike Johnson', action: 'received new application', time: '1 hour ago', project: 'Senior Developer' },
    { user: 'Sarah Wilson', action: 'posted new job', time: '2 hours ago', project: 'UX Designer' },
    { user: 'David Brown', action: 'submitted feedback', time: '3 hours ago', project: 'Project Review' },
  ]);

  return (
    <div className="dashboard-overview-modern">
      {/* Stats Grid */}
      <div className="stats-grid-modern">
        {stats.map((stat, index) => (
          <div 
            key={index} 
            className="stat-card-modern"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="stat-card-header">
              <div className="stat-icon" style={{ background: 'rgba(249, 195, 73, 0.15)', color: '#f9c349' }}>
                <i className={`fas ${stat.icon}`}></i>
              </div>
              <span className="stat-change">{stat.change}</span>
            </div>
            <div className="stat-card-body">
              <h3>{stat.value}</h3>
              <p>{stat.label}</p>
            </div>
            <div className="stat-progress" style={{ background: 'rgba(249, 195, 73, 0.1)' }}>
              <div className="stat-progress-bar" style={{ width: '70%', background: '#f9c349' }}></div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="quick-actions-modern">
        <h3 className="section-title">
          <i className="fas fa-bolt" style={{ color: '#f9c349' }}></i>
          Quick Actions
        </h3>
        <div className="quick-actions-grid">
          <Link to="/admin/projects" className="quick-action-card">
            <div className="qa-icon" style={{ background: 'rgba(249, 195, 73, 0.15)', color: '#f9c349' }}>
              <i className="fas fa-plus-circle"></i>
            </div>
            <h4>Add Project</h4>
            <p>Create a new project</p>
          </Link>
          <Link to="/admin/blogs" className="quick-action-card">
            <div className="qa-icon" style={{ background: 'rgba(249, 195, 73, 0.15)', color: '#f9c349' }}>
              <i className="fas fa-pen-fancy"></i>
            </div>
            <h4>Write Blog</h4>
            <p>Create new blog post</p>
          </Link>
          <Link to="/admin/jobs" className="quick-action-card">
            <div className="qa-icon" style={{ background: 'rgba(249, 195, 73, 0.15)', color: '#f9c349' }}>
              <i className="fas fa-plus"></i>
            </div>
            <h4>Post Job</h4>
            <p>Add new job opening</p>
          </Link>
          <Link to="/admin/newsletter" className="quick-action-card">
            <div className="qa-icon" style={{ background: 'rgba(249, 195, 73, 0.15)', color: '#f9c349' }}>
              <i className="fas fa-envelope-open"></i>
            </div>
            <h4>Send Newsletter</h4>
            <p>Send to subscribers</p>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="recent-activity-modern">
        <h3 className="section-title">
          <i className="fas fa-clock" style={{ color: '#f9c349' }}></i>
          Recent Activity
        </h3>
        <div className="activity-list">
          {recentActivities.map((activity, index) => (
            <div 
              key={index} 
              className="activity-item"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="activity-avatar" style={{ background: 'linear-gradient(135deg, #f9c349, #f8d070)' }}>
                {activity.user.charAt(0)}
              </div>
              <div className="activity-content">
                <div className="activity-text">
                  <strong>{activity.user}</strong>
                  <span> {activity.action} </span>
                  {activity.project && (
                    <span className="activity-project">"{activity.project}"</span>
                  )}
                </div>
                <span className="activity-time">{activity.time}</span>
              </div>
              <div className="activity-dot"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;