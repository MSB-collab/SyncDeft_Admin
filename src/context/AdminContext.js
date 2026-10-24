import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminContext = createContext();

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

export const AdminProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const adminData = localStorage.getItem('adminData');
    
    console.log('AdminProvider - Checking session:', { token: !!token, adminData: !!adminData });
    
    if (token && adminData) {
      try {
        const parsedAdmin = JSON.parse(adminData);
        console.log('AdminProvider - Session restored:', parsedAdmin);
        setAdmin(parsedAdmin);
      } catch (error) {
        console.error('Error parsing admin data:', error);
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminData');
      }
    }
    setLoading(false);
    console.log('AdminProvider - Loading complete');
  }, []);

  const login = (token, adminData) => {
    console.log('AdminProvider - Login called');
    localStorage.setItem('adminToken', token);
    localStorage.setItem('adminData', JSON.stringify(adminData));
    setAdmin(adminData);
    // Navigate to dashboard after login
    navigate('/');
  };

  const logout = () => {
    console.log('AdminProvider - Logout called');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    setAdmin(null);
    navigate('/login');
  };

  const getToken = () => {
    return localStorage.getItem('adminToken');
  };

  const isAuthenticated = !!admin;

  return (
    <AdminContext.Provider value={{
      admin,
      loading,
      login,
      logout,
      getToken,
      isAuthenticated
    }}>
      {children}
    </AdminContext.Provider>
  );
};

export default AdminContext;