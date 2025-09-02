'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/admin/Header';
import Sidebar from '@/components/admin/Sidebar';

export default function PendingOrdersPage() {
  return (
    <div className="dashboard-main-wrapper">
      <Header />
      <Sidebar />
      <div className="dashboard-wrapper">
        <div className="container-fluid dashboard-content">
          {/* Page Header - Fixed alignment */}
          <div className="row">
            <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12">
              <div className="page-header">
                <h2 className="pageheader-title">Pending Orders</h2>
                <p className="pageheader-text">Manage pending and failed payment orders</p>
              </div>
            </div>
          </div>

          {/* Orders Statistics - Fixed alignment */}
          <div className="row">
            <div className="col-xl-3 col-lg-6 col-md-6 col-sm-12 col-12">
              <div className="card border-top-primary shadow-sm h-100">
                <div className="card-body">
                  <h5 className="text-muted">Total Pending Orders</h5>
                  <div className="d-flex justify-content-between">
                    <div className="metric-value">
                      <h1 className="font-weight-bold text-primary">0</h1>
                    </div>
                    <div className="metric-label align-self-center text-primary">
                      <i className="fas fa-clock fa-2x"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Add other stat cards here */}
          </div>

          {/* Content placeholder */}
          <div className="row">
            <div className="col-12">
              <div className="card">
                <div className="card-body">
                  <p>Pending orders content will be implemented here...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}