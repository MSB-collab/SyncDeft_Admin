import React, { useState, useEffect } from 'react';
import { useAdmin } from '../context/AdminContext';
import './AdminManagement.css';
import './JobManagement.css';

const JobManagement = () => {
  const { getToken } = useAdmin();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingJob, setEditingJob] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [formData, setFormData] = useState({
    title: '',
    department: '',
    location: '',
    type: 'Full Time',
    experienceLevel: 'Entry Level',
    description: '',
    requirements: '',
    responsibilities: '',
    benefits: '',
    salary: '',
    applicationDeadline: '',
    status: 'Open',
    featuredJob: false,
    featured: false,
    activeJob: true
  });

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => {
        setNotification({ show: false, message: '', type: '' });
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const fetchJobs = async () => {
    try {
      const token = getToken();
      const response = await fetch(`${process.env.REACT_APP_API_URL}/jobs`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setJobs(data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      showNotification('Error loading jobs', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = getToken();
    const url = editingJob 
      ? `${process.env.REACT_APP_API_URL}/jobs/${editingJob._id}`
      : `${process.env.REACT_APP_API_URL}/jobs`;
    
    const method = editingJob ? 'PUT' : 'POST';
    
    const requirementsArray = formData.requirements.split('\n').filter(item => item.trim());
    const responsibilitiesArray = formData.responsibilities.split('\n').filter(item => item.trim());

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          requirements: requirementsArray,
          responsibilities: responsibilitiesArray,
          isActive: formData.status === 'Open',
          applicationDeadline: formData.applicationDeadline || undefined
        })
      });

      if (response.ok) {
        resetForm();
        fetchJobs();
        showNotification(
          editingJob ? 'Job updated successfully!' : 'Job posted successfully!'
        );
      } else {
        const error = await response.json();
        showNotification(error.message || 'Error saving job', 'error');
      }
    } catch (error) {
      console.error('Error saving job:', error);
      showNotification('Network error. Please try again.', 'error');
    }
  };

  const handleDelete = async (id) => {
    setDeleteId(id);
    setShowConfirmDialog(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    
    try {
      const token = getToken();
      const response = await fetch(`${process.env.REACT_APP_API_URL}/jobs/${deleteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        fetchJobs();
        showNotification('Job deleted successfully!');
      } else {
        const error = await response.json();
        showNotification(error.message || 'Error deleting job', 'error');
      }
    } catch (error) {
      console.error('Error deleting job:', error);
      showNotification('Error deleting job', 'error');
    } finally {
      setShowConfirmDialog(false);
      setDeleteId(null);
    }
  };

  const handleEdit = (job) => {
    setEditingJob(job);
    setFormData({
      title: job.title,
      department: job.department,
      location: job.location,
      type: job.type || 'Full Time',
      experienceLevel: job.experienceLevel || 'Entry Level',
      description: job.description,
      requirements: job.requirements.join('\n'),
      responsibilities: job.responsibilities.join('\n'),
      benefits: job.benefits || '',
      salary: job.salary || '',
      applicationDeadline: job.applicationDeadline ? job.applicationDeadline.split('T')[0] : '',
      status: job.status || (job.isActive ? 'Open' : 'Closed'),
      featuredJob: job.featuredJob || false,
      featured: job.featured || false,
      activeJob: job.activeJob !== false
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditingJob(null);
    setFormData({
      title: '',
      department: '',
      location: '',
      type: 'Full Time',
      experienceLevel: 'Entry Level',
      description: '',
      requirements: '',
      responsibilities: '',
      benefits: '',
      salary: '',
      applicationDeadline: '',
      status: 'Open',
      featuredJob: false,
      featured: false,
      activeJob: true
    });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'open' && (job.status === 'Open' || job.isActive)) ||
                         (filterStatus === 'closed' && (job.status === 'Closed' || !job.isActive));
    const matchesType = filterType === 'all' || job.type === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  const stats = {
    total: jobs.length,
    open: jobs.filter(j => j.status === 'Open' || j.isActive).length,
    closed: jobs.filter(j => j.status === 'Closed' || !j.isActive).length,
    featured: jobs.filter(j => j.featured || j.featuredJob).length
  };

  const jobTypes = ['all', ...new Set(jobs.map(j => j.type))];

  const renderJobPreview = () => {
    if (!formData.title && !formData.description) return null;
    
    const requirementsList = formData.requirements.split('\n').filter(item => item.trim());
    const responsibilitiesList = formData.responsibilities.split('\n').filter(item => item.trim());

    return (
      <div className="job-preview-modern animate-fadeIn">
        <div className="preview-header">
          <span className="preview-badge">
            <i className="fas fa-eye"></i> Live Preview
          </span>
          <span className={`preview-status ${formData.status === 'Open' ? 'open' : 'closed'}`}>
            <span className="pulse-dot"></span>
            {formData.status}
          </span>
        </div>
        <div className="preview-body">
          <div className="preview-content">
            <div className="preview-title">
              <h3>{formData.title || 'Job Title'}</h3>
              <span className="preview-type">{formData.type}</span>
            </div>
            <div className="preview-meta">
              <span><i className="fas fa-building"></i> {formData.department}</span>
              <span><i className="fas fa-map-marker-alt"></i> {formData.location}</span>
              <span><i className="fas fa-briefcase"></i> {formData.experienceLevel}</span>
              {formData.salary && (
                <span><i className="fas fa-dollar-sign"></i> {formData.salary}</span>
              )}
            </div>
            <p className="preview-description">{formData.description}</p>
            {requirementsList.length > 0 && (
              <div className="preview-list">
                <h4><i className="fas fa-check-circle"></i> Requirements</h4>
                <ul>
                  {requirementsList.map((req, i) => (
                    <li key={i}>{req}</li>
                  ))}
                </ul>
              </div>
            )}
            {responsibilitiesList.length > 0 && (
              <div className="preview-list">
                <h4><i className="fas fa-tasks"></i> Responsibilities</h4>
                <ul>
                  {responsibilitiesList.map((resp, i) => (
                    <li key={i}>{resp}</li>
                  ))}
                </ul>
              </div>
            )}
            {formData.featured && (
              <span className="featured-badge-preview">
                <i className="fas fa-star"></i> Featured Job
              </span>
            )}
            {formData.applicationDeadline && (
              <div className="preview-deadline">
                <i className="fas fa-calendar-alt"></i>
                Application Deadline: {formatDate(formData.applicationDeadline)}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="spinner-ring"></div>
          <p>Loading jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="job-management-modern">
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

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <div className="modal-icon danger">
              <i className="fas fa-trash-alt"></i>
            </div>
            <h3>Delete Job</h3>
            <p>Are you sure you want to delete this job posting? This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="btn-outline" onClick={() => {
                setShowConfirmDialog(false);
                setDeleteId(null);
              }}>
                Cancel
              </button>
              <button className="btn-danger" onClick={confirmDelete}>
                <i className="fas fa-trash"></i> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Dashboard */}
      <div className="stats-grid">
        <div className="stat-card glass-effect">
          <div className="stat-icon" style={{ background: 'rgba(249, 195, 73, 0.15)' }}>
            <i className="fas fa-briefcase" style={{ color: '#f9c349' }}></i>
          </div>
          <div className="stat-info">
            <h3>{stats.total}</h3>
            <p>Total Jobs</p>
          </div>
        </div>
        <div className="stat-card glass-effect">
          <div className="stat-icon" style={{ background: 'rgba(76, 175, 80, 0.15)' }}>
            <i className="fas fa-check-circle" style={{ color: '#4caf50' }}></i>
          </div>
          <div className="stat-info">
            <h3>{stats.open}</h3>
            <p>Open Positions</p>
          </div>
        </div>
        <div className="stat-card glass-effect">
          <div className="stat-icon" style={{ background: 'rgba(244, 67, 54, 0.15)' }}>
            <i className="fas fa-times-circle" style={{ color: '#f44336' }}></i>
          </div>
          <div className="stat-info">
            <h3>{stats.closed}</h3>
            <p>Closed Positions</p>
          </div>
        </div>
        <div className="stat-card glass-effect">
          <div className="stat-icon" style={{ background: 'rgba(156, 39, 176, 0.15)' }}>
            <i className="fas fa-star" style={{ color: '#9c27b0' }}></i>
          </div>
          <div className="stat-info">
            <h3>{stats.featured}</h3>
            <p>Featured Jobs</p>
          </div>
        </div>
      </div>

      {/* Form Section */}
      <div className="form-section glass-effect">
        <div className="form-header-modern">
          <div className="header-left">
            <div className="header-icon">
              <i className="fas fa-plus-circle"></i>
            </div>
            <div>
              <h2>{editingJob ? 'Edit Job' : 'Post New Job'}</h2>
              <p>{editingJob ? 'Update job details' : 'Create a new job opportunity'}</p>
            </div>
          </div>
          {editingJob && (
            <button className="btn-ghost" onClick={resetForm}>
              <i className="fas fa-times"></i> Cancel
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="modern-form">
          <div className="form-grid">
            <div className="form-group-modern">
              <label>
                <i className="fas fa-heading"></i> Job Title
                <span className="required">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="e.g., Senior React Developer"
                className="input-modern"
              />
            </div>
            <div className="form-group-modern">
              <label>
                <i className="fas fa-building"></i> Department
                <span className="required">*</span>
              </label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                required
                className="select-modern"
              >
                <option value="">Select Department</option>
                <option value="Engineering">Engineering</option>
                <option value="Design">Design</option>
                <option value="Marketing">Marketing</option>
                <option value="Sales">Sales</option>
                <option value="Operations">Operations</option>
                <option value="Finance">Finance</option>
                <option value="HR">Human Resources</option>
              </select>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group-modern">
              <label>
                <i className="fas fa-map-marker-alt"></i> Location
                <span className="required">*</span>
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
                placeholder="e.g., New York, NY (Hybrid)"
                className="input-modern"
              />
            </div>
            <div className="form-group-modern">
              <label>
                <i className="fas fa-clock"></i> Job Type
                <span className="required">*</span>
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
                className="select-modern"
              >
                <option value="Full Time">Full Time</option>
                <option value="Part Time">Part Time</option>
                <option value="Contract">Contract</option>
                <option value="Internship">Internship</option>
                <option value="Remote">Remote</option>
                <option value="Freelance">Freelance</option>
              </select>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group-modern">
              <label>
                <i className="fas fa-chart-line"></i> Experience Level
                <span className="required">*</span>
              </label>
              <select
                name="experienceLevel"
                value={formData.experienceLevel}
                onChange={handleChange}
                required
                className="select-modern"
              >
                <option value="Entry Level">Entry Level</option>
                <option value="Junior">Junior</option>
                <option value="Mid-Level">Mid-Level</option>
                <option value="Senior">Senior</option>
                <option value="Lead">Lead</option>
                <option value="Manager">Manager</option>
                <option value="Director">Director</option>
              </select>
            </div>
            <div className="form-group-modern">
              <label>
                <i className="fas fa-calendar-alt"></i> Application Deadline
              </label>
              <input
                type="date"
                name="applicationDeadline"
                value={formData.applicationDeadline}
                onChange={handleChange}
                className="input-modern"
              />
            </div>
          </div>

          <div className="form-group-modern">
            <label>
              <i className="fas fa-align-left"></i> Description
              <span className="required">*</span>
            </label>
            <textarea
              name="description"
              rows="4"
              value={formData.description}
              onChange={handleChange}
              required
              placeholder="Describe the job role and responsibilities..."
              className="textarea-modern"
            />
          </div>

          <div className="form-group-modern">
            <label>
              <i className="fas fa-list-check"></i> Requirements
              <span className="hint">(one per line)</span>
            </label>
            <textarea
              name="requirements"
              rows="4"
              value={formData.requirements}
              onChange={handleChange}
              placeholder="Bachelor's degree in Computer Science&#10;5+ years of experience&#10;Strong JavaScript skills"
              className="textarea-modern"
            />
          </div>

          <div className="form-group-modern">
            <label>
              <i className="fas fa-tasks"></i> Responsibilities
              <span className="hint">(one per line)</span>
            </label>
            <textarea
              name="responsibilities"
              rows="4"
              value={formData.responsibilities}
              onChange={handleChange}
              placeholder="Lead development team&#10;Design system architecture&#10;Write clean, maintainable code"
              className="textarea-modern"
            />
          </div>

          <div className="form-group-modern">
            <label>
              <i className="fas fa-gift"></i> Benefits
              <span className="hint">(one per line)</span>
            </label>
            <textarea
              name="benefits"
              rows="3"
              value={formData.benefits}
              onChange={handleChange}
              placeholder="Flexible Hours&#10;Health Coverage&#10;Remote Work&#10;Learning Budget"
              className="textarea-modern"
            />
          </div>

          <div className="form-grid">
            <div className="form-group-modern">
              <label>
                <i className="fas fa-dollar-sign"></i> Salary Range
              </label>
              <input
                type="text"
                name="salary"
                value={formData.salary}
                onChange={handleChange}
                placeholder="$80,000 - $100,000"
                className="input-modern"
              />
            </div>
            <div className="form-group-modern">
              <label>
                <i className="fas fa-flag"></i> Job Status
                <span className="required">*</span>
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
                className="select-modern"
              >
                <option value="Open">Open</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
          </div>

          <div className="toggle-group">
            <div className="toggle-item">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  name="featured"
                  checked={formData.featured}
                  onChange={handleChange}
                />
                <span className="toggle-slider"></span>
              </label>
              <div className="toggle-info">
                <span className="toggle-label">Featured Job</span>
                <span className="toggle-hint">Shows on homepage</span>
              </div>
            </div>
            <div className="toggle-item">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  name="activeJob"
                  checked={formData.activeJob}
                  onChange={handleChange}
                />
                <span className="toggle-slider"></span>
              </label>
              <div className="toggle-info">
                <span className="toggle-label">Active Job</span>
                <span className="toggle-hint">Visible on careers page</span>
              </div>
            </div>
          </div>

          {renderJobPreview()}

          <div className="form-actions-modern">
            <button type="submit" className="btn-primary-modern">
              {editingJob ? (
                <>
                  <i className="fas fa-sync-alt"></i> Update Job
                </>
              ) : (
                <>
                  <i className="fas fa-plus"></i> Post Job
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Jobs List */}
      <div className="list-section glass-effect">
        <div className="list-header-modern">
          <div className="header-left">
            <div className="header-icon">
              <i className="fas fa-list-ul"></i>
            </div>
            <div>
              <h2>All Job Postings</h2>
              <p>{filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''} found</p>
            </div>
          </div>
        </div>

        <div className="filter-section">
          <div className="search-box">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Search jobs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input-modern"
            />
          </div>
          <div className="filter-tabs">
            <button 
              className={`tab-btn ${filterStatus === 'all' ? 'active' : ''}`}
              onClick={() => setFilterStatus('all')}
            >
              All
            </button>
            <button 
              className={`tab-btn ${filterStatus === 'open' ? 'active' : ''}`}
              onClick={() => setFilterStatus('open')}
            >
              <span className="dot active"></span> Open
            </button>
            <button 
              className={`tab-btn ${filterStatus === 'closed' ? 'active' : ''}`}
              onClick={() => setFilterStatus('closed')}
            >
              <span className="dot closed"></span> Closed
            </button>
          </div>
          <select 
            className="filter-select"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            {jobTypes.map(type => (
              <option key={type} value={type}>
                {type === 'all' ? 'All Types' : type}
              </option>
            ))}
          </select>
        </div>

        {filteredJobs.length === 0 ? (
          <div className="empty-state-modern">
            <div className="empty-icon">
              <i className="fas fa-briefcase"></i>
            </div>
            <h3>No jobs found</h3>
            <p>
              {searchTerm || filterStatus !== 'all' || filterType !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'Start by posting your first job.'}
            </p>
          </div>
        ) : (
          <div className="jobs-grid">
            {filteredJobs.map((job, index) => (
              <div 
                key={job._id} 
                className={`job-card-modern ${(job.status === 'Closed' || !job.isActive) ? 'closed' : ''}`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="job-card-header">
                  <div className="job-card-title">
                    <h3>{job.title}</h3>
                    <span className="job-type-badge">{job.type}</span>
                  </div>
                  <div className="job-card-status">
                    <span className={`status-badge ${(job.status === 'Open' || job.isActive) ? 'open' : 'closed'}`}>
                      <span className="pulse-dot"></span>
                      {job.status || (job.isActive ? 'Open' : 'Closed')}
                    </span>
                  </div>
                </div>
                <div className="job-card-meta">
                  <span><i className="fas fa-building"></i> {job.department}</span>
                  <span><i className="fas fa-map-marker-alt"></i> {job.location}</span>
                  <span><i className="fas fa-briefcase"></i> {job.experienceLevel}</span>
                  {job.salary && (
                    <span><i className="fas fa-dollar-sign"></i> {job.salary}</span>
                  )}
                </div>
                <p className="job-card-description">{job.description}</p>
                <div className="job-card-footer">
                  <div className="job-card-info">
                    {job.featured || job.featuredJob ? (
                      <span className="featured-badge">
                        <i className="fas fa-star"></i> Featured
                      </span>
                    ) : (
                      <span className="applications-badge">
                        <i className="fas fa-users"></i> {job.applicationsCount || 0} applications
                      </span>
                    )}
                    {job.applicationDeadline && (
                      <span className="deadline-badge">
                        <i className="fas fa-calendar-alt"></i> {formatDate(job.applicationDeadline)}
                      </span>
                    )}
                  </div>
                  <div className="job-card-actions">
                    <button 
                      className="action-btn view"
                      onClick={() => window.open(`http://localhost:3000/careers/${job._id}`, '_blank')}
                      title="View Job"
                    >
                      <i className="fas fa-eye"></i>
                    </button>
                    <button 
                      className="action-btn edit"
                      onClick={() => handleEdit(job)}
                      title="Edit Job"
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button 
                      className="action-btn delete"
                      onClick={() => handleDelete(job._id)}
                      title="Delete Job"
                    >
                      <i className="fas fa-trash"></i>
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

export default JobManagement;