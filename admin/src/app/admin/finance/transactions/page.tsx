'use client';

import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

interface Transaction {
  _id: string;
  user_id: string;
  user_type: 'customer' | 'astrologer';
  user_name: string;
  user_email: string;
  user_phone: string;
  transaction_type: 'recharge' | 'withdrawal' | 'payment' | 'commission';
  amount: number;
  status: 'completed' | 'pending' | 'failed' | 'processing';
  payment_method: string;
  reference_id: string;
  description: string;
  bank_details?: {
    account_number: string;
    ifsc_code: string;
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

function TransactionsContent() {
  const searchParams = useSearchParams();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
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
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    document.body.className = '';
    
    // Get user_id from URL params if present
    const userId = searchParams.get('user_id') || '';
    
    fetchTransactions(1, '', userId, '', '', '', '');
  }, [searchParams]);

  const fetchTransactions = async (
    page: number, 
    searchTerm: string, 
    userId: string, 
    type: string, 
    status: string, 
    fromDate: string, 
    toDate: string
  ) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '30'
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (userId) params.append('user_id', userId);
      if (type) params.append('type', type);
      if (status) params.append('status', status);
      if (fromDate) params.append('date_from', fromDate);
      if (toDate) params.append('date_to', toDate);

      const response = await fetch(`/api/finance/transactions?${params}`);
      const data = await response.json();

      if (response.ok) {
        setTransactions(data.data.transactions);
        setPagination(data.data.pagination);
        setSearch(searchTerm);
        setTypeFilter(type);
        setStatusFilter(status);
        setDateFrom(fromDate);
        setDateTo(toDate);
      } else {
        console.error('Failed to fetch transactions:', data.error);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const userId = searchParams.get('user_id') || '';
    fetchTransactions(1, searchInput, userId, typeFilter, statusFilter, dateFrom, dateTo);
  };

