'use client';

import Header from '@/components/admin/Header';
import Sidebar from '@/components/admin/Sidebar';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { confirmDialogs, successMessages, errorMessages } from '@/lib/sweetalert';
import AirDatePickerComponent from '@/components/admin/AirDatePickerComponent';
import { Pagination } from '@/components/admin/ui/Pagination';
import tableStyles from '@/styles/table.module.css';
import { getCSRFToken } from '@/lib/csrf';

interface User {
  _id: string;
  full_name: string;
  email_address: string;
  phone_number: string;
  profile_image: string;
  profile_image_id?: string;
  account_status: string;
  verification_status: string;
  is_online: boolean;
  is_featured: boolean;
  city: string;
  state: string;
  skills: string[] | string;
  commission_rates: {
    call_rate: number;
    chat_rate: number;
    video_rate: number;
  };
  created_at: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface FilterParams {
  search?: string;
  accountStatus?: string;
  verificationStatus?: string;
  featuredStatus?: string;
  skills?: string;
  city?: string;
  state?: string;
  country?: string;
  fromDate?: string;
  toDate?: string;
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
    } else if (user.profile_image) {
      // User with network image (Google OAuth or external URL)
      setResolvedUrl(user.profile_image);
    } else {
      // No image available - show fallback
      setImageError(true);
    }
  }, [user.profile_image_id, user.profile_image, user.user_type]);

  if (imageError || !resolvedUrl) {
    return (
      <div 
        className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center mr-2" 
        style={{ 
          width: '40px', 
          height: '40px', 
          fontSize: '16px', 
          fontWeight: 'bold',
          minWidth: '40px',
          flexShrink: 0
        }}
      >
        {user.full_name.charAt(0).toUpperCase()}
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
      style={{ 
        width: '40px', 
        height: '40px', 
        objectFit: 'cover',
        minWidth: '40px',
        flexShrink: 0
      }}
      onError={() => setImageError(true)}
    />
  );
}

