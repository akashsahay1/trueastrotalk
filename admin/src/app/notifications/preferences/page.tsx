'use client';

import Header from '@/components/admin/Header';
import Sidebar from '@/components/admin/Sidebar';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { successMessages, errorMessages } from '@/lib/sweetalert';
import { getCSRFToken } from '@/lib/csrf';

interface UserPreference {
  _id: string;
  full_name: string;
  email_address: string;
  user_type: string;
  notification_preferences: {
    push_enabled: boolean;
    email_enabled: boolean;
    chat_notifications: boolean;
    call_notifications: boolean;
    payment_notifications: boolean;
    order_notifications: boolean;
    promotional_notifications: boolean;
    system_notifications: boolean;
  };
}

export default function NotificationPreferencesPage() {
  const [users, setUsers] = useState<UserPreference[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    userType: '',
    search: ''
  });

  const fetchUserPreferences = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: '50',
        page: '1'
      });

      if (filters.userType) params.append('type', filters.userType);
      if (filters.search) params.append('search', filters.search);

      const response = await fetch(`/api/notifications/preferences?${params}`);
      const data = await response.json();

      if (response.ok) {
        setUsers(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching user preferences:', error);
    } finally {
      setLoading(false);
    }
  }, [filters.userType, filters.search]);

  useEffect(() => {
    document.body.className = '';
    fetchUserPreferences();
  }, [fetchUserPreferences]);

  const updateUserPreference = async (userId: string, preferenceKey: string, value: boolean) => {
    setUpdating(userId);
    try {
      const csrfToken = getCSRFToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (csrfToken) {
        headers['x-csrf-token'] = csrfToken;
      }

      const response = await fetch(`/api/users/${userId}/preferences`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          preferences: {
            [preferenceKey]: value
          }
        }),
      });

      if (response.ok) {
        setUsers(prev => prev.map(user => 
          user._id === userId 
            ? {
                ...user,
                notification_preferences: {
                  ...user.notification_preferences,
                  [preferenceKey]: value
                }
              }
            : user
        ));
        successMessages.custom('Preference updated successfully');
      } else {
        errorMessages.custom('Failed to update preference');
      }
    } catch (error) {
      console.error('Error updating preference:', error);
      errorMessages.custom('Failed to update preference');
    } finally {
      setUpdating(null);
    }
  };

  const PreferenceToggle = ({ 
    userId, 
    preferenceKey, 
    value, 
    label 
  }: { 
    userId: string; 
    preferenceKey: string; 
    value: boolean; 
    label: string;
  }) => (
    <div className="form-check form-switch">
      <input
        className="form-check-input"
        type="checkbox"
        checked={value}
        onChange={(e) => updateUserPreference(userId, preferenceKey, e.target.checked)}
        disabled={updating === userId}
      />
      <label className="form-check-label text-sm">
        {label}
      </label>
    </div>
  );

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
                  <h2 className="pageheader-title">User Notification Preferences</h2>
                  <p className="pageheader-text">Manage notification preferences for all users</p>
                  <div className="page-breadcrumb">
                    <nav aria-label="breadcrumb">
                      <ol className="breadcrumb">
                        <li className="breadcrumb-item">
                          <Link href="/dashboard" className="breadcrumb-link">Dashboard</Link>
                        </li>
                        <li className="breadcrumb-item">
                          <span className="breadcrumb-link">Notifications</span>
                        </li>
                        <li className="breadcrumb-item active" aria-current="page">Preferences</li>
                      </ol>
                    </nav>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="row mb-4">
              <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12">
                <div className="card">
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-3">
                        <div className="form-group">
                          <label>User Type</label>
                          <select 
                            className="form-control form-control-sm"
                            value={filters.userType}
                            onChange={(e) => setFilters(prev => ({ ...prev, userType: e.target.value }))}
                          >
                            <option value="">All Users</option>
                            <option value="customer">Customers</option>
                            <option value="astrologer">Astrologers</option>
                          </select>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group">
                          <label>Search</label>
                          <input 
                            type="text" 
                            className="form-control form-control-sm"
                            placeholder="Search by name or email"
                            value={filters.search}
                            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="form-group">
                          <label>&nbsp;</label>
                          <div>
                            <button 
                              className="btn btn-primary btn-sm btn-block"
                              onClick={fetchUserPreferences}
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

            {/* User Preferences Table */}
            <div className="row">
              <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12">
                <div className="card">
                  <h5 className="card-header">User Notification Preferences</h5>
                  <div className="card-body">
                    <div className="table-responsive">
                      <table className="table table-striped">
                        <thead>
                          <tr>
                            <th>User</th>
                            <th>Type</th>
                            <th>Push</th>
                            <th>Email</th>
                            <th>Chat</th>
                            <th>Calls</th>
                            <th>Payments</th>
                            <th>Orders</th>
                            <th>Promotional</th>
                            <th>System</th>
                          </tr>
                        </thead>
                        <tbody>
                          {loading ? (
                            <tr>
                              <td colSpan={10} className="text-center">
                                <i className="fas fa-spinner fa-spin mr-2"></i>Loading...
                              </td>
                            </tr>
                          ) : users.length > 0 ? (
                            users.map((user) => (
                              <tr key={user._id}>
                                <td>
                                  <div>
                                    <strong>{user.full_name}</strong><br />
                                    <small className="text-muted">{user.email_address}</small>
                                  </div>
                                </td>
                                <td>
                                  <span className={`badge ${user.user_type === 'customer' ? 'badge-primary' : 'badge-info'}`}>
                                    {user.user_type}
                                  </span>
                                </td>
                                <td>
                                  <PreferenceToggle
                                    userId={user._id}
                                    preferenceKey="push_enabled"
                                    value={user.notification_preferences?.push_enabled ?? true}
                                    label=""
                                  />
                                </td>
                                <td>
                                  <PreferenceToggle
                                    userId={user._id}
                                    preferenceKey="email_enabled"
                                    value={user.notification_preferences?.email_enabled ?? true}
                                    label=""
                                  />
                                </td>
                                <td>
                                  <PreferenceToggle
                                    userId={user._id}
                                    preferenceKey="chat_notifications"
                                    value={user.notification_preferences?.chat_notifications ?? true}
                                    label=""
                                  />
                                </td>
                                <td>
                                  <PreferenceToggle
                                    userId={user._id}
                                    preferenceKey="call_notifications"
                                    value={user.notification_preferences?.call_notifications ?? true}
                                    label=""
                                  />
                                </td>
                                <td>
                                  <PreferenceToggle
                                    userId={user._id}
                                    preferenceKey="payment_notifications"
                                    value={user.notification_preferences?.payment_notifications ?? true}
                                    label=""
                                  />
                                </td>
                                <td>
                                  <PreferenceToggle
                                    userId={user._id}
                                    preferenceKey="order_notifications"
                                    value={user.notification_preferences?.order_notifications ?? true}
                                    label=""
                                  />
                                </td>
                                <td>
                                  <PreferenceToggle
                                    userId={user._id}
                                    preferenceKey="promotional_notifications"
                                    value={user.notification_preferences?.promotional_notifications ?? true}
                                    label=""
                                  />
                                </td>
                                <td>
                                  <PreferenceToggle
                                    userId={user._id}
                                    preferenceKey="system_notifications"
                                    value={user.notification_preferences?.system_notifications ?? true}
                                    label=""
                                  />
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={10} className="text-center">No users found</td>
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