'use client';

import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';

interface NotificationHistory {
  _id: string;
  type: string;
  title: string;
  body: string;
  user_id: string;
  delivery_status: string;
  created_at: string;
  is_read: boolean;
}

export default function NotificationHistoryPage() {
  const [notifications, setNotifications] = useState<NotificationHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    search: ''
  });

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: '50',
        page: '1'
      });

      if (filters.type) params.append('type', filters.type);
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);

      const response = await fetch(`/api/notifications/admin/history?${params}`);
      const data = await response.json();

      if (response.ok) {
        setNotifications(data.data.notifications || []);
      }
    } catch (error) {
      console.error('Error fetching notification history:', error);
    } finally {
      setLoading(false);
    }
  }, [filters.type, filters.status, filters.search]);

  useEffect(() => {
    document.body.className = '';
    fetchNotifications();
  }, [fetchNotifications]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'badge-success';
      case 'failed':
        return 'badge-danger';
      case 'pending':
        return 'badge-warning';
      default:
        return 'badge-secondary';
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'PROMOTIONAL':
        return 'badge-info';
      case 'SYSTEM_MAINTENANCE':
        return 'badge-warning';
      case 'URGENT':
        return 'badge-danger';
      default:
        return 'badge-primary';
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
                  <h2 className="pageheader-title">Notification History</h2>
                  <p className="pageheader-text">View all sent notifications and their delivery status</p>
                  <div className="page-breadcrumb">
                    <nav aria-label="breadcrumb">
                      <ol className="breadcrumb">
                        <li className="breadcrumb-item">
                          <Link href="/admin/dashboard" className="breadcrumb-link">Dashboard</Link>
                        </li>
                        <li className="breadcrumb-item">
                          <span className="breadcrumb-link">Notifications</span>
                        </li>
                        <li className="breadcrumb-item active" aria-current="page">History</li>
                      </ol>
                    </nav>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="row">
              <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12">
                <div className="card">
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-3">
                        <div className="form-group">
                          <label>Type</label>
                          <select 
                            className="form-control form-control-sm"
                            value={filters.type}
                            onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                          >
                            <option value="">All Types</option>
                            <option value="PROMOTIONAL">Promotional</option>
                            <option value="SYSTEM_MAINTENANCE">System Maintenance</option>
                            <option value="URGENT">Urgent</option>
                            <option value="GENERAL">General</option>
                          </select>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="form-group">
                          <label>Status</label>
                          <select 
                            className="form-control form-control-sm"
                            value={filters.status}
                            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                          >
                            <option value="">All Status</option>
                            <option value="delivered">Delivered</option>
                            <option value="failed">Failed</option>
                            <option value="pending">Pending</option>
                          </select>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group">
                          <label>Search</label>
                          <input 
                            type="text" 
                            className="form-control form-control-sm"
                            placeholder="Search by title or content"
                            value={filters.search}
                            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="col-md-2">
                        <div className="form-group">
                          <label>&nbsp;</label>
                          <div>
                            <button 
                              className="btn btn-primary btn-sm btn-block"
                              onClick={fetchNotifications}
                            >
                              <i className="fas fa-search mr-1"></i>
                              Filter
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notifications Table */}
            <div className="row">
              <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12">
                <div className="card">
                  <h5 className="card-header">Notification History</h5>
                  <div className="card-body p-0">
                    <div className="table-responsive">
                      <table className="table table-striped table-bordered m-0">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Type</th>
                            <th>Title</th>
                            <th>Message</th>
                            <th>Status</th>
                            <th>Read</th>
                          </tr>
                        </thead>
                        <tbody>
                          {loading ? (
                            <tr>
                              <td colSpan={6} className="text-center">
                                <i className="fas fa-spinner fa-spin mr-2"></i>Loading...
                              </td>
                            </tr>
                          ) : notifications.length > 0 ? (
                            notifications.map((notification) => (
                              <tr key={notification._id}>
                                <td>{new Date(notification.created_at).toLocaleString()}</td>
                                <td>
                                  <span className={`badge ${getTypeBadge(notification.type)}`}>
                                    {notification.type}
                                  </span>
                                </td>
                                <td className="font-weight-bold">{notification.title}</td>
                                <td>{notification.body.substring(0, 100)}{notification.body.length > 100 ? '...' : ''}</td>
                                <td>
                                  <span className={`badge ${getStatusBadge(notification.delivery_status)}`}>
                                    {notification.delivery_status || 'pending'}
                                  </span>
                                </td>
                                <td>
                                  <span className={`badge ${notification.is_read ? 'badge-success' : 'badge-secondary'}`}>
                                    {notification.is_read ? 'Read' : 'Unread'}
                                  </span>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={6} className="text-center">No notifications found</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
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