  const handlePageChange = (page: number) => {
    const userId = searchParams.get('user_id') || '';
    fetchTransactions(page, search, userId, typeFilter, statusFilter, dateFrom, dateTo);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return 'badge-success';
      case 'pending':
        return 'badge-warning';
      case 'processing':
        return 'badge-info';
      case 'failed':
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'recharge':
        return 'badge-primary';
      case 'withdrawal':
        return 'badge-warning';
      case 'payment':
        return 'badge-danger';
      case 'commission':
        return 'badge-success';
      default:
        return 'badge-secondary';
    }
  };

  const getUserTypeBadge = (userType: string) => {
    return userType === 'customer' ? 'badge-primary' : 'badge-success';
  };

  const totalStats = transactions.reduce((acc, transaction) => ({
    totalAmount: acc.totalAmount + transaction.amount,
    completedAmount: acc.completedAmount + (transaction.status === 'completed' ? transaction.amount : 0),
    pendingAmount: acc.pendingAmount + (transaction.status === 'pending' ? transaction.amount : 0),
    completedCount: acc.completedCount + (transaction.status === 'completed' ? 1 : 0)
  }), { totalAmount: 0, completedAmount: 0, pendingAmount: 0, completedCount: 0 });

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
                  <h2 className="pageheader-title">Transaction Management</h2>
                  <p className="pageheader-text">Manage all financial transactions</p>
                  <div className="page-breadcrumb">
                    <nav aria-label="breadcrumb">
                      <ol className="breadcrumb">
                        <li className="breadcrumb-item">
                          <a href="/admin/dashboard" className="breadcrumb-link">Dashboard</a>
                        </li>
                        <li className="breadcrumb-item">
                          <a href="#" className="breadcrumb-link">Finance</a>
                        </li>
                        <li className="breadcrumb-item active" aria-current="page">Transactions</li>
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
                    <h5 className="text-muted">Total Amount</h5>
                    <div className="metric-value d-inline-block">
                      <h1 className="mb-1">₹{totalStats.totalAmount.toLocaleString()}</h1>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-xl-3 col-lg-6 col-md-6 col-sm-12 col-12">
                <div className="card border-3 border-top border-top-success">
                  <div className="card-body">
                    <h5 className="text-muted">Completed Amount</h5>
                    <div className="metric-value d-inline-block">
                      <h1 className="mb-1">₹{totalStats.completedAmount.toLocaleString()}</h1>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-xl-3 col-lg-6 col-md-6 col-sm-12 col-12">
                <div className="card border-3 border-top border-top-warning">
                  <div className="card-body">
                    <h5 className="text-muted">Pending Amount</h5>
                    <div className="metric-value d-inline-block">
                      <h1 className="mb-1">₹{totalStats.pendingAmount.toLocaleString()}</h1>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-xl-3 col-lg-6 col-md-6 col-sm-12 col-12">
                <div className="card border-3 border-top border-top-danger">
                  <div className="card-body">
                    <h5 className="text-muted">Total Transactions</h5>
                    <div className="metric-value d-inline-block">
                      <h1 className="mb-1">{pagination.totalCount}</h1>
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
                    <h5 className="mb-0">Transactions ({pagination.totalCount} total)</h5>
                  </div>
                  <div className="card-body">
                    {/* Search and Filter Form */}
                    <form onSubmit={handleSearch} className="row mb-3">
                      <div className="col-md-3">
                        <div className="form-group">
                          <input 
                            type="text" 
                            className="form-control" 
                            placeholder="Search by name, email, reference..." 
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-md-2">
                        <div className="form-group">
                          <select 
                            className="form-control"
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                          >
                            <option value="">All Types</option>
                            <option value="recharge">Recharge</option>
                            <option value="withdrawal">Withdrawal</option>
                            <option value="payment">Payment</option>
                            <option value="commission">Commission</option>
                          </select>
                        </div>
                      </div>
                      <div className="col-md-2">
                        <div className="form-group">
                          <select 
                            className="form-control"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                          >
                            <option value="">All Status</option>
                            <option value="completed">Completed</option>
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="failed">Failed</option>
                          </select>
                        </div>
                      </div>
                      <div className="col-md-1">
                        <div className="form-group">
                          <input 
                            type="date" 
                            className="form-control" 
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-md-1">
                        <div className="form-group">
                          <input 
                            type="date" 
                            className="form-control" 
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-md-1">
                        <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
                          Search
                        </button>
                      </div>
                      <div className="col-md-2">
                        <button 
                          type="button" 
                          className="btn btn-secondary btn-sm"
                          onClick={() => {
                            setSearchInput('');
                            setTypeFilter('');
                            setStatusFilter('');
                            setDateFrom('');
                            setDateTo('');
                            const userId = searchParams.get('user_id') || '';
                            fetchTransactions(1, '', userId, '', '', '', '');
                          }}
                        >
                          Clear Filters
                        </button>
                      </div>
                    </form>

                    {/* Transactions Table */}
                    <div className="table-responsive">
                      <table className="table table-striped table-bordered session-table">
                        <thead>
                          <tr>
                            <th>Reference</th>
                            <th>User</th>
                            <th>Type</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Payment Method</th>
                            <th>Description</th>
                            <th>Date</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {loading ? (
                            <tr>
                              <td colSpan={9} className="text-center">
                                <i className="fas fa-spinner fa-spin mr-2"></i>Loading...
                              </td>
                            </tr>
                          ) : transactions.length > 0 ? (
                            transactions.map((transaction) => (
                              <tr key={transaction._id}>
                                <td>
                                  <code className="text-primary">{transaction.reference_id}</code>
                                </td>
                                <td>
                                  <div>
                                    <strong>{transaction.user_name}</strong>
                                    <br />
                                    <small className="text-muted">{transaction.user_email}</small>
                                    <br />
                                    <span className={`badge ${getUserTypeBadge(transaction.user_type)} badge-sm`}>
                                      {transaction.user_type}
                                    </span>
                                  </div>
                                </td>
                                <td>
                                  <span className={`badge ${getTypeBadge(transaction.transaction_type)}`}>
                                    {transaction.transaction_type}
                                  </span>
                                </td>
                                <td>
                                  <strong 
                                    className={
                                      transaction.transaction_type === 'recharge' || transaction.transaction_type === 'commission' 
                                        ? 'text-success' 
                                        : 'text-danger'
                                    }
                                  >
                                    {transaction.transaction_type === 'recharge' || transaction.transaction_type === 'commission' ? '+' : '-'}
                                    ₹{transaction.amount.toLocaleString()}
                                  </strong>
                                </td>
                                <td>
                                  <span className={`badge ${getStatusBadge(transaction.status)}`}>
                                    {transaction.status}
                                  </span>
                                </td>
                                <td>{transaction.payment_method}</td>
                                <td>
                                  <small>{transaction.description}</small>
                                  {transaction.bank_details && (
                                    <div>
                                      <small className="text-muted">
                                        {transaction.bank_details.account_number} | {transaction.bank_details.ifsc_code}
                                      </small>
                                    </div>
                                  )}
                                </td>
                                <td>{new Date(transaction.created_at).toLocaleString()}</td>
                                <td>
                                  <div>
                                    <button 
                                      className="btn btn-outline-info btn-sm mr-1"
                                      title="View Details"
                                      onClick={() => {/* TODO: Implement view details */}}
                                    >
                                      <i className="fas fa-eye"></i>
                                    </button>
                                    {transaction.status === 'pending' && (
                                      <>
                                        <button 
                                          className="btn btn-outline-success btn-sm mr-1"
                                          title="Approve"
                                          onClick={() => {/* TODO: Implement approve */}}
                                        >
                                          <i className="fas fa-check"></i>
                                        </button>
                                        <button 
                                          className="btn btn-outline-danger btn-sm"
                                          title="Reject"
                                          onClick={() => {/* TODO: Implement reject */}}
                                        >
                                          <i className="fas fa-times"></i>
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={9} className="text-center">No transactions found</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                      <nav aria-label="Transaction pagination">
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

export default function TransactionsPage() {
  return (
    <Suspense fallback={
      <div className="dashboard-main-wrapper">
        <Header />
        <Sidebar />
        
        <div className="dashboard-wrapper">
          <div className="dashboard-ecommerce">
            <div className="container-fluid dashboard-content">
              <div className="row">
                <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12">
                  <div className="text-center p-5">
                    <i className="fas fa-spinner fa-spin fa-3x text-primary"></i>
                    <p className="mt-3">Loading transactions...</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    }>
      <TransactionsContent />
    </Suspense>
  );
}