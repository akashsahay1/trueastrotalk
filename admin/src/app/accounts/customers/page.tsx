'use client';

import Header from '@/components/admin/Header';
import Sidebar from '@/components/admin/Sidebar';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { confirmDialogs, successMessages, errorMessages } from '@/lib/sweetalert';
import { Pagination } from '@/components/admin/ui/Pagination';
import tableStyles from '@/styles/table.module.css';

interface User {
  _id: string;
  full_name: string;
  email_address: string;
  phone_number: string;
  profile_image: string;
  account_status: string;
  verification_status: string;
  is_online: boolean;
  city: string;
  state: string;
  created_at: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export default function CustomersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [modalAnimating, setModalAnimating] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    accountStatus: '',
    verificationStatus: '',
    city: '',
    state: '',
    country: '',
    fromDate: '',
    toDate: ''
  });

  useEffect(() => {
    document.body.className = '';
    fetchUsers(1);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchUsers = async (page: number, filterParams = filters) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '30',
        type: 'customer'
      });
      
      if (filterParams?.search) {
        params.append('search', filterParams.search);
      }
      
      // Add filter parameters
      if (filterParams) {
        Object.entries(filterParams).forEach(([key, value]) => {
          if (value && key !== 'search') {
            params.append(key, value);
          }
        });
      }

      const response = await fetch(`/api/users?${params}`);
      const data = await response.json();

      if (response.ok) {
        setUsers(data.data.users);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const openModal = () => {
    setShowFilterModal(true);
    setTimeout(() => setModalAnimating(true), 10);
  };

  const closeModal = () => {
    setModalAnimating(false);
    setTimeout(() => setShowFilterModal(false), 300);
  };

  const clearFilters = () => {
    const clearedFilters = {
      search: '',
      accountStatus: '',
      verificationStatus: '',
      city: '',
      state: '',
      country: '',
      fromDate: '',
      toDate: ''
    };
    setFilters(clearedFilters);
    fetchUsers(1, clearedFilters);
    closeModal();
  };

  const applyFilters = () => {
    fetchUsers(1, filters);
    closeModal();
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  const handlePageChange = (newPage: number) => {
    // Store current scroll position
    const scrollPosition = window.scrollY;
    
    fetchUsers(newPage, filters).then(() => {
      // Restore scroll position after data loads
      requestAnimationFrame(() => {
        window.scrollTo(0, scrollPosition);
      });
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return 'badge-success';
      case 'inactive':
        return 'badge-warning';
      case 'banned':
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  };

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return 'badge-success';
      case 'pending':
        return 'badge-warning';
      case 'rejected':
        return 'badge-danger';
      default:
        return 'badge-warning';
    }
  };

  const getVerificationLabel = (status: string) => {
    switch (status) {
      case 'verified':
        return 'Verified';
      case 'pending':
        return 'Pending';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Pending';
    }
  };

  const handleDelete = async (userId: string) => {
    const confirmed = await confirmDialogs.deleteItem('user');
    if (!confirmed) return;

    setDeleting(userId);
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        successMessages.deleted('User');
        fetchUsers(pagination.currentPage, filters);
      } else {
        await response.json();
        errorMessages.deleteFailed('user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error deleting user. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUsers.length === 0) {
      errorMessages.deleteFailed('users - Please select users to delete');
      return;
    }

    const confirmed = await confirmDialogs.deleteMultiple(selectedUsers.length, 'users');
    if (!confirmed) return;

    setDeleting('bulk');
    try {
      const deletePromises = selectedUsers.map(userId =>
        fetch(`/api/users/${userId}`, { method: 'DELETE' })
      );

      const results = await Promise.allSettled(deletePromises);
      const successful = results.filter(result => result.status === 'fulfilled').length;
      const failed = results.length - successful;

      if (failed === 0) {
        successMessages.deleted(`${successful} users`);
      } else {
        errorMessages.deleteFailed(`${successful} users deleted, ${failed} failed`);
      }

      setSelectedUsers([]);
      fetchUsers(pagination.currentPage, filters);
    } catch (error) {
      console.error('Error in bulk delete:', error);
      alert('Error deleting users. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(user => user._id));
    }
  };

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
                  <h2 className="pageheader-title">Customers ({pagination.totalCount})</h2>
                  <p className="pageheader-text">Manage all customer accounts</p>
                  <div className="page-breadcrumb">
                    <nav aria-label="breadcrumb">
                      <ol className="breadcrumb">
                        <li className="breadcrumb-item">
                          <Link href="/dashboard" className="breadcrumb-link">Dashboard</Link>
                        </li>
                        <li className="breadcrumb-item">
                          <span className="breadcrumb-link">Accounts</span>
                        </li>
                        <li className="breadcrumb-item active" aria-current="page">Customers</li>
                      </ol>
                    </nav>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters and Actions */}
            <div className="row">
              <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12">
                <div className="card">
                  <div className="card-body">
										<div className='d-flex justify-content-end align-items-center mb-3'>
                      {selectedUsers.length > 0 && (
                        <button 
                          className="btn btn-danger mr-2"
                          onClick={handleBulkDelete}
                          disabled={deleting === 'bulk'}
                        >
                          <i className="fas fa-trash mr-1"></i>
                          Delete Selected ({selectedUsers.length})
                        </button>
                      )}
                      <button 
                        className="btn btn-outline-secondary mr-2"
                        onClick={openModal}
                      >
                        <i className="fas fa-filter mr-1"></i>
                        Filters {hasActiveFilters && <span className="badge badge-primary ml-1">•</span>}
                      </button>
                      <Link href="/accounts/add-user?type=customer" className="btn btn-primary">Add New</Link>
                    </div>
                    {/* Users Table */}
                    <div className={`table-responsive ${tableStyles.tableContainer}`}>
                      <table className="table table-striped table-bordered m-0">
                        <thead>
                          <tr>
                            <th className='text-center'>
                              <input 
                                type="checkbox" 
                                checked={users.length > 0 && selectedUsers.length === users.length}
                                onChange={handleSelectAll}
                                className="table-checkbox"
                              />
                            </th>
                            <th>Name</th>
                            <th className="d-none d-md-table-cell">Email</th>
                            <th>Phone</th>
                            <th className="d-none d-lg-table-cell">Location</th>
                            <th>Status</th>
                            <th className="d-none d-md-table-cell">Verified</th>
                            <th className="d-none d-lg-table-cell">Online</th>
                            <th className="d-none d-xl-table-cell">Joined</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {loading ? (
                            <tr>
                              <td colSpan={10} className="text-center">
                                <i className="fas fa-spinner fa-spin mr-2"></i>Loading...
                              </td>
                            </tr>
                          ) : users.length > 0 ? (
                            users.map((user) => (
                              <tr key={user._id}>
                                <td className='text-center' data-label="Select">
                                  <input 
                                    type="checkbox" 
                                    checked={selectedUsers.includes(user._id)}
                                    onChange={() => handleSelectUser(user._id)}
                                    className="table-checkbox"
                                  />
                                </td>
                                <td data-label="Name">
                                  <div className="d-flex align-items-center">
                                    {user.profile_image ? (
                                      <Image
                                        src={user.profile_image} 
                                        alt={user.full_name}
                                        className="rounded-circle mr-2"
																				width={40}
																				height={40}
                                        style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                                      />

                                    ) : (
                                      <div className="avatar-xs rounded-circle bg-primary text-white d-flex align-items-center justify-content-center mr-2">
                                        {user.full_name.charAt(0)}
                                      </div>
                                    )}
                                    <div>
                                      <div className="font-weight-bold">{user.full_name}</div>
                                      <small className="text-muted d-block d-md-none">{user.email_address}</small>
                                    </div>
                                  </div>
                                </td>
                                <td data-label="Email" className="d-none d-md-table-cell">{user.email_address}</td>
                                <td data-label="Phone">{user.phone_number}</td>
                                <td data-label="Location" className="d-none d-lg-table-cell">{user.city ? `${user.city}, ${user.state}` : '-'}</td>
                                <td data-label="Status">
                                  <span className={`badge ${getStatusBadge(user.account_status)}`}>
                                    {user.account_status}
                                  </span>
                                </td>
                                <td data-label="Verified" className="d-none d-md-table-cell">
                                  <span className={`badge ${getVerificationBadge(user.verification_status)}`}>
                                    {getVerificationLabel(user.verification_status)}
                                  </span>
                                </td>
                                <td data-label="Online" className="d-none d-lg-table-cell">
                                  <span className={`status-indicator ${user.is_online ? 'online' : 'offline'}`}></span>
                                  <span className={`badge ${user.is_online ? 'badge-success' : 'badge-secondary'}`}>
                                    {user.is_online ? 'Online' : 'Offline'}
                                  </span>
                                </td>
                                <td data-label="Joined" className="d-none d-xl-table-cell">{new Date(user.created_at).toLocaleDateString()}</td>
                                <td data-label="Actions">
                                  <div className="quick-actions">
                                    <Link 
                                      href={`/accounts/edit-user?id=${user._id}`}
                                      className="btn btn-outline-primary btn-sm"
                                      title="Edit"
                                    >
                                      <i className="fas fa-edit"></i>
                                    </Link>
                                    <button 
                                      className="btn btn-outline-danger btn-sm"
                                      title="Delete User"
                                      onClick={() => handleDelete(user._id)}
                                      disabled={deleting === user._id}
                                    >
                                      {deleting === user._id ? (
                                        <i className="fas fa-spinner fa-spin"></i>
                                      ) : (
                                        <i className="fas fa-trash"></i>
                                      )}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={10} className="text-center">No customers found</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                  </div>
                </div>
              </div>
            </div>

            {/* Pagination */}
            <div className="row">
              <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12">
                <Pagination
                  pagination={pagination}
                  onPageChange={handlePageChange}
                  loading={loading}
                  className="mt-3"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Filter Modal */}
      {showFilterModal && (
        <div className={`modal fade ${modalAnimating ? 'show' : ''}`} style={{display: 'block'}} tabIndex={-1} role="dialog">
          <div className="modal-dialog modal-dialog-centered modal-md" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Filter Customers</h5>
                <button 
                  type="button" 
                  className="close" 
                  onClick={closeModal}
                >
                  <span>&times;</span>
                </button>
              </div>
              <div className="modal-body">
                {/* Search Field */}
                <div className="form-group">
                  <label>Search</label>
                  <input 
                    type="text" 
                    className="form-control form-control-sm" 
                    placeholder="Search by name, email, or phone"
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                  />
                </div>

                {/* Status Filters - 2 columns */}
                <div className="row">
                  <div className="col-6">
                    <div className="form-group">
                      <label>Account Status</label>
                      <select 
                        className="form-control form-control-sm"
                        value={filters.accountStatus}
                        onChange={(e) => handleFilterChange('accountStatus', e.target.value)}
                      >
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="banned">Banned</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="form-group">
                      <label>Verification Status</label>
                      <select 
                        className="form-control form-control-sm"
                        value={filters.verificationStatus}
                        onChange={(e) => handleFilterChange('verificationStatus', e.target.value)}
                      >
                        <option value="">All Verification</option>
                        <option value="verified">Verified</option>
                        <option value="pending">Pending</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Location Filters - 2 columns */}
                <div className="row">
                  <div className="col-6">
                    <div className="form-group">
                      <label>City</label>
                      <input 
                        type="text" 
                        className="form-control form-control-sm" 
                        placeholder="Filter by city"
                        value={filters.city}
                        onChange={(e) => handleFilterChange('city', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="form-group">
                      <label>State</label>
                      <input 
                        type="text" 
                        className="form-control form-control-sm" 
                        placeholder="Filter by state"
                        value={filters.state}
                        onChange={(e) => handleFilterChange('state', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Country Filter */}
                <div className="form-group">
                  <label>Country</label>
                  <input 
                    type="text" 
                    className="form-control form-control-sm" 
                    placeholder="Filter by country"
                    value={filters.country}
                    onChange={(e) => handleFilterChange('country', e.target.value)}
                  />
                </div>

                {/* Date Range - 2 columns */}
                <div className="row">
                  <div className="col-6">
                    <div className="form-group">
                      <label>Joined From</label>
                      <input 
                        type="date" 
                        className="form-control form-control-sm"
                        value={filters.fromDate}
                        onChange={(e) => handleFilterChange('fromDate', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="form-group">
                      <label>Joined Upto</label>
                      <input 
                        type="date" 
                        className="form-control form-control-sm"
                        value={filters.toDate}
                        onChange={(e) => handleFilterChange('toDate', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary btn-sm" 
                  onClick={clearFilters}
                >
                  Clear All
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary btn-sm" 
                  onClick={applyFilters}
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Backdrop */}
      {showFilterModal && (
        <div 
          className={`modal-backdrop fade ${modalAnimating ? 'show' : ''}`}
          onClick={closeModal}
        ></div>
      )}
    </div>
  );
}