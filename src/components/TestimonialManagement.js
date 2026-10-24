import React, { useState, useEffect } from 'react';
import { useAdmin } from '../context/AdminContext';
import './AdminManagement.css';
import './TestimonialManagement.css';

const DEFAULT_PROFILE_IMAGE = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23cbd5e1"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="24" fill="%23475569">User</text></svg>`;
const DEFAULT_LOGO_IMAGE = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60" viewBox="0 0 200 60"><rect width="200" height="60" fill="%23e2e8f0"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="16" fill="%23475569">Logo</text></svg>`;

const handleProfileError = (e) => {
  e.target.src = DEFAULT_PROFILE_IMAGE;
};

const handleLogoError = (e) => {
  e.target.src = DEFAULT_LOGO_IMAGE;
};

const TestimonialManagement = () => {
  const { getToken } = useAdmin();
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingTestimonial, setEditingTestimonial] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState('');
  const [companyLogoFile, setCompanyLogoFile] = useState(null);
  const [companyLogoPreview, setCompanyLogoPreview] = useState('');

  const [formData, setFormData] = useState({
    clientName: '',
    companyName: '',
    designation: '',
    review: '',
    rating: 5,
    featured: false,
    active: true
  });

  useEffect(() => {
    fetchTestimonials();
  }, []);

  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => {
        setNotification({ show: false, message: '', type: '' });
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const fetchTestimonials = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const response = await fetch(`${process.env.REACT_APP_API_URL}/testimonials?active=all`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setTestimonials(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching testimonials:', error);
      showNotification('Error loading testimonials', 'error');
      setTestimonials([]);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
  };

  const handleProfileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImageFile(file);
      setProfileImagePreview(URL.createObjectURL(file));
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCompanyLogoFile(file);
      setCompanyLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = getToken();
    const url = editingTestimonial 
      ? `${process.env.REACT_APP_API_URL}/testimonials/${editingTestimonial._id}`
      : `${process.env.REACT_APP_API_URL}/testimonials`;
    
    const method = editingTestimonial ? 'PUT' : 'POST';
    
    const submitData = new FormData();
    submitData.append('clientName', formData.clientName);
    submitData.append('companyName', formData.companyName);
    submitData.append('designation', formData.designation);
    submitData.append('review', formData.review);
    submitData.append('rating', formData.rating);
    submitData.append('featured', formData.featured);
    submitData.append('active', formData.active);

    if (profileImageFile) {
      submitData.append('profileImage', profileImageFile);
    } else if (editingTestimonial && editingTestimonial.profileImage) {
      submitData.append('profileImage', editingTestimonial.profileImage);
    }

    if (companyLogoFile) {
      submitData.append('companyLogo', companyLogoFile);
    } else if (editingTestimonial && editingTestimonial.companyLogo) {
      submitData.append('companyLogo', editingTestimonial.companyLogo);
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
        fetchTestimonials();
        showNotification(
          editingTestimonial ? 'Testimonial updated successfully!' : 'Testimonial created successfully!'
        );
      } else {
        const errData = await response.json();
        showNotification(errData.message || 'Error saving testimonial', 'error');
      }
    } catch (error) {
      console.error('Error saving testimonial:', error);
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
      await fetch(`${process.env.REACT_APP_API_URL}/testimonials/${deleteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      fetchTestimonials();
      showNotification('Testimonial deleted successfully!');
    } catch (error) {
      console.error('Error deleting testimonial:', error);
      showNotification('Error deleting testimonial', 'error');
    } finally {
      setShowConfirmDialog(false);
      setDeleteId(null);
    }
  };

  const handleEdit = (testimonial) => {
    setEditingTestimonial(testimonial);
    setFormData({
      clientName: testimonial.clientName,
      companyName: testimonial.companyName || testimonial.company,
      designation: testimonial.designation,
      review: testimonial.review,
      rating: testimonial.rating,
      featured: testimonial.featured || false,
      active: testimonial.active !== undefined ? testimonial.active : true
    });

    const apiBase = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';
    
    if (testimonial.profileImage) {
      setProfileImagePreview(testimonial.profileImage.startsWith('http') ? testimonial.profileImage : `${apiBase}${testimonial.profileImage}`);
    } else {
      setProfileImagePreview('');
    }
    
    if (testimonial.companyLogo) {
      setCompanyLogoPreview(testimonial.companyLogo.startsWith('http') ? testimonial.companyLogo : `${apiBase}${testimonial.companyLogo}`);
    } else {
      setCompanyLogoPreview('');
    }

    setProfileImageFile(null);
    setCompanyLogoFile(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditingTestimonial(null);
    setFormData({
      clientName: '',
      companyName: '',
      designation: '',
      review: '',
      rating: 5,
      featured: false,
      active: true
    });
    setProfileImageFile(null);
    setProfileImagePreview('');
    setCompanyLogoFile(null);
    setCompanyLogoPreview('');
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;
    const apiBase = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';
    return `${apiBase}${imagePath}`;
  };

  const filteredTestimonials = Array.isArray(testimonials) ? testimonials.filter(t => {
    const matchesSearch = t.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         t.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         t.designation.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && t.active) ||
                         (filterStatus === 'inactive' && !t.active);
    return matchesSearch && matchesStatus;
  }) : [];

  const stats = {
    total: Array.isArray(testimonials) ? testimonials.length : 0,
    active: Array.isArray(testimonials) ? testimonials.filter(t => t.active).length : 0,
    inactive: Array.isArray(testimonials) ? testimonials.filter(t => !t.active).length : 0,
    featured: Array.isArray(testimonials) ? testimonials.filter(t => t.featured).length : 0
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <i key={i} className={`fas fa-star ${i < rating ? 'filled' : 'empty'}`}></i>
    ));
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="spinner-ring"></div>
          <p>Loading testimonials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="testimonial-management-modern">
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
            <h3>Delete Testimonial</h3>
            <p>Are you sure you want to delete this testimonial? This action cannot be undone.</p>
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
            <i className="fas fa-comments" style={{ color: '#f9c349' }}></i>
          </div>
          <div className="stat-info">
            <h3>{stats.total}</h3>
            <p>Total Testimonials</p>
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
              <i className="fas fa-quote-right"></i>
            </div>
            <div>
              <h2>{editingTestimonial ? 'Edit Testimonial' : 'Create New Testimonial'}</h2>
              <p>{editingTestimonial ? 'Update client testimonial' : 'Add a new client testimonial'}</p>
            </div>
          </div>
          {editingTestimonial && (
            <button className="btn-ghost" onClick={resetForm}>
              <i className="fas fa-times"></i> Cancel
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="modern-form">
          <div className="form-grid">
            <div className="form-group-modern">
              <label>
                <i className="fas fa-user"></i> Client Name
                <span className="required">*</span>
              </label>
              <input
                type="text"
                name="clientName"
                value={formData.clientName}
                onChange={handleChange}
                required
                placeholder="Enter client name..."
                className="input-modern"
              />
            </div>
            <div className="form-group-modern">
              <label>
                <i className="fas fa-building"></i> Company
                <span className="required">*</span>
              </label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                required
                placeholder="Enter company name..."
                className="input-modern"
              />
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group-modern">
              <label>
                <i className="fas fa-briefcase"></i> Designation
                <span className="required">*</span>
              </label>
              <input
                type="text"
                name="designation"
                value={formData.designation}
                onChange={handleChange}
                required
                placeholder="e.g., CEO, Founder..."
                className="input-modern"
              />
            </div>
            <div className="form-group-modern">
              <label>
                <i className="fas fa-star"></i> Rating
                <span className="required">*</span>
              </label>
              <select
                name="rating"
                value={formData.rating}
                onChange={handleChange}
                required
                className="select-modern"
              >
                <option value="5">⭐⭐⭐⭐⭐ 5 Stars</option>
                <option value="4">⭐⭐⭐⭐ 4 Stars</option>
                <option value="3">⭐⭐⭐ 3 Stars</option>
                <option value="2">⭐⭐ 2 Stars</option>
                <option value="1">⭐ 1 Star</option>
              </select>
            </div>
          </div>

          <div className="form-group-modern">
            <label>
              <i className="fas fa-quote-left"></i> Review Content
              <span className="required">*</span>
            </label>
            <textarea
              name="review"
              rows="6"
              value={formData.review}
              onChange={handleChange}
              required
              placeholder="Write the client testimonial review..."
              className="textarea-modern"
            />
          </div>

          <div className="form-grid">
            <div className="form-group-modern">
              <label>
                <i className="fas fa-user-circle"></i> Profile Image
              </label>
              <div className="upload-area">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfileChange}
                  id="profile-upload"
                  className="file-input-hidden"
                />
                <label htmlFor="profile-upload" className="upload-label">
                  {profileImagePreview ? (
                    <div className="upload-preview profile-preview">
                      <img src={profileImagePreview} alt="Profile" onError={handleProfileError} />
                      <button 
                        type="button" 
                        className="remove-btn"
                        onClick={(e) => {
                          e.preventDefault();
                          setProfileImageFile(null);
                          setProfileImagePreview('');
                        }}
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  ) : (
                    <div className="upload-placeholder">
                      <i className="fas fa-user-circle"></i>
                      <span>Upload Profile Image</span>
                      <small>PNG, JPG (Max 2MB)</small>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <div className="form-group-modern">
              <label>
                <i className="fas fa-image"></i> Company Logo
              </label>
              <div className="upload-area">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  id="logo-upload"
                  className="file-input-hidden"
                />
                <label htmlFor="logo-upload" className="upload-label">
                  {companyLogoPreview ? (
                    <div className="upload-preview logo-preview">
                      <img src={companyLogoPreview} alt="Logo" onError={handleLogoError} />
                      <button 
                        type="button" 
                        className="remove-btn"
                        onClick={(e) => {
                          e.preventDefault();
                          setCompanyLogoFile(null);
                          setCompanyLogoPreview('');
                        }}
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  ) : (
                    <div className="upload-placeholder">
                      <i className="fas fa-image"></i>
                      <span>Upload Company Logo</span>
                      <small>PNG, JPG (Max 2MB)</small>
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
                <span className="toggle-label">Featured Testimonial</span>
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
                <span className="toggle-label">Active Testimonial</span>
                <span className="toggle-hint">Visible on website</span>
              </div>
            </div>
          </div>

          {/* Preview Card */}
          {formData.clientName && formData.review && (
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
                <div className="preview-avatar">
                  {profileImagePreview ? (
                    <img src={profileImagePreview} alt="Client" onError={handleProfileError} />
                  ) : (
                    <div className="preview-avatar-placeholder">
                      <i className="fas fa-user"></i>
                    </div>
                  )}
                </div>
                <div className="preview-content">
                  <div className="preview-stars">
                    {renderStars(formData.rating)}
                  </div>
                  <p className="preview-review">"{formData.review}"</p>
                  <div className="preview-client">
                    <h4>{formData.clientName}</h4>
                    <span>{formData.designation}</span>
                    {formData.companyName && (
                      <span className="preview-company">at {formData.companyName}</span>
                    )}
                  </div>
                  {formData.featured && (
                    <span className="featured-badge-preview">
                      <i className="fas fa-star"></i> Featured
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="form-actions-modern">
            <button type="submit" className="btn-primary-modern">
              {editingTestimonial ? (
                <>
                  <i className="fas fa-sync-alt"></i> Update Testimonial
                </>
              ) : (
                <>
                  <i className="fas fa-plus"></i> Create Testimonial
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
              <h2>All Testimonials</h2>
              <p>{filteredTestimonials.length} testimonial{filteredTestimonials.length !== 1 ? 's' : ''} found</p>
            </div>
          </div>
        </div>

        <div className="filter-section">
          <div className="search-box">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Search testimonials..."
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

        {filteredTestimonials.length === 0 ? (
          <div className="empty-state-modern">
            <div className="empty-icon">
              <i className="fas fa-comment-slash"></i>
            </div>
            <h3>No Testimonials Found</h3>
            <p>
              {searchTerm || filterStatus !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'Start by creating your first testimonial.'}
            </p>
          </div>
        ) : (
          <div className="testimonials-grid">
            {filteredTestimonials.map((testimonial, index) => (
              <div 
                key={testimonial._id} 
                className={`testimonial-card ${!testimonial.active ? 'inactive' : ''}`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="testimonial-card-header">
                  <div className="client-info">
                    <div className="client-avatar">
                      {testimonial.profileImage ? (
                        <img 
                          src={getImageUrl(testimonial.profileImage)} 
                          alt={testimonial.clientName}
                          onError={handleProfileError}
                        />
                      ) : (
                        <div className="avatar-placeholder">
                          {testimonial.clientName?.charAt(0) || 'U'}
                        </div>
                      )}
                    </div>
                    <div>
                      <h4>{testimonial.clientName}</h4>
                      <span>{testimonial.designation}</span>
                    </div>
                  </div>
                  <div className="testimonial-badges">
                    <span className={`status-badge ${testimonial.active ? 'active' : 'inactive'}`}>
                      <span className="pulse-dot"></span>
                      {testimonial.active ? 'Active' : 'Inactive'}
                    </span>
                    {testimonial.featured && (
                      <span className="featured-badge">
                        <i className="fas fa-star"></i> Featured
                      </span>
                    )}
                  </div>
                </div>
                <div className="testimonial-card-body">
                  <div className="testimonial-stars">
                    {renderStars(testimonial.rating)}
                  </div>
                  <p className="testimonial-review">"{testimonial.review}"</p>
                  {testimonial.companyLogo && (
                    <div className="company-logo">
                      <img 
                        src={getImageUrl(testimonial.companyLogo)} 
                        alt={testimonial.companyName}
                        onError={handleLogoError}
                      />
                    </div>
                  )}
                  <div className="company-name">
                    <i className="fas fa-building"></i> {testimonial.companyName}
                  </div>
                </div>
                <div className="testimonial-card-footer">
                  <div className="card-actions">
                    <button 
                      className="action-btn edit"
                      onClick={() => handleEdit(testimonial)}
                      title="Edit"
                    >
                      <i className="fas fa-edit"></i> Edit
                    </button>
                    <button 
                      className="action-btn delete"
                      onClick={() => handleDelete(testimonial._id)}
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

export default TestimonialManagement;