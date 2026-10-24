import React, { useState, useEffect } from 'react';
import { useAdmin } from '../context/AdminContext';
import './AdminManagement.css';
import './BlogManagement.css';

const DEFAULT_BLOG_IMAGE = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500"><rect width="800" height="500" fill="%231e293b"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="32" fill="%23f9c349">TDC.USA</text></svg>`;

const handleImageError = (e) => {
  e.target.src = DEFAULT_BLOG_IMAGE;
};

const BlogManagement = () => {
  const { getToken } = useAdmin();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingBlog, setEditingBlog] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    author: 'TDC USA Team',
    category: 'Technology',
    tags: '',
    status: 'Draft',
    featured: false,
    readTime: '5 min read',
    slug: ''
  });

  useEffect(() => {
    fetchBlogs();
  }, []);

  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => {
        setNotification({ show: false, message: '', type: '' });
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const fetchBlogs = async () => {
    try {
      const token = getToken();
      const response = await fetch(`${process.env.REACT_APP_API_URL}/blogs`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setBlogs(data);
    } catch (error) {
      console.error('Error fetching blogs:', error);
      showNotification('Error loading blogs', 'error');
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
    const url = editingBlog 
      ? `${process.env.REACT_APP_API_URL}/blogs/${editingBlog._id}`
      : `${process.env.REACT_APP_API_URL}/blogs`;
    
    const method = editingBlog ? 'PUT' : 'POST';
    
    const submitData = new FormData();
    submitData.append('title', formData.title);
    submitData.append('excerpt', formData.excerpt);
    submitData.append('content', formData.content);
    submitData.append('author', formData.author);
    submitData.append('category', formData.category);
    submitData.append('tags', formData.tags);
    submitData.append('status', formData.status);
    submitData.append('featured', formData.featured);
    submitData.append('readTime', formData.readTime);

    if (imageFile) {
      submitData.append('image', imageFile);
    } else if (editingBlog && (editingBlog.featuredImage || editingBlog.image)) {
      const imgPath = editingBlog.featuredImage || editingBlog.image;
      submitData.append('image', imgPath);
      submitData.append('featuredImage', imgPath);
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
        fetchBlogs();
        showNotification(
          editingBlog ? 'Blog updated successfully!' : 'Blog created successfully!'
        );
      } else {
        const errData = await response.json();
        showNotification(errData.message || 'Error saving blog', 'error');
      }
    } catch (error) {
      console.error('Error saving blog:', error);
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
      await fetch(`${process.env.REACT_APP_API_URL}/blogs/${deleteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      fetchBlogs();
      showNotification('Blog deleted successfully!');
    } catch (error) {
      console.error('Error deleting blog:', error);
      showNotification('Error deleting blog', 'error');
    } finally {
      setShowConfirmDialog(false);
      setDeleteId(null);
    }
  };

  const handleEdit = (blog) => {
    setEditingBlog(blog);
    setFormData({
      title: blog.title,
      excerpt: blog.excerpt,
      content: blog.content,
      author: blog.author,
      category: blog.category,
      tags: blog.tags.join(', '),
      status: blog.status || (blog.isPublished ? 'Published' : 'Draft'),
      featured: blog.featured || false,
      readTime: blog.readTime || '5 min read',
      slug: blog.slug || ''
    });

    const imgPath = blog.featuredImage || blog.image;
    if (imgPath) {
      const apiBase = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';
      setImagePreview(imgPath.startsWith('http') ? imgPath : `${apiBase}${imgPath}`);
    } else {
      setImagePreview('');
    }
    setImageFile(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditingBlog(null);
    setFormData({
      title: '',
      excerpt: '',
      content: '',
      author: 'TDC USA Team',
      category: 'Technology',
      tags: '',
      status: 'Draft',
      featured: false,
      readTime: '5 min read',
      slug: ''
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

  const getImageUrl = (imagePath) => {
    if (!imagePath) return DEFAULT_BLOG_IMAGE;
    if (imagePath.startsWith('http')) return imagePath;
    const apiBase = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';
    return `${apiBase}${imagePath}`;
  };

  const filteredBlogs = blogs.filter(blog => {
    const matchesSearch = blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         blog.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         blog.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'published' && (blog.status === 'Published' || blog.isPublished)) ||
                         (filterStatus === 'draft' && (blog.status === 'Draft' || !blog.isPublished));
    const matchesCategory = filterCategory === 'all' || blog.category === filterCategory;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const categories = ['all', ...new Set(blogs.map(b => b.category))];

  const stats = {
    total: blogs.length,
    published: blogs.filter(b => b.status === 'Published' || b.isPublished).length,
    drafts: blogs.filter(b => b.status === 'Draft' || !b.isPublished).length,
    featured: blogs.filter(b => b.featured).length
  };

  const renderBlogPreview = () => {
    if (!formData.title && !formData.excerpt) return null;
    
    return (
      <div className="blog-preview-modern animate-fadeIn">
        <div className="preview-header">
          <span className="preview-badge">
            <i className="fas fa-eye"></i> Live Preview
          </span>
          <span className={`preview-status ${formData.status === 'Published' ? 'published' : 'draft'}`}>
            <span className="pulse-dot"></span>
            {formData.status}
          </span>
        </div>
        <div className="preview-body">
          <div className="preview-image">
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" onError={handleImageError} />
            ) : (
              <div className="preview-placeholder">
                <i className="fas fa-image"></i>
              </div>
            )}
          </div>
          <div className="preview-content">
            <div className="preview-meta">
              <span><i className="fas fa-user"></i> {formData.author}</span>
              <span><i className="fas fa-folder"></i> {formData.category}</span>
              <span><i className="fas fa-clock"></i> {formData.readTime}</span>
            </div>
            <h3>{formData.title || 'Untitled Blog'}</h3>
            <p>{formData.excerpt || 'No excerpt provided'}</p>
            {formData.tags && (
              <div className="preview-tags">
                {formData.tags.split(',').map((tag, i) => 
                  tag.trim() && <span key={i} className="tag-pill">{tag.trim()}</span>
                )}
              </div>
            )}
            {formData.featured && (
              <span className="featured-badge">
                <i className="fas fa-star"></i> Featured
              </span>
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
          <p>Loading blogs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="blog-management-modern">
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
            <h3>Delete Blog</h3>
            <p>Are you sure you want to delete this blog? This action cannot be undone.</p>
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
            <i className="fas fa-blog" style={{ color: '#f9c349' }}></i>
          </div>
          <div className="stat-info">
            <h3>{stats.total}</h3>
            <p>Total Blogs</p>
          </div>
        </div>
        <div className="stat-card glass-effect">
          <div className="stat-icon" style={{ background: 'rgba(76, 175, 80, 0.15)' }}>
            <i className="fas fa-check-circle" style={{ color: '#4caf50' }}></i>
          </div>
          <div className="stat-info">
            <h3>{stats.published}</h3>
            <p>Published</p>
          </div>
        </div>
        <div className="stat-card glass-effect">
          <div className="stat-icon" style={{ background: 'rgba(255, 152, 0, 0.15)' }}>
            <i className="fas fa-pencil-alt" style={{ color: '#ff9800' }}></i>
          </div>
          <div className="stat-info">
            <h3>{stats.drafts}</h3>
            <p>Drafts</p>
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
              <i className="fas fa-pen-fancy"></i>
            </div>
            <div>
              <h2>{editingBlog ? 'Edit Blog' : 'Create New Blog'}</h2>
              <p>{editingBlog ? 'Update your blog post' : 'Share your knowledge with the world'}</p>
            </div>
          </div>
          {editingBlog && (
            <button className="btn-ghost" onClick={resetForm}>
              <i className="fas fa-times"></i> Cancel
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="modern-form">
          <div className="form-grid">
            <div className="form-group-modern">
              <label>
                <i className="fas fa-heading"></i> Title
                <span className="required">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="Enter blog title..."
                className="input-modern"
              />
            </div>
            <div className="form-group-modern">
              <label>
                <i className="fas fa-tag"></i> Category
                <span className="required">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="select-modern"
              >
                <option value="Technology">Technology</option>
                <option value="Business">Business</option>
                <option value="Innovation">Innovation</option>
                <option value="Industry">Industry</option>
                <option value="Design">Design</option>
                <option value="Marketing">Marketing</option>
              </select>
            </div>
          </div>

          <div className="form-group-modern">
            <label>
              <i className="fas fa-align-left"></i> Excerpt
              <span className="required">*</span>
            </label>
            <textarea
              name="excerpt"
              rows="2"
              value={formData.excerpt}
              onChange={handleChange}
              required
              placeholder="Write a brief summary of your blog..."
              className="textarea-modern"
            />
          </div>

          <div className="form-group-modern">
            <label>
              <i className="fas fa-file-alt"></i> Content
              <span className="required">*</span>
            </label>
            <textarea
              name="content"
              rows="10"
              value={formData.content}
              onChange={handleChange}
              required
              placeholder="Write your blog content here..."
              className="textarea-modern content-editor"
            />
          </div>

          <div className="form-grid">
            <div className="form-group-modern">
              <label>
                <i className="fas fa-user"></i> Author
              </label>
              <input
                type="text"
                name="author"
                value={formData.author}
                onChange={handleChange}
                className="input-modern"
              />
            </div>
            <div className="form-group-modern">
              <label>
                <i className="fas fa-clock"></i> Read Time
              </label>
              <input
                type="text"
                name="readTime"
                value={formData.readTime}
                onChange={handleChange}
                placeholder="e.g. 5 min read"
                className="input-modern"
              />
            </div>
          </div>

          <div className="form-group-modern">
            <label>
              <i className="fas fa-tags"></i> Tags
            </label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="React, JavaScript, Web Development"
              className="input-modern"
            />
          </div>

          <div className="form-group-modern">
            <label>
              <i className="fas fa-image"></i> Featured Image
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
                    <img src={imagePreview} alt="Preview" onError={handleImageError} />
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

          <div className="form-grid">
            <div className="form-group-modern">
              <label>
                <i className="fas fa-flag"></i> Status
                <span className="required">*</span>
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
                className="select-modern"
              >
                <option value="Draft">Draft</option>
                <option value="Published">Published</option>
              </select>
            </div>
            <div className="form-group-modern">
              <label>
                <i className="fas fa-link"></i> Slug
              </label>
              <input
                type="text"
                name="slug"
                value={formData.slug}
                readOnly
                className="input-modern slug-input"
                style={{ background: '#f5f5f5', cursor: 'not-allowed' }}
              />
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
                <span className="toggle-label">Featured Blog</span>
                <span className="toggle-hint">Shows on homepage</span>
              </div>
            </div>
          </div>

          {renderBlogPreview()}

          <div className="form-actions-modern">
            <button type="submit" className="btn-primary-modern">
              {editingBlog ? (
                <>
                  <i className="fas fa-sync-alt"></i> Update Blog
                </>
              ) : (
                <>
                  <i className="fas fa-plus"></i> Create Blog
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Blog List */}
      <div className="list-section glass-effect">
        <div className="list-header-modern">
          <div className="header-left">
            <div className="header-icon">
              <i className="fas fa-list-ul"></i>
            </div>
            <div>
              <h2>All Blogs</h2>
              <p>{filteredBlogs.length} blog{filteredBlogs.length !== 1 ? 's' : ''} found</p>
            </div>
          </div>
        </div>

        <div className="filter-section">
          <div className="search-box">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Search blogs..."
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
              className={`tab-btn ${filterStatus === 'published' ? 'active' : ''}`}
              onClick={() => setFilterStatus('published')}
            >
              <span className="dot active"></span> Published
            </button>
            <button 
              className={`tab-btn ${filterStatus === 'draft' ? 'active' : ''}`}
              onClick={() => setFilterStatus('draft')}
            >
              <span className="dot draft"></span> Drafts
            </button>
          </div>
          <select 
            className="category-filter"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'All Categories' : cat}
              </option>
            ))}
          </select>
        </div>

        {filteredBlogs.length === 0 ? (
          <div className="empty-state-modern">
            <div className="empty-icon">
              <i className="fas fa-blog"></i>
            </div>
            <h3>No blogs found</h3>
            <p>
              {searchTerm || filterStatus !== 'all' || filterCategory !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'Start by creating your first blog post.'}
            </p>
          </div>
        ) : (
          <div className="blogs-grid">
            {filteredBlogs.map((blog, index) => (
              <div 
                key={blog._id} 
                className="blog-card-modern"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="blog-card-image">
                  <img 
                    src={getImageUrl(blog.featuredImage || blog.image)} 
                    alt={blog.title}
                    onError={handleImageError}
                  />
                  {blog.featured && (
                    <span className="featured-badge-modern">
                      <i className="fas fa-star"></i> Featured
                    </span>
                  )}
                  <div className="blog-card-status">
                    <span className={`status-badge ${(blog.status === 'Published' || blog.isPublished) ? 'published' : 'draft'}`}>
                      <span className="pulse-dot"></span>
                      {blog.status || (blog.isPublished ? 'Published' : 'Draft')}
                    </span>
                  </div>
                </div>
                <div className="blog-card-content">
                  <div className="blog-card-header">
                    <h3>{blog.title}</h3>
                    <span className="category-badge">{blog.category}</span>
                  </div>
                  <p className="blog-card-excerpt">{blog.excerpt}</p>
                  <div className="blog-card-meta">
                    <span><i className="fas fa-user"></i> {blog.author}</span>
                    <span><i className="fas fa-clock"></i> {blog.readTime}</span>
                    <span><i className="fas fa-calendar"></i> {new Date(blog.createdAt).toLocaleDateString()}</span>
                  </div>
                  {blog.tags && blog.tags.length > 0 && (
                    <div className="blog-card-tags">
                      {blog.tags.slice(0, 4).map((tag, i) => (
                        <span key={i} className="tag-pill">{tag}</span>
                      ))}
                      {blog.tags.length > 4 && (
                        <span className="tag-pill">+{blog.tags.length - 4}</span>
                      )}
                    </div>
                  )}
                  <div className="blog-card-actions">
                    <button 
                      className="action-btn view"
                      onClick={() => window.open(`http://localhost:3000/blogs/${blog.slug || blog._id}`, '_blank')}
                      title="View Blog"
                    >
                      <i className="fas fa-eye"></i>
                    </button>
                    <button 
                      className="action-btn edit"
                      onClick={() => handleEdit(blog)}
                      title="Edit Blog"
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button 
                      className="action-btn delete"
                      onClick={() => handleDelete(blog._id)}
                      title="Delete Blog"
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

export default BlogManagement;