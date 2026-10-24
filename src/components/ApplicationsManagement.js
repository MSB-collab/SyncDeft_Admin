import React, { useState, useEffect } from 'react';
import { useAdmin } from '../context/AdminContext';
import './AdminManagement.css';
import './ApplicationsManagement.css';

const getImageUrl = (imagePath) => {
  if (!imagePath) return '';
  if (imagePath.startsWith('http')) return imagePath;
  const apiBase = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';
  return `${apiBase}${imagePath}`;
};

const ApplicationsManagement = () => {
  const { getToken } = useAdmin();
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [filterJob, setFilterJob] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, [filterJob, filterStatus]);

  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => {
        setNotification({ show: false, message: '', type: '' });
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const token = getToken();
      
      let queryParams = [];
      if (filterJob) queryParams.push(`jobId=${filterJob}`);
      if (filterStatus) queryParams.push(`status=${filterStatus}`);
      const queryStr = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';

      const [appsRes, jobsRes] = await Promise.all([
        fetch(`${process.env.REACT_APP_API_URL}/applications${queryStr}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${process.env.REACT_APP_API_URL}/jobs`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const appsData = await appsRes.json();
      const jobsData = await jobsRes.json();

      // Ensure applications is always an array
      setApplications(Array.isArray(appsData) ? appsData : []);
      setJobs(Array.isArray(jobsData) ? jobsData : []);
    } catch (error) {
      console.error('Error fetching applications:', error);
      showNotification('Error loading applications', 'error');
      setApplications([]); // Set to empty array on error
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
  };

  const handleStatusChange = async (appId, newStatus) => {
    try {
      const token = getToken();
      const response = await fetch(`${process.env.REACT_APP_API_URL}/applications/${appId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        const updatedApp = await response.json();
        setApplications(prev => prev.map(app => app._id === appId ? updatedApp : app));
        if (selectedApplication && selectedApplication._id === appId) {
          setSelectedApplication(updatedApp);
        }
        showNotification('Application status updated successfully!');
      } else {
        const error = await response.json();
        showNotification(error.message || 'Error updating status', 'error');
      }
    } catch (error) {
      console.error('Error updating application status:', error);
      showNotification('Network error. Please try again.', 'error');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Safely filter applications - ensure it's an array first
  const filteredApplications = Array.isArray(applications) ? applications.filter(app => {
    const matchesSearch = app.fullName?.toLowerCase().includes(searchTerm?.toLowerCase() || '') ||
                         app.email?.toLowerCase().includes(searchTerm?.toLowerCase() || '') ||
                         app.jobTitle?.toLowerCase().includes(searchTerm?.toLowerCase() || '');
    return matchesSearch;
  }) : [];

  const stats = {
    total: Array.isArray(applications) ? applications.length : 0,
    pending: Array.isArray(applications) ? applications.filter(a => a.status === 'Pending').length : 0,
    reviewed: Array.isArray(applications) ? applications.filter(a => a.status === 'Reviewed').length : 0,
    shortlisted: Array.isArray(applications) ? applications.filter(a => a.status === 'Shortlisted').length : 0,
    hired: Array.isArray(applications) ? applications.filter(a => a.status === 'Hired').length : 0,
    rejected: Array.isArray(applications) ? applications.filter(a => a.status === 'Rejected').length : 0
  };

  if (loading && (!Array.isArray(applications) || applications.length === 0)) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="spinner-ring"></div>
          <p>Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="applications-management-modern">
      {/* Notification */}
      {notification.show && (
        <div className={`toast-notification ${notification.type}`}>
          <div className="toast-content">
            <div className="toast-icon">
              {notification.type === 'success' ? (
                <i className="fas fa-check-circle"></i>
              ) : (
                <i className="fas fa-exclamation-circle"></i>
              )}
            </div>
            <p>{notification.message}</p>
          </div>
          <div className="toast-progress"></div>
        </div>
      )}

      {/* Stats Dashboard */}
      <div className="stats-grid">
        <div className="stat-card glass-effect">
          <div className="stat-icon" style={{ background: 'rgba(249, 195, 73, 0.15)' }}>
            <i className="fas fa-users" style={{ color: '#f9c349' }}></i>
          </div>
          <div className="stat-info">
            <h3>{stats.total}</h3>
            <p>Total Applications</p>
          </div>
        </div>
        <div className="stat-card glass-effect">
          <div className="stat-icon" style={{ background: 'rgba(255, 152, 0, 0.15)' }}>
            <i className="fas fa-clock" style={{ color: '#ff9800' }}></i>
          </div>
          <div className="stat-info">
            <h3>{stats.pending}</h3>
            <p>Pending Review</p>
          </div>
        </div>
        <div className="stat-card glass-effect">
          <div className="stat-icon" style={{ background: 'rgba(33, 150, 243, 0.15)' }}>
            <i className="fas fa-check-circle" style={{ color: '#2196F3' }}></i>
          </div>
          <div className="stat-info">
            <h3>{stats.reviewed}</h3>
            <p>Reviewed</p>
          </div>
        </div>
        <div className="stat-card glass-effect">
          <div className="stat-icon" style={{ background: 'rgba(0, 188, 212, 0.15)' }}>
            <i className="fas fa-star" style={{ color: '#00BCD4' }}></i>
          </div>
          <div className="stat-info">
            <h3>{stats.shortlisted}</h3>
            <p>Shortlisted</p>
          </div>
        </div>
        <div className="stat-card glass-effect">
          <div className="stat-icon" style={{ background: 'rgba(76, 175, 80, 0.15)' }}>
            <i className="fas fa-user-check" style={{ color: '#4caf50' }}></i>
          </div>
          <div className="stat-info">
            <h3>{stats.hired}</h3>
            <p>Hired</p>
          </div>
        </div>
        <div className="stat-card glass-effect">
          <div className="stat-icon" style={{ background: 'rgba(244, 67, 54, 0.15)' }}>
            <i className="fas fa-times-circle" style={{ color: '#f44336' }}></i>
          </div>
          <div className="stat-info">
            <h3>{stats.rejected}</h3>
            <p>Rejected</p>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedApplication && (
        <div className="modal-overlay" onClick={() => setSelectedApplication(null)}>
          <div className="modal-dialog modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-left">
                <div className="modal-avatar">
                  {selectedApplication.fullName?.charAt(0) || 'A'}
                </div>
                <div>
                  <h3>{selectedApplication.fullName}</h3>
                  <p>{selectedApplication.jobTitle}</p>
                </div>
              </div>
              <button className="modal-close" onClick={() => setSelectedApplication(null)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="profile-grid">
                <div className="profile-section">
                  <h4><i className="fas fa-user"></i> Personal Information</h4>
                  <div className="profile-field">
                    <span className="field-label">Full Name</span>
                    <span className="field-value">{selectedApplication.fullName}</span>
                  </div>
                  <div className="profile-field">
                    <span className="field-label">Email</span>
                    <a href={`mailto:${selectedApplication.email}`} className="field-value">{selectedApplication.email}</a>
                  </div>
                  <div className="profile-field">
                    <span className="field-label">Phone</span>
                    <a href={`tel:${selectedApplication.phone}`} className="field-value">{selectedApplication.phone}</a>
                  </div>
                  <div className="profile-field">
                    <span className="field-label">Location</span>
                    <span className="field-value">{selectedApplication.location}</span>
                  </div>
                  <div className="profile-field">
                    <span className="field-label">Applied Date</span>
                    <span className="field-value">{formatDate(selectedApplication.createdAt)}</span>
                  </div>
                </div>

                <div className="profile-section">
                  <h4><i className="fas fa-link"></i> Links & Documents</h4>
                  {selectedApplication.linkedin && (
                    <div className="profile-field">
                      <span className="field-label">LinkedIn</span>
                      <a href={selectedApplication.linkedin} target="_blank" rel="noopener noreferrer" className="field-value">
                        <i className="fab fa-linkedin"></i> View Profile
                      </a>
                    </div>
                  )}
                  {selectedApplication.portfolio && (
                    <div className="profile-field">
                      <span className="field-label">Portfolio</span>
                      <a href={selectedApplication.portfolio} target="_blank" rel="noopener noreferrer" className="field-value">
                        <i className="fas fa-globe"></i> Visit Website
                      </a>
                    </div>
                  )}
                  {selectedApplication.resume && (
                    <div className="profile-field">
                      <span className="field-label">Resume</span>
                      <a 
                        href={getImageUrl(selectedApplication.resume)} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="field-value resume-link"
                      >
                        <i className="fas fa-file-pdf"></i> View Resume
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {selectedApplication.coverLetter && (
                <div className="cover-letter-section">
                  <h4><i className="fas fa-envelope"></i> Cover Letter</h4>
                  <div className="cover-letter-box">
                    {selectedApplication.coverLetter}
                  </div>
                </div>
              )}

              <div className="status-control-section">
                <h4><i className="fas fa-tasks"></i> Update Status</h4>
                <div className="status-select-wrapper">
                  <select
                    value={selectedApplication.status}
                    onChange={(e) => handleStatusChange(selectedApplication._id, e.target.value)}
                    className={`status-select ${selectedApplication.status?.toLowerCase() || 'pending'}`}
                  >
                    <option value="Pending">📋 Pending</option>
                    <option value="Reviewed">👁️ Reviewed</option>
                    <option value="Shortlisted">⭐ Shortlisted</option>
                    <option value="Rejected">❌ Rejected</option>
                    <option value="Hired">✅ Hired</option>
                  </select>
                  <div className="status-indicator">
                    <span className={`status-dot ${selectedApplication.status?.toLowerCase() || 'pending'}`}></span>
                    Current: {selectedApplication.status || 'Pending'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="filter-section glass-effect">
        <div className="search-box">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Search candidates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input-modern"
          />
        </div>
        <div className="filter-group">
          <select value={filterJob} onChange={(e) => setFilterJob(e.target.value)} className="filter-select">
            <option value="">All Job Openings</option>
            {Array.isArray(jobs) && jobs.map(job => (
              <option key={job._id} value={job._id}>{job.title}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="filter-select">
            <option value="">All Statuses</option>
            <option value="Pending">📋 Pending</option>
            <option value="Reviewed">👁️ Reviewed</option>
            <option value="Shortlisted">⭐ Shortlisted</option>
            <option value="Rejected">❌ Rejected</option>
            <option value="Hired">✅ Hired</option>
          </select>
        </div>
      </div>

      {/* Main List Section */}
      <div className="list-section glass-effect">
        <div className="list-header-modern">
          <div className="header-left">
            <div className="header-icon">
              <i className="fas fa-file-signature"></i>
            </div>
            <div>
              <h2>Applications</h2>
              <p>{filteredApplications.length} candidate{filteredApplications.length !== 1 ? 's' : ''} found</p>
            </div>
          </div>
        </div>

        {!Array.isArray(applications) || applications.length === 0 ? (
          <div className="empty-state-modern">
            <div className="empty-icon">
              <i className="fas fa-user-tie"></i>
            </div>
            <h3>No Applications Found</h3>
            <p>
              {searchTerm || filterJob || filterStatus
                ? 'Try adjusting your search or filter criteria.'
                : 'No applications have been submitted yet.'}
            </p>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="empty-state-modern">
            <div className="empty-icon">
              <i className="fas fa-search"></i>
            </div>
            <h3>No Matching Candidates</h3>
            <p>Try adjusting your search or filter criteria.</p>
          </div>
        ) : (
          <div className="applications-grid">
            {filteredApplications.map((app, index) => (
              <div 
                key={app._id} 
                className="application-card"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="application-card-header">
                  <div className="applicant-info">
                    <div className="applicant-avatar">
                      {app.fullName?.charAt(0) || 'A'}
                    </div>
                    <div>
                      <h3>{app.fullName}</h3>
                      <p>{app.jobTitle}</p>
                    </div>
                  </div>
                  <span className={`status-badge ${app.status?.toLowerCase() || 'pending'}`}>
                    {app.status || 'Pending'}
                  </span>
                </div>
                <div className="application-card-body">
                  <div className="applicant-details">
                    <span><i className="fas fa-envelope"></i> {app.email}</span>
                    <span><i className="fas fa-phone"></i> {app.phone}</span>
                    <span><i className="fas fa-map-marker-alt"></i> {app.location}</span>
                    <span><i className="fas fa-calendar"></i> {formatDate(app.createdAt)}</span>
                  </div>
                </div>
                <div className="application-card-footer">
                  <div className="card-actions">
                    {app.resume && (
                      <a 
                        href={getImageUrl(app.resume)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="action-btn resume"
                        title="View Resume"
                      >
                        <i className="fas fa-file-pdf"></i> Resume
                      </a>
                    )}
                    <button 
                      className="action-btn view"
                      onClick={() => setSelectedApplication(app)}
                      title="View Details"
                    >
                      <i className="fas fa-eye"></i> View Profile
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ApplicationsManagement;