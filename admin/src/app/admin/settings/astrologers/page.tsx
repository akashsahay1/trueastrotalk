'use client';

import Header from '@/components/admin/Header';
import Sidebar from '@/components/admin/Sidebar';
import { useEffect, useState } from 'react';
import { successMessages, errorMessages, confirmMessages, showLoadingAlert, closeSweetAlert } from '@/lib/sweetalert';
import Link from 'next/link';

interface AstrologerOption {
  _id: string;
  category: 'languages' | 'skills';
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AstrologerOptionsPage() {
  const [languages, setLanguages] = useState<AstrologerOption[]>([]);
  const [skills, setSkills] = useState<AstrologerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'languages' | 'skills'>('languages');
  
  // Form states
  const [newItemName, setNewItemName] = useState('');
  const [editingItem, setEditingItem] = useState<AstrologerOption | null>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    document.body.className = '';
    loadOptions();
  }, []);

  const loadOptions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/astrologer-options');
      const data = await response.json();
      
      if (response.ok) {
        setLanguages(data.data.filter((item: AstrologerOption) => item.category === 'languages'));
        setSkills(data.data.filter((item: AstrologerOption) => item.category === 'skills'));
      } else {
        errorMessages.fetchError('Failed to load astrologer options');
      }
    } catch (error) {
      console.error('Error loading options:', error);
      errorMessages.networkError();
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async () => {
    if (!newItemName.trim()) {
      errorMessages.validationError('Item name is required');
      return;
    }

    showLoadingAlert('Adding new item...');
    
    try {
      const response = await fetch('/api/astrologer-options', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category: activeTab,
          name: newItemName.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        closeSweetAlert();
        successMessages.added('Language');
        setNewItemName('');
        loadOptions();
      } else {
        closeSweetAlert();
        errorMessages.createFailed(`item: ${data.error || 'Unknown error occurred'}`);
      }
    } catch (error) {
      closeSweetAlert();
      errorMessages.networkError();
      console.error('Error adding item:', error);
    }
  };

  const handleEditItem = async (item: AstrologerOption) => {
    if (!editName.trim()) {
      errorMessages.validationError('Item name is required');
      return;
    }

    showLoadingAlert('Updating item...');
    
    try {
      const response = await fetch(`/api/astrologer-options/${item._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editName.trim(),
          isActive: item.isActive,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        closeSweetAlert();
        successMessages.updated('Item');
        setEditingItem(null);
        setEditName('');
        loadOptions();
      } else {
        closeSweetAlert();
        errorMessages.updateFailed(`item: ${data.error || 'Unknown error occurred'}`);
      }
    } catch (error) {
      closeSweetAlert();
      errorMessages.networkError();
      console.error('Error updating item:', error);
    }
  };

  const handleToggleStatus = async (item: AstrologerOption) => {
    showLoadingAlert('Updating status...');
    
    try {
      const response = await fetch(`/api/astrologer-options/${item._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: item.name,
          isActive: !item.isActive,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        closeSweetAlert();
        successMessages.updated('Item status');
        loadOptions();
      } else {
        closeSweetAlert();
        errorMessages.updateFailed(`item: ${data.error || 'Unknown error occurred'}`);
      }
    } catch (error) {
      closeSweetAlert();
      errorMessages.networkError();
      console.error('Error updating status:', error);
    }
  };

  const handleDeleteItem = async (item: AstrologerOption) => {
    const confirmed = await confirmMessages.delete('this item');
    if (!confirmed) return;

    showLoadingAlert('Deleting item...');
    
    try {
      const response = await fetch(`/api/astrologer-options/${item._id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        closeSweetAlert();
        successMessages.deleted('Item');
        loadOptions();
      } else {
        const data = await response.json();
        closeSweetAlert();
        errorMessages.deleteFailed(`item: ${data.error || 'Unknown error occurred'}`);
      }
    } catch (error) {
      closeSweetAlert();
      errorMessages.networkError();
      console.error('Error deleting item:', error);
    }
  };

  const startEdit = (item: AstrologerOption) => {
    setEditingItem(item);
    setEditName(item.name);
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setEditName('');
  };

  const getCurrentItems = () => {
    switch (activeTab) {
      case 'languages':
        return languages;
      case 'skills':
        return skills;
      default:
        return [];
    }
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case 'languages':
        return 'Languages';
      case 'skills':
        return 'Skills';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="dashboard-main-wrapper">
        <Header />
        <Sidebar />
        <div className="dashboard-wrapper">
          <div className="dashboard-ecommerce">
            <div className="container-fluid dashboard-content">
              <div className="row">
                <div className="col-xl-12">
                  <div className="text-center">
                    <i className="fas fa-spinner fa-spin fa-3x text-primary"></i>
                    <p className="mt-3">Loading astrologer options...</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-main-wrapper">
      <Header />
      <Sidebar />
      
      <div className="dashboard-wrapper">
        <div className="dashboard-ecommerce">
          <div className="container-fluid dashboard-content">
            {/* Page Header */}
            <div className="row">
              <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12">
                <div className="page-header">
                  <h2 className="pageheader-title">Astrologers</h2>
                  <p className="pageheader-text">Manage languages and skills for astrologers</p>
                  <div className="page-breadcrumb">
                    <nav aria-label="breadcrumb">
                      <ol className="breadcrumb">
                        <li className="breadcrumb-item">
                          <Link href="/admin/dashboard" className="breadcrumb-link">Dashboard</Link>
                        </li>
                        <li className="breadcrumb-item">
                          <span className="breadcrumb-link">Settings</span>
                        </li>
                        <li className="breadcrumb-item active" aria-current="page">Astrologers</li>
                      </ol>
                    </nav>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="row">
              <div className="col-xl-12">
                <div className="card">
                  <div className="card-body">
                    <ul className="nav nav-tabs" role="tablist">
                      <li className="nav-item">
                        <a 
                          className={`nav-link ${activeTab === 'languages' ? 'active' : ''}`}
                          onClick={() => setActiveTab('languages')}
                          role="tab"
                          style={{ cursor: 'pointer' }}
                        >Languages ({languages.length})</a>
                      </li>
                      <li className="nav-item">
                        <a 
                          className={`nav-link ${activeTab === 'skills' ? 'active' : ''}`}
                          onClick={() => setActiveTab('skills')}
                          role="tab"
                          style={{ cursor: 'pointer' }}
                        >Skills ({skills.length})</a>
                      </li>
                    </ul>

                    <div className="tab-content mt-4">
                      <div className="tab-pane active">
                        {/* Add New Item Form */}
                        <div className="card mb-4">
                          <div className="card-header">
                            <h5 className="mb-0">Add New {getTabTitle().slice(0, -1)}</h5>
                          </div>
                          <div className="card-body">
                            <div className="row">
                              <div className="col-lg-8">
                                <input type="text" className="form-control" placeholder={`${getTabTitle().slice(0, -1)} name`} value={newItemName} onChange={(e) => setNewItemName(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleAddItem()} />
                              </div>
                              <div className="col-lg-4">
                                <button type="button" className="btn btn-primary" onClick={handleAddItem} disabled={!newItemName.trim()}><i className="fa fa-plus"></i></button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Items List */}
                        <div className="card">
                          <div className="card-header">
                            <h5 className="mb-0">{getTabTitle()} ({getCurrentItems().length})</h5>
                          </div>
                          <div className="card-body">
                            {getCurrentItems().length === 0 ? (
                              <div className="text-center py-4">
                                <i className="fas fa-inbox fa-3x text-muted mb-3"></i>
                                <p className="text-muted">No {getTabTitle().toLowerCase()} found. Add some items above.</p>
                              </div>
                            ) : (
                              <div className="table-responsive">
                                <table className="table table-striped">
                                  <thead>
                                    <tr>
                                      <th>Name</th>
                                      <th>Status</th>
                                      <th>Created</th>
                                      <th>Actions</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {getCurrentItems().map((item) => (
                                      <tr key={item._id}>
                                        <td>
                                          {editingItem?._id === item._id ? (
                                            <input
                                              type="text"
                                              className="form-control form-control-sm"
                                              value={editName}
                                              onChange={(e) => setEditName(e.target.value)}
                                              onKeyPress={(e) => e.key === 'Enter' && handleEditItem(item)}
                                            />
                                          ) : (
                                            item.name
                                          )}
                                        </td>
                                        <td>
                                          <span className={`badge ${item.isActive ? 'badge-success' : 'badge-secondary'}`}>
                                            {item.isActive ? 'Active' : 'Inactive'}
                                          </span>
                                        </td>
                                        <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                                        <td>
                                          {editingItem?._id === item._id ? (
                                            <div className="btn-group btn-group-sm">
                                              <button
                                                type="button"
                                                className="btn btn-success mr-2"
                                                onClick={() => handleEditItem(item)}
                                                title="Save"
                                              >
                                                <i className="fas fa-check"></i>
                                              </button>
                                              <button
                                                type="button"
                                                className="btn btn-secondary"
                                                onClick={cancelEdit}
                                                title="Cancel"
                                              >
                                                <i className="fas fa-times"></i>
                                              </button>
                                            </div>
                                          ) : (
                                            <div className="btn-group btn-group-sm">
                                              <button
                                                type="button"
                                                className="btn btn-outline-primary"
                                                onClick={() => startEdit(item)}
                                                title="Edit"
                                              >
                                                <i className="fas fa-edit"></i>
                                              </button>
                                              <button
                                                type="button"
                                                className={`btn mx-2 ${item.isActive ? 'btn-outline-warning' : 'btn-outline-success'}`}
                                                onClick={() => handleToggleStatus(item)}
                                                title={item.isActive ? 'Deactivate' : 'Activate'}
                                              >
                                                <i className={`fas ${item.isActive ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                              </button>
                                              <button
                                                type="button"
                                                className="btn btn-outline-danger"
                                                onClick={() => handleDeleteItem(item)}
                                                title="Delete"
                                              >
                                                <i className="fas fa-trash"></i>
                                              </button>
                                            </div>
                                          )}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}