'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import Link from 'next/link';

interface OrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  image_url?: string;
}

interface ShippingAddress {
  full_name: string;
  phone_number: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state: string;
  postal_code: string;
  country?: string;
}

interface Order {
  _id: string;
  order_number: string;
  items: OrderItem[];
  total_amount: number;
  subtotal: number;
  shipping_cost: number;
  tax_amount: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_method: string;
  shipping_address: ShippingAddress;
  tracking_number?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  shipped_at?: string;
  delivered_at?: string;
  user_info?: {
    name: string;
    email: string | null;
    phone: string | null;
  };
}

interface OrdersResponse {
  success: boolean;
  data: {
    orders: Order[];
    total: number;
    page: number;
    limit: number;
  };
  error?: string;
}

export default function HistoryOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<string>('');
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel'>('csv');
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [amountMin, setAmountMin] = useState<string>('');
  const [amountMax, setAmountMax] = useState<string>('');
  const [customerFilter, setCustomerFilter] = useState<string>('');
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [modalAnimating, setModalAnimating] = useState(false);

  const ordersPerPage = 20;

  // Remove the bg-light class for dashboard and set default date range
  useEffect(() => {
    document.body.className = '';
    
    // Set default date range to last 30 days
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    setFromDate(thirtyDaysAgo.toISOString().split('T')[0]);
    setToDate(today.toISOString().split('T')[0]);
  }, []);

  // Fetch orders from API
  const fetchOrders = async (page = 1, search = '', status = 'all') => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: ordersPerPage.toString(),
        type: 'history',
        payment_status: 'paid',
        ...(search && { search }),
        ...(status !== 'all' && { status }),
        ...(fromDate && { from_date: fromDate }),
        ...(toDate && { to_date: toDate }),
        ...(amountMin && { amount_min: amountMin }),
        ...(amountMax && { amount_max: amountMax }),
        ...(customerFilter && { customer: customerFilter }),
      });

      const response = await fetch(`/api/admin/orders?${queryParams}`);
      const data: OrdersResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch orders');
      }

      if (data.success) {
        setOrders(data.data.orders);
        setTotalOrders(data.data.total);
        setCurrentPage(data.data.page);
      } else {
        throw new Error(data.error || 'Failed to load orders');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    fetchOrders(currentPage, searchTerm, statusFilter);
  }, [currentPage, statusFilter, fromDate, toDate, amountMin, amountMax, customerFilter]);

  // Search handler with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (currentPage === 1) {
        fetchOrders(1, searchTerm, statusFilter);
      } else {
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Bulk status update
  const handleBulkStatusUpdate = async () => {
    if (selectedOrders.length === 0 || !bulkStatus) {
      alert('Please select orders and choose a status to update');
      return;
    }

    try {
      setBulkUpdating(true);
      const response = await fetch('/api/admin/orders/bulk-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order_ids: selectedOrders,
          status: bulkStatus
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        alert(`Successfully updated ${data.updated_count} orders to ${bulkStatus}`);
        setSelectedOrders([]);
        setBulkStatus('');
        setShowBulkModal(false);
        fetchOrders(currentPage, searchTerm, statusFilter);
      } else {
        alert(data.message || 'Failed to update orders');
      }
    } catch (error) {
      console.error('Error updating orders:', error);
      alert('Error updating order statuses');
    } finally {
      setBulkUpdating(false);
    }
  };

  // Export orders
  const handleExportOrders = async () => {
    try {
      setExporting(true);
      
      const queryParams = new URLSearchParams({
        type: 'history',
        format: exportFormat,
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(fromDate && { from_date: fromDate }),
        ...(toDate && { to_date: toDate }),
        ...(amountMin && { amount_min: amountMin }),
        ...(amountMax && { amount_max: amountMax }),
        ...(customerFilter && { customer: customerFilter }),
      });

      const response = await fetch(`/api/admin/orders/export?${queryParams}`);
      
      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `complete-orders-${new Date().toISOString().split('T')[0]}.${exportFormat === 'csv' ? 'csv' : 'xlsx'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      setShowExportModal(false);
      alert('Export completed successfully!');
    } catch (error) {
      console.error('Error exporting orders:', error);
      alert('Error exporting orders');
    } finally {
      setExporting(false);
    }
  };

  // Select all orders
  const handleSelectAll = () => {
    if (selectedOrders.length === orders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(orders.map(order => order._id));
    }
  };

  // Toggle order selection
  const toggleOrderSelection = (orderId: string) => {
    if (selectedOrders.includes(orderId)) {
      setSelectedOrders(selectedOrders.filter(id => id !== orderId));
    } else {
      setSelectedOrders([...selectedOrders, orderId]);
    }
  };

  // Update order status
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/admin/orders', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order_id: orderId,
          status: newStatus,
          updated_by: 'admin'
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Refresh orders list
        fetchOrders(currentPage, searchTerm, statusFilter);
        // Update selected order if modal is open
        if (selectedOrder && selectedOrder._id === orderId) {
          setSelectedOrder({...selectedOrder, status: newStatus as Order['status']});
        }
      } else {
        alert('Failed to update order status: ' + data.error);
      }
    } catch (err) {
      alert('Error updating order status');
      console.error('Update order error:', err);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'placed': return 'badge-secondary';
      case 'confirmed': return 'badge-info';
      case 'processing': return 'badge-warning';
      case 'shipped': return 'badge-primary';
      case 'delivered': return 'badge-success';
      case 'cancelled': return 'badge-danger';
      default: return 'badge-secondary';
    }
  };

  const getPaymentBadgeClass = (status: string) => {
    switch (status) {
      case 'paid': return 'badge-success';
      case 'pending': return 'badge-warning';
      case 'failed': return 'badge-danger';
      case 'refunded': return 'badge-info';
      default: return 'badge-secondary';
    }
  };

  const totalPages = Math.ceil(totalOrders / ordersPerPage);

  const openModal = () => {
    setShowFilterModal(true);
    setTimeout(() => setModalAnimating(true), 10);
  };

  const closeModal = () => {
    setModalAnimating(false);
    setTimeout(() => setShowFilterModal(false), 300);
  };

  const clearFilters = () => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
    setFromDate(thirtyDaysAgo.toISOString().split('T')[0]);
    setToDate(today.toISOString().split('T')[0]);
    setSearchTerm('');
    setStatusFilter('all');
    setAmountMin('');
    setAmountMax('');
    setCustomerFilter('');
    setCurrentPage(1);
    closeModal();
  };

  const applyFilters = () => {
    setCurrentPage(1);
    closeModal();
  };

  return (
    <div className="dashboard-main-wrapper">
      <Header />
      <Sidebar />
      
      {/* Orders Management Content */}
      <div className="dashboard-wrapper">
        <div className="dashboard-ecommerce">
          <div className="container-fluid dashboard-content">
            {/* Page Header */}
            <div className="row">
              <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12">
                <div className="page-header">
                  <h2 className="pageheader-title">History Orders</h2>
                  <p className="pageheader-text">View and manage orders older than 30 days</p>
                  <div className="page-breadcrumb">
                    <nav aria-label="breadcrumb">
                      <ol className="breadcrumb">
                        <li className="breadcrumb-item">
                          <Link href="/admin/dashboard" className="breadcrumb-link">Dashboard</Link>
                        </li>
                        <li className="breadcrumb-item active" aria-current="page">Orders</li>
                      </ol>
                    </nav>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Statistics */}
            <div className="ecommerce-widget">
              <div className="row">
                <div className="col-xl-3 col-lg-3 col-md-6 col-sm-12 col-12 mb-4">
                  <div className="card border-top-primary shadow-sm h-100">
                    <div className="card-body">
                      <h5 className="text-muted mb-4">Total History Orders</h5>
                      <div className="d-flex justify-content-between">
                        <div className="metric-value">
                          <h1 className="font-weight-bold text-primary">{totalOrders.toLocaleString()}</h1>
                        </div>
                        <div className="metric-label align-self-center text-primary">
                          <i className="fas fa-history fa-2x"></i>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-xl-3 col-lg-3 col-md-6 col-sm-12 col-12 mb-4">
                  <div className="card border-top-primary shadow-sm h-100">
                    <div className="card-body">
                      <h5 className="text-muted mb-4">Delivered Orders</h5>
                      <div className="d-flex justify-content-between">
                        <div className="metric-value">
                          <h1 className="font-weight-bold text-success">
                            {orders.filter(order => order.status === 'delivered').length}
                          </h1>
                        </div>
                        <div className="metric-label align-self-center text-success">
                          <i className="fas fa-check-circle fa-2x"></i>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-xl-3 col-lg-3 col-md-6 col-sm-12 col-12 mb-4">
                  <div className="card border-top-primary shadow-sm h-100">
                    <div className="card-body">
                      <h5 className="text-muted mb-4">Pending Orders</h5>
                      <div className="d-flex justify-content-between">
                        <div className="metric-value">
                          <h1 className="font-weight-bold text-warning">
                            {orders.filter(order => ['placed', 'confirmed', 'processing'].includes(order.status)).length}
                          </h1>
                        </div>
                        <div className="metric-label align-self-center text-warning">
                          <i className="fas fa-clock fa-2x"></i>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-xl-3 col-lg-3 col-md-6 col-sm-12 col-12 mb-4">
                  <div className="card border-top-primary shadow-sm h-100">
                    <div className="card-body">
                      <h5 className="text-muted mb-4">Revenue (This Page)</h5>
                      <div className="d-flex justify-content-between">
                        <div className="metric-value">
                          <h1 className="font-weight-bold text-info">
                            ₹{orders.reduce((sum, order) => sum + order.total_amount, 0).toLocaleString()}
                          </h1>
                        </div>
                        <div className="metric-label align-self-center text-info">
                          <i className="fas fa-rupee-sign fa-2x"></i>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters and Search */}
            <div className="row">
              <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12">
                <div className="card shadow-sm">
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">Order History</h5>
                    <div>
                      <button 
                        className="btn btn-outline-secondary btn-sm mr-2"
                        onClick={() => setShowFilterModal(true)}
                      >
                        <i className="fas fa-filter mr-1"></i>
                        Filters {(searchTerm || statusFilter !== 'all' || customerFilter || amountMin || amountMax) && <span className="badge badge-primary ml-1">•</span>}
                      </button>
                      <button
                        className="btn btn-outline-success btn-sm mr-2"
                        onClick={() => setShowExportModal(true)}
                        disabled={loading}
                      >
                        <i className="fas fa-download mr-1"></i>
                        Export
                      </button>
                      {selectedOrders.length > 0 && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => setShowBulkModal(true)}
                        >
                          <i className="fas fa-edit mr-1"></i>
                          Update Selected ({selectedOrders.length})
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="card-body">

                    {error && (
                      <div className="alert alert-danger" role="alert">
                        {error}
                      </div>
                    )}

                    {loading ? (
                      <div className="text-center py-4">
                        <div className="spinner-border text-primary" role="status">
                          <span className="sr-only">Loading...</span>
                        </div>
                        <p className="mt-2">Loading orders...</p>
                      </div>
                    ) : (
                      <div className="table-responsive">
                        <table className="table table-striped table-hover">
                          <thead className="thead-light">
                            <tr>
                              <th className="text-center">
                                <input
                                  type="checkbox"
                                  checked={orders.length > 0 && selectedOrders.length === orders.length}
                                  onChange={handleSelectAll}
                                  className="table-checkbox"
                                />
                              </th>
                              <th>Order #</th>
                              <th>Customer</th>
                              <th>Items</th>
                              <th>Amount</th>
                              <th>Status</th>
                              <th>Date</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {orders.length > 0 ? (
                              orders.map((order) => (
                                <tr key={order._id}>
                                  <td className="text-center">
                                    <input
                                      type="checkbox"
                                      checked={selectedOrders.includes(order._id)}
                                      onChange={() => toggleOrderSelection(order._id)}
                                      className="table-checkbox"
                                    />
                                  </td>
                                  <td>
                                    <strong>#{order.order_number}</strong>
                                    {order.tracking_number && (
                                      <div className="text-small text-muted">
                                        Track: {order.tracking_number}
                                      </div>
                                    )}
                                  </td>
                                  <td>
                                    <div>
                                      <strong>{order.user_info?.name || 'Unknown User'}</strong>
                                      {order.user_info?.email && <div className="text-small text-muted">{order.user_info.email}</div>}
                                      {order.user_info?.phone && <div className="text-small text-muted">{order.user_info.phone}</div>}
                                    </div>
                                  </td>
                                  <td>
                                    <strong>{order.items.length}</strong> item{order.items.length > 1 ? 's' : ''}
                                  </td>
                                  <td>
                                    <strong>₹{order.total_amount.toLocaleString()}</strong>
                                  </td>
                                  <td>
                                    <span className={`badge ${getStatusBadgeClass(order.status)}`}>
                                      {order.status.toUpperCase()}
                                    </span>
                                  </td>
                                  <td>
                                    <div>{new Date(order.created_at).toLocaleDateString('en-IN')}</div>
                                    <div className="text-small text-muted">
                                      {new Date(order.created_at).toLocaleTimeString('en-IN', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </div>
                                  </td>
                                  <td>
                                    <div className="d-flex">
                                      <button
                                        className="btn btn-outline-info btn-sm mr-1"
                                        title="View Details"
                                        onClick={() => {
                                          setSelectedOrder(order);
                                          setShowOrderModal(true);
                                        }}
                                      >
                                        <i className="fas fa-eye"></i>
                                      </button>
                                      <button
                                        className="btn btn-outline-primary btn-sm mr-1"
                                        title="Edit Status"
                                        onClick={() => {
                                          // TODO: Add edit status functionality
                                        }}
                                      >
                                        <i className="fas fa-edit"></i>
                                      </button>
                                      <button
                                        className="btn btn-outline-danger btn-sm"
                                        title="Delete Order"
                                        onClick={() => {
                                          // TODO: Add delete functionality
                                        }}
                                      >
                                        <i className="fas fa-trash"></i>
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={9} className="text-center py-4">
                                  <i className="fas fa-shopping-cart fa-3x text-muted mb-3"></i>
                                  <p className="text-muted">No orders found</p>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="row">
                        <div className="col-sm-12 col-md-5">
                          <div className="dataTables_info">
                            Showing {((currentPage - 1) * ordersPerPage) + 1} to {Math.min(currentPage * ordersPerPage, totalOrders)} of {totalOrders} orders
                          </div>
                        </div>
                        <div className="col-sm-12 col-md-7">
                          <nav>
                            <ul className="pagination justify-content-end">
                              <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                <button
                                  className="page-link"
                                  onClick={() => setCurrentPage(currentPage - 1)}
                                  disabled={currentPage === 1}
                                >
                                  Previous
                                </button>
                              </li>
                              {[...Array(Math.min(totalPages, 5))].map((_, idx) => {
                                const pageNum = Math.max(1, currentPage - 2) + idx;
                                if (pageNum > totalPages) return null;
                                return (
                                  <li key={pageNum} className={`page-item ${currentPage === pageNum ? 'active' : ''}`}>
                                    <button
                                      className="page-link"
                                      onClick={() => setCurrentPage(pageNum)}
                                    >
                                      {pageNum}
                                    </button>
                                  </li>
                                );
                              })}
                              <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                <button
                                  className="page-link"
                                  onClick={() => setCurrentPage(currentPage + 1)}
                                  disabled={currentPage === totalPages}
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
            </div>

            {/* Order Detail Modal */}
            {showOrderModal && selectedOrder && (
              <div className="modal fade show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}} onClick={() => setShowOrderModal(false)}>
                <div className="modal-dialog modal-lg" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-content">
                    <div className="modal-header">
                      <h5 className="modal-title">Order Details - #{selectedOrder.order_number}</h5>
                      <button className="close" onClick={() => setShowOrderModal(false)}>
                        <span>&times;</span>
                      </button>
                    </div>
                    <div className="modal-body">
                      <div className="row">
                        <div className="col-md-6">
                          <h6>Customer Information</h6>
                          <p><strong>Name:</strong> {selectedOrder.user_info?.name || 'Unknown User'}</p>
                          {selectedOrder.user_info?.email && <p><strong>Email:</strong> {selectedOrder.user_info.email}</p>}
                          {selectedOrder.user_info?.phone && <p><strong>Phone:</strong> {selectedOrder.user_info.phone}</p>}
                        </div>
                        <div className="col-md-6">
                          <h6>Order Information</h6>
                          <p><strong>Order Date:</strong> {new Date(selectedOrder.created_at).toLocaleString('en-IN')}</p>
                          <p><strong>Payment Status:</strong> 
                            <span className={`badge ${getPaymentBadgeClass(selectedOrder.payment_status)} ml-2`}>
                              {selectedOrder.payment_status.toUpperCase()}
                            </span>
                          </p>
                          <p><strong>Order Status:</strong> 
                            <span className={`badge ${getStatusBadgeClass(selectedOrder.status)} ml-2`}>
                              {selectedOrder.status.toUpperCase()}
                            </span>
                          </p>
                        </div>
                      </div>
                      
                      <hr />
                      
                      <h6>Shipping Address</h6>
                      <div className="alert alert-light">
                        <strong>{selectedOrder.shipping_address.full_name}</strong><br />
                        {selectedOrder.shipping_address.phone_number}<br />
                        {selectedOrder.shipping_address.address_line_1}<br />
                        {selectedOrder.shipping_address.address_line_2 && (
                          <>
                            {selectedOrder.shipping_address.address_line_2}<br />
                          </>
                        )}
                        {selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.state} - {selectedOrder.shipping_address.postal_code}
                      </div>
                      
                      <hr />
                      
                      <h6>Order Items</h6>
                      <div className="table-responsive">
                        <table className="table table-sm">
                          <thead>
                            <tr>
                              <th>Product</th>
                              <th>Quantity</th>
                              <th>Price</th>
                              <th>Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedOrder.items.map((item, index) => (
                              <tr key={index}>
                                <td>{item.product_name}</td>
                                <td>{item.quantity}</td>
                                <td>₹{item.price.toLocaleString()}</td>
                                <td>₹{(item.quantity * item.price).toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr>
                              <td colSpan={3}><strong>Subtotal:</strong></td>
                              <td><strong>₹{selectedOrder.total_amount.toLocaleString()}</strong></td>
                            </tr>
                            {selectedOrder.shipping_cost > 0 && (
                              <tr>
                                <td colSpan={3}>Shipping:</td>
                                <td>₹{selectedOrder.shipping_cost.toLocaleString()}</td>
                              </tr>
                            )}
                            {selectedOrder.tax_amount > 0 && (
                              <tr>
                                <td colSpan={3}>Tax:</td>
                                <td>₹{selectedOrder.tax_amount.toLocaleString()}</td>
                              </tr>
                            )}
                            <tr className="table-success">
                              <td colSpan={3}><strong>Final Total:</strong></td>
                              <td><strong>₹{selectedOrder.total_amount.toLocaleString()}</strong></td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>

                      {selectedOrder.notes && (
                        <>
                          <hr />
                          <h6>Notes</h6>
                          <div className="alert alert-info">
                            {selectedOrder.notes}
                          </div>
                        </>
                      )}
                    </div>
                    <div className="modal-footer">
                      <button className="btn btn-secondary" onClick={() => setShowOrderModal(false)}>
                        Close
                      </button>
                      <button className="btn btn-primary" onClick={() => window.print()}>
                        <i className="fas fa-print mr-2"></i>Print Order
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Bulk Status Update Modal */}
            {showBulkModal && (
              <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
                <div className="modal-dialog">
                  <div className="modal-content">
                    <div className="modal-header">
                      <h5 className="modal-title">Bulk Update Order Status</h5>
                      <button
                        type="button"
                        className="close"
                        onClick={() => {
                          setShowBulkModal(false);
                          setBulkStatus('');
                        }}
                      >
                        <span>&times;</span>
                      </button>
                    </div>
                    <div className="modal-body">
                      <p>Update status for {selectedOrders.length} selected order(s):</p>
                      <div className="form-group">
                        <label htmlFor="bulkStatus">New Status:</label>
                        <select
                          id="bulkStatus"
                          className="form-control"
                          value={bulkStatus}
                          onChange={(e) => setBulkStatus(e.target.value)}
                        >
                          <option value="">Select Status</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>
                    <div className="modal-footer">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => {
                          setShowBulkModal(false);
                          setBulkStatus('');
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleBulkStatusUpdate}
                        disabled={!bulkStatus || bulkUpdating}
                      >
                        {bulkUpdating ? (
                          <>
                            <i className="fas fa-spinner fa-spin mr-2"></i>
                            Updating...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-check mr-2"></i>
                            Update Status
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Export Modal */}
            {showExportModal && (
              <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
                <div className="modal-dialog">
                  <div className="modal-content">
                    <div className="modal-header">
                      <h5 className="modal-title">Export Orders</h5>
                      <button
                        type="button"
                        className="close"
                        onClick={() => setShowExportModal(false)}
                      >
                        <span>&times;</span>
                      </button>
                    </div>
                    <div className="modal-body">
                      <p>Export complete orders with current filters applied:</p>
                      <div className="form-group">
                        <label htmlFor="exportFormat">Export Format:</label>
                        <select
                          id="exportFormat"
                          className="form-control"
                          value={exportFormat}
                          onChange={(e) => setExportFormat(e.target.value as 'csv' | 'excel')}
                        >
                          <option value="csv">CSV Format</option>
                          <option value="excel">Excel Format (.xlsx)</option>
                        </select>
                      </div>
                      <div className="alert alert-info">
                        <i className="fas fa-info-circle mr-2"></i>
                        Export will include all orders matching your current search and filter criteria.
                      </div>
                    </div>
                    <div className="modal-footer">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setShowExportModal(false)}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="btn btn-success"
                        onClick={handleExportOrders}
                        disabled={exporting}
                      >
                        {exporting ? (
                          <>
                            <i className="fas fa-spinner fa-spin mr-2"></i>
                            Exporting...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-download mr-2"></i>
                            Export {exportFormat.toUpperCase()}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Filter Modal */}
            {showFilterModal && (
              <div className={`modal fade ${modalAnimating ? 'show' : ''}`} style={{display: 'block'}} tabIndex={-1} role="dialog">
                <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
                  <div className="modal-content">
                    <div className="modal-header">
                      <h5 className="modal-title">Filter Order History</h5>
                      <button 
                        type="button" 
                        className="close" 
                        onClick={closeModal}
                      >
                        <span>&times;</span>
                      </button>
                    </div>
                    <div className="modal-body">
                      <div className="row">
                        {/* Search Field */}
                        <div className="col-md-6">
                          <div className="form-group">
                            <label>Search Orders</label>
                            <input 
                              type="text" 
                              className="form-control form-control-sm" 
                              placeholder="Search by order number, customer name"
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                            />
                          </div>
                        </div>
                        
                        {/* Status Filter */}
                        <div className="col-md-6">
                          <div className="form-group">
                            <label>Status</label>
                            <select 
                              className="form-control form-control-sm"
                              value={statusFilter}
                              onChange={(e) => setStatusFilter(e.target.value)}
                            >
                              <option value="all">All Statuses</option>
                              <option value="pending">Pending</option>
                              <option value="confirmed">Confirmed</option>
                              <option value="processing">Processing</option>
                              <option value="shipped">Shipped</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </div>
                        </div>
                        
                        {/* Date Range */}
                        <div className="col-md-6">
                          <div className="form-group">
                            <label>From Date</label>
                            <input 
                              type="date" 
                              className="form-control form-control-sm"
                              value={fromDate}
                              onChange={(e) => setFromDate(e.target.value)}
                            />
                          </div>
                        </div>
                        
                        <div className="col-md-6">
                          <div className="form-group">
                            <label>To Date</label>
                            <input 
                              type="date" 
                              className="form-control form-control-sm"
                              value={toDate}
                              onChange={(e) => setToDate(e.target.value)}
                            />
                          </div>
                        </div>
                        
                        {/* Customer Filter */}
                        <div className="col-md-6">
                          <div className="form-group">
                            <label>Customer</label>
                            <input 
                              type="text" 
                              className="form-control form-control-sm"
                              placeholder="Customer name or email"
                              value={customerFilter}
                              onChange={(e) => setCustomerFilter(e.target.value)}
                            />
                          </div>
                        </div>
                        
                        {/* Amount Range */}
                        <div className="col-md-3">
                          <div className="form-group">
                            <label>Min Amount (₹)</label>
                            <input 
                              type="number" 
                              className="form-control form-control-sm"
                              placeholder="0"
                              value={amountMin}
                              onChange={(e) => setAmountMin(e.target.value)}
                            />
                          </div>
                        </div>
                        
                        <div className="col-md-3">
                          <div className="form-group">
                            <label>Max Amount (₹)</label>
                            <input 
                              type="number" 
                              className="form-control form-control-sm"
                              placeholder="No limit"
                              value={amountMax}
                              onChange={(e) => setAmountMax(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="alert alert-info mt-3">
                        <i className="fas fa-info-circle mr-2"></i>
                        By default, showing order history from last 30 days. Adjust date range to see more orders.
                      </div>
                    </div>
                    <div className="modal-footer">
                      <button 
                        type="button" 
                        className="btn btn-secondary btn-sm" 
                        onClick={clearFilters}
                      >
                        <i className="fas fa-undo mr-1"></i>
                        Reset All
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-primary btn-sm" 
                        onClick={applyFilters}
                      >
                        <i className="fas fa-check mr-1"></i>
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
        </div>
      </div>
    </div>
  );
}