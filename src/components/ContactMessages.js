import React, { useState, useEffect } from 'react';
import { useAdmin } from '../context/AdminContext';
import './AdminManagement.css';
import './ContactMessages.css';

const ContactMessages = () => {
  const { getToken } = useAdmin();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [replyForm, setReplyForm] = useState({
    show: false,
    messageId: null,
    reply: ''
  });

  useEffect(() => {
    fetchMessages();
  }, []);

  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => {
        setNotification({ show: false, message: '', type: '' });
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const response = await fetch(`${process.env.REACT_APP_API_URL}/contact`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }

      const data = await response.json();
      setMessages(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      showNotification('Error loading messages', 'error');
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
  };

  const updateStatus = async (id, status) => {
    try {
      const token = getToken();
      const response = await fetch(`${process.env.REACT_APP_API_URL}/contact/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      await fetchMessages();
      showNotification(`Message marked as ${status}`);
    } catch (error) {
      console.error('Error updating message:', error);
      showNotification('Error updating message status', 'error');
    }
  };

  const deleteMessage = async (id) => {
    setDeleteId(id);
    setShowConfirmDialog(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      const token = getToken();
      const response = await fetch(`${process.env.REACT_APP_API_URL}/contact/${deleteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete message');
      }

      await fetchMessages();
      if (selectedMessage && selectedMessage._id === deleteId) {
        setSelectedMessage(null);
      }
      showNotification('Message deleted successfully!');
    } catch (error) {
      console.error('Error deleting message:', error);
      showNotification('Error deleting message', 'error');
    } finally {
      setShowConfirmDialog(false);
      setDeleteId(null);
    }
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyForm.reply.trim()) {
      showNotification('Please enter a reply message.', 'error');
      return;
    }

    try {
      const token = getToken();
      const response = await fetch(`${process.env.REACT_APP_API_URL}/contact/${replyForm.messageId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reply: replyForm.reply })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send reply');
      }

      await fetchMessages();
      setReplyForm({ show: false, messageId: null, reply: '' });
      showNotification('Reply sent successfully!');
    } catch (error) {
      console.error('Error sending reply:', error);
      showNotification(error.message || 'Error sending reply', 'error');
    }
  };

  const getFilteredMessages = () => {
    if (!Array.isArray(messages)) return [];
    
    let filtered = messages;

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(msg => 
        (msg.name || '').toLowerCase().includes(search) ||
        (msg.email || '').toLowerCase().includes(search) ||
        (msg.subject || '').toLowerCase().includes(search) ||
        (msg.message || '').toLowerCase().includes(search)
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(msg => msg.status === filterStatus);
    }

    return filtered;
  };

  const getStatusCount = (status) => {
    if (!Array.isArray(messages)) return 0;
    return messages.filter(msg => msg.status === status).length;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'new':
        return 'fa-envelope';
      case 'read':
        return 'fa-eye';
      case 'replied':
        return 'fa-reply-all';
      case 'archived':
        return 'fa-archive';
      default:
        return 'fa-envelope';
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="spinner-ring"></div>
          <p>Loading messages...</p>
        </div>
      </div>
    );
  }

  const filteredMessages = getFilteredMessages();
  const totalMessages = Array.isArray(messages) ? messages.length : 0;

  return (
    <div className="contact-messages-modern">
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
            <h3>Delete Message</h3>
            <p>Are you sure you want to delete this message? This action cannot be undone.</p>
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

      {/* Stats Section */}
      <div className="stats-grid">
        <div className="stat-card glass-effect">
          <div className="stat-icon" style={{ background: 'rgba(249, 195, 73, 0.15)' }}>
            <i className="fas fa-envelope" style={{ color: '#f9c349' }}></i>
          </div>
          <div className="stat-info">
            <h3>{totalMessages}</h3>
            <p>Total Messages</p>
          </div>
        </div>
        <div className="stat-card glass-effect">
          <div className="stat-icon" style={{ background: 'rgba(33, 150, 243, 0.15)' }}>
            <i className="fas fa-envelope-open" style={{ color: '#2196F3' }}></i>
          </div>
          <div className="stat-info">
            <h3>{getStatusCount('new')}</h3>
            <p>New</p>
          </div>
        </div>
        <div className="stat-card glass-effect">
          <div className="stat-icon" style={{ background: 'rgba(156, 39, 176, 0.15)' }}>
            <i className="fas fa-eye" style={{ color: '#9C27B0' }}></i>
          </div>
          <div className="stat-info">
            <h3>{getStatusCount('read')}</h3>
            <p>Read</p>
          </div>
        </div>
        <div className="stat-card glass-effect">
          <div className="stat-icon" style={{ background: 'rgba(76, 175, 80, 0.15)' }}>
            <i className="fas fa-reply-all" style={{ color: '#4caf50' }}></i>
          </div>
          <div className="stat-info">
            <h3>{getStatusCount('replied')}</h3>
            <p>Replied</p>
          </div>
        </div>
        <div className="stat-card glass-effect">
          <div className="stat-icon" style={{ background: 'rgba(158, 158, 158, 0.15)' }}>
            <i className="fas fa-archive" style={{ color: '#9E9E9E' }}></i>
          </div>
          <div className="stat-info">
            <h3>{getStatusCount('archived')}</h3>
            <p>Archived</p>
          </div>
        </div>
      </div>

      {/* Messages List */}
      <div className="list-section glass-effect">
        <div className="list-header-modern">
          <div className="header-left">
            <div className="header-icon">
              <i className="fas fa-inbox"></i>
            </div>
            <div>
              <h2>Contact Messages</h2>
              <p>{filteredMessages.length} message{filteredMessages.length !== 1 ? 's' : ''} found</p>
            </div>
          </div>
        </div>

        <div className="filter-section">
          <div className="search-box">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Search messages..."
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
              className={`tab-btn ${filterStatus === 'new' ? 'active' : ''}`}
              onClick={() => setFilterStatus('new')}
            >
              <span className="dot new"></span> New
            </button>
            <button 
              className={`tab-btn ${filterStatus === 'read' ? 'active' : ''}`}
              onClick={() => setFilterStatus('read')}
            >
              <span className="dot read"></span> Read
            </button>
            <button 
              className={`tab-btn ${filterStatus === 'replied' ? 'active' : ''}`}
              onClick={() => setFilterStatus('replied')}
            >
              <span className="dot replied"></span> Replied
            </button>
            <button 
              className={`tab-btn ${filterStatus === 'archived' ? 'active' : ''}`}
              onClick={() => setFilterStatus('archived')}
            >
              <span className="dot archived"></span> Archived
            </button>
          </div>
        </div>

        {filteredMessages.length === 0 ? (
          <div className="empty-state-modern">
            <div className="empty-icon">
              <i className="fas fa-inbox"></i>
            </div>
            <h3>No Messages Found</h3>
            <p>
              {searchTerm || filterStatus !== 'all' 
                ? 'Try adjusting your search or filters.' 
                : 'No contact messages have been received yet.'}
            </p>
          </div>
        ) : (
          <div className="messages-grid">
            {filteredMessages.map((message, index) => (
              <div 
                key={message._id} 
                className={`message-card ${message.status === 'new' ? 'unread' : ''} ${selectedMessage?._id === message._id ? 'selected' : ''}`}
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => {
                  if (message.status === 'new') {
                    updateStatus(message._id, 'read');
                  }
                  setSelectedMessage(selectedMessage?._id === message._id ? null : message);
                }}
              >
                <div className="message-card-header">
                  <div className="sender-info">
                    <div className="sender-avatar">
                      {message.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <h4>{message.name}</h4>
                      <span className="sender-email">{message.email}</span>
                    </div>
                  </div>
                  <span className={`status-badge ${message.status}`}>
                    <i className={`fas ${getStatusIcon(message.status)}`}></i>
                    {message.status}
                  </span>
                </div>
                <div className="message-card-body">
                  <div className="message-subject">
                    <i className="fas fa-tag"></i>
                    <span>{message.subject}</span>
                  </div>
                  <p className="message-preview">{message.message}</p>
                  {message.phone && (
                    <div className="message-phone">
                      <i className="fas fa-phone"></i> {message.phone}
                    </div>
                  )}
                </div>
                <div className="message-card-footer">
                  <span className="message-date">
                    <i className="far fa-calendar-alt"></i> {formatDate(message.createdAt)}
                  </span>
                  <div className="message-actions">
                    <button 
                      className="action-btn view"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedMessage(selectedMessage?._id === message._id ? null : message);
                      }}
                      title="View Details"
                    >
                      <i className="fas fa-eye"></i>
                    </button>
                    {message.status !== 'replied' && (
                      <button 
                        className="action-btn reply"
                        onClick={(e) => {
                          e.stopPropagation();
                          setReplyForm({
                            show: true,
                            messageId: message._id,
                            reply: `Dear ${message.name},\n\nThank you for contacting TDC.USA. `
                          });
                          setSelectedMessage(null);
                        }}
                        title="Reply"
                      >
                        <i className="fas fa-reply"></i>
                      </button>
                    )}
                    <button 
                      className="action-btn delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteMessage(message._id);
                      }}
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

        {/* Message Detail View */}
        {selectedMessage && (
          <div className="message-detail-modern animate-slideUp">
            <div className="detail-header">
              <div className="detail-header-left">
                <div className="detail-avatar">
                  {selectedMessage.name?.charAt(0) || 'U'}
                </div>
                <div>
                  <h3>{selectedMessage.name}</h3>
                  <p>{selectedMessage.email}</p>
                </div>
              </div>
              <button className="detail-close" onClick={() => setSelectedMessage(null)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="detail-body">
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Subject</span>
                  <span className="detail-value">{selectedMessage.subject}</span>
                </div>
                {selectedMessage.phone && (
                  <div className="detail-item">
                    <span className="detail-label">Phone</span>
                    <a href={`tel:${selectedMessage.phone}`} className="detail-value">{selectedMessage.phone}</a>
                  </div>
                )}
                <div className="detail-item">
                  <span className="detail-label">Status</span>
                  <span className={`status-badge ${selectedMessage.status}`}>
                    <i className={`fas ${getStatusIcon(selectedMessage.status)}`}></i>
                    {selectedMessage.status}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Received</span>
                  <span className="detail-value">
                    {new Date(selectedMessage.createdAt).toLocaleString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
              <div className="detail-message">
                <span className="detail-label">Message</span>
                <div className="message-content-box">
                  {selectedMessage.message}
                </div>
              </div>
              <div className="detail-actions">
                {selectedMessage.status !== 'replied' && (
                  <button 
                    className="btn-primary-modern"
                    onClick={() => {
                      setReplyForm({
                        show: true,
                        messageId: selectedMessage._id,
                        reply: `Dear ${selectedMessage.name},\n\nThank you for contacting TDC.USA. `
                      });
                      setSelectedMessage(null);
                    }}
                  >
                    <i className="fas fa-reply"></i> Reply
                  </button>
                )}
                {selectedMessage.status === 'new' && (
                  <button 
                    className="btn-secondary-modern"
                    onClick={() => updateStatus(selectedMessage._id, 'read')}
                  >
                    <i className="fas fa-check"></i> Mark as Read
                  </button>
                )}
                {selectedMessage.status !== 'archived' && (
                  <button 
                    className="btn-secondary-modern"
                    onClick={() => updateStatus(selectedMessage._id, 'archived')}
                  >
                    <i className="fas fa-archive"></i> Archive
                  </button>
                )}
                <button 
                  className="btn-danger-modern"
                  onClick={() => deleteMessage(selectedMessage._id)}
                >
                  <i className="fas fa-trash"></i> Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Reply Form Modal */}
      {replyForm.show && (
        <div className="modal-overlay" onClick={() => setReplyForm({ show: false, messageId: null, reply: '' })}>
          <div className="modal-dialog modal-reply" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className="fas fa-reply" style={{ color: '#f9c349' }}></i> Reply to Message</h3>
              <button className="modal-close" onClick={() => setReplyForm({ show: false, messageId: null, reply: '' })}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleReplySubmit} className="modal-body">
              <div className="form-group-modern">
                <label>Reply Message</label>
                <textarea
                  value={replyForm.reply}
                  onChange={(e) => setReplyForm({ ...replyForm, reply: e.target.value })}
                  rows="8"
                  placeholder="Type your reply here..."
                  required
                  className="textarea-modern"
                />
              </div>
              <div className="form-actions-modern">
                <button type="submit" className="btn-primary-modern">
                  <i className="fas fa-paper-plane"></i> Send Reply
                </button>
                <button 
                  type="button" 
                  className="btn-secondary-modern"
                  onClick={() => setReplyForm({ show: false, messageId: null, reply: '' })}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactMessages;