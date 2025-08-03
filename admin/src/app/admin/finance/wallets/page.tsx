'use client';

import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { useEffect, useState } from 'react';
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
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
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
  const [searchInput, setSearchInput] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState('');

  useEffect(() => {
    document.body.className = '';
    fetchWallets(1, '', '');
  }, []);

  const fetchWallets = async (page: number, searchTerm: string, userType: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '30'
      });
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      if (userType) {
        params.append('type', userType);
      }

      const response = await fetch(`/api/finance/wallets?${params}`);
      const data = await response.json();

      if (response.ok) {
        setWallets(data.data.wallets);
        setPagination(data.data.pagination);
        setSearch(searchTerm);
        setUserTypeFilter(userType);
      } else {
        console.error('Failed to fetch wallets:', data.error);
      }
    } catch (error) {
      console.error('Error fetching wallets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchWallets(1, searchInput, userTypeFilter);
  };

  const handlePageChange = (page: number) => {
    fetchWallets(page, search, userTypeFilter);
  };

  const handleFilterChange = (userType: string) => {
    setUserTypeFilter(userType);
    fetchWallets(1, search, userType);
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
                          <a href="/admin/dashboard" className="breadcrumb-link">Dashboard</a>
                        </li>
                        <li className="breadcrumb-item">
                          <a href="#" className="breadcrumb-link">Finance</a>
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
                <div className="card border-3 border-top border-top-primary">
                  <div className="card-body">
                    <h5 className="text-muted">Total Customer Wallets</h5>
                    <div className="metric-value d-inline-block">
                      <h1 className="mb-1">{wallets.filter(w => w.user_type === 'customer').length}</h1>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-xl-3 col-lg-6 col-md-6 col-sm-12 col-12">
                <div className="card border-3 border-top border-top-success">
                  <div className="card-body">
                    <h5 className="text-muted">Total Astrologer Wallets</h5>
                    <div className="metric-value d-inline-block">
                      <h1 className="mb-1">{wallets.filter(w => w.user_type === 'astrologer').length}</h1>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-xl-3 col-lg-6 col-md-6 col-sm-12 col-12">
                <div className="card border-3 border-top border-top-warning">
                  <div className="card-body">
                    <h5 className="text-muted">Total Balance</h5>
                    <div className="metric-value d-inline-block">
                      <h1 className="mb-1">₹{wallets.reduce((sum, w) => sum + w.wallet_balance, 0).toLocaleString()}</h1>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-xl-3 col-lg-6 col-md-6 col-sm-12 col-12">
                <div className="card border-3 border-top border-top-danger">
                  <div className="card-body">
                    <h5 className="text-muted">Active Wallets</h5>
                    <div className="metric-value d-inline-block">
                      <h1 className="mb-1">{wallets.filter(w => w.status === 'active').length}</h1>
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
                    <h5 className="mb-0">Wallets ({pagination.totalCount} total)</h5>
                  </div>
                  <div className="card-body">
                    {/* Search and Filter Form */}
                    <form onSubmit={handleSearch} className="row mb-3">
                      <div className="col-md-5">
                        <div className="form-group">
                          <input 
                            type="text" 
                            className="form-control" 
                            placeholder="Search by name, email, or phone..." 
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="form-group">
                          <select 
                            className="form-control"
                            value={userTypeFilter}
                            onChange={(e) => handleFilterChange(e.target.value)}
                          >
                            <option value="">All User Types</option>
                            <option value="customer">Customers</option>
                            <option value="astrologer">Astrologers</option>
                          </select>
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
                            setUserTypeFilter('');
                            fetchWallets(1, '', '');
                          }}
                        >
                          Clear
                        </button>
                      </div>
                    </form>

                    {/* Wallets Table */}
                    <div className="table-responsive">
                      <table className="table table-striped table-bordered session-table">
                        <thead>
                          <tr>
                            <th>User</th>
                            <th>Type</th>
                            <th>Contact</th>
                            <th>Balance</th>
                            <th>Spent/Earned</th>
                            <th>Recharged/Withdrawn</th>
                            <th>Sessions</th>
                            <th>Status</th>
                            <th>Last Transaction</th>
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
                                  <span className={`badge ${getStatusBadge(wallet.status)}`}>
                                    {wallet.status}
                                  </span>
                                </td>
                                <td>{new Date(wallet.last_transaction).toLocaleDateString()}</td>
                                <td>
                                  <div>
                                    <Link 
                                      href={`/admin/finance/transactions?user_id=${wallet.user_id}`}
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
                              <td colSpan={10} className="text-center">No wallets found</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
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