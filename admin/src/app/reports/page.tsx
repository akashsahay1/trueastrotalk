/**
 * Main Reports Dashboard Page - App Performance and Error Monitoring
 */

'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/admin/Header';
import Sidebar from '@/components/admin/Sidebar';

interface ErrorSummary {
  total_errors: number;
  unresolved_errors: number;
  critical_errors: number;
  errors_today: number;
  top_error_types: Array<{
    error_type: string;
    count: number;
    percentage: number;
  }>;
  error_trends: Array<{
    date: string;
    count: number;
  }>;
}

interface PerformanceSummary {
  avg_response_time: number;
  error_rate: number;
  peak_users: number;
  current_active_users: number;
  app_crashes_today: number;
  api_calls_today: number;
}

interface RealtimeStats {
  total_customers: number;
  total_astrologers: number;
  online_customers: number;
  online_astrologers: number;
  active_sessions: number;
  active_calls: number;
}

interface AppError {
  _id: string;
  user_id?: string;
  user_type?: string;
  error_type: string;
  error_message: string;
  severity: string;
  platform?: string;
  screen_name?: string;
  resolved: boolean;
  created_at: string;
}

interface ReportsData {
  errors: ErrorSummary;
  performance: PerformanceSummary;
  realtime: RealtimeStats;
  generated_at: string;
}

