'use client';

import Header from '@/components/admin/Header';
import Sidebar from '@/components/admin/Sidebar';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

interface Wallet {
  _id: string;
  user_id: string;
  user_name: string;
  user_type: 'customer' | 'astrologer';
  email: string;
  phone: string;
  wallet_balance: number;
  total_spent?: number;
  total_earned?: number;
  total_recharged?: number;
  total_withdrawn?: number;
  session_count: number;
  status: string;
  last_transaction: string;
  created_at: string;
  transaction_count: number;
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
  userType?: string;
  status?: string;
  minBalance?: string;
  maxBalance?: string;
}

export default function WalletsPage() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
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
    userType: '',
    status: '',
    minBalance: '',
    maxBalance: ''
  });
  const [limit, setLimit] = useState(30);

  const fetchWallets = useCallback(async (page: number, searchTerm: string, filterParams: FilterParams = {}, pageLimit?: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: (pageLimit || limit).toString()
      });
      
      // Use either searchTerm (legacy) or filter search
      const searchQuery = searchTerm || filterParams.search;
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      
      // Add filter parameters
      if (filterParams.userType) params.append('type', filterParams.userType);
      if (filterParams.status) params.append('status', filterParams.status);
      if (filterParams.minBalance) params.append('min_balance', filterParams.minBalance);
      if (filterParams.maxBalance) params.append('max_balance', filterParams.maxBalance);

      const response = await fetch(`/api/finance/wallets?${params}`);
      const data = await response.json();

      if (response.ok) {
        setWallets(data.data.wallets);
        setPagination(data.data.pagination);
        setSearch(searchTerm);
      } else {
        console.error('Failed to fetch wallets:', data.error);
      }
    } catch (error) {
      console.error('Error fetching wallets:', error);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    document.body.className = '';
    fetchWallets(1, '', {
      search: '',
      userType: '',
      status: '',
      minBalance: '',
      maxBalance: ''
    });
  }, [fetchWallets]);

  const handlePageChange = (page: number) => {
    fetchWallets(page, search, filters);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    fetchWallets(1, search, filters, newLimit);
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
      userType: '',
      status: '',
      minBalance: '',
      maxBalance: ''
    };
    setFilters(clearedFilters);
    fetchWallets(1, search, clearedFilters, limit);
    closeModal();
  };

  const applyFilters = () => {
    fetchWallets(1, search, filters, limit);
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

  const getUserTypeBadge = (userType: string) => {
    return userType === 'customer' ? 'badge-primary' : 'badge-success';
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
                  <h2 className="pageheader-title">Wallet Management</h2>
                  <p className="pageheader-text">Manage customer and astrologer wallets</p>
                  <div className="page-breadcrumb">
                    <nav aria-label="breadcrumb">
                      <ol className="breadcrumb">
                        <li className="breadcrumb-item">
                          <Link href="/dashboard" className="breadcrumb-link">Dashboard</Link>
                        </li>
                        <li className="breadcrumb-item">
                          <span className="breadcrumb-link">Finance</span>
                        </li>
                        <li className="breadcrumb-item active" aria-current="page">Wallets</li>
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
                    <h5 className="text-muted">Total Customer Wallets</h5>
                    <div className="metric-value d-inline-block">
                      <h1 className="mb-1">{wallets.filter(w => w.user_type === 'customer').length}</h1>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-xl-3 col-lg-6 col-md-6 col-sm-12 col-12">
                <div className="card border-top-primary shadow-sm h-100">
                  <div className="card-body">
                    <h5 className="text-muted">Total Astrologer Wallets</h5>
                    <div className="metric-value d-inline-block">
                      <h1 className="mb-1">{wallets.filter(w => w.user_type === 'astrologer').length}</h1>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-xl-3 col-lg-6 col-md-6 col-sm-12 col-12">
                <div className="card border-top-primary shadow-sm h-100">
                  <div className="card-body">
                    <h5 className="text-muted">Total Balance</h5>
                    <div className="metric-value d-inline-block">
                      <h1 className="mb-1">₹{wallets.reduce((sum, w) => sum + w.wallet_balance, 0).toLocaleString()}</h1>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-xl-3 col-lg-6 col-md-6 col-sm-12 col-12">
                <div className="card border-top-primary shadow-sm h-100">
                  <div className="card-body">
                    <h5 className="text-muted">Total Transactions</h5>
                    <div className="metric-value d-inline-block">
                      <h1 className="mb-1">{wallets.reduce((sum, w) => sum + w.transaction_count, 0)}</h1>
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
                      <h5 className="mb-0">Wallets ({pagination.totalCount})</h5>
                      <button 
                        className="btn btn-outline-secondary"
                        onClick={openModal}
                      >
                        <i className="fas fa-filter mr-1"></i>
                        Filters {hasActiveFilters && <span className="badge badge-primary ml-1">•</span>}
                      </button>
                    </div>

                    {/* Pagination Limit Dropdown */}
                    <div className="d-flex align-items-center mb-3">
                      <span className="mr-2">Show:</span>
                      <select 
                        className="form-control form-control-sm" 
                        style={{width: 'auto', display: 'inline-block'}}
                        value={limit}
                        onChange={(e) => handleLimitChange(Number(e.target.value))}
                      >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={30}>30</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                      <span className="ml-2">entries</span>
                    </div>

                    {/* Wallets Table */}
                    <div className="table-responsive">
                      <table className="table table-striped session-table m-0">
                        <thead>
                          <tr>
                            <th>User</th>
                            <th>Type</th>
                            <th>Contact</th>
                            <th>Balance</th>
                            <th>Spent/Earned</th>
                            <th>Recharged/Withdrawn</th>
                            <th>Sessions</th>
                            <th>Transactions</th>
                            <th>Status</th>
                            <th>Last Transaction</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {loading ? (
                            <tr>
                              <td colSpan={11} className="text-center">
                                <i className="fas fa-spinner fa-spin mr-2"></i>Loading...
                              </td>
                            </tr>
                          ) : wallets.length > 0 ? (
                            wallets.map((wallet) => (
                              <tr key={wallet._id}>
                                <td>
                                  <div>
                                    <strong>{wallet.user_name}</strong>
                                    <br />
                                    <small className="text-muted">{wallet.email}</small>
                                  </div>
                                </td>
                                <td>
                                  <span className={`badge ${getUserTypeBadge(wallet.user_type)}`}>
                                    {wallet.user_type}
                                  </span>
                                </td>
                                <td>{wallet.phone}</td>
                                <td>
                                  <strong className="text-success">₹{wallet.wallet_balance.toLocaleString()}</strong>
                                </td>
                                <td>
                                  {wallet.user_type === 'customer' ? (
                                    <span className="text-danger">₹{(wallet.total_spent || 0).toLocaleString()}</span>
                                  ) : (
                                    <span className="text-success">₹{(wallet.total_earned || 0).toLocaleString()}</span>
                                  )}
                                </td>
                                <td>
                                  {wallet.user_type === 'customer' ? (
                                    <span className="text-primary">₹{(wallet.total_recharged || 0).toLocaleString()}</span>
                                  ) : (
                                    <span className="text-warning">₹{(wallet.total_withdrawn || 0).toLocaleString()}</span>
                                  )}
                                </td>
                                <td>
                                  <span className="badge badge-light">{wallet.session_count}</span>
                                </td>
                                <td>
                                  <span className="badge badge-info">{wallet.transaction_count}</span>
                                </td>
                                <td>
                                  <span className={`badge ${getStatusBadge(wallet.status)}`}>
                                    {wallet.status}
                                  </span>
                                </td>
                                <td>{new Date(wallet.last_transaction).toLocaleDateString()}</td>
                                <td>
                                  <div>
                                    <Link 
                                      href={`/finance/transactions?user_id=${wallet.user_id}`}
                                      className="btn btn-outline-info btn-sm mr-1"
                                      title="View Transactions"
                                    >
                                      <i className="fas fa-list"></i>
                                    </Link>
                                    <button 
                                      className="btn btn-outline-success btn-sm mr-1"
                                      title="Add Balance"
                                      onClick={() => {/* TODO: Implement add balance */}}
                                    >
                                      <i className="fas fa-plus"></i>
                                    </button>
                                    <button 
                                      className="btn btn-outline-warning btn-sm"
                                      title="Transaction History"
                                      onClick={() => {/* TODO: Implement transaction history */}}
                                    >
                                      <i className="fas fa-history"></i>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={11} className="text-center">No wallets found</td>
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
                  <nav aria-label="Wallet pagination">
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
                <h5 className="modal-title">Filter Wallets</h5>
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

                {/* User Type and Status - 2 columns */}
                <div className="row">
                  <div className="col-6">
                    <div className="form-group">
                      <label>User Type</label>
                      <select 
                        className="form-control form-control-sm"
                        value={filters.userType}
                        onChange={(e) => handleFilterChange('userType', e.target.value)}
                      >
                        <option value="">All Types</option>
                        <option value="customer">Customer</option>
                        <option value="astrologer">Astrologer</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-6">
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
                  </div>
                </div>

                {/* Balance Range - 2 columns */}
                <div className="row">
                  <div className="col-6">
                    <div className="form-group">
                      <label>Min Balance (₹)</label>
                      <input 
                        type="number" 
                        className="form-control form-control-sm" 
                        placeholder="Min balance"
                        value={filters.minBalance}
                        onChange={(e) => handleFilterChange('minBalance', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="form-group">
                      <label>Max Balance (₹)</label>
                      <input 
                        type="number" 
                        className="form-control form-control-sm" 
                        placeholder="Max balance"
                        value={filters.maxBalance}
                        onChange={(e) => handleFilterChange('maxBalance', e.target.value)}
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