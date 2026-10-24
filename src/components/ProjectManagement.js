import React, { useState, useEffect } from 'react';
import { useAdmin } from '../context/AdminContext';
import './AdminManagement.css';
import './ProjectManagement.css';

const getImageUrl = (imagePath) => {
  if (!imagePath) return '';
  if (imagePath.startsWith('http')) return imagePath;
  const apiBase = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';
  return `${apiBase}${imagePath}`;
};

const ProjectManagement = () => {
  const { getToken } = useAdmin();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProject, setEditingProject] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    image: '',
    technologies: '',
    client: '',
    completionDate: '',
    isFeatured: false,
    isActive: true,
    industry: 'Technology',
    challenge: '',
    solution: '',
    results: ''
  });
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => {
        setNotification({ show: false, message: '', type: '' });
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const fetchProjects = async () => {
    try {
      const token = getToken();
      const response = await fetch(`${process.env.REACT_APP_API_URL}/projects`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setProjects(data);
    } catch (error) {
      console.error('Error fetching projects:', error);
      showNotification('Error loading projects', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = getToken();
    const url = editingProject 
      ? `${process.env.REACT_APP_API_URL}/projects/${editingProject._id}`
      : `${process.env.REACT_APP_API_URL}/projects`;
    
    const method = editingProject ? 'PUT' : 'POST';
    
    const submitData = new FormData();
    submitData.append('title', formData.title);
    submitData.append('category', formData.category);
    submitData.append('description', formData.description);
    submitData.append('technologies', formData.technologies);
    submitData.append('client', formData.client);
    submitData.append('completionDate', formData.completionDate);
    submitData.append('isFeatured', formData.isFeatured);
    submitData.append('isActive', formData.isActive);
    submitData.append('industry', formData.industry);
    submitData.append('challenge', formData.challenge);
    submitData.append('solution', formData.solution);
    submitData.append('results', formData.results);

    if (imageFile) {
      submitData.append('image', imageFile);
    } else if (editingProject && editingProject.image) {
      submitData.append('image', editingProject.image);
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
        fetchProjects();
        showNotification(
          editingProject ? 'Project updated successfully!' : 'Project added successfully!'
        );
      } else {
        const error = await response.json();
        showNotification(error.message || 'Error saving project', 'error');
      }
    } catch (error) {
      console.error('Error saving project:', error);
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
      const response = await fetch(`${process.env.REACT_APP_API_URL}/projects/${deleteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchProjects();
        showNotification('Project deleted successfully!');
      } else {
        const error = await response.json();
        showNotification(error.message || 'Error deleting project', 'error');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      showNotification('Network error. Please try again.', 'error');
    } finally {
      setShowConfirmDialog(false);
      setDeleteId(null);
    }
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    setFormData({
      title: project.title,
      description: project.description,
      category: project.category,
      image: project.image || '',
      technologies: project.technologies.join(', '),
      client: project.client || '',
      completionDate: project.completionDate ? project.completionDate.split('T')[0] : '',
      isFeatured: project.isFeatured || false,
      isActive: project.isActive,
      industry: project.industry || 'Technology',
      challenge: project.challenge || '',
      solution: project.solution || '',
      results: project.results || ''
    });

    if (project.image) {
      setImagePreview(getImageUrl(project.image));
    } else {
      setImagePreview('');
    }
    setImageFile(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditingProject(null);
    setFormData({
      title: '',
      description: '',
      category: '',
      image: '',
      technologies: '',
      client: '',
      completionDate: '',
      isFeatured: false,
      isActive: true,
      industry: 'Technology',
      challenge: '',
      solution: '',
      results: ''
    });
    setImageFile(null);
    setImagePreview('');
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

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (project.client && project.client.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && project.isActive) ||
                         (filterStatus === 'inactive' && !project.isActive);
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: projects.length,
    active: projects.filter(p => p.isActive).length,
    featured: projects.filter(p => p.isFeatured).length
  };

  const renderProjectPreview = () => {
    if (!formData.title && !formData.description) return null;
    
    return (
      <div className="preview-card glass-effect">
        <div className="preview-header">
          <span className="preview-badge">
            <i className="fas fa-eye"></i> Live Preview
          </span>
          <span className={`preview-status ${formData.isActive ? 'active' : 'inactive'}`}>
            <span className="pulse-dot"></span>
            {formData.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
        <div className="preview-body">
          <div className="preview-image-placeholder">
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" />
            ) : (
              <div className="placeholder-icon">
                <i className="fas fa-image"></i>
              </div>
            )}
          </div>
          <div className="preview-details">
            <h3>{formData.title || 'Untitled Project'}</h3>
            <p>{formData.description || 'No description provided'}</p>
            <div className="preview-meta">
              {formData.client && (
                <span><i className="fas fa-user"></i> {formData.client}</span>
              )}
              <span><i className="fas fa-industry"></i> {formData.industry}</span>
            </div>
            {formData.technologies && (
              <div className="preview-tech">
                {formData.technologies.split(',').map((tech, i) => 
                  tech.trim() && <span key={i} className="tech-pill">{tech.trim()}</span>
                )}
              </div>
            )}
            <span className="preview-category">{formData.category}</span>
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
          <p>Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="project-management-modern">
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
            <h3>Delete Project</h3>
            <p>Are you sure you want to delete this project? This action cannot be undone.</p>
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
            <i className="fas fa-project-diagram" style={{ color: '#f9c349' }}></i>
          </div>
          <div className="stat-info">
            <h3>{stats.total}</h3>
            <p>Total Projects</p>
          </div>
        </div>
        <div className="stat-card glass-effect">
          <div className="stat-icon" style={{ background: 'rgba(76, 175, 80, 0.15)' }}>
            <i className="fas fa-check-circle" style={{ color: '#4caf50' }}></i>
          </div>
          <div className="stat-info">
            <h3>{stats.active}</h3>
            <p>Active Projects</p>
          </div>
        </div>
        <div className="stat-card glass-effect">
          <div className="stat-icon" style={{ background: 'rgba(255, 152, 0, 0.15)' }}>
            <i className="fas fa-star" style={{ color: '#ff9800' }}></i>
          </div>
          <div className="stat-info">
            <h3>{stats.featured}</h3>
            <p>Featured Projects</p>
          </div>
        </div>
      </div>

      {/* Form Section */}
      <div className="form-section glass-effect">
        <div className="form-header-modern">
          <div className="header-left">
            <div className="header-icon">
              <i className="fas fa-pen-fancy"></i>
            </div>
            <div>
              <h2>{editingProject ? 'Edit Project' : 'Create New Project'}</h2>
              <p>{editingProject ? 'Update project details' : 'Add a new project to your portfolio'}</p>
            </div>
          </div>
          {editingProject && (
            <button className="btn-ghost" onClick={resetForm}>
              <i className="fas fa-times"></i> Cancel
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="modern-form">
          <div className="form-row">
            <div className="form-group-modern">
              <label>
                <i className="fas fa-tag"></i> Project Title
                <span className="required">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="Enter project title..."
                className="input-modern"
              />
            </div>
            <div className="form-group-modern">
              <label>
                <i className="fas fa-folder"></i> Category
                <span className="required">*</span>
              </label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                placeholder="e.g., Web Development"
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
              placeholder="Describe the project in detail..."
              className="textarea-modern"
            />
          </div>

          <div className="form-row">
            <div className="form-group-modern">
              <label>
                <i className="fas fa-code"></i> Technologies
              </label>
              <input
                type="text"
                name="technologies"
                value={formData.technologies}
                onChange={handleChange}
                placeholder="React, Node.js, MongoDB"
                className="input-modern"
              />
            </div>
            <div className="form-group-modern">
              <label>
                <i className="fas fa-user-tie"></i> Client
              </label>
              <input
                type="text"
                name="client"
                value={formData.client}
                onChange={handleChange}
                placeholder="Client name or company"
                className="input-modern"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group-modern">
              <label>
                <i className="fas fa-industry"></i> Industry
                <span className="required">*</span>
              </label>
              <select
                name="industry"
                value={formData.industry}
                onChange={handleChange}
                required
                className="select-modern"
              >
                <option value="Healthcare">Healthcare</option>
                <option value="Education">Education</option>
                <option value="Finance">Finance</option>
                <option value="Retail">Retail</option>
                <option value="Logistics">Logistics</option>
                <option value="Real Estate">Real Estate</option>
                <option value="Technology">Technology</option>
                <option value="Government">Government</option>
                <option value="Government">EdTech & Student Community</option>
                <option value="Government">MarTech & Creator Economy</option>
                <option value="Government">LegalTech & Artificial Intelligence</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="form-group-modern">
              <label>
                <i className="fas fa-calendar-alt"></i> Completion Date
              </label>
              <input
                type="date"
                name="completionDate"
                value={formData.completionDate}
                onChange={handleChange}
                className="input-modern"
              />
            </div>
          </div>

          <div className="form-group-modern">
            <label>
              <i className="fas fa-image"></i> Project Image
            </label>
            <div className="upload-area">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                id="file-upload-modern"
                className="file-input-hidden"
              />
              <label htmlFor="file-upload-modern" className="upload-label">
                {imagePreview ? (
                  <div className="upload-preview">
                    <img src={imagePreview} alt="Preview" />
                    <button 
                      type="button" 
                      className="remove-btn"
                      onClick={(e) => {
                        e.preventDefault();
                        setImageFile(null);
                        setImagePreview('');
                      }}
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                ) : (
                  <div className="upload-placeholder">
                    <i className="fas fa-cloud-upload-alt"></i>
                    <span>Click to upload image</span>
                    <small>PNG, JPG, WEBP (Max 5MB)</small>
                  </div>
                )}
              </label>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group-modern">
              <label>
                <i className="fas fa-exclamation-triangle"></i> Challenge
              </label>
              <textarea
                name="challenge"
                rows="2"
                value={formData.challenge}
                onChange={handleChange}
                placeholder="Describe the business problem..."
                className="textarea-modern"
              />
            </div>
            <div className="form-group-modern">
              <label>
                <i className="fas fa-lightbulb"></i> Solution
              </label>
              <textarea
                name="solution"
                rows="2"
                value={formData.solution}
                onChange={handleChange}
                placeholder="Describe the implemented solution..."
                className="textarea-modern"
              />
            </div>
          </div>

          <div className="form-group-modern">
            <label>
              <i className="fas fa-chart-line"></i> Results
            </label>
            <textarea
              name="results"
              rows="2"
              value={formData.results}
              onChange={handleChange}
              placeholder="Describe measurable outcomes..."
              className="textarea-modern"
            />
          </div>

          <div className="toggle-group">
            <div className="toggle-item">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  name="isFeatured"
                  checked={formData.isFeatured}
                  onChange={handleChange}
                />
                <span className="toggle-slider"></span>
              </label>
              <div className="toggle-info">
                <span className="toggle-label">Featured Project</span>
                <span className="toggle-hint">Shows on homepage</span>
              </div>
            </div>
            <div className="toggle-item">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                />
                <span className="toggle-slider"></span>
              </label>
              <div className="toggle-info">
                <span className="toggle-label">Active Project</span>
                <span className="toggle-hint">Visible on website</span>
              </div>
            </div>
          </div>

          {renderProjectPreview()}

          <div className="form-actions-modern">
            <button type="submit" className="btn-primary-modern">
              {editingProject ? (
                <>
                  <i className="fas fa-sync-alt"></i> Update Project
                </>
              ) : (
                <>
                  <i className="fas fa-plus"></i> Create Project
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Projects List */}
      <div className="list-section glass-effect">
        <div className="list-header-modern">
          <div className="header-left">
            <div className="header-icon">
              <i className="fas fa-list-ul"></i>
            </div>
            <div>
              <h2>Projects</h2>
              <p>{filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''} found</p>
            </div>
          </div>
          <div className="view-toggle">
            <button 
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              <i className="fas fa-th"></i>
            </button>
            <button 
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              <i className="fas fa-list"></i>
            </button>
          </div>
        </div>

        <div className="filter-section">
          <div className="search-box">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Search projects..."
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

        {filteredProjects.length === 0 ? (
          <div className="empty-state-modern">
            <div className="empty-icon">
              <i className="fas fa-folder-open"></i>
            </div>
            <h3>No projects found</h3>
            <p>
              {searchTerm || filterStatus !== 'all' 
                ? 'Try adjusting your search or filter criteria.' 
                : 'Start by creating your first project.'}
            </p>
          </div>
        ) : (
          <div className={`projects-${viewMode}`}>
            {filteredProjects.map((project, index) => (
              <div 
                key={project._id} 
                className={`project-card-${viewMode} ${!project.isActive ? 'inactive' : ''}`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {viewMode === 'grid' ? (
                  // Grid View
                  <>
                    <div className="card-image">
                      {project.image ? (
                        <img src={getImageUrl(project.image)} alt={project.title} />
                      ) : (
                        <div className="card-image-placeholder">
                          <i className="fas fa-project-diagram"></i>
                        </div>
                      )}
                      {project.isFeatured && (
                        <span className="featured-badge-modern">
                          <i className="fas fa-star"></i> Featured
                        </span>
                      )}
                      <div className="card-status">
                        <span className={`status-badge ${project.isActive ? 'active' : 'inactive'}`}>
                          <span className="pulse-dot"></span>
                          {project.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    <div className="card-content">
                      <div className="card-header">
                        <h3>{project.title}</h3>
                        <span className="category-badge">{project.category}</span>
                      </div>
                      <p className="card-description">{project.description}</p>
                      <div className="card-meta">
                        {project.client && (
                          <span><i className="fas fa-user"></i> {project.client}</span>
                        )}
                        {project.completionDate && (
                          <span><i className="fas fa-calendar"></i> {formatDate(project.completionDate)}</span>
                        )}
                      </div>
                      {project.technologies && project.technologies.length > 0 && (
                        <div className="card-tech">
                          {project.technologies.slice(0, 4).map((tech, i) => (
                            <span key={i} className="tech-pill">{tech}</span>
                          ))}
                          {project.technologies.length > 4 && (
                            <span className="tech-pill">+{project.technologies.length - 4}</span>
                          )}
                        </div>
                      )}
                      <div className="card-actions">
                        <button 
                          className="action-btn edit"
                          onClick={() => handleEdit(project)}
                        >
                          <i className="fas fa-edit"></i> Edit
                        </button>
                        <button 
                          className="action-btn delete"
                          onClick={() => handleDelete(project._id)}
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  // List View
                  <div className="list-item-content">
                    <div className="list-item-image">
                      {project.image ? (
                        <img src={getImageUrl(project.image)} alt={project.title} />
                      ) : (
                        <div className="list-item-placeholder">
                          <i className="fas fa-project-diagram"></i>
                        </div>
                      )}
                    </div>
                    <div className="list-item-details">
                      <div className="list-item-header">
                        <h3>{project.title}</h3>
                        <div className="list-item-badges">
                          <span className="category-badge">{project.category}</span>
                          {project.isFeatured && (
                            <span className="featured-badge-list">
                              <i className="fas fa-star"></i> Featured
                            </span>
                          )}
                          <span className={`status-badge ${project.isActive ? 'active' : 'inactive'}`}>
                            <span className="pulse-dot"></span>
                            {project.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                      <p className="list-item-description">{project.description}</p>
                      <div className="list-item-meta">
                        {project.client && (
                          <span><i className="fas fa-user"></i> {project.client}</span>
                        )}
                        {project.completionDate && (
                          <span><i className="fas fa-calendar"></i> {formatDate(project.completionDate)}</span>
                        )}
                        <span><i className="fas fa-industry"></i> {project.industry}</span>
                      </div>
                      {project.technologies && project.technologies.length > 0 && (
                        <div className="list-item-tech">
                          {project.technologies.slice(0, 6).map((tech, i) => (
                            <span key={i} className="tech-pill">{tech}</span>
                          ))}
                          {project.technologies.length > 6 && (
                            <span className="tech-pill">+{project.technologies.length - 6}</span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="list-item-actions">
                      <button 
                        className="action-btn edit"
                        onClick={() => handleEdit(project)}
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button 
                        className="action-btn delete"
                        onClick={() => handleDelete(project._id)}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectManagement;