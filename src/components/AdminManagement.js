import React, { useState, useEffect } from 'react';
import { useAdmin } from '../context/AdminContext';
import './AdminManagement.css';

/**
 * AdminManagement - Reusable component for all admin CRUD operations
 * This component can be extended for Blogs, Jobs, Services, Projects, etc.
 */
const AdminManagement = ({
  // Configuration props
  title = 'Manage Items',
  apiEndpoint = '',
  fields = [],
  columns = [],
  itemName = 'Item',
  fetchOnMount = true,
  
  // Custom render functions
  renderFormFields = null,
  renderTableRow = null,
  renderPreview = null,
  
  // Callbacks
  onSuccess = null,
  onError = null,
  onDelete = null,
}) => {
  const { getToken } = useAdmin();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [formData, setFormData] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Initialize form data from fields
  useEffect(() => {
    const initialData = {};
    fields.forEach(field => {
      initialData[field.name] = field.defaultValue || '';
    });
    setFormData(initialData);
  }, [fields]);

  // Fetch items on mount
  useEffect(() => {
    if (fetchOnMount) {
      fetchItems();
    }
  }, []);

  /**
   * Fetch all items from API
   */
  const fetchItems = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const response = await fetch(`${process.env.REACT_APP_API_URL}/${apiEndpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch items');
      }

      const data = await response.json();
      setItems(data);
    } catch (error) {
      console.error('Error fetching items:', error);
      if (onError) onError(error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle form submission (Create or Update)
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const token = getToken();
      const url = editingItem 
        ? `${process.env.REACT_APP_API_URL}/${apiEndpoint}/${editingItem._id}`
        : `${process.env.REACT_APP_API_URL}/${apiEndpoint}`;
      
      const method = editingItem ? 'PUT' : 'POST';

      // Process form data before sending
      const submitData = { ...formData };
      
      // Remove empty fields if needed
      Object.keys(submitData).forEach(key => {
        if (submitData[key] === '' || submitData[key] === null || submitData[key] === undefined) {
          delete submitData[key];
        }
      });

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(submitData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save item');
      }

      const savedItem = await response.json();
      
      // Reset form and refresh list
      resetForm();
      await fetchItems();
      
      if (onSuccess) {
        onSuccess(savedItem);
      }
      
      alert(`${editingItem ? 'Updated' : 'Created'} ${itemName} successfully!`);
    } catch (error) {
      console.error('Error saving item:', error);
      alert(error.message || `Error saving ${itemName}`);
      if (onError) onError(error);
    }
  };

  /**
   * Handle item deletion
   */
  const handleDelete = async (id) => {
    setDeleteId(id);
    setShowConfirmDialog(true);
  };

  /**
   * Confirm and execute deletion
   */
  const confirmDelete = async () => {
    if (!deleteId) return;
    
    try {
      const token = getToken();
      const response = await fetch(`${process.env.REACT_APP_API_URL}/${apiEndpoint}/${deleteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete item');
      }

      await fetchItems();
      
      if (onDelete) {
        onDelete(deleteId);
      }
      
      alert(`${itemName} deleted successfully!`);
    } catch (error) {
      console.error('Error deleting item:', error);
      alert(error.message || `Error deleting ${itemName}`);
      if (onError) onError(error);
    } finally {
      setShowConfirmDialog(false);
      setDeleteId(null);
    }
  };

  /**
   * Set item for editing
   */
  const handleEdit = (item) => {
    setEditingItem(item);
    const editData = {};
    fields.forEach(field => {
      editData[field.name] = item[field.name] || field.defaultValue || '';
    });
    setFormData(editData);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /**
   * Reset form to initial state
   */
  const resetForm = () => {
    setEditingItem(null);
    const initialData = {};
    fields.forEach(field => {
      initialData[field.name] = field.defaultValue || '';
    });
    setFormData(initialData);
  };

  /**
   * Handle form field changes
   */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  /**
   * Filter items based on search and status
   */
  const getFilteredItems = () => {
    let filtered = items;
    
    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(item => {
        // Search in all string fields
        const searchableFields = fields.filter(f => f.searchable !== false);
        return searchableFields.some(field => {
          const value = item[field.name];
          return value && String(value).toLowerCase().includes(search);
        });
      });
    }
    
    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(item => {
        if (filterStatus === 'active') {
          return item.isActive !== false && item.isPublished !== false;
        } else if (filterStatus === 'inactive') {
          return item.isActive === false || item.isPublished === false;
        }
        return true;
      });
    }
    
    return filtered;
  };

  /**
   * Get status label for item
   */
  const getStatus = (item) => {
    if (item.isActive !== undefined) {
      return item.isActive ? 'active' : 'inactive';
    }
    if (item.isPublished !== undefined) {
      return item.isPublished ? 'published' : 'draft';
    }
    return 'unknown';
  };

  /**
   * Render form fields dynamically
   */
  const renderFields = () => {
    if (renderFormFields) {
      return renderFormFields(formData, handleChange);
    }

    return fields.map((field) => {
      const value = formData[field.name] || '';
      
      // Determine field type
      let inputElement;
      switch (field.type) {
        case 'textarea':
          inputElement = (
            <textarea
              id={field.name}
              name={field.name}
              value={value}
              onChange={handleChange}
              rows={field.rows || 4}
              placeholder={field.placeholder || ''}
              required={field.required || false}
            />
          );
          break;
          
        case 'select':
          inputElement = (
            <select
              id={field.name}
              name={field.name}
              value={value}
              onChange={handleChange}
              required={field.required || false}
            >
              {field.options && field.options.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          );
          break;
          
        case 'checkbox':
          inputElement = (
            <input
              type="checkbox"
              id={field.name}
              name={field.name}
              checked={value}
              onChange={handleChange}
            />
          );
          break;
          
        default:
          inputElement = (
            <input
              type={field.type || 'text'}
              id={field.name}
              name={field.name}
              value={value}
              onChange={handleChange}
              placeholder={field.placeholder || ''}
              required={field.required || false}
            />
          );
      }

      return (
        <div key={field.name} className={`form-group ${field.type === 'checkbox' ? 'checkbox' : ''}`}>
          <label htmlFor={field.name}>
            {field.label}
            {field.required && <span className="required">*</span>}
          </label>
          {inputElement}
          {field.hint && <span className="checkbox-hint">{field.hint}</span>}
        </div>
      );
    });
  };

  /**
   * Render table rows dynamically
   */
  const renderRows = () => {
    if (renderTableRow) {
      return renderTableRow(getFilteredItems(), handleEdit, handleDelete);
    }

    return getFilteredItems().map((item) => {
      const status = getStatus(item);
      
      return (
        <tr key={item._id} className={status === 'inactive' || status === 'draft' ? 'inactive-row' : ''}>
          {columns.map((column) => (
            <td key={column.key}>
              {column.render 
                ? column.render(item[column.key], item)
                : String(item[column.key] || 'N/A')
              }
            </td>
          ))}
          <td className="actions">
            <button 
              className="btn-edit"
              onClick={() => handleEdit(item)}
              title="Edit"
            >
              <i className="fas fa-edit"></i>
            </button>
            <button 
              className="btn-delete"
              onClick={() => handleDelete(item._id)}
              title="Delete"
            >
              <i className="fas fa-trash"></i>
            </button>
          </td>
        </tr>
      );
    });
  };

  /**
   * Render preview section
   */
  const renderPreviewSection = () => {
    if (renderPreview) {
      return renderPreview(formData);
    }
    return null;
  };

  // Loading state
  if (loading && fetchOnMount) {
    return <div className="loading">Loading {itemName}s...</div>;
  }

  const filteredItems = getFilteredItems();

  return (
    <div className="admin-management">
      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="confirm-dialog">
          <div className="dialog-box">
            <h3>Confirm Delete</h3>
            <p>Are you sure you want to delete this {itemName.toLowerCase()}? This action cannot be undone.</p>
            <div className="dialog-actions">
              <button className="btn-cancel" onClick={() => {
                setShowConfirmDialog(false);
                setDeleteId(null);
              }}>
                Cancel
              </button>
              <button className="btn-confirm" onClick={confirmDelete}>
                Delete {itemName}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form Section */}
      <div className="management-form">
        <h2>{editingItem ? `Edit ${itemName}` : `Create New ${itemName}`}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            {renderFields()}
          </div>
          
          {renderPreviewSection()}

          <div className="form-actions">
            <button type="submit" className="btn-primary">
              <i className={`fas ${editingItem ? 'fa-save' : 'fa-plus-circle'}`}></i>
              {editingItem ? ` Update ${itemName}` : ` Add ${itemName}`}
            </button>
            {editingItem && (
              <button type="button" className="btn-secondary" onClick={resetForm}>
                <i className="fas fa-times"></i> Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* List Section */}
      <div className="management-list">
        <div className="list-header">
          <h2>All {itemName}s</h2>
          <div className="list-controls">
            <input
              type="text"
              placeholder={`Search ${itemName}s...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <span className="item-count">{filteredItems.length} items</span>
          </div>
        </div>
        
        <div className="items-table">
          {filteredItems.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-folder-open"></i>
              <h3>No {itemName}s Found</h3>
              <p>
                {searchTerm || filterStatus !== 'all' 
                  ? 'Try adjusting your filters.' 
                  : `Add your first ${itemName.toLowerCase()} using the form above.`}
              </p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  {columns.map((column) => (
                    <th key={column.key}>{column.label}</th>
                  ))}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {renderRows()}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminManagement;