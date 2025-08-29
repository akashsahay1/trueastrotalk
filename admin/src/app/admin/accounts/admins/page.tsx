'use client';

import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { confirmDialogs, successMessages, errorMessages } from '@/lib/sweetalert';

interface User {
  _id: string;
  full_name: string;
  email_address: string;
  phone_number: string;
  profile_image: string;
  profile_image_id?: string;
  user_type: string;
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

interface ProfileImageProps {
  user: {
    profile_image_id?: string;
    profile_image?: string;
    user_type: string;
    full_name: string;
  };
}

function ProfileImage({ user }: ProfileImageProps) {
  const [imageError, setImageError] = useState(false);
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);

  useEffect(() => {
    // Priority logic based on user type and available image sources
    if (user.profile_image_id) {
      // User has media_id (from admin panel or mobile app upload) - resolve via media API
      fetch(`/api/media/resolve?id=${user.profile_image_id}`)
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            setResolvedUrl(data.media.full_url);
          } else {
            setImageError(true);
          }
        })
        .catch(() => setImageError(true));
    } else if (user.user_type === 'customer' && user.profile_image) {
      // Customer with network image (Google OAuth or external URL)
      setResolvedUrl(user.profile_image);
    } else {
      // No image available - show fallback
      setImageError(true);
    }
  }, [user.profile_image_id, user.profile_image, user.user_type]);

  if (imageError || !resolvedUrl) {
    return (
      <div className="avatar-xs rounded-circle bg-primary text-white d-flex align-items-center justify-content-center mr-2">
        {user.full_name.charAt(0)}
      </div>
    );
  }

  return (
    <Image
      src={resolvedUrl}
      alt={user.full_name}
      className="rounded-circle mr-2"
      width={40}
      height={40}
      style={{ width: '40px', height: '40px', objectFit: 'cover' }}
      onError={() => setImageError(true)}
    />
  );
}

