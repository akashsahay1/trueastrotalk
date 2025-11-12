'use client';

import Header from '@/components/admin/Header';
import Sidebar from '@/components/admin/Sidebar';
import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getCSRFToken } from '@/lib/csrf';
import Link from 'next/link';
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
  gateway_transaction_id?: string;
  notes?: string;
  bank_details?: {
    account_number: string;
    ifsc_code: string;
    bank_name?: string;
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
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [modalAnimating, setModalAnimating] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    status: '',
    dateFrom: '',
    dateTo: ''
  });
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const fetchTransactions = useCallback(async (
    page: number, 
    searchTerm: string, 
    userId: string, 
    filterParams = filters
  ) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '30'
      });
      
      // Use either searchTerm (legacy) or filter search
      const searchQuery = searchTerm || filterParams.search;
      if (searchQuery) params.append('search', searchQuery);
      if (userId) params.append('user_id', userId);
      
      // Add filter parameters
      if (filterParams.type) params.append('type', filterParams.type);
      if (filterParams.status) params.append('status', filterParams.status);
      if (filterParams.dateFrom) params.append('date_from', filterParams.dateFrom);
      if (filterParams.dateTo) params.append('date_to', filterParams.dateTo);

      const response = await fetch(`/api/finance/transactions?${params}`);
      const data = await response.json();

      if (response.ok) {
        setTransactions(data.data.transactions);
        setPagination(data.data.pagination);
        setSearch(searchTerm);
      } else {
        console.error('Failed to fetch transactions:', data.error);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    document.body.className = '';
    
    // Get user_id from URL params if present
    const userId = searchParams?.get('user_id') || '';
    
    fetchTransactions(1, '', userId, {
      search: '',
      type: '',
      status: '',
      dateFrom: '',
      dateTo: ''
    });
  }, [searchParams, fetchTransactions]);

  const handlePageChange = (page: number) => {
    const userId = searchParams?.get('user_id') || '';
    fetchTransactions(page, search, userId, filters);
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
      type: '',
      status: '',
      dateFrom: '',
      dateTo: ''
    };
    setFilters(clearedFilters);
    const userId = searchParams?.get('user_id') || '';
    fetchTransactions(1, search, userId, clearedFilters);
    closeModal();
  };

  const applyFilters = () => {
    const userId = searchParams?.get('user_id') || '';
    fetchTransactions(1, search, userId, filters);
    closeModal();
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  const handleViewDetails = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowDetailsModal(true);
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedTransaction(null);
  };

  const handleStatusUpdate = async (transactionId: string, newStatus: string, actionType: 'approve' | 'reject') => {
    if (!confirm(`Are you sure you want to ${actionType} this transaction? This action cannot be undone.`)) {
      return;
    }

    try {
      const csrfToken = getCSRFToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (csrfToken) {
        headers['x-csrf-token'] = csrfToken;
      }

      const response = await fetch(`/api/finance/transactions/${transactionId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          status: newStatus,
          admin_action: actionType,
          admin_notes: `Transaction ${actionType}d by admin`
        }),
      });

      if (response.ok) {
        alert(`Transaction ${actionType}d successfully`);
        // Refresh the transactions list
        const userId = searchParams?.get('user_id') || '';
        fetchTransactions(pagination.currentPage, search, userId, filters);
        closeDetailsModal();
      } else {
        const errorData = await response.json();
        alert('Error updating transaction: ' + (errorData.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error updating transaction:', error);
      alert('Error updating transaction. Please try again.');
    }
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
                          <Link href="/dashboard" className="breadcrumb-link">Dashboard</Link>
                        </li>
                        <li className="breadcrumb-item">
                          <span className="breadcrumb-link">Finance</span>
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
                <div className="card border-top-primary shadow-sm h-100">
                  <div className="card-body">
                    <h5 className="text-muted">Total Amount</h5>
                    <div className="metric-value d-inline-block">
                      <h1 className="mb-1">₹{totalStats.totalAmount.toLocaleString()}</h1>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-xl-3 col-lg-6 col-md-6 col-sm-12 col-12">
                <div className="card border-top-primary shadow-sm h-100">
                  <div className="card-body">
                    <h5 className="text-muted">Completed Amount</h5>
                    <div className="metric-value d-inline-block">
                      <h1 className="mb-1">₹{totalStats.completedAmount.toLocaleString()}</h1>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-xl-3 col-lg-6 col-md-6 col-sm-12 col-12">
                <div className="card border-top-primary shadow-sm h-100">
                  <div className="card-body">
                    <h5 className="text-muted">Pending Amount</h5>
                    <div className="metric-value d-inline-block">
                      <h1 className="mb-1">₹{totalStats.pendingAmount.toLocaleString()}</h1>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-xl-3 col-lg-6 col-md-6 col-sm-12 col-12">
                <div className="card border-top-primary shadow-sm h-100">
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
                <div className="card mb-4">
                  <div className="card-body">
                    <div className='d-flex justify-content-between align-items-center mb-3'>
                      <h5 className="mb-0">Transactions ({pagination.totalCount})</h5>
                      <button 
                        className="btn btn-outline-secondary"
                        onClick={openModal}
                      >
                        <i className="fas fa-filter mr-1"></i>
                        Filters {hasActiveFilters && <span className="badge badge-primary ml-1">•</span>}
                      </button>
                    </div>

                    {/* Transactions Table */}
                    <div className="table-responsive">
                      <table className="table table-striped session-table m-0">
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
                                      className="btn btn-sm btn-info mr-1"
                                      title="View"
                                      onClick={() => handleViewDetails(transaction)}
                                    >
                                      <i className="fas fa-eye"></i>
                                    </button>
                                    {transaction.status === 'pending' && (
                                      <>
                                        <button 
                                          className="btn btn-sm btn-success mr-1"
                                          title="Approve"
                                          onClick={() => handleStatusUpdate(transaction._id, 'completed', 'approve')}
                                        >
                                          <i className="fas fa-check"></i>
                                        </button>
                                        <button 
                                          className="btn btn-sm btn-danger"
                                          title="Reject"
                                          onClick={() => handleStatusUpdate(transaction._id, 'failed', 'reject')}
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

                  </div>
                </div>
              </div>
            </div>

            {/* Pagination - Outside Card */}
            {pagination.totalPages > 1 && (
              <div className="row">
                <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12">
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
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Transaction Details Modal */}
      {showDetailsModal && selectedTransaction && (
        <div className="modal fade show" style={{display: 'block'}} tabIndex={-1} role="dialog">
          <div className="modal-dialog modal-lg" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Transaction Details</h5>
                <button 
                  type="button" 
                  className="close" 
                  onClick={closeDetailsModal}
                >
                  <span>&times;</span>
                </button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <h6 className="text-primary">Basic Information</h6>
                    <table className="table table-sm">
                      <tbody>
                        <tr>
                          <td><strong>Transaction ID:</strong></td>
                          <td>{selectedTransaction._id}</td>
                        </tr>
                        <tr>
                          <td><strong>Reference ID:</strong></td>
                          <td>{selectedTransaction.reference_id || 'N/A'}</td>
                        </tr>
                        <tr>
                          <td><strong>Type:</strong></td>
                          <td>
                            <span className={`badge ${selectedTransaction.transaction_type === 'recharge' || selectedTransaction.transaction_type === 'commission' ? 'badge-success' : 'badge-warning'}`}>
                              {selectedTransaction.transaction_type?.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td><strong>Amount:</strong></td>
                          <td><strong>₹{selectedTransaction.amount.toLocaleString()}</strong></td>
                        </tr>
                        <tr>
                          <td><strong>Status:</strong></td>
                          <td>
                            <span className={`badge ${getStatusBadge(selectedTransaction.status)}`}>
                              {selectedTransaction.status?.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="col-md-6">
                    <h6 className="text-primary">User & Payment Information</h6>
                    <table className="table table-sm">
                      <tbody>
                        <tr>
                          <td><strong>User Name:</strong></td>
                          <td>{selectedTransaction.user_name}</td>
                        </tr>
                        <tr>
                          <td><strong>Email:</strong></td>
                          <td>{selectedTransaction.user_email}</td>
                        </tr>
                        <tr>
                          <td><strong>Payment Method:</strong></td>
                          <td>{selectedTransaction.payment_method || 'N/A'}</td>
                        </tr>
                        <tr>
                          <td><strong>Gateway Reference:</strong></td>
                          <td>{selectedTransaction.gateway_transaction_id || 'N/A'}</td>
                        </tr>
                        <tr>
                          <td><strong>Created:</strong></td>
                          <td>{new Date(selectedTransaction.created_at).toLocaleString()}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <div className="row mt-3">
                  <div className="col-12">
                    <h6 className="text-primary">Description & Notes</h6>
                    <div className="card">
                      <div className="card-body">
                        <p><strong>Description:</strong> {selectedTransaction.description || 'No description available'}</p>
                        {selectedTransaction.notes && (
                          <p><strong>Notes:</strong> {selectedTransaction.notes}</p>
                        )}
                        {selectedTransaction.bank_details && (
                          <div>
                            <p><strong>Bank Details:</strong></p>
                            <ul>
                              <li>Account: {selectedTransaction.bank_details.account_number}</li>
                              <li>IFSC: {selectedTransaction.bank_details.ifsc_code}</li>
                              <li>Bank: {selectedTransaction.bank_details.bank_name}</li>
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                {selectedTransaction.status === 'pending' && (
                  <>
                    <button 
                      type="button" 
                      className="btn btn-success mr-2"
                      onClick={() => handleStatusUpdate(selectedTransaction._id, 'completed', 'approve')}
                    >
                      <i className="fas fa-check mr-1"></i>
                      Approve Transaction
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-danger mr-2"
                      onClick={() => handleStatusUpdate(selectedTransaction._id, 'failed', 'reject')}
                    >
                      <i className="fas fa-times mr-1"></i>
                      Reject Transaction
                    </button>
                  </>
                )}
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={closeDetailsModal}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Modal */}
      {showFilterModal && (
        <div className={`modal fade ${modalAnimating ? 'show' : ''}`} style={{display: 'block'}} tabIndex={-1} role="dialog">
          <div className="modal-dialog modal-dialog-centered modal-md" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Filter Transactions</h5>
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
                    placeholder="Search by name, email, or reference"
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                  />
                </div>

                {/* Type and Status - 2 columns */}
                <div className="row">
                  <div className="col-6">
                    <div className="form-group">
                      <label>Transaction Type</label>
                      <select 
                        className="form-control form-control-sm"
                        value={filters.type}
                        onChange={(e) => handleFilterChange('type', e.target.value)}
                      >
                        <option value="">All Types</option>
                        <option value="recharge">Recharge</option>
                        <option value="withdrawal">Withdrawal</option>
                        <option value="payment">Payment</option>
                        <option value="commission">Commission</option>
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
                        <option value="completed">Completed</option>
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="failed">Failed</option>
                      </select>
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

      {/* Filter Modal Backdrop */}
      {showFilterModal && (
        <div 
          className={`modal-backdrop fade ${modalAnimating ? 'show' : ''}`}
          onClick={closeModal}
        ></div>
      )}

      {/* Details Modal Backdrop */}
      {showDetailsModal && (
        <div 
          className="modal-backdrop fade show"
          onClick={closeDetailsModal}
        ></div>
      )}
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