export default function AstrologersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [limit, setLimit] = useState(30);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [modalAnimating, setModalAnimating] = useState(false);
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [showBulkUpdateModal, setShowBulkUpdateModal] = useState(false);
  const [bulkUpdateModalAnimating, setBulkUpdateModalAnimating] = useState(false);
  const [bulkUpdateData, setBulkUpdateData] = useState({
    field: '',
    value: ''
  });
  const [filters, setFilters] = useState({
    search: '',
    accountStatus: '',
    verificationStatus: '',
    featuredStatus: '',
    skills: '',
    city: '',
    state: '',
    country: '',
    fromDate: '',
    toDate: ''
  });
  const [availableSkills, setAvailableSkills] = useState<string[]>([]);

  const fetchSkills = useCallback(async () => {
    try {
      const response = await fetch('/api/astrologer-options?type=skills');
      const data = await response.json();
      if (response.ok && data.skills) {
        // Handle both string array and object array formats
        const skills = data.skills.map((skill: string | {name?: string; value?: string}) => {
          if (typeof skill === 'string') {
            return skill;
          } else if (skill && typeof skill === 'object') {
            return skill.name || skill.value || String(skill);
          }
          return String(skill);
        });
        setAvailableSkills(skills);
      }
    } catch (error) {
      console.error('Error fetching skills:', error);
    }
  }, []);

  const fetchUsers = useCallback(async (page: number, searchTerm: string, filterParams: FilterParams = {}, pageLimit?: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: (pageLimit || limit).toString(),
        type: 'astrologer'
      });
      
      // Use either searchTerm (legacy) or filter search
      const searchQuery = searchTerm || filterParams.search;
      if (searchQuery) {
        params.append('search', searchQuery);
      }

      // Add filter parameters
      if (filterParams.accountStatus) params.append('accountStatus', filterParams.accountStatus);
      if (filterParams.verificationStatus) params.append('verificationStatus', filterParams.verificationStatus);
      if (filterParams.featuredStatus) params.append('featuredStatus', filterParams.featuredStatus);
      if (filterParams.skills) params.append('skills', filterParams.skills);
      if (filterParams.city) params.append('city', filterParams.city);
      if (filterParams.state) params.append('state', filterParams.state);
      if (filterParams.country) params.append('country', filterParams.country);
      if (filterParams.fromDate) params.append('fromDate', filterParams.fromDate);
      if (filterParams.toDate) params.append('toDate', filterParams.toDate);

      const response = await fetch(`/api/users?${params}`);

      const data = await response.json();


      if (response.ok) {
        setUsers(data.data.users);
        setPagination(data.data.pagination);
        setSearch(searchTerm);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    document.body.className = '';
    
    // Fetch CSRF token on page load
    fetch('/api/csrf')
      .then(response => response.json())
      .then(data => {
        if (data.success && data.csrfToken) {
          // Store token in localStorage for later use
          localStorage.setItem('csrf-token', data.csrfToken);
        }
      })
      .catch(error => console.error('Error fetching CSRF token:', error));
    
    fetchSkills();
    fetchUsers(1, '', {
      search: '',
      accountStatus: '',
      verificationStatus: '',
      featuredStatus: '',
      skills: '',
      city: '',
      state: '',
      country: '',
      fromDate: '',
      toDate: ''
    });
  }, [fetchSkills, fetchUsers]);

  const handlePageChange = (newPage: number) => {
    // Store current scroll position
    const scrollPosition = window.scrollY;
    
    fetchUsers(newPage, search, filters).then(() => {
      // Restore scroll position after data loads
      requestAnimationFrame(() => {
        window.scrollTo(0, scrollPosition);
      });
    });
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setSelectedUsers([]); // Clear selections when changing page size
    // Reset to page 1 when changing limit
    fetchUsers(1, search, filters, newLimit);
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
    setTimeout(() => setShowFilterModal(false), 150);
  };

  const openBulkUpdateModal = () => {
    setShowBulkUpdateModal(true);
    setTimeout(() => setBulkUpdateModalAnimating(true), 10);
  };

  const closeBulkUpdateModal = () => {
    setBulkUpdateModalAnimating(false);
    setTimeout(() => setShowBulkUpdateModal(false), 150);
    setBulkUpdateData({ field: '', value: '' });
  };

  const clearFilters = () => {
    const clearedFilters = {
      search: '',
      accountStatus: '',
      verificationStatus: '',
      featuredStatus: '',
      skills: '',
      city: '',
      state: '',
      country: '',
      fromDate: '',
      toDate: ''
    };
    setFilters(clearedFilters);
    fetchUsers(1, search, clearedFilters);
    closeModal();
  };

  const applyFilters = () => {
    fetchUsers(1, search, filters);
    closeModal();
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '');

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
        fetchUsers(pagination.currentPage, search);
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
      fetchUsers(pagination.currentPage, search);
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

  const handleBulkUpdate = async () => {
    if (selectedUsers.length === 0) {
      errorMessages.validationError('Please select users to update');
      return;
    }

    if (!bulkUpdateData.field || !bulkUpdateData.value) {
      errorMessages.validationError('Please select field and value to update');
      return;
    }

    const fieldLabels: Record<string, string> = {
      'account_status': 'Account Status',
      'verification_status': 'Verification Status',
      'is_online': 'Online Status',
      'is_featured': 'Featured Status'
    };

    const valueLabels: Record<string, string> = {
      'active': 'Active',
      'inactive': 'Inactive',
      'banned': 'Banned',
      'verified': 'Verified',
      'pending': 'Pending',
      'rejected': 'Rejected',
      'true': 'Yes',
      'false': 'No'
    };

    const fieldLabel = fieldLabels[bulkUpdateData.field] || bulkUpdateData.field;
    const valueLabel = valueLabels[bulkUpdateData.value] || bulkUpdateData.value;

    const confirmed = await confirmDialogs.bulkUpdate(
      selectedUsers.length, 
      fieldLabel,
      valueLabel
    );
    if (!confirmed) return;

    setBulkUpdating(true);
    try {
      const csrfToken = getCSRFToken();
      
      if (!csrfToken) {
        console.error('No CSRF token found. Fetching new token...');
        // Try to fetch a new CSRF token
        const csrfResponse = await fetch('/api/csrf');
        const csrfData = await csrfResponse.json();
        if (csrfData.success && csrfData.csrfToken) {
          localStorage.setItem('csrf-token', csrfData.csrfToken);
        }
      }
      
      // For test endpoint, we don't need CSRF token
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      const requestBody = {
        userIds: selectedUsers,
        updates: {
          [bulkUpdateData.field]: bulkUpdateData.field === 'is_online' || bulkUpdateData.field === 'is_featured' 
            ? bulkUpdateData.value === 'true' 
            : bulkUpdateData.value
        }
      };


      const response = await fetch('/api/users/bulk-update', {
        method: 'PATCH',
        headers,
        body: JSON.stringify(requestBody)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        successMessages.updated(`${result.modifiedCount} users`);
        setSelectedUsers([]);
        fetchUsers(pagination.currentPage, search, filters);
        closeBulkUpdateModal();
      } else {
        errorMessages.updateFailed(`bulk update: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error in bulk update:', error);
      errorMessages.updateFailed('bulk update - Please try again');
    } finally {
      setBulkUpdating(false);
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
                  <h2 className="pageheader-title">Astrologers ({pagination.totalCount})</h2>
                  <p className="pageheader-text">Manage all astrologer accounts and their services</p>
                  <div className="page-breadcrumb">
                    <nav aria-label="breadcrumb">
                      <ol className="breadcrumb">
                        <li className="breadcrumb-item">
                          <Link href="/dashboard" className="breadcrumb-link">Dashboard</Link>
                        </li>
                        <li className="breadcrumb-item">
                          <span className="breadcrumb-link">Accounts</span>
                        </li>
                        <li className="breadcrumb-item active" aria-current="page">Astrologers</li>
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
                    <div className='d-flex justify-content-between align-items-center mb-3'>
                      <div className="d-flex align-items-center">
                        <label className="mr-2 mb-0 text-muted" style={{ fontSize: '14px' }}>Show:</label>
                        <select 
                          className="form-control form-control-sm"
                          style={{ width: 'auto' }}
                          value={limit}
                          onChange={(e) => handleLimitChange(parseInt(e.target.value))}
                        >
                          <option value={1000}>All</option>
                          <option value={10}>10</option>
                          <option value={20}>20</option>
                          <option value={30}>30</option>
                          <option value={50}>50</option>
                          <option value={100}>100</option>
                        </select>
                        <span className="ml-2 text-muted" style={{ fontSize: '14px' }}>entries</span>
                      </div>
										<div className='d-flex align-items-center'>
                      {selectedUsers.length > 0 && (
                        <>
                          <button 
                            className="btn btn-info mr-2"
                            onClick={openBulkUpdateModal}
                            disabled={bulkUpdating}
                          >
                            <i className="fas fa-edit mr-1"></i>
                            Bulk Update ({selectedUsers.length})
                          </button>
                          <button 
                            className="btn btn-danger mr-2"
                            onClick={handleBulkDelete}
                            disabled={deleting === 'bulk'}
                          >
                            <i className="fas fa-trash mr-1"></i>
                            Delete Selected ({selectedUsers.length})
                          </button>
                        </>
                      )}
                      <button 
                        className="btn btn-outline-secondary mr-2"
                        onClick={openModal}
                      >
                        <i className="fas fa-filter mr-1"></i>
                        Filters {hasActiveFilters && <span className="badge badge-primary ml-1">•</span>}
                      </button>
                      <Link href="/accounts/add-user?type=astrologer" className="btn btn-primary">Add New</Link>
                      </div>
                    </div>
                    {/* Users Table */}
                    <div className={`table-responsive ${tableStyles.tableContainer}`}>
                      <table className="table table-striped m-0">
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
                            users.map((user) => (
                              <tr key={String(user._id)}>
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
                                      user={{
                                        profile_image_id: user.profile_image_id,
                                        profile_image: user.profile_image,
                                        user_type: 'astrologer',
                                        full_name: user.full_name
                                      }}
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
                                  <span className={`badge ${
                                    user.account_status === 'active' && user.verification_status === 'verified' && user.is_online 
                                      ? 'badge-success' 
                                      : 'badge-secondary'
                                  }`}>
                                    {user.account_status === 'active' && user.verification_status === 'verified' && user.is_online 
                                      ? 'Online' 
                                      : 'Offline'}
                                  </span>
                                </td>
                                <td>{new Date(user.created_at).toLocaleDateString()}</td>
                                <td>
                                  <div>
                                    <Link 
                                      href={`/accounts/edit-user?id=${user._id}`}
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
                              <td colSpan={10} className="text-center">No astrologers found</td>
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
                  limit={limit}
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
                <h5 className="modal-title">Filter Astrologers</h5>
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

                {/* Status Filters - 3 columns */}
                <div className="row">
                  <div className="col-4">
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
                  <div className="col-4">
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
                  <div className="col-4">
                    <div className="form-group">
                      <label>Featured Status</label>
                      <select 
                        className="form-control form-control-sm"
                        value={filters.featuredStatus}
                        onChange={(e) => handleFilterChange('featuredStatus', e.target.value)}
                      >
                        <option value="">All</option>
                        <option value="true">Featured Only</option>
                        <option value="false">Non-Featured</option>
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

                {/* Country and Skills - 2 columns */}
                <div className="row">
                  <div className="col-6">
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
                  </div>
                  <div className="col-6">
                    <div className="form-group">
                      <label>Skills</label>
                      <select 
                        className="form-control form-control-sm"
                        value={filters.skills}
                        onChange={(e) => handleFilterChange('skills', e.target.value)}
                      >
                        <option value="">All Skills</option>
                        {availableSkills.map((skill, index) => (
                          <option key={`skill-${index}-${skill}`} value={skill}>{skill}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Date Range - 2 columns */}
                <div className="row">
                  <div className="col-6">
                    <div className="form-group">
                      <label>Joined From</label>
                      <AirDatePickerComponent
                        className="form-control form-control-sm"
                        placeholder="Select date"
                        value={filters.fromDate}
                        onChange={(date: string) => {
                          handleFilterChange('fromDate', date);
                        }}
                        maxDate={new Date()}
                        minDate={new Date(new Date().getFullYear() - 80, 0, 1)}
                      />
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="form-group">
                      <label>Joined Upto</label>
                      <AirDatePickerComponent
                        className="form-control form-control-sm"
                        placeholder="Select date"
                        value={filters.toDate}
                        onChange={(date: string) => {
                          handleFilterChange('toDate', date);
                        }}
                        maxDate={new Date()}
                        minDate={new Date(new Date().getFullYear() - 80, 0, 1)}
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

      {/* Bulk Update Modal */}
      {showBulkUpdateModal && (
        <div className={`modal fade ${bulkUpdateModalAnimating ? 'show' : ''}`} style={{display: 'block'}} tabIndex={-1} role="dialog">
          <div className="modal-dialog modal-dialog-centered modal-sm" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Bulk Update ({selectedUsers.length} users)</h5>
                <button 
                  type="button" 
                  className="close" 
                  onClick={closeBulkUpdateModal}
                >
                  <span>&times;</span>
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Field to Update</label>
                  <select 
                    className="form-control form-control-sm"
                    value={bulkUpdateData.field}
                    onChange={(e) => setBulkUpdateData(prev => ({ ...prev, field: e.target.value, value: '' }))}
                  >
                    <option value="">Select Field</option>
                    <option value="account_status">Account Status</option>
                    <option value="verification_status">Verification Status</option>
                    <option value="is_online">Online Status</option>
                    <option value="is_featured">Featured Status</option>
                  </select>
                </div>

                {bulkUpdateData.field && (
                  <div className="form-group">
                    <label>New Value</label>
                    <select 
                      className="form-control form-control-sm"
                      value={bulkUpdateData.value}
                      onChange={(e) => setBulkUpdateData(prev => ({ ...prev, value: e.target.value }))}
                    >
                      <option value="">Select Value</option>
                      {bulkUpdateData.field === 'account_status' && (
                        <>
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="banned">Banned</option>
                        </>
                      )}
                      {bulkUpdateData.field === 'verification_status' && (
                        <>
                          <option value="verified">Verified</option>
                          <option value="pending">Pending</option>
                          <option value="rejected">Rejected</option>
                        </>
                      )}
                      {(bulkUpdateData.field === 'is_online' || bulkUpdateData.field === 'is_featured') && (
                        <>
                          <option value="true">Yes</option>
                          <option value="false">No</option>
                        </>
                      )}
                    </select>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary btn-sm" 
                  onClick={closeBulkUpdateModal}
                  disabled={bulkUpdating}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary btn-sm" 
                  onClick={handleBulkUpdate}
                  disabled={bulkUpdating || !bulkUpdateData.field || !bulkUpdateData.value}
                >
                  {bulkUpdating ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-1"></i>
                      Updating...
                    </>
                  ) : (
                    'Update Users'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Update Modal Backdrop */}
      {showBulkUpdateModal && (
        <div 
          className={`modal-backdrop fade ${bulkUpdateModalAnimating ? 'show' : ''}`}
          onClick={closeBulkUpdateModal}
        ></div>
      )}
    </div>
  );
}