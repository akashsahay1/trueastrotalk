'use client';

import React from 'react';

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface PaginationProps {
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
  loading?: boolean;
  className?: string;
  showInfo?: boolean;
  limit?: number;
}

export function Pagination({
  pagination,
  onPageChange,
  loading = false,
  className = '',
  showInfo = true,
  limit = 30
}: PaginationProps) {
  const { currentPage, totalPages, totalCount, hasNextPage, hasPrevPage } = pagination;

  if (totalPages <= 1) {
    return null;
  }

  const getPageNumbers = () => {
    const delta = 2; // Number of pages to show on each side of current page
    const pages: (number | string)[] = [];
    
    // Always show first page
    pages.push(1);
    
    // Calculate range around current page
    const startPage = Math.max(2, currentPage - delta);
    const endPage = Math.min(totalPages - 1, currentPage + delta);
    
    // Add ellipsis after first page if needed
    if (startPage > 2) {
      pages.push('...');
    }
    
    // Add pages around current page
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    // Add ellipsis before last page if needed
    if (endPage < totalPages - 1) {
      pages.push('...');
    }
    
    // Always show last page (if not already included)
    if (totalPages > 1) {
      pages.push(totalPages);
    }
    
    return pages;
  };

  const handlePageClick = (e: React.MouseEvent, page: number | string) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof page === 'number' && page !== currentPage && !loading) {
      onPageChange(page);
    }
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className={`d-flex flex-column justify-content-center align-items-center ${className}`}>
      <style jsx>{`
        .page-link:hover:not(.disabled) {
          background-color: #007bff !important;
          border-color: #007bff !important;
          color: #fff !important;
        }
        .page-item.disabled .page-link:hover {
          background-color: initial !important;
          border-color: initial !important;
          color: initial !important;
        }
      `}</style>
      
      <nav>
        <ul className="pagination mb-0">
          {/* First Button */}
          <li className={`page-item ${currentPage <= 1 || loading ? 'disabled' : ''}`}>
            <button
              type="button"
              className="page-link"
              onClick={(e) => handlePageClick(e, 1)}
              disabled={currentPage <= 1 || loading}
              aria-label="First"
              title="First page"
            >
              <span aria-hidden="true">&laquo;&laquo;</span>
            </button>
          </li>

          {/* Previous Button */}
          <li className={`page-item ${!hasPrevPage || loading ? 'disabled' : ''}`}>
            <button
              type="button"
              className="page-link"
              onClick={(e) => handlePageClick(e, currentPage - 1)}
              disabled={!hasPrevPage || loading}
              aria-label="Previous"
            >
              <span aria-hidden="true">&laquo;</span>
            </button>
          </li>

          {/* Page Numbers */}
          {pageNumbers.map((page, index) => (
            <li
              key={index}
              className={`page-item ${
                page === currentPage ? 'active' : ''
              } ${
                typeof page === 'string' || loading ? 'disabled' : ''
              }`}
            >
              {typeof page === 'string' ? (
                <span className="page-link">{page}</span>
              ) : (
                <button
                  type="button"
                  className="page-link"
                  onClick={(e) => handlePageClick(e, page)}
                  disabled={loading}
                >
                  {page}
                </button>
              )}
            </li>
          ))}

          {/* Next Button */}
          <li className={`page-item ${!hasNextPage || loading ? 'disabled' : ''}`}>
            <button
              type="button"
              className="page-link"
              onClick={(e) => handlePageClick(e, currentPage + 1)}
              disabled={!hasNextPage || loading}
              aria-label="Next"
            >
              <span aria-hidden="true">&raquo;</span>
            </button>
          </li>

          {/* Last Button */}
          <li className={`page-item ${currentPage >= totalPages || loading ? 'disabled' : ''}`}>
            <button
              type="button"
              className="page-link"
              onClick={(e) => handlePageClick(e, totalPages)}
              disabled={currentPage >= totalPages || loading}
              aria-label="Last"
              title="Last page"
            >
              <span aria-hidden="true">&raquo;&raquo;</span>
            </button>
          </li>
        </ul>
      </nav>

      {showInfo && (
        <div className="mt-2">
          <small className="text-muted">
            Showing {Math.min((currentPage - 1) * limit + 1, totalCount)} to{' '}
            {Math.min(currentPage * limit, totalCount)} of {totalCount} entries
          </small>
        </div>
      )}
    </div>
  );
}

// Simple pagination for basic use cases
interface SimplePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
}

export function SimplePagination({
  currentPage,
  totalPages,
  onPageChange,
  loading = false
}: SimplePaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav>
      <style jsx>{`
        .page-link:hover:not(.disabled) {
          background-color: #007bff !important;
          border-color: #007bff !important;
          color: #fff !important;
        }
        .page-item.disabled .page-link:hover {
          background-color: initial !important;
          border-color: initial !important;
          color: initial !important;
        }
      `}</style>
      <ul className="pagination justify-content-center mb-0">
        <li className={`page-item ${currentPage <= 1 || loading ? 'disabled' : ''}`}>
          <button
            type="button"
            className="page-link"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onPageChange(1); }}
            disabled={currentPage <= 1 || loading}
            title="First page"
          >
            First
          </button>
        </li>

        <li className={`page-item ${currentPage <= 1 || loading ? 'disabled' : ''}`}>
          <button
            type="button"
            className="page-link"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onPageChange(currentPage - 1); }}
            disabled={currentPage <= 1 || loading}
          >
            Previous
          </button>
        </li>
        
        <li className="page-item active">
          <span className="page-link">
            Page {currentPage} of {totalPages}
          </span>
        </li>
        
        <li className={`page-item ${currentPage >= totalPages || loading ? 'disabled' : ''}`}>
          <button
            type="button"
            className="page-link"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onPageChange(currentPage + 1); }}
            disabled={currentPage >= totalPages || loading}
          >
            Next
          </button>
        </li>

        <li className={`page-item ${currentPage >= totalPages || loading ? 'disabled' : ''}`}>
          <button
            type="button"
            className="page-link"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onPageChange(totalPages); }}
            disabled={currentPage >= totalPages || loading}
            title="Last page"
          >
            Last
          </button>
        </li>
      </ul>
    </nav>
  );
}