export default function ReportsPage() {
  const [reportsData, setReportsData] = useState<ReportsData | null>(null);
  const [recentErrors, setRecentErrors] = useState<AppError[]>([]);
  const [detailedLogs, setDetailedLogs] = useState<AppError[]>([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // const [lastUpdated, setLastUpdated] = useState<string>('');
  const [showDetailedLogs, setShowDetailedLogs] = useState(false);

  // Fetch reports data
  const fetchReportsData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/reports/summary');
      
      if (!response.ok) {
        throw new Error('Failed to fetch reports data');
      }

      const result = await response.json();
      if (result.success) {
        setReportsData(result.data);
        setError(null);
        // setLastUpdated(new Date().toLocaleTimeString());
      } else {
        throw new Error(result.error || 'Unknown error occurred');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Fetch recent errors
  const fetchRecentErrors = async () => {
    try {
      const response = await fetch('/api/reports/errors?limit=10');
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setRecentErrors(result.data.errors);
        }
      }
    } catch (err) {
      console.error('Failed to fetch recent errors:', err);
    }
  };

  // Fetch detailed error logs
  const fetchDetailedLogs = async (limit = 50) => {
    try {
      setLogsLoading(true);
      const response = await fetch(`/api/reports/errors?limit=${limit}&detailed=true`);
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setDetailedLogs(result.data.errors);
        }
      }
    } catch (err) {
      console.error('Failed to fetch detailed logs:', err);
    } finally {
      setLogsLoading(false);
    }
  };

  // Resolve error
  const resolveError = async (errorId: string) => {
    try {
      const response = await fetch('/api/reports/errors', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error_id: errorId,
          action: 'resolve',
          resolved_by: 'admin',
          notes: 'Resolved from admin panel'
        })
      });

      if (response.ok) {
        // Refresh the data
        fetchReportsData();
        fetchRecentErrors();
        if (showDetailedLogs) {
          fetchDetailedLogs();
        }
      }
    } catch (err) {
      console.error('Failed to resolve error:', err);
    }
  };

  // Initial data load
  useEffect(() => {
    // Remove the bg-light class for dashboard
    document.body.className = '';
    
    fetchReportsData();
    fetchRecentErrors();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchReportsData();
      fetchRecentErrors();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  if (loading && !reportsData) {
    return (
      <div className="dashboard-main-wrapper">
        <Header />
        <Sidebar />
        
        {/* Loading Content */}
        <div className="dashboard-wrapper">
          <div className="dashboard-ecommerce">
            <div className="container-fluid dashboard-content">
              {/* Page Header */}
              <div className="row">
                <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12">
                  <div className="page-header">
                    <h2 className="pageheader-title">App Performance & Error Reports</h2>
                    <p className="pageheader-text">Real-time monitoring and analytics</p>
                    <div className="page-breadcrumb">
                      <nav aria-label="breadcrumb">
                        <ol className="breadcrumb">
                          <li className="breadcrumb-item"><a href="/dashboard" className="breadcrumb-link">Dashboard</a></li>
                          <li className="breadcrumb-item active" aria-current="page">Reports</li>
                        </ol>
                      </nav>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="text-center mt-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="sr-only">Loading...</span>
                </div>
                <p className="mt-2">Loading reports data...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-main-wrapper">
        <Header />
        <Sidebar />
        
        {/* Error Content */}
        <div className="dashboard-wrapper">
          <div className="dashboard-ecommerce">
            <div className="container-fluid dashboard-content">
              {/* Page Header */}
              <div className="row">
                <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12">
                  <div className="page-header">
                    <h2 className="pageheader-title">App Performance & Error Reports</h2>
                    <p className="pageheader-text">Real-time monitoring and analytics</p>
                    <div className="page-breadcrumb">
                      <nav aria-label="breadcrumb">
                        <ol className="breadcrumb">
                          <li className="breadcrumb-item"><a href="/dashboard" className="breadcrumb-link">Dashboard</a></li>
                          <li className="breadcrumb-item active" aria-current="page">Reports</li>
                        </ol>
                      </nav>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="alert alert-danger mt-3" role="alert">
                <h4 className="alert-heading">Error!</h4>
                <p>{error}</p>
                <hr />
                <button className="btn btn-primary" onClick={fetchReportsData}>
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-main-wrapper">
      <Header />
      <Sidebar />
      
      {/* Reports Content */}
      <div className="dashboard-wrapper">
        <div className="dashboard-ecommerce">
          <div className="container-fluid dashboard-content">
            {/* Page Header */}
            <div className="row">
              <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12">
                <div className="page-header">
                  <h2 className="pageheader-title">App Performance & Error Reports</h2>
                  <p className="pageheader-text">Real-time monitoring and analytics</p>
                  <div className="page-breadcrumb">
                    <nav aria-label="breadcrumb">
                      <ol className="breadcrumb">
                        <li className="breadcrumb-item">
                          <a href="/dashboard" className="breadcrumb-link">Dashboard</a>
                        </li>
                        <li className="breadcrumb-item active" aria-current="page">Reports</li>
                      </ol>
                    </nav>
                  </div>
                </div>
              </div>
            </div>

            {/* Real-time User Statistics */}
            <div className="ecommerce-widget">
              <div className="row">
                <div className="col-xl-3 col-lg-3 col-md-6 col-sm-12 col-12 mb-4">
                  <div className="card border-top-primary shadow-sm h-100">
                    <div className="card-body">
                      <h5 className="text-muted mb-4">Total Customers</h5>
                      <div className="d-flex justify-content-between">
                        <div className="metric-value">
                          <h1 className="font-weight-bold">{reportsData?.realtime.total_customers.toLocaleString() || '0'}</h1>
                        </div>
                        <div className="metric-label align-self-center text-primary">
                          <i className="fas fa-users fa-2x"></i>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-xl-3 col-lg-3 col-md-6 col-sm-12 col-12 mb-4">
                  <div className="card border-top-primary shadow-sm h-100">
                    <div className="card-body">
                      <h5 className="text-muted mb-4">Total Astrologers</h5>
                      <div className="d-flex justify-content-between">
                        <div className="metric-value">
                          <h1 className="font-weight-bold">{reportsData?.realtime.total_astrologers.toLocaleString() || '0'}</h1>
                        </div>
                        <div className="metric-label align-self-center text-primary">
                          <i className="fas fa-star fa-2x"></i>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-xl-3 col-lg-3 col-md-6 col-sm-12 col-12 mb-4">
                  <div className="card border-top-primary shadow-sm h-100">
                    <div className="card-body">
                      <h5 className="text-muted mb-4">Online Customers</h5>
                      <div className="d-flex justify-content-between">
                        <div className="metric-value">
                          <h1 className="font-weight-bold text-success">{reportsData?.realtime.online_customers.toLocaleString() || '0'}</h1>
                        </div>
                        <div className="metric-label align-self-center text-success">
                          <i className="fas fa-circle fa-2x"></i>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-xl-3 col-lg-3 col-md-6 col-sm-12 col-12 mb-4">
                  <div className="card border-top-primary shadow-sm h-100">
                    <div className="card-body">
                      <h5 className="text-muted mb-4">Online Astrologers</h5>
                      <div className="d-flex justify-content-between">
                        <div className="metric-value">
                          <h1 className="font-weight-bold text-success">{reportsData?.realtime.online_astrologers.toLocaleString() || '0'}</h1>
                        </div>
                        <div className="metric-label align-self-center text-success">
                          <i className="fas fa-dot-circle fa-2x"></i>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Activity & Performance Stats */}
            <div className="ecommerce-widget">
              <div className="row">
                <div className="col-xl-3 col-lg-3 col-md-6 col-sm-12 col-12 mb-4">
                  <div className="card border-top-primary shadow-sm h-100">
                    <div className="card-body">
                      <h5 className="text-muted mb-4">Active Sessions</h5>
                      <div className="d-flex justify-content-between">
                        <div className="metric-value">
                          <h1 className="font-weight-bold text-info">{reportsData?.realtime.active_sessions.toLocaleString() || '0'}</h1>
                        </div>
                        <div className="metric-label align-self-center text-info">
                          <i className="fas fa-comments fa-2x"></i>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-xl-3 col-lg-3 col-md-6 col-sm-12 col-12 mb-4">
                  <div className="card border-top-primary shadow-sm h-100">
                    <div className="card-body">
                      <h5 className="text-muted mb-4">Active Calls</h5>
                      <div className="d-flex justify-content-between">
                        <div className="metric-value">
                          <h1 className="font-weight-bold text-info">{reportsData?.realtime.active_calls.toLocaleString() || '0'}</h1>
                        </div>
                        <div className="metric-label align-self-center text-info">
                          <i className="fas fa-phone fa-2x"></i>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-xl-3 col-lg-3 col-md-6 col-sm-12 col-12 mb-4">
                  <div className="card border-top-primary shadow-sm h-100">
                    <div className="card-body">
                      <h5 className="text-muted mb-4">API Calls Today</h5>
                      <div className="d-flex justify-content-between">
                        <div className="metric-value">
                          <h1 className="font-weight-bold text-warning">{reportsData?.performance.api_calls_today.toLocaleString() || '0'}</h1>
                        </div>
                        <div className="metric-label align-self-center text-warning">
                          <i className="fas fa-exchange-alt fa-2x"></i>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-xl-3 col-lg-3 col-md-6 col-sm-12 col-12 mb-4">
                  <div className="card border-top-primary shadow-sm h-100">
                    <div className="card-body">
                      <h5 className="text-muted mb-4">Current Active Users</h5>
                      <div className="d-flex justify-content-between">
                        <div className="metric-value">
                          <h1 className="font-weight-bold text-primary">{reportsData?.performance.current_active_users.toLocaleString() || '0'}</h1>
                        </div>
                        <div className="metric-label align-self-center text-primary">
                          <i className="fas fa-user-clock fa-2x"></i>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Error Statistics */}
            <div className="ecommerce-widget">
              <div className="row">
                <div className="col-xl-3 col-lg-3 col-md-6 col-sm-12 col-12 mb-4">
                  <div className="card border-top-primary shadow-sm h-100">
                    <div className="card-body">
                      <h5 className="text-muted mb-4">Total Errors</h5>
                      <div className="d-flex justify-content-between">
                        <div className="metric-value">
                          <h1 className="font-weight-bold">{reportsData?.errors.total_errors.toLocaleString() || '0'}</h1>
                        </div>
                        <div className="metric-label align-self-center text-secondary">
                          <i className="fas fa-exclamation-triangle fa-2x"></i>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-xl-3 col-lg-3 col-md-6 col-sm-12 col-12 mb-4">
                  <div className="card border-top-primary shadow-sm h-100">
                    <div className="card-body">
                      <h5 className="text-muted mb-4">Unresolved Errors</h5>
                      <div className="d-flex justify-content-between">
                        <div className="metric-value">
                          <h1 className="font-weight-bold text-warning">{reportsData?.errors.unresolved_errors.toLocaleString() || '0'}</h1>
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
                      <h5 className="text-muted mb-4">Critical Errors</h5>
                      <div className="d-flex justify-content-between">
                        <div className="metric-value">
                          <h1 className="font-weight-bold text-danger">{reportsData?.errors.critical_errors.toLocaleString() || '0'}</h1>
                        </div>
                        <div className="metric-label align-self-center text-danger">
                          <i className="fas fa-times-circle fa-2x"></i>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-xl-3 col-lg-3 col-md-6 col-sm-12 col-12 mb-4">
                  <div className="card border-top-primary shadow-sm h-100">
                    <div className="card-body">
                      <h5 className="text-muted mb-4">Errors Today</h5>
                      <div className="d-flex justify-content-between">
                        <div className="metric-value">
                          <h1 className="font-weight-bold text-info">{reportsData?.errors.errors_today.toLocaleString() || '0'}</h1>
                        </div>
                        <div className="metric-label align-self-center text-info">
                          <i className="fas fa-calendar-day fa-2x"></i>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="ecommerce-widget">
              <div className="row">
                <div className="col-xl-3 col-lg-3 col-md-6 col-sm-12 col-12 mb-4">
                  <div className="card border-top-primary shadow-sm h-100">
                    <div className="card-body">
                      <h5 className="text-muted mb-4">Avg Response Time</h5>
                      <div className="d-flex justify-content-between">
                        <div className="metric-value">
                          <h1 className="font-weight-bold text-success">{reportsData?.performance.avg_response_time || 0}ms</h1>
                        </div>
                        <div className="metric-label align-self-center text-success">
                          <i className="fas fa-tachometer-alt fa-2x"></i>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-xl-3 col-lg-3 col-md-6 col-sm-12 col-12 mb-4">
                  <div className="card border-top-primary shadow-sm h-100">
                    <div className="card-body">
                      <h5 className="text-muted mb-4">Error Rate</h5>
                      <div className="d-flex justify-content-between">
                        <div className="metric-value">
                          <h1 className="font-weight-bold text-warning">{reportsData?.performance.error_rate || 0}%</h1>
                        </div>
                        <div className="metric-label align-self-center text-warning">
                          <i className="fas fa-percentage fa-2x"></i>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-xl-3 col-lg-3 col-md-6 col-sm-12 col-12 mb-4">
                  <div className="card border-top-primary shadow-sm h-100">
                    <div className="card-body">
                      <h5 className="text-muted mb-4">Peak Users (24h)</h5>
                      <div className="d-flex justify-content-between">
                        <div className="metric-value">
                          <h1 className="font-weight-bold text-info">{reportsData?.performance.peak_users.toLocaleString() || '0'}</h1>
                        </div>
                        <div className="metric-label align-self-center text-info">
                          <i className="fas fa-chart-line fa-2x"></i>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-xl-3 col-lg-3 col-md-6 col-sm-12 col-12 mb-4">
                  <div className="card border-top-primary shadow-sm h-100">
                    <div className="card-body">
                      <h5 className="text-muted mb-4">App Crashes Today</h5>
                      <div className="d-flex justify-content-between">
                        <div className="metric-value">
                          <h1 className="font-weight-bold text-danger">{reportsData?.performance.app_crashes_today.toLocaleString() || '0'}</h1>
                        </div>
                        <div className="metric-label align-self-center text-danger">
                          <i className="fas fa-bug fa-2x"></i>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Error Types */}
            <div className="row">
        <div className="col-xl-6 col-lg-6 col-md-12 col-sm-12 col-12 mb-4">
          <div className="card shadow-sm h-100">
            <h5 className="card-header">Top Error Types</h5>
            <div className="card-body">
              {reportsData?.errors.top_error_types.length ? (
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>Error Type</th>
                        <th>Count</th>
                        <th>Percentage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportsData.errors.top_error_types.map((errorType, index) => (
                        <tr key={index}>
                          <td>
                            <span className={`badge badge-${
                              errorType.error_type === 'critical' ? 'danger' : 
                              errorType.error_type === 'network' ? 'warning' : 
                              errorType.error_type === 'authentication' ? 'info' : 'secondary'
                            }`}>
                              {errorType.error_type}
                            </span>
                          </td>
                          <td>{errorType.count}</td>
                          <td>{errorType.percentage}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted">No error data available</p>
              )}
            </div>
          </div>
        </div>

        {/* Recent Errors */}
        <div className="col-xl-6 col-lg-6 col-md-12 col-sm-12 col-12 mb-4">
          <div className="card shadow-sm h-100">
            <h5 className="card-header">Recent Errors</h5>
            <div className="card-body">
              {recentErrors.length ? (
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Message</th>
                        <th>Severity</th>
                        <th>Time</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentErrors.slice(0, 5).map((error) => (
                        <tr key={error._id}>
                          <td>
                            <span className={`badge badge-${
                              error.error_type === 'network' ? 'warning' : 
                              error.error_type === 'authentication' ? 'info' : 
                              error.error_type === 'payment' ? 'danger' : 'secondary'
                            }`}>
                              {error.error_type}
                            </span>
                          </td>
                          <td className="text-truncate" style={{maxWidth: '150px'}}>
                            {error.error_message}
                          </td>
                          <td>
                            <span className={`badge badge-${
                              error.severity === 'critical' ? 'danger' : 
                              error.severity === 'high' ? 'warning' : 
                              error.severity === 'medium' ? 'info' : 'success'
                            }`}>
                              {error.severity}
                            </span>
                          </td>
                          <td>{new Date(error.created_at).toLocaleTimeString()}</td>
                          <td>
                            {!error.resolved ? (
                              <button 
                                className="btn btn-sm btn-outline-success"
                                onClick={() => resolveError(error._id)}
                              >
                                Resolve
                              </button>
                            ) : (
                              <span className="badge badge-success">Resolved</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted">No recent errors</p>
              )}
            </div>
          </div>
        </div>
      </div>

            {/* Detailed Error Logs Section */}
            <div className="row">
        <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12 mb-4">
          <div className="card shadow-sm">
            <div className="card-header d-flex justify-content-between align-items-center flex-wrap">
              <h5 className="mb-2 mb-md-0">Detailed Error Logs</h5>
              <div className="d-flex flex-wrap">
                <button 
                  className={`btn btn-outline-primary btn-sm mr-2 mb-2 mb-md-0 ${logsLoading ? 'disabled' : ''}`}
                  onClick={() => {
                    setShowDetailedLogs(!showDetailedLogs);
                    if (!showDetailedLogs && detailedLogs.length === 0) {
                      fetchDetailedLogs();
                    }
                  }}
                  disabled={logsLoading}
                >
                  {showDetailedLogs ? 'Hide Logs' : 'Show Detailed Logs'}
                </button>
                {showDetailedLogs && (
                  <button 
                    className={`btn btn-outline-secondary btn-sm mb-2 mb-md-0 ${logsLoading ? 'disabled' : ''}`}
                    onClick={() => fetchDetailedLogs()}
                    disabled={logsLoading}
                  >
                    {logsLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm mr-1" role="status" aria-hidden="true"></span>
                        Loading...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-refresh mr-1"></i>
                        Refresh Logs
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
            
            {showDetailedLogs && (
              <div className="card-body p-0">
                {logsLoading ? (
                  <div className="text-center p-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="sr-only">Loading logs...</span>
                    </div>
                    <p className="mt-2">Loading detailed error logs...</p>
                  </div>
                ) : detailedLogs.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-striped table-hover">
                      <thead className="thead-light">
                        <tr>
                          <th style={{minWidth: '80px'}}>Time</th>
                          <th style={{minWidth: '100px'}} className="d-none d-md-table-cell">User</th>
                          <th style={{minWidth: '100px'}}>Type</th>
                          <th style={{minWidth: '120px'}}>Severity</th>
                          <th style={{minWidth: '200px'}}>Error Message</th>
                          <th style={{minWidth: '100px'}} className="d-none d-lg-table-cell">Platform</th>
                          <th style={{minWidth: '120px'}} className="d-none d-lg-table-cell">Screen</th>
                          <th style={{minWidth: '100px'}} className="d-none d-sm-table-cell">Status</th>
                          <th style={{minWidth: '100px'}}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailedLogs.map((log) => (
                          <tr key={log._id} className={log.resolved ? 'table-success' : ''}>
                            <td>
                              <small>
                                {new Date(log.created_at).toLocaleString('en-IN', {
                                  year: '2-digit',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </small>
                            </td>
                            <td className="d-none d-md-table-cell">
                              <div>
                                <small className="text-muted">{log.user_type || 'N/A'}</small>
                                <br />
                                <small className="text-truncate" style={{maxWidth: '80px', display: 'block'}} title={log.user_id || 'N/A'}>
                                  {log.user_id ? log.user_id.substring(0, 8) + '...' : 'N/A'}
                                </small>
                              </div>
                            </td>
                            <td>
                              <span className={`badge badge-${
                                log.error_type === 'network' ? 'warning' : 
                                log.error_type === 'authentication' ? 'info' : 
                                log.error_type === 'payment' ? 'danger' :
                                log.error_type === 'crash' ? 'dark' : 'secondary'
                              }`}>
                                {log.error_type}
                              </span>
                            </td>
                            <td>
                              <span className={`badge badge-pill badge-${
                                log.severity === 'critical' ? 'danger' : 
                                log.severity === 'high' ? 'warning' : 
                                log.severity === 'medium' ? 'info' : 
                                log.severity === 'low' ? 'success' : 'secondary'
                              }`}>
                                {log.severity}
                              </span>
                            </td>
                            <td>
                              <div className="text-truncate" style={{maxWidth: '200px'}} title={log.error_message}>
                                <small>{log.error_message}</small>
                                <div className="d-block d-lg-none">
                                  <small className="text-muted">
                                    {log.platform || 'Web'} • {log.screen_name || 'N/A'}
                                  </small>
                                </div>
                              </div>
                            </td>
                            <td className="d-none d-lg-table-cell">
                              <span className={`badge badge-outline-${log.platform === 'ios' ? 'primary' : log.platform === 'android' ? 'success' : 'secondary'}`}>
                                {log.platform || 'Web'}
                              </span>
                            </td>
                            <td className="d-none d-lg-table-cell">
                              <small className="text-muted">{log.screen_name || 'N/A'}</small>
                            </td>
                            <td className="d-none d-sm-table-cell">
                              {log.resolved ? (
                                <span className="badge badge-success">
                                  <i className="fas fa-check mr-1"></i>
                                  <span className="d-none d-md-inline">Resolved</span>
                                </span>
                              ) : (
                                <span className="badge badge-warning">
                                  <i className="fas fa-exclamation-triangle mr-1"></i>
                                  <span className="d-none d-md-inline">Pending</span>
                                </span>
                              )}
                            </td>
                            <td>
                              {!log.resolved ? (
                                <button 
                                  className="btn btn-sm btn-outline-success"
                                  onClick={() => resolveError(log._id)}
                                  title="Mark as resolved"
                                >
                                  <i className="fas fa-check"></i>
                                  <span className="d-none d-sm-inline ml-1">Resolve</span>
                                </button>
                              ) : (
                                <span className="text-success">
                                  <i className="fas fa-check-circle"></i>
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center p-4">
                    <i className="fas fa-inbox fa-3x text-muted mb-3"></i>
                    <p className="text-muted">No error logs found</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

            {/* Refresh Button */}
            <div className="row">
        <div className="col-12 text-center">
          <button 
            className={`btn btn-primary ${loading ? 'disabled' : ''}`}
            onClick={() => {
              fetchReportsData();
              fetchRecentErrors();
              if (showDetailedLogs) {
                fetchDetailedLogs();
              }
            }}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true"></span>
                Refreshing...
              </>
            ) : (
              <>
                <i className="fas fa-sync-alt mr-2"></i>
                Refresh All Data
              </>
            )}
          </button>
          <p className="text-muted mt-2">
            <i className="fas fa-clock"></i> Auto-refreshes every 30 seconds
          </p>
        </div>
      </div>
          </div>
        </div>
      </div>
    </div>
  );
}