'use client';

import Header from '@/components/admin/Header';
import Sidebar from '@/components/admin/Sidebar';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { confirmDialogs, successMessages, errorMessages } from '@/lib/sweetalert';

interface CallSession {
  _id: string;
  customer_name: string;
  astrologer_name: string;
  customer_phone: string;
  astrologer_phone: string;
  status: 'pending' | 'ongoing' | 'completed' | 'cancelled' | 'missed';
  start_time: string;
  end_time?: string;
  duration?: number;
  call_rate: number;
  total_amount: number;
  connection_quality?: string;
  customer_rating?: number;
  session_id?: string;
  created_at: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface CallStatistics {
  totalCallsToday: number;
  completedCalls: number;
  ongoingCalls: number;
  avgDuration: string;
}

export default function CallSessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<CallSession[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [modalAnimating, setModalAnimating] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    astrologer: '',
    fromDate: '',
    toDate: '',
    minAmount: '',
    maxAmount: '',
    rating: ''
  });
  const [statistics, setStatistics] = useState<CallStatistics>({
    totalCallsToday: 0,
    completedCalls: 0,
    ongoingCalls: 0,
    avgDuration: '0m'
  });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    document.body.className = '';
    fetchSessions(1);
    fetchStatistics();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchStatistics = async () => {
    setStatsLoading(true);
    try {
      const response = await fetch('/api/sessions/stats?type=call');
      const data = await response.json();

      if (response.ok && data.success) {
        setStatistics({
          totalCallsToday: data.data.totalToday || 0,
          completedCalls: data.data.completed || 0,
          ongoingCalls: data.data.ongoing || 0,
          avgDuration: data.data.avgDuration || '0m'
        });
      }
    } catch (error) {
      console.error('Error fetching call statistics:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchSessions = useCallback(async (page: number, filterParams = filters) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '30',
        type: 'call'
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

      const response = await fetch(`/api/sessions?${params}`);
      const data = await response.json();

      if (response.ok) {
        setSessions(data.data.sessions);
        setPagination(data.data.pagination);
        // Refresh statistics after fetching sessions
        fetchStatistics();
      } else {
        console.error('Error fetching sessions:', data.error);
        setSessions([]);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
      setSessions([]);
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
      status: '',
      astrologer: '',
      fromDate: '',
      toDate: '',
      minAmount: '',
      maxAmount: '',
      rating: ''
    };
    setFilters(clearedFilters);
    fetchSessions(1, clearedFilters);
    closeModal();
  };

  const applyFilters = () => {
    fetchSessions(1, filters);
    closeModal();
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  const handlePageChange = (newPage: number) => {
    fetchSessions(newPage, filters);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ongoing':
        return 'badge-primary';
      case 'completed':
        return 'badge-success';
      case 'cancelled':
        return 'badge-danger';
      case 'missed':
        return 'badge-warning';
      case 'pending':
        return 'badge-info';
      default:
        return 'badge-secondary';
    }
  };

  const getConnectionQualityBadge = (quality?: string) => {
    switch (quality) {
      case 'excellent':
        return 'badge-success';
      case 'good':
        return 'badge-primary';
      case 'fair':
        return 'badge-warning';
      case 'poor':
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return '-';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const handleDelete = async (sessionId: string) => {
    const confirmed = await confirmDialogs.deleteItem('session');
    if (!confirmed) return;

    setDeleting(sessionId);
    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        successMessages.deleted('Session');
        fetchSessions(pagination.currentPage, filters);
      } else {
        await response.json();
        errorMessages.deleteFailed('session');
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      alert('Error deleting session. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedSessions.length === 0) {
      errorMessages.deleteFailed('sessions - Please select sessions to delete');
      return;
    }

    const confirmed = await confirmDialogs.deleteMultiple(selectedSessions.length, 'sessions');
    if (!confirmed) return;

    setDeleting('bulk');
    try {
      const response = await fetch('/api/sessions', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionIds: selectedSessions })
      });

      if (response.ok) {
        const result = await response.json();
        alert(result.message);
        setSelectedSessions([]);
        fetchSessions(pagination.currentPage, filters);
      } else {
        await response.json();
        alert('Error deleting sessions. Please try again.');
      }
    } catch (error) {
      console.error('Error in bulk delete:', error);
      alert('Error deleting sessions. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  const handleSelectSession = (sessionId: string) => {
    setSelectedSessions(prev =>
      prev.includes(sessionId)
        ? prev.filter(id => id !== sessionId)
        : [...prev, sessionId]
    );
  };

  const handleSelectAll = () => {
    if (selectedSessions.length === sessions.length) {
      setSelectedSessions([]);
    } else {
      setSelectedSessions(sessions.map(session => session._id));
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
                  <h2 className="pageheader-title">Call Sessions Management</h2>
                  <p className="pageheader-text">Manage and monitor all call sessions</p>
                  <div className="page-breadcrumb">
                    <nav aria-label="breadcrumb">
                      <ol className="breadcrumb">
                        <li className="breadcrumb-item">
                          <Link href="/admin/dashboard" className="breadcrumb-link">Dashboard</Link>
                        </li>
                        <li className="breadcrumb-item">
                          <span className="breadcrumb-link">Sessions</span>
                        </li>
                        <li className="breadcrumb-item active" aria-current="page">Call Sessions</li>
                      </ol>
                    </nav>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="row mb-4">
              <div className="col-xl-3 col-lg-6 col-md-6 col-sm-12 col-12">
                <div className="card border-top-primary shadow-sm h-100">
                  <div className="card-body">
                    <h5 className="text-muted">Total Calls Today</h5>
                    <div className="metric-value d-inline-block">
                      <h1 className="mb-1">
                        {statsLoading ? (
                          <i className="fas fa-spinner fa-spin"></i>
                        ) : (
                          statistics.totalCallsToday
                        )}
                      </h1>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-xl-3 col-lg-6 col-md-6 col-sm-12 col-12">
                <div className="card border-top-primary shadow-sm h-100">
                  <div className="card-body">
                    <h5 className="text-muted">Completed Calls</h5>
                    <div className="metric-value d-inline-block">
                      <h1 className="mb-1">
                        {statsLoading ? (
                          <i className="fas fa-spinner fa-spin"></i>
                        ) : (
                          statistics.completedCalls
                        )}
                      </h1>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-xl-3 col-lg-6 col-md-6 col-sm-12 col-12">
                <div className="card border-top-primary shadow-sm h-100">
                  <div className="card-body">
                    <h5 className="text-muted">Ongoing Calls</h5>
                    <div className="metric-value d-inline-block">
                      <h1 className="mb-1">
                        {statsLoading ? (
                          <i className="fas fa-spinner fa-spin"></i>
                        ) : (
                          statistics.ongoingCalls
                        )}
                      </h1>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-xl-3 col-lg-6 col-md-6 col-sm-12 col-12">
                <div className="card border-top-primary shadow-sm h-100">
                  <div className="card-body">
                    <h5 className="text-muted">Avg Duration</h5>
                    <div className="metric-value d-inline-block">
                      <h1 className="mb-1">
                        {statsLoading ? (
                          <i className="fas fa-spinner fa-spin"></i>
                        ) : (
                          statistics.avgDuration
                        )}
                      </h1>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters and Actions */}
            <div className="row">
              <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12">
                <div className="card">
                  <div className="card-body">
                    <div className='d-flex justify-content-between align-items-center mb-3'>
                      <h5 className="mb-0">Call Sessions ({pagination.totalCount} total)</h5>
                      <div>
                        {selectedSessions.length > 0 && (
                          <button 
                            className="btn btn-danger mr-2"
                            onClick={handleBulkDelete}
                            disabled={deleting === 'bulk'}
                          >
                            <i className="fas fa-trash mr-1"></i>
                            Delete Selected ({selectedSessions.length})
                          </button>
                        )}
                        <button 
                          className="btn btn-outline-secondary"
                          onClick={openModal}
                        >
                          <i className="fas fa-filter mr-1"></i>
                          Filters {hasActiveFilters && <span className="badge badge-primary ml-1">•</span>}
                        </button>
                      </div>
                    </div>

                    {/* Sessions Table */}
                    <div className="table-responsive">
                      <table className="table table-striped session-table m-0">
                        <thead>
                          <tr>
                            <th>
                              <input 
                                type="checkbox" 
                                checked={sessions.length > 0 && selectedSessions.length === sessions.length}
                                onChange={handleSelectAll}
                                className="table-checkbox"
                              />
                            </th>
                            <th>Session ID</th>
                            <th>Customer</th>
                            <th>Astrologer</th>
                            <th>Start Time</th>
                            <th>Duration</th>
                            <th>Status</th>
                            <th>Rate</th>
                            <th>Amount</th>
                            <th>Quality</th>
                            <th>Rating</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {loading ? (
                            <tr>
                              <td colSpan={12} className="text-center">
                                <i className="fas fa-spinner fa-spin mr-2"></i>Loading...
                              </td>
                            </tr>
                          ) : sessions.length > 0 ? (
                            sessions.map((session) => (
                              <tr key={session._id}>
                                <td>
                                  <input 
                                    type="checkbox" 
                                    checked={selectedSessions.includes(session._id)}
                                    onChange={() => handleSelectSession(session._id)}
                                    className="table-checkbox"
                                  />
                                </td>
                                <td>
                                  <div>
                                    {session.session_id ? (
                                      <code className="text-primary">{session.session_id}</code>
                                    ) : (
                                      <span className="text-muted">Not assigned</span>
                                    )}
                                  </div>
                                </td>
                                <td>
                                  <div>
                                    <strong>{session.customer_name}</strong>
                                    <br />
                                    <small className="text-muted">{session.customer_phone}</small>
                                  </div>
                                </td>
                                <td>
                                  <div>
                                    <strong>{session.astrologer_name}</strong>
                                    <br />
                                    <small className="text-muted">{session.astrologer_phone}</small>
                                  </div>
                                </td>
                                <td>{new Date(session.start_time).toLocaleString()}</td>
                                <td>{formatDuration(session.duration)}</td>
                                <td>
                                  <span className={`badge ${getStatusBadge(session.status)}`}>
                                    {session.status}
                                  </span>
                                </td>
                                <td>₹{session.call_rate}</td>
                                <td>₹{session.total_amount}</td>
                                <td>
                                  {session.connection_quality ? (
                                    <span className={`badge ${getConnectionQualityBadge(session.connection_quality)}`}>
                                      {session.connection_quality}
                                    </span>
                                  ) : '-'}
                                </td>
                                <td>
                                  {session.status === 'completed' && session.customer_rating ? (
                                    <div>
                                      {Array.from({ length: 5 }, (_, i) => (
                                        <i 
                                          key={i} 
                                          className={`fa${i < session.customer_rating! ? 's' : 'r'} fa-star text-warning`}
                                        ></i>
                                      ))}
                                    </div>
                                  ) : session.status === 'completed' ? 'Not rated' : '-'}
                                </td>
                                <td>
                                  <div>
                                    <button 
                                      className="btn btn-sm btn-info mr-1"
                                      title="View"
                                      onClick={() => router.push(`/admin/sessions/call/details/${encodeURIComponent(session.session_id || session._id)}`)}
                                    >
                                      <i className="fas fa-eye"></i>
                                    </button>
                                    <button 
                                      className="btn btn-sm btn-danger"
                                      title="Delete"
                                      onClick={() => handleDelete(session._id)}
                                      disabled={deleting === session._id}
                                    >
                                      {deleting === session._id ? (
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
                              <td colSpan={12} className="text-center">No call sessions found</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                      <nav aria-label="Session pagination">
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
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Filter Modal */}
      {showFilterModal && (
        <div className={`modal fade ${modalAnimating ? 'show' : ''}`} style={{display: 'block'}} tabIndex={-1} role="dialog">
          <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Filter Call Sessions</h5>
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
                    placeholder="Search by customer name, astrologer, or phone"
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                  />
                </div>

                {/* Status and Astrologer - 2 columns */}
                <div className="row">
                  <div className="col-6">
                    <div className="form-group">
                      <label>Status</label>
                      <select 
                        className="form-control form-control-sm"
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                      >
                        <option value="">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="ongoing">Ongoing</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="missed">Missed</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="form-group">
                      <label>Astrologer</label>
                      <input 
                        type="text" 
                        className="form-control form-control-sm" 
                        placeholder="Filter by astrologer name"
                        value={filters.astrologer}
                        onChange={(e) => handleFilterChange('astrologer', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Amount Range - 2 columns */}
                <div className="row">
                  <div className="col-6">
                    <div className="form-group">
                      <label>Min Amount (₹)</label>
                      <input 
                        type="number" 
                        className="form-control form-control-sm" 
                        placeholder="Minimum amount"
                        value={filters.minAmount}
                        onChange={(e) => handleFilterChange('minAmount', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="form-group">
                      <label>Max Amount (₹)</label>
                      <input 
                        type="number" 
                        className="form-control form-control-sm" 
                        placeholder="Maximum amount"
                        value={filters.maxAmount}
                        onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Date Range - 2 columns */}
                <div className="row">
                  <div className="col-6">
                    <div className="form-group">
                      <label>From Date</label>
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
                      <label>To Date</label>
                      <input 
                        type="date" 
                        className="form-control form-control-sm"
                        value={filters.toDate}
                        onChange={(e) => handleFilterChange('toDate', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Rating Filter */}
                <div className="form-group">
                  <label>Minimum Rating</label>
                  <select 
                    className="form-control form-control-sm"
                    value={filters.rating}
                    onChange={(e) => handleFilterChange('rating', e.target.value)}
                  >
                    <option value="">All Ratings</option>
                    <option value="1">1 Star & Above</option>
                    <option value="2">2 Stars & Above</option>
                    <option value="3">3 Stars & Above</option>
                    <option value="4">4 Stars & Above</option>
                    <option value="5">5 Stars Only</option>
                  </select>
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