export default function AdminsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [loading, setLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [deleting, setDeleting] = useState<string | null>(null);
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

  const fetchUsers = useCallback(async (page: number, filterParams = filters) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '30',
        type: 'administrator'
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
  }, [filters]);


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
    fetchUsers(newPage, filters);
  };


  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(user => user._id));
    }
  };

  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedUsers.length === 0) {
      errorMessages.deleteFailed('users - Please select users to delete');
      return;
    }

    const confirmed = await confirmDialogs.deleteMultiple(selectedUsers.length, 'administrators');
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
        successMessages.deleted(`${successful} administrators`);
      } else {
        errorMessages.deleteFailed(`${successful} administrators deleted, ${failed} failed`);
      }

      setSelectedUsers([]);
      fetchUsers(pagination.currentPage, filters);
    } catch (error) {
      console.error('Error in bulk delete:', error);
      errorMessages.deleteFailed('administrators');
    } finally {
      setDeleting(null);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }

    setDeleting(userId);
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('User deleted successfully');
        fetchUsers(pagination.currentPage, filters);
      } else {
        alert('Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('An error occurred while deleting user');
    } finally {
      setDeleting(null);
    }
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
                  <h2 className="pageheader-title">Administrators ({pagination.totalCount})</h2>
                  <p className="pageheader-text">Manage administrator accounts and permissions</p>
                  <div className="page-breadcrumb">
                    <nav aria-label="breadcrumb">
                      <ol className="breadcrumb">
                        <li className="breadcrumb-item">
                          <Link href="/admin/dashboard" className="breadcrumb-link">Dashboard</Link>
                        </li>
                        <li className="breadcrumb-item">
                          <span className="breadcrumb-link">Accounts</span>
                        </li>
                        <li className="breadcrumb-item active" aria-current="page">Administrators</li>
                      </ol>
                    </nav>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters and Actions */}
            <div className="row">
              <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12">
                <div className="card mb-4">
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
                      <Link href="/admin/accounts/add-user?type=admin" className="btn btn-primary">Add</Link>
                    </div>
                    {/* Users Table */}
                    <div className="table-responsive">
                      <table className="table table-striped m-0">
                        <thead>
                          <tr>
                            <th className='text-center'>
                              <input 
                                type="checkbox" 
                                onChange={handleSelectAll}
                                checked={users.length > 0 && selectedUsers.length === users.length}
                                className="table-checkbox"
                              />
                            </th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Location</th>
                            <th>Status</th>
                            <th>Verified</th>
                            <th>Online</th>
                            <th>Joined</th>
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
                            users.map((user, index) => (
                              <tr key={user._id}>
                                <td className='text-center'>
                                  <input 
                                    type="checkbox" 
                                    checked={selectedUsers.includes(user._id)}
                                    onChange={() => handleSelectUser(user._id)}
                                    className="table-checkbox"
                                  />
                                </td>
                                <td>
                                  <div className="d-flex align-items-center">
                                    <ProfileImage 
                                      user={user}
                                    />
                                    {user.full_name}
                                  </div>
                                </td>
                                <td>{user.email_address}</td>
                                <td>{user.phone_number}</td>
                                <td>{user.city ? `${user.city}, ${user.state}` : '-'}</td>
                                <td>
                                  <span className={`badge ${getStatusBadge(user.account_status)}`}>
                                    {user.account_status}
                                  </span>
                                </td>
                                <td>
                                  <span className={`badge ${getVerificationBadge(user.verification_status)}`}>
                                    {getVerificationLabel(user.verification_status)}
                                  </span>
                                </td>
                                <td>
                                  <span className={`badge ${user.is_online ? 'badge-success' : 'badge-secondary'}`}>
                                    {user.is_online ? 'Online' : 'Offline'}
                                  </span>
                                </td>
                                <td>{new Date(user.created_at).toLocaleDateString()}</td>
                                <td>
                                  <div>
                                    <Link 
                                      href={`/admin/accounts/edit-user?id=${user._id}`}
                                      className="btn btn-sm btn-warning mr-1"
                                      title="Edit"
                                    >
                                      <i className="fas fa-edit"></i>
                                    </Link>
                                    <button 
                                      className="btn btn-sm btn-danger"
                                      title="Delete"
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
                              <td colSpan={10} className="text-center">No administrators found</td>
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
            {pagination.totalPages > 1 && (
              <div className="row mt-4">
                <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12">
                  <nav aria-label="User pagination">
                    <ul className="pagination justify-content-center">
                      <li className={`page-item ${!pagination.hasPrevPage ? 'disabled' : ''}`}>
                        <button 
                          className="page-link" 
                          onClick={() => handlePageChange(pagination.currentPage - 1)}
                          disabled={!pagination.hasPrevPage || loading}
                        >
                          Previous
                        </button>
                      </li>
                      
                      {/* Page numbers */}
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        let pageNumber;
                        if (pagination.totalPages <= 5) {
                          pageNumber = i + 1;
                        } else if (pagination.currentPage <= 3) {
                          pageNumber = i + 1;
                        } else if (pagination.currentPage >= pagination.totalPages - 2) {
                          pageNumber = pagination.totalPages - 4 + i;
                        } else {
                          pageNumber = pagination.currentPage - 2 + i;
                        }
                        
                        return (
                          <li key={pageNumber} className={`page-item ${pagination.currentPage === pageNumber ? 'active' : ''}`}>
                            <button 
                              className="page-link" 
                              onClick={() => handlePageChange(pageNumber)}
                              disabled={loading}
                            >
                              {pageNumber}
                            </button>
                          </li>
                        );
                      })}
                      
                      <li className={`page-item ${!pagination.hasNextPage ? 'disabled' : ''}`}>
                        <button 
                          className="page-link" 
                          onClick={() => handlePageChange(pagination.currentPage + 1)}
                          disabled={!pagination.hasNextPage || loading}
                        >
                          Next
                        </button>
                      </li>
                    </ul>
                  </nav>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filter Modal */}
      {showFilterModal && (
        <div className={`modal fade ${modalAnimating ? 'show' : ''}`} style={{display: 'block'}} tabIndex={-1} role="dialog">
          <div className="modal-dialog modal-dialog-centered modal-md" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Filter Administrators</h5>
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