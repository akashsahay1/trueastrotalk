'use client';

import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { useEffect, useState } from 'react';

interface DashboardStats {
  totalCustomers: number;
  totalAstrologers: number;
  totalOrders: number;
  totalRevenue: number;
}

interface RecentCustomer {
  _id: string;
  full_name: string;
  email_address: string;
  phone_number: string;
  account_status: string;
  created_at: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalCustomers: 0,
    totalAstrologers: 0,
    totalOrders: 0,
    totalRevenue: 0
  });
  const [recentCustomers, setRecentCustomers] = useState<RecentCustomer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Remove the bg-light class for dashboard
    document.body.className = '';
    
    // Fetch dashboard data
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard/stats');
      const data = await response.json();
      
      if (response.ok) {
        setStats(data.stats);
        setRecentCustomers(data.recentCustomers);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-main-wrapper">
      <Header />
      <Sidebar />
      
      {/* Dashboard Content */}
      <div className="dashboard-wrapper">
        <div className="dashboard-ecommerce">
          <div className="container-fluid dashboard-content">
            {/* Page Header */}
            <div className="row">
              <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12">
                <div className="page-header">
                  <h2 className="pageheader-title">Dashboard</h2>
                  <p className="pageheader-text">Welcome to the panel!</p>
                  <div className="page-breadcrumb">
                    <nav aria-label="breadcrumb">
                      <ol className="breadcrumb">
                        <li className="breadcrumb-item">
                          <a href="/admin/dashboard" className="breadcrumb-link">Dashboard</a>
                        </li>
                        <li className="breadcrumb-item active" aria-current="page">Overview</li>
                      </ol>
                    </nav>
                  </div>
                </div>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="row">
              <div className="col-xl-3 col-lg-6 col-md-6 col-sm-12 col-12 mb-4">
                <div className="card border-3 border-top border-top-primary">
                  <div className="card-body">
                    <h5 className="text-muted">Customers</h5>
                    <div className="metric-value d-inline-block">
                      <h1 className="mb-1">{loading ? '...' : stats.totalCustomers.toLocaleString()}</h1>
                    </div>
                    <div className="metric-label d-inline-block float-right text-success font-weight-bold">
                      <span className="text-color-light">Total registered</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-xl-3 col-lg-6 col-md-6 col-sm-12 col-12 mb-4">
                <div className="card border-3 border-top border-top-primary">
                  <div className="card-body">
                    <h5 className="text-muted">Astrologers</h5>
                    <div className="metric-value d-inline-block">
                      <h1 className="mb-1">{loading ? '...' : stats.totalAstrologers.toLocaleString()}</h1>
                    </div>
                    <div className="metric-label d-inline-block float-right text-success font-weight-bold">
                      <span className="text-color-light">Active consultants</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-xl-3 col-lg-6 col-md-6 col-sm-12 col-12 mb-4">
                <div className="card border-3 border-top border-top-primary">
                  <div className="card-body">
                    <h5 className="text-muted">Orders</h5>
                    <div className="metric-value d-inline-block">
                      <h1 className="mb-1">{loading ? '...' : stats.totalOrders.toLocaleString()}</h1>
                    </div>
                    <div className="metric-label d-inline-block float-right text-success font-weight-bold">
                      <span className="text-color-light">Total consultations</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-xl-3 col-lg-6 col-md-6 col-sm-12 col-12 mb-4">
                <div className="card border-3 border-top border-top-primary">
                  <div className="card-body">
                    <h5 className="text-muted">Revenue</h5>
                    <div className="metric-value d-inline-block">
                      <h1 className="mb-1">₹{loading ? '...' : stats.totalRevenue.toLocaleString()}</h1>
                    </div>
                    <div className="metric-label d-inline-block float-right text-success font-weight-bold">
                      <span className="text-color-light">Total earned</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Customers */}
            <div className="row">
              <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12">
                <div className="card">
                  <h5 className="card-header">Recent Customers</h5>
                  <div className="card-body p-0">
                    <div className="table-responsive">
                      <table className="table">
                        <thead className="bg-light">
                          <tr className="border-0">
                            <th className="border-0">#</th>
                            <th className="border-0">Name</th>
                            <th className="border-0">Email</th>
                            <th className="border-0">Phone</th>
                            <th className="border-0">Status</th>
                            <th className="border-0">Joined</th>
                          </tr>
                        </thead>
                        <tbody>
                          {loading ? (
                            <tr>
                              <td colSpan={6} className="text-center">Loading...</td>
                            </tr>
                          ) : recentCustomers.length > 0 ? (
                            recentCustomers.map((customer, index) => (
                              <tr key={customer._id}>
                                <td>{index + 1}</td>
                                <td>{customer.full_name}</td>
                                <td>{customer.email_address}</td>
                                <td>{customer.phone_number}</td>
                                <td>
                                  <span className={`badge ${
                                    customer.account_status === 'active' ? 'badge-success' : 
                                    customer.account_status === 'inactive' ? 'badge-warning' : 
                                    'badge-danger'
                                  }`}>
                                    {customer.account_status}
                                  </span>
                                </td>
                                <td>{new Date(customer.created_at).toLocaleDateString()}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={6} className="text-center">No customers found</td>
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