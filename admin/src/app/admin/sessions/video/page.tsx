'use client';

import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface VideoSession {
  _id: string;
  customer_name: string;
  astrologer_name: string;
  customer_phone: string;
  astrologer_phone: string;
  status: 'pending' | 'ongoing' | 'completed' | 'cancelled' | 'failed';
  start_time?: string;
  end_time?: string;
  duration?: number;
  video_rate: number;
  total_amount: number;
  customer_rating?: number;
  session_id?: string;
  connection_issues?: number;
  created_at: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export default function VideoSessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<VideoSession[]>([]);
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
        type: 'video'
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
      case 'pending':
        return 'badge-info';
      case 'ongoing':
        return 'badge-danger';
      case 'completed':
        return 'badge-success';
      case 'cancelled':
        return 'badge-warning';
      case 'failed':
        return 'badge-secondary';
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
    if (!confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
      return;
    }

    setDeleting(sessionId);
    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Session deleted successfully');
        fetchSessions(pagination.currentPage, search, statusFilter);
      } else {
        const error = await response.json();
        alert('Error deleting session: ' + error.error);
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
      alert('Please select sessions to delete');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedSessions.length} selected sessions? This action cannot be undone.`)) {
      return;
    }

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
        const error = await response.json();
        alert('Error deleting sessions: ' + error.error);
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
                  <h2 className="pageheader-title">Video Sessions Management</h2>
                  <p className="pageheader-text">Manage and monitor all video sessions</p>
                  <div className="page-breadcrumb">
                    <nav aria-label="breadcrumb">
                      <ol className="breadcrumb">
                        <li className="breadcrumb-item">
                          <a href="/admin/dashboard" className="breadcrumb-link">Dashboard</a>
                        </li>
                        <li className="breadcrumb-item">
                          <a href="#" className="breadcrumb-link">Sessions</a>
                        </li>
                        <li className="breadcrumb-item active" aria-current="page">Video Sessions</li>
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
                    <h5 className="text-muted">Total Videos Today</h5>
                    <div className="metric-value d-inline-block">
                      <h1 className="mb-1">16</h1>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-xl-3 col-lg-6 col-md-6 col-sm-12 col-12">
                <div className="card border-3 border-top border-top-danger">
                  <div className="card-body">
                    <h5 className="text-muted">Ongoing Videos</h5>
                    <div className="metric-value d-inline-block">
                      <h1 className="mb-1">2</h1>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-xl-3 col-lg-6 col-md-6 col-sm-12 col-12">
                <div className="card border-3 border-top border-top-info">
                  <div className="card-body">
                    <h5 className="text-muted">Pending Sessions</h5>
                    <div className="metric-value d-inline-block">
                      <h1 className="mb-1">5</h1>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-xl-3 col-lg-6 col-md-6 col-sm-12 col-12">
                <div className="card border-3 border-top border-top-success">
                  <div className="card-body">
                    <h5 className="text-muted">Avg Duration</h5>
                    <div className="metric-value d-inline-block">
                      <h1 className="mb-1">42m</h1>
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
                    <h5 className="mb-0">Video Sessions ({pagination.totalCount} total)</h5>
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
                            placeholder="Search by customer name, astrologer, or session ID..." 
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
                            <option value="ongoing">Ongoing</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="failed">Failed</option>
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
                            <th>Duration</th>
                            <th>Rate</th>
                            <th>Amount</th>
                            <th>Rating</th>
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
                                <td>
                                  <div>
                                    {session.start_time ? (
                                      <div>{new Date(session.start_time).toLocaleString()}</div>
                                    ) : (
                                      <span className="text-muted">Not started</span>
                                    )}
                                  </div>
                                </td>
                                <td>
                                  <span className={`badge ${getStatusBadge(session.status)}`}>
                                    {session.status}
                                    {session.status === 'ongoing' && (
                                      <i className="fas fa-circle ml-1 text-danger" style={{fontSize: '8px'}}></i>
                                    )}
                                  </span>
                                </td>
                                <td>{formatDuration(session.duration)}</td>
                                <td>₹{session.video_rate}</td>
                                <td>₹{session.total_amount}</td>
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
                                      className="btn btn-outline-info btn-sm mr-1"
                                      title="View Details"
                                      onClick={() => router.push(`/admin/sessions/video/details/${encodeURIComponent(session._id)}`)}
                                    >
                                      <i className="fas fa-eye"></i>
                                    </button>
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
                              <td colSpan={10} className="text-center">No video sessions found</td>
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