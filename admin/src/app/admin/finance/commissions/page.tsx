'use client';

import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Commission {
  _id: string;
  astrologer_id: string;
  astrologer_name: string;
  email: string;
  phone: string;
  status: string;
  commission_rates: {
    call_rate: number;
    chat_rate: number;
    video_rate: number;
  };
  sessions: {
    call: {
      count: number;
      revenue: number;
      commission: number;
      rate: number;
    };
    chat: {
      count: number;
      revenue: number;
      commission: number;
      rate: number;
    };
    video: {
      count: number;
      revenue: number;
      commission: number;
      rate: number;
    };
  };
  total_sessions: number;
  total_revenue: number;
  total_commission: number;
  platform_fee: number;
  wallet_balance: number;
  last_session: string | null;
  created_at: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export default function CommissionsPage() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
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
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    document.body.className = '';
    fetchCommissions(1, '', '', '');
  }, []);

  const fetchCommissions = async (page: number, searchTerm: string, fromDate: string, toDate: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '30'
      });
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      if (fromDate) {
        params.append('date_from', fromDate);
      }
      
      if (toDate) {
        params.append('date_to', toDate);
      }

      const response = await fetch(`/api/finance/commissions?${params}`);
      const data = await response.json();

      if (response.ok) {
        setCommissions(data.data.commissions);
        setPagination(data.data.pagination);
        setSearch(searchTerm);
        setDateFrom(fromDate);
        setDateTo(toDate);
      } else {
        console.error('Failed to fetch commissions:', data.error);
      }
    } catch (error) {
      console.error('Error fetching commissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCommissions(1, searchInput, dateFrom, dateTo);
  };

  const handlePageChange = (page: number) => {
    fetchCommissions(page, search, dateFrom, dateTo);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return 'badge-success';
      case 'inactive':
        return 'badge-warning';
      case 'suspended':
        return 'badge-danger';
      case 'pending':
        return 'badge-info';
      default:
        return 'badge-secondary';
    }
  };

  const totalStats = commissions.reduce((acc, commission) => ({
    totalRevenue: acc.totalRevenue + commission.total_revenue,
    totalCommission: acc.totalCommission + commission.total_commission,
    totalPlatformFee: acc.totalPlatformFee + commission.platform_fee,
    totalSessions: acc.totalSessions + commission.total_sessions
  }), { totalRevenue: 0, totalCommission: 0, totalPlatformFee: 0, totalSessions: 0 });

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
                  <h2 className="pageheader-title">Commission Management</h2>
                  <p className="pageheader-text">Manage astrologer commissions and earnings</p>
                  <div className="page-breadcrumb">
                    <nav aria-label="breadcrumb">
                      <ol className="breadcrumb">
                        <li className="breadcrumb-item">
                          <Link href="/admin/dashboard" className="breadcrumb-link">Dashboard</Link>
                        </li>
                        <li className="breadcrumb-item">
                          <span className="breadcrumb-link">Finance</span>
                        </li>
                        <li className="breadcrumb-item active" aria-current="page">Commissions</li>
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
                    <h5 className="text-muted">Total Revenue</h5>
                    <div className="metric-value d-inline-block">
                      <h1 className="mb-1">₹{totalStats.totalRevenue.toLocaleString()}</h1>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-xl-3 col-lg-6 col-md-6 col-sm-12 col-12">
                <div className="card border-3 border-top border-top-success">
                  <div className="card-body">
                    <h5 className="text-muted">Total Commissions</h5>
                    <div className="metric-value d-inline-block">
                      <h1 className="mb-1">₹{totalStats.totalCommission.toLocaleString()}</h1>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-xl-3 col-lg-6 col-md-6 col-sm-12 col-12">
                <div className="card border-3 border-top border-top-warning">
                  <div className="card-body">
                    <h5 className="text-muted">Platform Fees</h5>
                    <div className="metric-value d-inline-block">
                      <h1 className="mb-1">₹{totalStats.totalPlatformFee.toLocaleString()}</h1>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-xl-3 col-lg-6 col-md-6 col-sm-12 col-12">
                <div className="card border-3 border-top border-top-danger">
                  <div className="card-body">
                    <h5 className="text-muted">Active Astrologers</h5>
                    <div className="metric-value d-inline-block">
                      <h1 className="mb-1">{commissions.filter(c => c.status === 'active').length}</h1>
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
                    <h5 className="mb-0">Astrologer Commissions ({pagination.totalCount} total)</h5>
                  </div>
                  <div className="card-body">
                    {/* Search and Filter Form */}
                    <form onSubmit={handleSearch} className="row mb-3">
                      <div className="col-md-4">
                        <div className="form-group">
                          <input 
                            type="text" 
                            className="form-control" 
                            placeholder="Search by astrologer name..." 
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-md-2">
                        <div className="form-group">
                          <input 
                            type="date" 
                            className="form-control" 
                            placeholder="From Date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-md-2">
                        <div className="form-group">
                          <input 
                            type="date" 
                            className="form-control" 
                            placeholder="To Date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-md-2">
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                          {loading ? 'Searching...' : 'Search'}
                        </button>
                      </div>
                      <div className="col-md-2">
                        <button 
                          type="button" 
                          className="btn btn-secondary"
                          onClick={() => {
                            setSearchInput('');
                            setDateFrom('');
                            setDateTo('');
                            fetchCommissions(1, '', '', '');
                          }}
                        >
                          Clear
                        </button>
                      </div>
                    </form>

                    {/* Commissions Table */}
                    <div className="table-responsive">
                      <table className="table table-striped table-bordered session-table">
                        <thead>
                          <tr>
                            <th>Astrologer</th>
                            <th>Status</th>
                            <th>Sessions</th>
                            <th>Revenue</th>
                            <th>Commission</th>
                            <th>Platform Fee</th>
                            <th>Commission Rates</th>
                            <th>Wallet Balance</th>
                            <th>Last Session</th>
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
                          ) : commissions.length > 0 ? (
                            commissions.map((commission) => (
                              <tr key={commission._id}>
                                <td>
                                  <div>
                                    <strong>{commission.astrologer_name}</strong>
                                    <br />
                                    <small className="text-muted">{commission.email}</small>
                                  </div>
                                </td>
                                <td>
                                  <span className={`badge ${getStatusBadge(commission.status)}`}>
                                    {commission.status}
                                  </span>
                                </td>
                                <td>
                                  <div>
                                    <strong>{commission.total_sessions}</strong>
                                    <br />
                                    <small className="text-muted">
                                      C:{commission.sessions.call.count} | 
                                      Ch:{commission.sessions.chat.count} | 
                                      V:{commission.sessions.video.count}
                                    </small>
                                  </div>
                                </td>
                                <td>
                                  <strong className="text-primary">₹{commission.total_revenue.toLocaleString()}</strong>
                                </td>
                                <td>
                                  <strong className="text-success">₹{commission.total_commission.toLocaleString()}</strong>
                                </td>
                                <td>
                                  <strong className="text-warning">₹{commission.platform_fee.toLocaleString()}</strong>
                                </td>
                                <td>
                                  <small>
                                    Call: {commission.commission_rates.call_rate}%<br />
                                    Chat: {commission.commission_rates.chat_rate}%<br />
                                    Video: {commission.commission_rates.video_rate}%
                                  </small>
                                </td>
                                <td>
                                  <span className="text-info">₹{commission.wallet_balance.toLocaleString()}</span>
                                </td>
                                <td>
                                  {commission.last_session ? 
                                    new Date(commission.last_session).toLocaleDateString() : 
                                    'No sessions'
                                  }
                                </td>
                                <td>
                                  <div>
                                    <Link 
                                      href={`/admin/finance/transactions?user_id=${commission.astrologer_id}`}
                                      className="btn btn-outline-info btn-sm mr-1"
                                      title="View Transactions"
                                    >
                                      <i className="fas fa-list"></i>
                                    </Link>
                                    <button 
                                      className="btn btn-outline-primary btn-sm mr-1"
                                      title="Edit Commission Rates"
                                      onClick={() => {/* TODO: Implement edit commission rates */}}
                                    >
                                      <i className="fas fa-edit"></i>
                                    </button>
                                    <button 
                                      className="btn btn-outline-success btn-sm"
                                      title="Payout"
                                      onClick={() => {/* TODO: Implement payout */}}
                                    >
                                      <i className="fas fa-money-bill"></i>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={10} className="text-center">No commissions found</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                      <nav aria-label="Commission pagination">
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
                              <li key={pageNumber} className={`page-item ${pageNumber === pagination.currentPage ? 'active' : ''}`}>
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