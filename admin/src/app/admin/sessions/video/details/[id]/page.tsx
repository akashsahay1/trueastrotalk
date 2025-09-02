'use client';

import Header from '@/components/admin/Header';
import Sidebar from '@/components/admin/Sidebar';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface VideoSessionDetail {
  _id: string;
  session_id: string;
  customer_name: string;
  astrologer_name: string;
  customer_phone: string;
  astrologer_phone: string;
  status: 'pending' | 'ongoing' | 'completed' | 'cancelled' | 'failed';
  start_time: string;
  end_time?: string;
  duration?: number;
  video_rate: number;
  total_amount: number;
  customer_rating?: number;
  created_at: string;
  customer_id: string;
  astrologer_id: string;
}

export default function VideoSessionDetailPage() {
  const params = useParams();
  const [session, setSession] = useState<VideoSessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    document.body.className = '';
    if (params?.id) {
      fetchSessionDetail(params?.id as string);
    }
  }, [params?.id]);

  useEffect(() => {
    if (session) {
      document.title = `Video Session ${session.session_id} | True Astrotalk`;
    } else {
      document.title = 'Video Session Details | True Astrotalk';
    }
  }, [session]);

  const fetchSessionDetail = async (sessionId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/sessions/${sessionId}`);
      const data = await response.json();

      if (response.ok) {
        setSession(data.session);
      } else {
        setError(data.error || 'Failed to fetch session details');
      }
    } catch (error) {
      console.error('Error fetching session:', error);
      setError('Failed to fetch session details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return 'badge-info';
      case 'ongoing':
        return 'badge-danger';
      case 'completed':
        return 'badge-success';
      case 'cancelled':
        return 'badge-warning';
      case 'failed':
        return 'badge-secondary';
      default:
        return 'badge-secondary';
    }
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (loading) {
    return (
      <div className="dashboard-main-wrapper">
        <Header />
        <Sidebar />
        <div className="dashboard-wrapper">
          <div className="dashboard-ecommerce">
            <div className="container-fluid dashboard-content">
              <div className="text-center">
                <i className="fas fa-spinner fa-spin fa-2x"></i>
                <p>Loading session details...</p>
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
        <div className="dashboard-wrapper">
          <div className="dashboard-ecommerce">
            <div className="container-fluid dashboard-content">
              <div className="alert alert-danger">
                <h4>Error</h4>
                <p>{error}</p>
                <Link href="/admin/sessions/video" className="btn btn-primary">
                  Back to Video Sessions
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="dashboard-main-wrapper">
        <Header />
        <Sidebar />
        <div className="dashboard-wrapper">
          <div className="dashboard-ecommerce">
            <div className="container-fluid dashboard-content">
              <div className="alert alert-warning">
                <h4>Session Not Found</h4>
                <p>The requested video session could not be found.</p>
                <Link href="/admin/sessions/video" className="btn btn-primary">
                  Back to Video Sessions
                </Link>
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
      
      <div className="dashboard-wrapper">
        <div className="dashboard-ecommerce">
          <div className="container-fluid dashboard-content">
            {/* Page Header */}
            <div className="row">
              <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12">
                <div className="page-header">
                  <h2 className="pageheader-title">Video Session Details</h2>
                  <p className="pageheader-text">Detailed information about video session {session.session_id}</p>
                  <div className="page-breadcrumb">
                    <nav aria-label="breadcrumb">
                      <ol className="breadcrumb">
                        <li className="breadcrumb-item">
                          <Link href="/admin/dashboard" className="breadcrumb-link">Dashboard</Link>
                        </li>
                        <li className="breadcrumb-item">
                          <span className="breadcrumb-link">Sessions</span>
                        </li>
                        <li className="breadcrumb-item">
                          <Link href="/admin/sessions/video" className="breadcrumb-link">Video Sessions</Link>
                        </li>
                        <li className="breadcrumb-item active" aria-current="page">Session Details</li>
                      </ol>
                    </nav>
                  </div>
                </div>
              </div>
            </div>

            {/* Session Details */}
            <div className="row mb-4">
              <div className="col-xl-8 col-lg-8 col-md-12 col-sm-12 col-12">
                <div className="card">
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">Session Information</h5>
                    <span className={`badge ${getStatusBadge(session.status)} badge-lg`}>
                      {session.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-6">
                        <h6 className="text-muted">Session Details</h6>
                        <table className="table table-borderless">
                          <tbody>
                            <tr>
                              <td><strong>Session ID:</strong></td>
                              <td><code className="text-primary">{session.session_id}</code></td>
                            </tr>
                            <tr>
                              <td><strong>Type:</strong></td>
                              <td>Video Session</td>
                            </tr>
                            <tr>
                              <td><strong>Status:</strong></td>
                              <td>
                                <span className={`badge ${getStatusBadge(session.status)}`}>
                                  {session.status}
                                </span>
                              </td>
                            </tr>
                            <tr>
                              <td><strong>Start Time:</strong></td>
                              <td>{new Date(session.start_time).toLocaleString()}</td>
                            </tr>
                            {session.end_time && (
                              <tr>
                                <td><strong>End Time:</strong></td>
                                <td>{new Date(session.end_time).toLocaleString()}</td>
                              </tr>
                            )}
                            <tr>
                              <td><strong>Duration:</strong></td>
                              <td>{formatDuration(session.duration)}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <div className="col-md-6">
                        <h6 className="text-muted">Financial Details</h6>
                        <table className="table table-borderless">
                          <tbody>
                            <tr>
                              <td><strong>Rate per Minute:</strong></td>
                              <td>₹{session.video_rate || 'N/A'}</td>
                            </tr>
                            <tr>
                              <td><strong>Total Amount:</strong></td>
                              <td><strong className="text-success">₹{session.total_amount}</strong></td>
                            </tr>
                            {session.customer_rating && (
                              <tr>
                                <td><strong>Customer Rating:</strong></td>
                                <td>
                                  <div>
                                    {Array.from({ length: 5 }, (_, i) => (
                                      <i 
                                        key={i} 
                                        className={`fa${i < session.customer_rating! ? 's' : 'r'} fa-star text-warning`}
                                      ></i>
                                    ))}
                                    <span className="ml-2">({session.customer_rating}/5)</span>
                                  </div>
                                </td>
                              </tr>
                            )}
                            <tr>
                              <td><strong>Created:</strong></td>
                              <td>{new Date(session.created_at).toLocaleString()}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-xl-4 col-lg-4 col-md-12 col-sm-12 col-12">
                <div className="card mb-4">
                  <div className="card-header">
                    <h5 className="mb-0">Participants</h5>
                  </div>
                  <div className="card-body">
                    <div className="mb-4">
                      <h6 className="text-muted">Customer</h6>
                      <div className="d-flex align-items-center mb-2">
                        <div className="avatar-xs rounded-circle bg-primary text-white d-flex align-items-center justify-content-center mr-2">
                          {session.customer_name.charAt(0)}
                        </div>
                        <div>
                          <strong>{session.customer_name}</strong>
                          <br />
                          <small className="text-muted">{session.customer_phone}</small>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h6 className="text-muted">Astrologer</h6>
                      <div className="d-flex align-items-center">
                        <div className="avatar-xs rounded-circle bg-success text-white d-flex align-items-center justify-content-center mr-2">
                          {session.astrologer_name.charAt(0)}
                        </div>
                        <div>
                          <strong>{session.astrologer_name}</strong>
                          <br />
                          <small className="text-muted">{session.astrologer_phone}</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {session.status === 'ongoing' && (
                  <div className="card">
                    <div className="card-header">
                      <h5 className="mb-0">Quick Actions</h5>
                    </div>
                    <div className="card-body">
                      <button className="btn btn-warning btn-block mb-2">
                        <i className="fas fa-headset mr-1"></i>
                        Monitor Session
                      </button>
                      <button className="btn btn-danger btn-block">
                        <i className="fas fa-phone-slash mr-1"></i>
                        End Session
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="row">
              <div className="col-12">
                <div className="text-left">
                  <Link href="/admin/sessions/video" className="btn btn-secondary">
                    <i className="fas fa-arrow-left mr-1"></i>
                    Back to Video Sessions
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}