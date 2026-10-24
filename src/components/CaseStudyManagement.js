import React, { useState, useEffect } from 'react';
import { useAdmin } from '../context/AdminContext';
import './AdminManagement.css';
import './CaseStudyManagement.css';

const CaseStudyManagement = () => {
  const { getToken } = useAdmin();
  const [caseStudies, setCaseStudies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingStudy, setEditingStudy] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    industry: '',
    description: '',
    challenge: '',
    solution: '',
    results: '',
    technologies: '',
    featured: false,
    active: true
  });

  useEffect(() => {
    fetchCaseStudies();
  }, []);

  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => {
        setNotification({ show: false, message: '', type: '' });
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const fetchCaseStudies = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const response = await fetch(`${process.env.REACT_APP_API_URL}/case-studies?active=all`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setCaseStudies(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching case studies:', error);
      showNotification('Error loading case studies', 'error');
      setCaseStudies([]);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = getToken();
    const url = editingStudy 
      ? `${process.env.REACT_APP_API_URL}/case-studies/${editingStudy._id}`
      : `${process.env.REACT_APP_API_URL}/case-studies`;
    
    const method = editingStudy ? 'PUT' : 'POST';
    
    const submitData = new FormData();
    submitData.append('title', formData.title);
    submitData.append('industry', formData.industry);
    submitData.append('description', formData.description);
    submitData.append('challenge', formData.challenge);
    submitData.append('solution', formData.solution);
    submitData.append('results', formData.results);
    submitData.append('technologies', formData.technologies);
    submitData.append('featured', formData.featured);
    submitData.append('active', formData.active);

    if (videoFile) {
      submitData.append('video', videoFile);
    } else if (!editingStudy) {
      showNotification('Video file is required!', 'error');
      return;
    }

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: submitData
      });

      if (response.ok) {
        resetForm();
        fetchCaseStudies();
        showNotification(
          editingStudy ? 'Case study updated successfully!' : 'Case study created successfully!'
        );
      } else {
        const errData = await response.json();
        showNotification(errData.message || 'Error saving case study', 'error');
      }
    } catch (error) {
      console.error('Error saving case study:', error);
      showNotification('Error connecting to server', 'error');
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
      const response = await fetch(`${process.env.REACT_APP_API_URL}/case-studies/${deleteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        fetchCaseStudies();
        showNotification('Case study deleted successfully!');
      } else {
        const errData = await response.json();
        showNotification(errData.message || 'Error deleting case study', 'error');
      }
    } catch (error) {
      console.error('Error deleting case study:', error);
      showNotification('Error deleting case study', 'error');
    } finally {
      setShowConfirmDialog(false);
      setDeleteId(null);
    }
  };

  const handleEdit = (study) => {
    setEditingStudy(study);
    setFormData({
      title: study.title,
      industry: study.industry,
      description: study.description,
      challenge: study.challenge || '',
      solution: study.solution || '',
      results: study.results || '',
      technologies: study.technologies ? study.technologies.join(', ') : '',
      featured: study.featured || false,
      active: study.active !== undefined ? study.active : true
    });

    const apiBase = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';
    
    if (study.video) {
      setVideoPreview(study.video.startsWith('http') ? study.video : `${apiBase}${study.video}`);
    } else {
      setVideoPreview('');
    }
    setVideoFile(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditingStudy(null);
    setFormData({
      title: '',
      industry: '',
      description: '',
      challenge: '',
      solution: '',
      results: '',
      technologies: '',
      featured: false,
      active: true
    });
    setVideoFile(null);
    setVideoPreview('');
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const getVideoUrl = (videoPath) => {
    if (!videoPath) return '';
    if (videoPath.startsWith('http')) return videoPath;
    const apiBase = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';
    return `${apiBase}${videoPath}`;
  };

  const filteredStudies = Array.isArray(caseStudies) ? caseStudies.filter(study => {
    const matchesSearch = study.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         study.industry.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         study.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && study.active) ||
                         (filterStatus === 'inactive' && !study.active);
    return matchesSearch && matchesStatus;
  }) : [];

  const stats = {
    total: Array.isArray(caseStudies) ? caseStudies.length : 0,
    active: Array.isArray(caseStudies) ? caseStudies.filter(s => s.active).length : 0,
    inactive: Array.isArray(caseStudies) ? caseStudies.filter(s => !s.active).length : 0,
    featured: Array.isArray(caseStudies) ? caseStudies.filter(s => s.featured).length : 0
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="spinner-ring"></div>
          <p>Loading case studies...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="case-study-management-modern">
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
            <h3>Delete Case Study</h3>
            <p>Are you sure you want to delete this case study? This action cannot be undone.</p>
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
            <i className="fas fa-file-alt" style={{ color: '#f9c349' }}></i>
          </div>
          <div className="stat-info">
            <h3>{stats.total}</h3>
            <p>Total Case Studies</p>
          </div>
        </div>
        <div className="stat-card glass-effect">
          <div className="stat-icon" style={{ background: 'rgba(76, 175, 80, 0.15)' }}>
            <i className="fas fa-check-circle" style={{ color: '#4caf50' }}></i>
          </div>
          <div className="stat-info">
            <h3>{stats.active}</h3>
            <p>Active</p>
          </div>
        </div>
        <div className="stat-card glass-effect">
          <div className="stat-icon" style={{ background: 'rgba(244, 67, 54, 0.15)' }}>
            <i className="fas fa-times-circle" style={{ color: '#f44336' }}></i>
          </div>
          <div className="stat-info">
            <h3>{stats.inactive}</h3>
            <p>Inactive</p>
          </div>
        </div>
        <div className="stat-card glass-effect">
          <div className="stat-icon" style={{ background: 'rgba(156, 39, 176, 0.15)' }}>
            <i className="fas fa-star" style={{ color: '#9c27b0' }}></i>
          </div>
          <div className="stat-info">
            <h3>{stats.featured}</h3>
            <p>Featured</p>
          </div>
        </div>
      </div>

      {/* Form Section */}
      <div className="form-section glass-effect">
        <div className="form-header-modern">
          <div className="header-left">
            <div className="header-icon">
              <i className="fas fa-file-alt"></i>
            </div>
            <div>
              <h2>{editingStudy ? 'Edit Case Study' : 'Create New Case Study'}</h2>
              <p>{editingStudy ? 'Update case study details' : 'Add a new case study to your portfolio'}</p>
            </div>
          </div>
          {editingStudy && (
            <button className="btn-ghost" onClick={resetForm}>
              <i className="fas fa-times"></i> Cancel
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="modern-form">
          <div className="form-grid">
            <div className="form-group-modern">
              <label>
                <i className="fas fa-heading"></i> Case Study Title
                <span className="required">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="Enter case study title..."
                className="input-modern"
              />
            </div>
            <div className="form-group-modern">
              <label>
                <i className="fas fa-industry"></i> Industry
                <span className="required">*</span>
              </label>
              <input
                type="text"
                name="industry"
                value={formData.industry}
                onChange={handleChange}
                required
                placeholder="e.g., Healthcare, Logistics"
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
              rows="3"
              value={formData.description}
              onChange={handleChange}
              required
              placeholder="A brief overview for listings and card display..."
              className="textarea-modern"
            />
          </div>

          <div className="form-group-modern">
            <label>
              <i className="fas fa-exclamation-triangle"></i> The Challenge
            </label>
            <textarea
              name="challenge"
              rows="4"
              value={formData.challenge}
              onChange={handleChange}
              placeholder="What problems was the client facing?"
              className="textarea-modern"
            />
          </div>

          <div className="form-group-modern">
            <label>
              <i className="fas fa-lightbulb"></i> The Solution
            </label>
            <textarea
              name="solution"
              rows="4"
              value={formData.solution}
              onChange={handleChange}
              placeholder="How did TDC.USA help solve the problem?"
              className="textarea-modern"
            />
          </div>

          <div className="form-group-modern">
            <label>
              <i className="fas fa-chart-line"></i> The Results
            </label>
            <textarea
              name="results"
              rows="4"
              value={formData.results}
              onChange={handleChange}
              placeholder="What positive outcomes were achieved?"
              className="textarea-modern"
            />
          </div>

          <div className="form-grid">
            <div className="form-group-modern">
              <label>
                <i className="fas fa-code"></i> Technologies Used
              </label>
              <input
                type="text"
                name="technologies"
                value={formData.technologies}
                onChange={handleChange}
                placeholder="React, Next.js, Node.js, MongoDB"
                className="input-modern"
              />
            </div>
            <div className="form-group-modern">
              <label>
                <i className="fas fa-video"></i> Case Study Video
                <span className="required">*</span>
              </label>
              <div className="upload-area">
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoChange}
                  id="video-upload"
                  className="file-input-hidden"
                  required={!editingStudy}
                />
                <label htmlFor="video-upload" className="upload-label">
                  {videoPreview ? (
                    <div className="upload-preview video-preview">
                      <video src={videoPreview} controls className="video-preview-player" />
                      <button 
                        type="button" 
                        className="remove-btn"
                        onClick={(e) => {
                          e.preventDefault();
                          setVideoFile(null);
                          setVideoPreview('');
                        }}
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  ) : (
                    <div className="upload-placeholder">
                      <i className="fas fa-video"></i>
                      <span>Upload Video</span>
                      <small>MP4, WEBM (Max 50MB)</small>
                    </div>
                  )}
                </label>
              </div>
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
                <span className="toggle-label">Featured Case Study</span>
                <span className="toggle-hint">Shows on homepage</span>
              </div>
            </div>
            <div className="toggle-item">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  name="active"
                  checked={formData.active}
                  onChange={handleChange}
                />
                <span className="toggle-slider"></span>
              </label>
              <div className="toggle-info">
                <span className="toggle-label">Active Case Study</span>
                <span className="toggle-hint">Visible on website</span>
              </div>
            </div>
          </div>

          {/* Preview Card */}
          {formData.title && formData.description && (
            <div className="preview-card glass-effect animate-fadeIn">
              <div className="preview-header">
                <span className="preview-badge">
                  <i className="fas fa-eye"></i> Live Preview
                </span>
                <span className={`preview-status ${formData.active ? 'active' : 'inactive'}`}>
                  <span className="pulse-dot"></span>
                  {formData.active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="preview-body">
                <div className="preview-content">
                  <h3>{formData.title}</h3>
                  <span className="preview-industry">{formData.industry}</span>
                  <p>{formData.description}</p>
                  {formData.technologies && (
                    <div className="preview-tech">
                      {formData.technologies.split(',').map((tech, i) => 
                        tech.trim() && <span key={i} className="tech-pill">{tech.trim()}</span>
                      )}
                    </div>
                  )}
                  {formData.featured && (
                    <span className="featured-badge-preview">
                      <i className="fas fa-star"></i> Featured
                    </span>
                  )}
                </div>
                {videoPreview && (
                  <div className="preview-video">
                    <video src={videoPreview} controls className="preview-video-player" />
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="form-actions-modern">
            <button type="submit" className="btn-primary-modern">
              {editingStudy ? (
                <>
                  <i className="fas fa-sync-alt"></i> Update Case Study
                </>
              ) : (
                <>
                  <i className="fas fa-plus"></i> Create Case Study
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* List Section */}
      <div className="list-section glass-effect">
        <div className="list-header-modern">
          <div className="header-left">
            <div className="header-icon">
              <i className="fas fa-list-ul"></i>
            </div>
            <div>
              <h2>All Case Studies</h2>
              <p>{filteredStudies.length} case stud{filteredStudies.length !== 1 ? 'ies' : 'y'} found</p>
            </div>
          </div>
        </div>

        <div className="filter-section">
          <div className="search-box">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Search case studies..."
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
              className={`tab-btn ${filterStatus === 'active' ? 'active' : ''}`}
              onClick={() => setFilterStatus('active')}
            >
              <span className="dot active"></span> Active
            </button>
            <button 
              className={`tab-btn ${filterStatus === 'inactive' ? 'active' : ''}`}
              onClick={() => setFilterStatus('inactive')}
            >
              <span className="dot inactive"></span> Inactive
            </button>
          </div>
        </div>

        {filteredStudies.length === 0 ? (
          <div className="empty-state-modern">
            <div className="empty-icon">
              <i className="fas fa-file-alt"></i>
            </div>
            <h3>No Case Studies Found</h3>
            <p>
              {searchTerm || filterStatus !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'Start by creating your first case study.'}
            </p>
          </div>
        ) : (
          <div className="case-studies-grid">
            {filteredStudies.map((study, index) => (
              <div 
                key={study._id} 
                className={`case-study-card ${!study.active ? 'inactive' : ''}`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="case-study-card-header">
                  <h3>{study.title}</h3>
                  <div className="case-study-badges">
                    <span className={`status-badge ${study.active ? 'active' : 'inactive'}`}>
                      <span className="pulse-dot"></span>
                      {study.active ? 'Active' : 'Inactive'}
                    </span>
                    {study.featured && (
                      <span className="featured-badge">
                        <i className="fas fa-star"></i> Featured
                      </span>
                    )}
                  </div>
                </div>
                <div className="case-study-card-body">
                  <div className="case-study-meta">
                    <span><i className="fas fa-industry"></i> {study.industry}</span>
                    {study.technologies && study.technologies.length > 0 && (
                      <span><i className="fas fa-code"></i> {study.technologies.slice(0, 3).join(', ')}</span>
                    )}
                  </div>
                  <p className="case-study-description">{study.description}</p>
                  <div className="case-study-details">
                    {study.challenge && (
                      <div className="detail-section">
                        <h4><i className="fas fa-exclamation-triangle"></i> Challenge</h4>
                        <p>{study.challenge}</p>
                      </div>
                    )}
                    {study.solution && (
                      <div className="detail-section">
                        <h4><i className="fas fa-lightbulb"></i> Solution</h4>
                        <p>{study.solution}</p>
                      </div>
                    )}
                    {study.results && (
                      <div className="detail-section">
                        <h4><i className="fas fa-chart-line"></i> Results</h4>
                        <p>{study.results}</p>
                      </div>
                    )}
                  </div>
                  {study.video && (
                    <div className="case-study-video">
                      <video src={getVideoUrl(study.video)} controls className="case-study-video-player" />
                    </div>
                  )}
                </div>
                <div className="case-study-card-footer">
                  <div className="card-actions">
                    <button 
                      className="action-btn edit"
                      onClick={() => handleEdit(study)}
                      title="Edit"
                    >
                      <i className="fas fa-edit"></i> Edit
                    </button>
                    <button 
                      className="action-btn delete"
                      onClick={() => handleDelete(study._id)}
                      title="Delete"
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

export default CaseStudyManagement;