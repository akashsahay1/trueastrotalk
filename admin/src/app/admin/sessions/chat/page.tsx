'use client';

import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { confirmDialogs, successMessages, errorMessages } from '@/lib/sweetalert';

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
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);

  useEffect(() => {
    document.body.className = '';
    fetchSessions(1, '', '');
  }, []);

  const fetchSessions = async (page: number, searchTerm: string, status: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '30',
        type: 'chat'
      });
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      if (status) {
        params.append('status', status);
      }

      const response = await fetch(`/api/sessions?${params}`);
      const data = await response.json();

      if (response.ok) {
        setSessions(data.data.sessions);
        setPagination(data.data.pagination);
        setSearch(searchTerm);
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
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSessions(1, searchInput, statusFilter);
  };

  const handlePageChange = (newPage: number) => {
    fetchSessions(newPage, search, statusFilter);
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
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        successMessages.deleted('Session');
        fetchSessions(pagination.currentPage, search, statusFilter);
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
        fetchSessions(pagination.currentPage, search, statusFilter);
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
                          <Link href="/admin/dashboard" className="breadcrumb-link">Dashboard</Link>
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
                <div className="card border-3 border-top border-top-primary">
                  <div className="card-body">
                    <h5 className="text-muted">Total Chats Today</h5>
                    <div className="metric-value d-inline-block">
                      <h1 className="mb-1">32</h1>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-xl-3 col-lg-6 col-md-6 col-sm-12 col-12">
                <div className="card border-3 border-top border-top-success">
                  <div className="card-body">
                    <h5 className="text-muted">Active Chats</h5>
                    <div className="metric-value d-inline-block">
                      <h1 className="mb-1">7</h1>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-xl-3 col-lg-6 col-md-6 col-sm-12 col-12">
                <div className="card border-3 border-top border-top-info">
                  <div className="card-body">
                    <h5 className="text-muted">Completed Today</h5>
                    <div className="metric-value d-inline-block">
                      <h1 className="mb-1">23</h1>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-xl-3 col-lg-6 col-md-6 col-sm-12 col-12">
                <div className="card border-3 border-top border-top-warning">
                  <div className="card-body">
                    <h5 className="text-muted">Avg Messages</h5>
                    <div className="metric-value d-inline-block">
                      <h1 className="mb-1">28</h1>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters and Actions */}
            <div className="row">
              <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12">
                <div className="card">
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">Chat Sessions ({pagination.totalCount} total)</h5>
                    {selectedSessions.length > 0 && (
                      <button 
                        className="btn btn-danger"
                        onClick={handleBulkDelete}
                        disabled={deleting === 'bulk'}
                      >
                        <i className="fas fa-trash mr-1"></i>
                        Delete Selected ({selectedSessions.length})
                      </button>
                    )}
                  </div>
                  <div className="card-body">
                    {/* Search and Filter Form */}
                    <form onSubmit={handleSearch} className="row mb-3">
                      <div className="col-md-5">
                        <div className="form-group">
                          <input 
                            type="text" 
                            className="form-control" 
                            placeholder="Search by customer name, astrologer, or phone..." 
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="form-group">
                          <select 
                            className="form-control" 
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
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
                      <div className="col-md-4">
                        <button type="submit" className="btn btn-outline-primary mr-2" disabled={loading}>
                          <i className="fas fa-search mr-1"></i>Search
                        </button>
                        <button 
                          type="button" 
                          className="btn btn-outline-secondary"
                          onClick={() => {
                            setSearchInput('');
                            setStatusFilter('');
                            fetchSessions(1, '', '');
                          }}
                          disabled={loading}
                        >
                          Clear
                        </button>
                      </div>
                    </form>

                    {/* Sessions Table */}
                    <div className="table-responsive">
                      <table className="table table-striped table-bordered session-table">
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
                                      className="btn btn-outline-primary"
                                      title="View Details"
                                      onClick={() => router.push(`/admin/sessions/chat/details/${encodeURIComponent(session._id)}`)}
                                    >
                                      <i className="fas fa-eye"></i>
                                    </button>
                                    <button 
                                      className="btn btn-outline-info btn-sm mr-1"
                                      title="View Chat"
                                      onClick={() => {/* TODO: Implement view chat */}}
                                    >
                                      <i className="fas fa-comments"></i>
                                    </button>
                                    {session.status === 'active' && (
                                      <button 
                                        className="btn btn-outline-warning btn-sm mr-1"
                                        title="Monitor Chat"
                                        onClick={() => {/* TODO: Implement monitor chat */}}
                                      >
                                        <i className="fas fa-headset"></i>
                                      </button>
                                    )}
                                    <button 
                                      className="btn btn-outline-danger btn-sm"
                                      title="Delete Session"
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
    </div>
  );
}