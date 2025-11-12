'use client';

import Header from '@/components/admin/Header';
import Sidebar from '@/components/admin/Sidebar';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { confirmDialogs, successMessages, errorMessages } from '@/lib/sweetalert';
import { Pagination } from '@/components/admin/ui/Pagination';
import { getCSRFToken } from '@/lib/csrf';
interface ChatSession {
  _id: string;
  customer_name: string;
  astrologer_name: string;
  customer_phone: string;
  astrologer_phone: string;
  status: 'pending' | 'active' | 'completed' | 'expired' | 'cancelled';
  start_time: string;
  end_time?: string;
  message_count: number;
  chat_rate: number;
  total_amount: number;
  session_duration?: number;
  customer_rating?: number;
  last_message_time?: string;
  created_at: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface ChatStatistics {
  totalChatsToday: number;
  activeChats: number;
  completedToday: number;
  avgMessages: number;
}

export default function ChatSessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
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
    minMessages: '',
    maxMessages: '',
    minAmount: '',
    maxAmount: '',
    rating: ''
  });
  const [statistics, setStatistics] = useState<ChatStatistics>({
    totalChatsToday: 0,
    activeChats: 0,
    completedToday: 0,
    avgMessages: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [limit, setLimit] = useState(30);

  useEffect(() => {
    document.body.className = '';
    fetchSessions(1);
    fetchStatistics();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setSelectedSessions([]);
    fetchSessions(1, newLimit, filters);
  };

  const fetchStatistics = async () => {
    setStatsLoading(true);
    try {
      const response = await fetch('/api/sessions/stats?type=chat');
      const data = await response.json();

      if (response.ok && data.success) {
        setStatistics({
          totalChatsToday: data.data.totalToday || 0,
          activeChats: data.data.active || 0,
          completedToday: data.data.completedToday || 0,
          avgMessages: data.data.avgMessages || 0
        });
      }
    } catch (error) {
      console.error('Error fetching chat statistics:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchSessions = useCallback(async (page: number, pageLimit?: number, filterParams = filters) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: (pageLimit || limit).toString(),
        type: 'chat'
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
  }, [filters, limit]);

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
      minMessages: '',
      maxMessages: '',
      minAmount: '',
      maxAmount: '',
      rating: ''
    };
    setFilters(clearedFilters);
    fetchSessions(1, undefined, clearedFilters);
    closeModal();
  };

  const applyFilters = () => {
    fetchSessions(1, undefined, filters);
    closeModal();
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  const handlePageChange = (newPage: number) => {
    fetchSessions(newPage, undefined, filters);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return 'badge-success';
      case 'completed':
        return 'badge-primary';
      case 'expired':
        return 'badge-warning';
      case 'cancelled':
        return 'badge-danger';
      case 'pending':
        return 'badge-info';
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

  const formatLastActivity = (timestamp?: string) => {
    if (!timestamp) return '-';
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffMs = now.getTime() - activityTime.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return activityTime.toLocaleDateString();
  };

  const handleDelete = async (sessionId: string) => {
    const confirmed = await confirmDialogs.deleteItem('session');
    if (!confirmed) return;

    setDeleting(sessionId);
    try {
      const csrfToken = getCSRFToken();
      const headers: HeadersInit = {};

      if (csrfToken) {
        headers['x-csrf-token'] = csrfToken;
      }

      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'DELETE',
        headers,
      });

      if (response.ok) {
        successMessages.deleted('Session');
        fetchSessions(pagination.currentPage, undefined, filters);
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
      const csrfToken = getCSRFToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (csrfToken) {
        headers['x-csrf-token'] = csrfToken;
      }

      const response = await fetch('/api/sessions', {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ sessionIds: selectedSessions })
      });

      if (response.ok) {
        const result = await response.json();
        alert(result.message);
        setSelectedSessions([]);
        fetchSessions(pagination.currentPage, undefined, filters);
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
                  <h2 className="pageheader-title">Chat Sessions Management</h2>
                  <p className="pageheader-text">Manage and monitor all chat sessions</p>
                  <div className="page-breadcrumb">
                    <nav aria-label="breadcrumb">
                      <ol className="breadcrumb">
                        <li className="breadcrumb-item">
                          <Link href="/dashboard" className="breadcrumb-link">Dashboard</Link>
                        </li>
                        <li className="breadcrumb-item">
                          <span className="breadcrumb-link">Sessions</span>
                        </li>
                        <li className="breadcrumb-item active" aria-current="page">Chat Sessions</li>
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
                    <h5 className="text-muted">Total Chats Today</h5>
                    <div className="metric-value d-inline-block">
                      <h1 className="mb-1">
                        {statsLoading ? (
                          <i className="fas fa-spinner fa-spin"></i>
                        ) : (
                          statistics.totalChatsToday
                        )}
                      </h1>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-xl-3 col-lg-6 col-md-6 col-sm-12 col-12">
                <div className="card border-top-primary shadow-sm h-100">
                  <div className="card-body">
                    <h5 className="text-muted">Active Chats</h5>
                    <div className="metric-value d-inline-block">
                      <h1 className="mb-1">
                        {statsLoading ? (
                          <i className="fas fa-spinner fa-spin"></i>
                        ) : (
                          statistics.activeChats
                        )}
                      </h1>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-xl-3 col-lg-6 col-md-6 col-sm-12 col-12">
                <div className="card border-top-primary shadow-sm h-100">
                  <div className="card-body">
                    <h5 className="text-muted">Completed Today</h5>
                    <div className="metric-value d-inline-block">
                      <h1 className="mb-1">
                        {statsLoading ? (
                          <i className="fas fa-spinner fa-spin"></i>
                        ) : (
                          statistics.completedToday
                        )}
                      </h1>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-xl-3 col-lg-6 col-md-6 col-sm-12 col-12">
                <div className="card border-top-primary shadow-sm h-100">
                  <div className="card-body">
                    <h5 className="text-muted">Avg Messages</h5>
                    <div className="metric-value d-inline-block">
                      <h1 className="mb-1">
                        {statsLoading ? (
                          <i className="fas fa-spinner fa-spin"></i>
                        ) : (
                          statistics.avgMessages
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
                      <div className="d-flex align-items-center">
                        <h5 className="mb-0 mr-3">Chat Sessions ({pagination.totalCount} total)</h5>
                        <div className="d-flex align-items-center">
                          <span className="mr-2" style={{fontSize: '14px'}}>Show:</span>
                          <select 
                            className="form-control form-control-sm" 
                            style={{width: 'auto', minWidth: '70px'}}
                            value={limit} 
                            onChange={(e) => handleLimitChange(Number(e.target.value))}
                          >
                            <option value={1000}>All</option>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={30}>30</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                          </select>
                          <span className="ml-2" style={{fontSize: '14px'}}>entries</span>
                        </div>
                      </div>
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
                            <th>Status</th>
                            <th>Messages</th>
                            <th>Duration</th>
                            <th>Rate</th>
                            <th>Amount</th>
                            <th>Last Activity</th>
                            <th>Rating</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {loading ? (
                            <tr>
                              <td colSpan={13} className="text-center">
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
                                    <code className="text-primary">{session._id}</code>
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
                                <td>
                                  <span className={`badge ${getStatusBadge(session.status)}`}>
                                    {session.status}
                                    {session.status === 'active' && (
                                      <i className="fas fa-circle ml-1 text-success" style={{fontSize: '8px'}}></i>
                                    )}
                                  </span>
                                </td>
                                <td>
                                  <span className="badge badge-light">{session.message_count}</span>
                                </td>
                                <td>{formatDuration(session.session_duration)}</td>
                                <td>₹{session.chat_rate}</td>
                                <td>₹{session.total_amount}</td>
                                <td>
                                  <small>{formatLastActivity(session.last_message_time)}</small>
                                </td>
                                <td>
                                  {session.status === 'completed' && session.customer_rating ? (
                                    <div>
                                      {Array.from({ length: 5 }, (_, i) => (
                                        <i 
                                          key={i} 
                                          className={`fa${i < session.customer_rating! ? 's' : 'r'} fa-star text-warning`}
                                          style={{fontSize: '12px'}}
                                        ></i>
                                      ))}
                                    </div>
                                  ) : session.status === 'completed' ? 'Not rated' : '-'}
                                </td>
                                <td>
                                  <div className="">
                                    <button 
                                      className="btn btn-sm btn-info mr-1"
                                      title="View"
                                      onClick={() => router.push(`/sessions/chat/details/${encodeURIComponent(session._id)}`)}
                                    >
                                      <i className="fas fa-eye"></i>
                                    </button>
                                    <button 
                                      className="btn btn-sm btn-info mr-1"
                                      title="View Chat"
                                      onClick={() => {/* TODO: Implement view chat */}}
                                    >
                                      <i className="fas fa-comments"></i>
                                    </button>
                                    {session.status === 'active' && (
                                      <button 
                                        className="btn btn-sm btn-warning mr-1"
                                        title="Monitor Chat"
                                        onClick={() => {/* TODO: Implement monitor chat */}}
                                      >
                                        <i className="fas fa-headset"></i>
                                      </button>
                                    )}
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
                              <td colSpan={13} className="text-center">No chat sessions found</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
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
                <h5 className="modal-title">Filter Chat Sessions</h5>
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
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                        <option value="expired">Expired</option>
                        <option value="cancelled">Cancelled</option>
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

                {/* Message Count Range - 2 columns */}
                <div className="row">
                  <div className="col-6">
                    <div className="form-group">
                      <label>Min Messages</label>
                      <input 
                        type="number" 
                        className="form-control form-control-sm" 
                        placeholder="Minimum messages"
                        value={filters.minMessages}
                        onChange={(e) => handleFilterChange('minMessages', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="form-group">
                      <label>Max Messages</label>
                      <input 
                        type="number" 
                        className="form-control form-control-sm" 
                        placeholder="Maximum messages"
                        value={filters.maxMessages}
                        onChange={(e) => handleFilterChange('maxMessages', e.target.value)}
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