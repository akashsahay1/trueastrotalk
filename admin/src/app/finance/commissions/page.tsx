'use client';

import Header from '@/components/admin/Header';
import Sidebar from '@/components/admin/Sidebar';
import { useEffect, useState, useCallback } from 'react';
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
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [modalAnimating, setModalAnimating] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    dateFrom: '',
    dateTo: '',
    minRevenue: '',
    maxRevenue: ''
  });

  const fetchCommissions = useCallback(async (page: number, searchTerm: string, filterParams = filters) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '30'
      });
      
      // Use either searchTerm (legacy) or filter search
      const searchQuery = searchTerm || filterParams.search;
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      
      // Add filter parameters
      if (filterParams.status) params.append('status', filterParams.status);
      if (filterParams.dateFrom) params.append('date_from', filterParams.dateFrom);
      if (filterParams.dateTo) params.append('date_to', filterParams.dateTo);
      if (filterParams.minRevenue) params.append('min_revenue', filterParams.minRevenue);
      if (filterParams.maxRevenue) params.append('max_revenue', filterParams.maxRevenue);

      const response = await fetch(`/api/finance/commissions?${params}`);
      const data = await response.json();

      if (response.ok) {
        setCommissions(data.data.commissions);
        setPagination(data.data.pagination);
        setSearch(searchTerm);
      } else {
        console.error('Failed to fetch commissions:', data.error);
      }
    } catch (error) {
      console.error('Error fetching commissions:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.body.className = '';
    fetchCommissions(1, '', {
      search: '',
      status: '',
      dateFrom: '',
      dateTo: '',
      minRevenue: '',
      maxRevenue: ''
    });
  }, [fetchCommissions]);

  const handlePageChange = (page: number) => {
    fetchCommissions(page, search, filters);
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

  const clearFilters = () => {
    const clearedFilters = {
      search: '',
      status: '',
      dateFrom: '',
      dateTo: '',
      minRevenue: '',
      maxRevenue: ''
    };
    setFilters(clearedFilters);
    fetchCommissions(1, search, clearedFilters);
    closeModal();
  };

  const applyFilters = () => {
    fetchCommissions(1, search, filters);
    closeModal();
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '');

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
                          <Link href="/dashboard" className="breadcrumb-link">Dashboard</Link>
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
                <div className="card border-top-primary shadow-sm h-100">
                  <div className="card-body">
                    <h5 className="text-muted">Total Revenue</h5>
                    <div className="metric-value d-inline-block">
                      <h1 className="mb-1">₹{totalStats.totalRevenue.toLocaleString()}</h1>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-xl-3 col-lg-6 col-md-6 col-sm-12 col-12">
                <div className="card border-top-primary shadow-sm h-100">
                  <div className="card-body">
                    <h5 className="text-muted">Total Commissions</h5>
                    <div className="metric-value d-inline-block">
                      <h1 className="mb-1">₹{totalStats.totalCommission.toLocaleString()}</h1>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-xl-3 col-lg-6 col-md-6 col-sm-12 col-12">
                <div className="card border-top-primary shadow-sm h-100">
                  <div className="card-body">
                    <h5 className="text-muted">Platform Fees</h5>
                    <div className="metric-value d-inline-block">
                      <h1 className="mb-1">₹{totalStats.totalPlatformFee.toLocaleString()}</h1>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-xl-3 col-lg-6 col-md-6 col-sm-12 col-12">
                <div className="card border-top-primary shadow-sm h-100">
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
                <div className="card mb-4">
                  <div className="card-body">
                    <div className='d-flex justify-content-between align-items-center mb-3'>
                      <h5 className="mb-0">Astrologer Commissions ({pagination.totalCount})</h5>
                      <button 
                        className="btn btn-outline-secondary"
                        onClick={openModal}
                      >
                        <i className="fas fa-filter mr-1"></i>
                        Filters {hasActiveFilters && <span className="badge badge-primary ml-1">•</span>}
                      </button>
                    </div>

                    {/* Commissions Table */}
                    <div className="table-responsive">
                      <table className="table table-striped session-table m-0">
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
                                      className="btn btn-sm btn-info mr-1"
                                      title="View"
                                    >
                                      <i className="fas fa-eye"></i>
                                    </Link>
                                    <button 
                                      className="btn btn-sm btn-warning mr-1"
                                      title="Edit"
                                      onClick={() => {/* TODO: Implement edit commission rates */}}
                                    >
                                      <i className="fas fa-edit"></i>
                                    </button>
                                    <button 
                                      className="btn btn-sm btn-success"
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

                  </div>
                </div>
              </div>
            </div>

            {/* Pagination - Outside Card */}
            {pagination.totalPages > 1 && (
              <div className="row">
                <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12">
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
                <h5 className="modal-title">Filter Commissions</h5>
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
                    placeholder="Search by astrologer name or email"
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                  />
                </div>

                {/* Status Filter */}
                <div className="form-group">
                  <label>Status</label>
                  <select 
                    className="form-control form-control-sm"
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                  >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>

                {/* Date Range - 2 columns */}
                <div className="row">
                  <div className="col-6">
                    <div className="form-group">
                      <label>From Date</label>
                      <input 
                        type="date" 
                        className="form-control form-control-sm" 
                        value={filters.dateFrom}
                        onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="form-group">
                      <label>To Date</label>
                      <input 
                        type="date" 
                        className="form-control form-control-sm" 
                        value={filters.dateTo}
                        onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Revenue Range - 2 columns */}
                <div className="row">
                  <div className="col-6">
                    <div className="form-group">
                      <label>Min Revenue (₹)</label>
                      <input 
                        type="number" 
                        className="form-control form-control-sm" 
                        placeholder="Min revenue"
                        value={filters.minRevenue}
                        onChange={(e) => handleFilterChange('minRevenue', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="form-group">
                      <label>Max Revenue (₹)</label>
                      <input 
                        type="number" 
                        className="form-control form-control-sm" 
                        placeholder="Max revenue"
                        value={filters.maxRevenue}
                        onChange={(e) => handleFilterChange('maxRevenue', e.target.value)}
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