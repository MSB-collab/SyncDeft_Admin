import React, { useState, useEffect } from 'react';
import { useAdmin } from '../context/AdminContext';
import './AdminManagement.css';
import './NewsletterManagement.css';

const NewsletterManagement = () => {
  const { getToken } = useAdmin();
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteEmail, setDeleteEmail] = useState('');

  useEffect(() => {
    fetchSubscribers();
  }, []);

  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => {
        setNotification({ show: false, message: '', type: '' });
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const fetchSubscribers = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/newsletter`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch subscribers');
      }

      const data = await response.json();
      setSubscribers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching subscribers:', error);
      showNotification('Error loading subscribers. Please try again.', 'error');
      setSubscribers([]);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
  };

  const handleDelete = async (id, email) => {
    setDeleteId(id);
    setDeleteEmail(email);
    setShowConfirmDialog(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      const token = getToken();
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/newsletter/${deleteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete subscriber');
      }

      setSubscribers(prev => prev.filter(sub => sub._id !== deleteId));
      showNotification('Subscriber removed successfully!');
    } catch (error) {
      console.error('Error deleting subscriber:', error);
      showNotification('Error removing subscriber.', 'error');
    } finally {
      setShowConfirmDialog(false);
      setDeleteId(null);
      setDeleteEmail('');
    }
  };

  const handleExportCSV = () => {
    const listToExport = getFilteredSubscribers();
    if (listToExport.length === 0) {
      showNotification('No subscribers found to export.', 'error');
      return;
    }

    const headers = ['Email Address', 'Subscription Date', 'Subscription Time'];
    const rows = listToExport.map(sub => {
      const dateObj = new Date(sub.subscribedAt);
      return [
        sub.email,
        dateObj.toLocaleDateString(),
        dateObj.toLocaleTimeString()
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${val.toString().replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `newsletter_subscribers_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('CSV exported successfully!');
  };

  const getFilteredSubscribers = () => {
    if (!Array.isArray(subscribers)) return [];
    if (!searchTerm.trim()) return subscribers;
    const term = searchTerm.toLowerCase().trim();
    return subscribers.filter(sub => sub.email.toLowerCase().includes(term));
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="spinner-ring"></div>
          <p>Loading subscribers...</p>
        </div>
      </div>
    );
  }

  const filteredSubscribers = getFilteredSubscribers();
  const totalSubscribers = Array.isArray(subscribers) ? subscribers.length : 0;

  return (
    <div className="newsletter-management-modern">
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
              <i className="fas fa-user-slash"></i>
            </div>
            <h3>Remove Subscriber</h3>
            <p>Are you sure you want to remove <strong>{deleteEmail}</strong> from the newsletter subscribers list?</p>
            <div className="modal-actions">
              <button className="btn-outline" onClick={() => {
                setShowConfirmDialog(false);
                setDeleteId(null);
                setDeleteEmail('');
              }}>
                Cancel
              </button>
              <button className="btn-danger" onClick={confirmDelete}>
                <i className="fas fa-trash"></i> Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Dashboard */}
      <div className="stats-grid">
        <div className="stat-card glass-effect">
          <div className="stat-icon" style={{ background: 'rgba(249, 195, 73, 0.15)' }}>
            <i className="fas fa-users" style={{ color: '#f9c349' }}></i>
          </div>
          <div className="stat-info">
            <h3>{totalSubscribers}</h3>
            <p>Total Subscribers</p>
          </div>
        </div>
        <div className="stat-card glass-effect">
          <div className="stat-icon" style={{ background: 'rgba(33, 150, 243, 0.15)' }}>
            <i className="fas fa-search" style={{ color: '#2196F3' }}></i>
          </div>
          <div className="stat-info">
            <h3>{filteredSubscribers.length}</h3>
            <p>Filtered Matches</p>
          </div>
        </div>
        <div className="stat-card glass-effect">
          <div className="stat-icon" style={{ background: 'rgba(76, 175, 80, 0.15)' }}>
            <i className="fas fa-file-csv" style={{ color: '#4caf50' }}></i>
          </div>
          <div className="stat-info">
            <h3>{totalSubscribers > 0 ? 'Export' : '0'}</h3>
            <p>Export Available</p>
          </div>
        </div>
      </div>

      {/* Main List Section */}
      <div className="list-section glass-effect">
        <div className="list-header-modern">
          <div className="header-left">
            <div className="header-icon">
              <i className="fas fa-paper-plane"></i>
            </div>
            <div>
              <h2>Newsletter Subscribers</h2>
              <p>{filteredSubscribers.length} subscriber{filteredSubscribers.length !== 1 ? 's' : ''} found</p>
            </div>
          </div>
          <div className="header-actions">
            <button 
              className="btn-export" 
              onClick={handleExportCSV}
              disabled={totalSubscribers === 0}
              title={totalSubscribers === 0 ? 'No subscribers to export' : 'Export filtered list to CSV'}
            >
              <i className="fas fa-file-csv"></i> Export CSV
            </button>
          </div>
        </div>

        <div className="filter-section">
          <div className="search-box">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Search subscribers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input-modern"
            />
          </div>
          <div className="filter-stats">
            <span className="subscriber-count">
              <i className="fas fa-envelope"></i> {filteredSubscribers.length} active
            </span>
          </div>
        </div>

        {filteredSubscribers.length === 0 ? (
          <div className="empty-state-modern">
            <div className="empty-icon">
              <i className="fas fa-paper-plane"></i>
            </div>
            <h3>No Subscribers Found</h3>
            <p>
              {searchTerm 
                ? 'No subscribers match your search term.' 
                : 'No emails have subscribed to the newsletter yet.'}
            </p>
          </div>
        ) : (
          <div className="subscribers-grid">
            {filteredSubscribers.map((sub, index) => (
              <div 
                key={sub._id} 
                className="subscriber-card"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="subscriber-card-content">
                  <div className="subscriber-avatar">
                    {sub.email.charAt(0).toUpperCase()}
                  </div>
                  <div className="subscriber-info">
                    <div className="subscriber-email">{sub.email}</div>
                    <div className="subscriber-date">
                      <i className="far fa-calendar-alt"></i>
                      {formatDate(sub.subscribedAt)}
                    </div>
                  </div>
                </div>
                <div className="subscriber-card-actions">
                  <button 
                    className="action-btn delete"
                    onClick={() => handleDelete(sub._id, sub.email)}
                    title="Remove Subscriber"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsletterManagement;