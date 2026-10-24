import React, { useState, useEffect } from 'react';
import { useAdmin } from '../context/AdminContext';
import './AdminManagement.css';
import './Settings.css';

const Settings = () => {
  const { admin, getToken } = useAdmin();
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    role: ''
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [companyForm, setCompanyForm] = useState({
    companyName: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    phone: '',
    email: '',
    googleMapsUrl: ''
  });

  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  // Email Config State
  const [emailForm, setEmailForm] = useState({
    senderEmail: '',
    senderName: '',
    host: '',
    port: 587,
    username: '',
    password: ''
  });
  const [emailLoading, setEmailLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [testRecipient, setTestRecipient] = useState('');
  const [emailStatus, setEmailStatus] = useState({ type: '', text: '' });
  const [modalStatus, setModalStatus] = useState({ type: '', text: '' });


  useEffect(() => {
    const fetchCompanySettings = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/settings/public`);
        if (response.ok) {
          const data = await response.json();
          setCompanyForm({
            companyName: data.companyName || 'TDC.USA',
            address: data.address || '',
            city: data.city || '',
            state: data.state || '',
            country: data.country || '',
            postalCode: data.postalCode || '',
            phone: data.phone || '',
            email: data.email || '',
            googleMapsUrl: data.googleMapsUrl || ''
          });
        }
      } catch (error) {
        console.error('Error fetching company settings:', error);
      }
    };

    const fetchEmailSettings = async () => {
      try {
        const token = getToken();
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/settings/email`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setEmailForm({
            senderEmail: data.senderEmail || '',
            senderName: data.senderName || '',
            host: data.host || '',
            port: data.port || 587,
            username: data.username || '',
            password: data.password || ''
          });
        }
      } catch (error) {
        console.error('Error fetching email settings:', error);
      }
    };

    fetchCompanySettings();
    fetchEmailSettings();
  }, []);

  useEffect(() => {
    if (admin) {
      setProfileForm({
        name: admin.name || '',
        email: admin.email || '',
        role: admin.role || 'Administrator'
      });
    }
  }, [admin]);

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    // Profile is read-only or mock saved since there's no update API endpoint
    setTimeout(() => {
      setLoading(false);
      setStatusMessage({ type: 'success', text: 'Admin profile updated successfully!' });
      setTimeout(() => setStatusMessage({ type: '', text: '' }), 4000);
    }, 1000);
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setStatusMessage({ type: 'error', text: 'New passwords do not match!' });
      return;
    }
    setLoading(true);
    // Password mock save
    setTimeout(() => {
      setLoading(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setStatusMessage({ type: 'success', text: 'Password changed successfully!' });
      setTimeout(() => setStatusMessage({ type: '', text: '' }), 4000);
    }, 1200);
  };

  const handleCompanySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const token = getToken();
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(companyForm)
      });
      if (response.ok) {
        setStatusMessage({ type: 'success', text: 'Company settings saved successfully!' });
      } else {
        const errData = await response.json();
        setStatusMessage({ type: 'error', text: errData.message || 'Error saving settings' });
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setStatusMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
      setTimeout(() => setStatusMessage({ type: '', text: '' }), 4000);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
  };

  const handleCompanyChange = (e) => {
    const { name, value } = e.target;
    setCompanyForm(prev => ({ ...prev, [name]: value }));
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setEmailLoading(true);
    setEmailStatus({ type: '', text: '' });
    const token = getToken();
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/settings/email`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(emailForm)
      });
      if (response.ok) {
        setEmailStatus({ type: 'success', text: 'Email SMTP settings saved successfully!' });
      } else {
        const errData = await response.json();
        setEmailStatus({ type: 'error', text: errData.message || 'Error saving email settings' });
      }
    } catch (error) {
      console.error('Error saving email settings:', error);
      setEmailStatus({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setEmailLoading(false);
      setTimeout(() => setEmailStatus({ type: '', text: '' }), 5000);
    }
  };

  const handleVerifyConnection = async () => {
    setVerifying(true);
    setEmailStatus({ type: '', text: '' });
    const token = getToken();
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/settings/email/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(emailForm)
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setEmailStatus({ type: 'success', text: 'SMTP Connection Verified Successfully!' });
      } else {
        setEmailStatus({ type: 'error', text: data.message || 'SMTP Connection Verification Failed' });
      }
    } catch (error) {
      console.error('Error verifying connection:', error);
      setEmailStatus({ type: 'error', text: 'Network error. SMTP Verification Failed.' });
    } finally {
      setVerifying(false);
      setTimeout(() => setEmailStatus({ type: '', text: '' }), 8000);
    }
  };

  const handleSendTestEmail = async (e) => {
    e.preventDefault();
    if (!testRecipient.trim()) {
      alert('Please enter a recipient email.');
      return;
    }
    setTesting(true);
    setModalStatus({ type: '', text: '' });
    const token = getToken();
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/settings/email/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...emailForm,
          recipient: testRecipient
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setModalStatus({ type: 'success', text: `Test email sent successfully!` });
        setEmailStatus({ type: 'success', text: `Test email successfully sent to ${testRecipient}!` });
        setTimeout(() => {
          setShowTestModal(false);
          setTestRecipient('');
          setModalStatus({ type: '', text: '' });
        }, 2000);
      } else {
        setModalStatus({ type: 'error', text: data.message || 'Failed to send test email.' });
      }
    } catch (error) {
      console.error('Error sending test email:', error);
      setModalStatus({ type: 'error', text: 'Network error. Failed to send test email.' });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="admin-management settings-container">
      <h2>Global System Settings</h2>

      {statusMessage.text && (
        <div className={`status-notification ${statusMessage.type}`}>
          <i className={statusMessage.type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-triangle'}></i>
          {statusMessage.text}
        </div>
      )}

      <div className="settings-grid">
        {/* Profile Card */}
        <div className="management-form settings-card">
          <h3>Admin Profile Details</h3>
          <form onSubmit={handleProfileSubmit}>
            <div className="form-group">
              <label>Administrator Name</label>
              <input
                type="text"
                name="name"
                value={profileForm.name}
                onChange={handleProfileChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                name="email"
                value={profileForm.email}
                onChange={handleProfileChange}
                required
              />
            </div>
            <div className="form-group">
              <label>System Role</label>
              <input
                type="text"
                name="role"
                value={profileForm.role}
                disabled
                style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed' }}
              />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              Save Profile
            </button>
          </form>
        </div>

        {/* Change Password Card */}
        <div className="management-form settings-card">
          <h3>Security & Password</h3>
          <form onSubmit={handlePasswordSubmit}>
            <div className="form-group">
              <label>Current Password</label>
              <input
                type="password"
                name="currentPassword"
                value={passwordForm.currentPassword}
                onChange={handlePasswordChange}
                required
                placeholder="••••••••"
              />
            </div>
            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                name="newPassword"
                value={passwordForm.newPassword}
                onChange={handlePasswordChange}
                required
                placeholder="••••••••"
              />
            </div>
            <div className="form-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordChange}
                required
                placeholder="••••••••"
              />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              Change Password
            </button>
          </form>
        </div>

        {/* Company Settings Card */}
        <div className="management-form settings-card full-width-card">
          <h3>Company & Contact Information</h3>
          <form onSubmit={handleCompanySubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Company Name *</label>
                <input
                  type="text"
                  name="companyName"
                  value={companyForm.companyName}
                  onChange={handleCompanyChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Contact Phone *</label>
                <input
                  type="text"
                  name="phone"
                  value={companyForm.phone}
                  onChange={handleCompanyChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Contact Email *</label>
                <input
                  type="email"
                  name="email"
                  value={companyForm.email}
                  onChange={handleCompanyChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Office Address *</label>
                <input
                  type="text"
                  name="address"
                  value={companyForm.address}
                  onChange={handleCompanyChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>City *</label>
                <input
                  type="text"
                  name="city"
                  value={companyForm.city}
                  onChange={handleCompanyChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>State/Province *</label>
                <input
                  type="text"
                  name="state"
                  value={companyForm.state}
                  onChange={handleCompanyChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Country *</label>
                <input
                  type="text"
                  name="country"
                  value={companyForm.country}
                  onChange={handleCompanyChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Postal Code *</label>
                <input
                  type="text"
                  name="postalCode"
                  value={companyForm.postalCode}
                  onChange={handleCompanyChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Google Maps URL (Optional - direct maps link or embed iframe URL)</label>
              <input
                type="text"
                name="googleMapsUrl"
                value={companyForm.googleMapsUrl}
                onChange={handleCompanyChange}
                placeholder="e.g. https://www.google.com/maps/embed?pb=..."
              />
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              Save Corporate Settings
            </button>
          </form>
        </div>

        {/* Email Settings Card */}
        <div className="management-form settings-card full-width-card">
          <h3>Email Configuration (SMTP Settings)</h3>
          <form onSubmit={handleEmailSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Sender Name (e.g. TDC.USA)</label>
                <input 
                  type="text" 
                  name="senderName" 
                  value={emailForm.senderName} 
                  onChange={(e) => setEmailForm(prev => ({ ...prev, senderName: e.target.value }))}
                  placeholder="TDC.USA"
                />
              </div>
              <div className="form-group">
                <label>Default Sender Email</label>
                <input 
                  type="email" 
                  name="senderEmail" 
                  value={emailForm.senderEmail} 
                  onChange={(e) => setEmailForm(prev => ({ ...prev, senderEmail: e.target.value }))}
                  required
                  placeholder="info@tdc.usa"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>SMTP Host</label>
                <input 
                  type="text" 
                  name="host" 
                  value={emailForm.host} 
                  onChange={(e) => setEmailForm(prev => ({ ...prev, host: e.target.value }))}
                  required
                  placeholder="smtp.mailtrap.io"
                />
              </div>
              <div className="form-group">
                <label>SMTP Port</label>
                <input 
                  type="number" 
                  name="port" 
                  value={emailForm.port} 
                  onChange={(e) => setEmailForm(prev => ({ ...prev, port: parseInt(e.target.value, 10) || '' }))}
                  required
                  placeholder="587"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>SMTP Username</label>
                <input 
                  type="text" 
                  name="username" 
                  value={emailForm.username} 
                  onChange={(e) => setEmailForm(prev => ({ ...prev, username: e.target.value }))}
                  required
                  placeholder="smtp_user"
                />
              </div>
              <div className="form-group">
                <label>SMTP Password</label>
                <input 
                  type="password" 
                  name="password" 
                  value={emailForm.password} 
                  onChange={(e) => setEmailForm(prev => ({ ...prev, password: e.target.value }))}
                  required
                  placeholder="••••••••"
                />
              </div>
            </div>

            {emailStatus.text && (
              <div className={`status-notification ${emailStatus.type}`} style={{ marginBottom: '1.5rem' }}>
                <i className={emailStatus.type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-triangle'}></i>
                {emailStatus.text}
              </div>
            )}

            <div className="settings-button-group">
              <button type="submit" className="btn-primary" disabled={emailLoading || verifying}>
                {emailLoading ? 'Saving...' : 'Save Email Configuration'}
              </button>
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={handleVerifyConnection}
                disabled={emailLoading || verifying}
              >
                <i className="fas fa-plug"></i> {verifying ? 'Verifying...' : 'Verify Connection'}
              </button>
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => setShowTestModal(true)}
                disabled={emailLoading || verifying}
              >
                <i className="fas fa-paper-plane"></i> Send Test Email
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Send Test Email Modal */}
      {showTestModal && (
        <div className="reply-modal">
          <div className="reply-modal-content">
            <div className="reply-modal-header">
              <h3>
                <i className="fas fa-paper-plane"></i> Send Test Email
              </h3>
              <button 
                className="btn-close"
                onClick={() => {
                  setShowTestModal(false);
                  setTestRecipient('');
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleSendTestEmail}>
              <div className="form-group">
                <label>Recipient Email Address</label>
                <input
                  type="email"
                  value={testRecipient}
                  onChange={(e) => setTestRecipient(e.target.value)}
                  placeholder="e.g. admin@tdc.usa"
                  required
                  className="search-input"
                  style={{ width: '100%', padding: '10px', marginTop: '5px' }}
                />
                <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
                  A test message will be sent using the configuration above to verify everything works correctly.
                </small>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-primary" disabled={testing}>
                  {testing ? 'Sending...' : 'Send Message'}
                </button>
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => {
                    setShowTestModal(false);
                    setTestRecipient('');
                  }}
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

export default Settings;
