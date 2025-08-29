'use client';

import React, { useEffect } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

interface AdminLayoutProps {
  children: React.ReactNode;
  pageTitle: string;
  pageDescription?: string;
  breadcrumbs?: Array<{
    label: string;
    href?: string;
    active?: boolean;
  }>;
}

export default function AdminLayout({ 
  children, 
  pageTitle, 
  pageDescription,
  breadcrumbs = []
}: AdminLayoutProps) {
  useEffect(() => {
    // Reset body class for all admin pages
    document.body.className = '';
  }, []);

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
                  <h2 className="pageheader-title">{pageTitle}</h2>
                  {pageDescription && (
                    <p className="pageheader-text">{pageDescription}</p>
                  )}
                  {breadcrumbs.length > 0 && (
                    <div className="page-breadcrumb">
                      <nav aria-label="breadcrumb">
                        <ol className="breadcrumb">
                          {breadcrumbs.map((crumb, index) => (
                            <li 
                              key={index}
                              className={`breadcrumb-item ${crumb.active ? 'active' : ''}`}
                              {...(crumb.active && { 'aria-current': 'page' })}
                            >
                              {crumb.href && !crumb.active ? (
                                <a href={crumb.href} className="breadcrumb-link">
                                  {crumb.label}
                                </a>
                              ) : (
                                <span className={crumb.active ? '' : 'breadcrumb-link'}>
                                  {crumb.label}
                                </span>
                              )}
                            </li>
                          ))}
                        </ol>
                      </nav>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Page Content */}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}