'use client';

import Header from '@/components/admin/Header';
import Sidebar from '@/components/admin/Sidebar';
import Link from 'next/link';
import { useState } from 'react';
import { successMessages, errorMessages } from '@/lib/sweetalert';
import { getCSRFToken } from '@/lib/csrf';

export default function SendNotificationPage() {
  const [formData, setFormData] = useState({
    target_user_type: '',
    target_user_ids: [],
    notification: {
      type: 'PROMOTIONAL',
      title: '',
      body: '',
      data: {}
    }
  });
  const [sending, setSending] = useState(false);

  const handleInputChange = (field: string, value: string | boolean | string[]) => {
    if (field.startsWith('notification.')) {
      const notificationField = field.replace('notification.', '');
      setFormData(prev => ({
        ...prev,
        notification: {
          ...prev.notification,
          [notificationField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.notification.title || !formData.notification.body) {
      errorMessages.custom('Please fill in title and message');
      return;
    }

    if (!formData.target_user_type && formData.target_user_ids.length === 0) {
      errorMessages.custom('Please select target users or user type');
      return;
    }

    setSending(true);
    try {
      const csrfToken = getCSRFToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (csrfToken) {
        headers['x-csrf-token'] = csrfToken;
      }

      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers,
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        successMessages.custom('Notification sent successfully');
        setFormData({
          target_user_type: '',
          target_user_ids: [],
          notification: {
            type: 'PROMOTIONAL',
            title: '',
            body: '',
            data: {}
          }
        });
      } else {
        errorMessages.custom(data.message || 'Failed to send notification');
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      errorMessages.custom('Failed to send notification');
    } finally {
      setSending(false);
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
                  <h2 className="pageheader-title">Send Notification</h2>
                  <p className="pageheader-text">Send push notifications to users</p>
                  <div className="page-breadcrumb">
                    <nav aria-label="breadcrumb">
                      <ol className="breadcrumb">
                        <li className="breadcrumb-item">
                          <Link href="/dashboard" className="breadcrumb-link">Dashboard</Link>
                        </li>
                        <li className="breadcrumb-item">
                          <span className="breadcrumb-link">Notifications</span>
                        </li>
                        <li className="breadcrumb-item active" aria-current="page">Send</li>
                      </ol>
                    </nav>
                  </div>
                </div>
              </div>
            </div>

            {/* Send Notification Form */}
            <div className="row">
              <div className="col-xl-8 col-lg-8 col-md-12 col-sm-12 col-12">
                <div className="card">
                  <h5 className="card-header">Notification Details</h5>
                  <div className="card-body">
                    <form onSubmit={handleSendNotification}>
                      {/* Target Selection */}
                      <div className="form-group">
                        <label>Target Audience</label>
                        <select 
                          className="form-control"
                          value={formData.target_user_type}
                          onChange={(e) => handleInputChange('target_user_type', e.target.value)}
                        >
                          <option value="">Select target audience</option>
                          <option value="customer">All Customers</option>
                          <option value="astrologer">All Astrologers</option>
                          <option value="all">All Users</option>
                        </select>
                      </div>

                      {/* Notification Type */}
                      <div className="form-group">
                        <label>Notification Type</label>
                        <select 
                          className="form-control"
                          value={formData.notification.type}
                          onChange={(e) => handleInputChange('notification.type', e.target.value)}
                        >
                          <option value="PROMOTIONAL">Promotional</option>
                          <option value="SYSTEM_MAINTENANCE">System Maintenance</option>
                          <option value="GENERAL">General</option>
                          <option value="URGENT">Urgent</option>
                        </select>
                      </div>

                      {/* Title */}
                      <div className="form-group">
                        <label>Title *</label>
                        <input 
                          type="text" 
                          className="form-control"
                          placeholder="Enter notification title"
                          value={formData.notification.title}
                          onChange={(e) => handleInputChange('notification.title', e.target.value)}
                          required
                        />
                      </div>

                      {/* Message */}
                      <div className="form-group">
                        <label>Message *</label>
                        <textarea 
                          className="form-control"
                          rows={4}
                          placeholder="Enter notification message"
                          value={formData.notification.body}
                          onChange={(e) => handleInputChange('notification.body', e.target.value)}
                          required
                        />
                      </div>

                      {/* Submit Button */}
                      <div className="form-group">
                        <button 
                          type="submit" 
                          className="btn btn-primary"
                          disabled={sending}
                        >
                          {sending ? (
                            <>
                              <i className="fas fa-spinner fa-spin mr-2"></i>
                              Sending...
                            </>
                          ) : (
                            <>
                              <i className="fas fa-paper-plane mr-2"></i>
                              Send Notification
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>

              {/* Help Card */}
              <div className="col-xl-4 col-lg-4 col-md-12 col-sm-12 col-12">
                <div className="card">
                  <h5 className="card-header">Tips</h5>
                  <div className="card-body">
                    <ul className="list-unstyled">
                      <li className="mb-2">
                        <i className="fas fa-info-circle text-info mr-2"></i>
                        Keep titles under 50 characters for best display
                      </li>
                      <li className="mb-2">
                        <i className="fas fa-info-circle text-info mr-2"></i>
                        Messages should be clear and actionable
                      </li>
                      <li className="mb-2">
                        <i className="fas fa-info-circle text-info mr-2"></i>
                        Test with a small group before sending to all users
                      </li>
                      <li className="mb-2">
                        <i className="fas fa-info-circle text-info mr-2"></i>
                        Promotional notifications can be disabled by users
                      </li>
                    </ul>
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