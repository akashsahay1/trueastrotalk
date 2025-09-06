import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

interface LoadingSpinnerProps {
  title?: string;
  message?: string;
  fullPage?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  title = 'Loading', 
  message,
  fullPage = true 
}) => {
  const spinnerContent = (
    <div className="text-center">
      <div className="spinner-border" role="status">
        <span className="sr-only">Loading...</span>
      </div>
      {message && <p className="mt-3">{message}</p>}
    </div>
  );

  if (!fullPage) {
    return spinnerContent;
  }

  return (
    <div className="dashboard-main-wrapper">
      <Header />
      <Sidebar />
      <div className="dashboard-wrapper">
        <div className="dashboard-ecommerce">
          <div className="container-fluid dashboard-content">
            <div className="row">
              <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12">
                <div className="page-header">
                  <h2 className="pageheader-title">{title}</h2>
                </div>
                {spinnerContent}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;