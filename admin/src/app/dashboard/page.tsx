'use client';

import Header from '@/components/admin/Header';
import Sidebar from '@/components/admin/Sidebar';
import Link from 'next/link';
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
        // API returns data directly, not in a nested stats object
        setStats({
          totalCustomers: data.totalCustomers || 0,
          totalAstrologers: data.totalAstrologers || 0,
          totalOrders: data.totalOrders || 0,
          totalRevenue: data.totalRevenue || 0
        });
        setRecentCustomers(data.recentCustomers || []);
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
                          <Link href="/dashboard" className="breadcrumb-link">Dashboard</Link>
                        </li>
                        <li className="breadcrumb-item active" aria-current="page">Overview</li>
                      </ol>
                    </nav>
                  </div>
                </div>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="ecommerce-widget">
              <div className="row">
                <div className="col-xl-3 col-lg-3 col-md-6 col-sm-12 col-12 mb-4">
                  <div className="card border-top-primary shadow-sm h-100">
                    <div className="card-body">
                      <h5 className="text-muted mb-4">Customers</h5>
                      <div className="d-flex justify-content-between">
                        <div className="metric-value">
                          <h1 className="font-weight-bold">
                            {loading ? '...' : (stats?.totalCustomers || 0).toLocaleString()}
                          </h1>
                        </div>
                        <div className="metric-label text-success font-weight-bold align-self-center">
                          <span className="icon-shape icon-xs rounded-circle text-success bg-success-light">
                            <i className="fa fa-fw fa-arrow-up"></i>
                          </span>
                          <span className="ml-1">12%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-xl-3 col-lg-3 col-md-6 col-sm-12 col-12 mb-4">
                  <div className="card border-top-primary shadow-sm h-100">
                    <div className="card-body">
                      <h5 className="text-muted mb-4">Astrologers</h5>
                      <div className="d-flex justify-content-between">
                        <div className="metric-value">
                          <h1 className="font-weight-bold">
                            {loading ? '...' : (stats?.totalAstrologers || 0).toLocaleString()}
                          </h1>
                        </div>
                        <div className="metric-label align-self-center text-success font-weight-bold">
                          <span className="icon-shape icon-xs rounded-circle text-success bg-success-light">
                            <i className="fa fa-fw fa-arrow-up"></i>
                          </span>
                          <span className="ml-1">8%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-xl-3 col-lg-3 col-md-6 col-sm-12 col-12 mb-4">
                  <div className="card border-top-primary shadow-sm h-100">
                    <div className="card-body">
                      <h5 className="text-muted mb-4">Sessions</h5>
                      <div className="d-flex justify-content-between">
                        <div className="metric-value">
                          <h1 className="font-weight-bold">
                            {loading ? '...' : (stats?.totalOrders || 0).toLocaleString()}
                          </h1>
                        </div>
                        <div className="metric-label align-self-center text-success font-weight-bold">
                          <span className="icon-shape icon-xs rounded-circle text-success bg-success-light">
                            <i className="fa fa-fw fa-arrow-up"></i>
                          </span>
                          <span className="ml-1">15%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-xl-3 col-lg-3 col-md-6 col-sm-12 col-12 mb-4">
                  <div className="card border-top-primary shadow-sm h-100">
                    <div className="card-body">
                      <h5 className="text-muted mb-4">Revenue</h5>
                      <div className="d-flex justify-content-between">
                        <div className="metric-value">
                          <h1 className="font-weight-bold">
                            ₹{loading ? '...' : (stats?.totalRevenue || 0).toLocaleString()}
                          </h1>
                        </div>
                        <div className="metric-label align-self-center text-danger font-weight-bold">
                          <span className="icon-shape icon-xs rounded-circle text-danger bg-danger-light">
                            <i className="fa fa-fw fa-arrow-down"></i>
                          </span>
                          <span className="ml-1">2%</span>
                        </div>
                      </div>
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
                  <div className="card-body">
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