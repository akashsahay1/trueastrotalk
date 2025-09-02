'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OrdersPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to complete orders by default
    router.replace('/admin/orders/complete');
  }, [router]);

  return (
    <div className="dashboard-main-wrapper">
      <div className="dashboard-wrapper">
        <div className="container-fluid dashboard-content">
          <div className="row">
            <div className="col-xl-12">
              <div className="page-header">
                <h2 className="pageheader-title">Orders Management</h2>
                <p className="pageheader-text">Redirecting to complete orders...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}