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
}

export function Pagination({
  pagination,
  onPageChange,
  loading = false,
  className = '',
  showInfo = true
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

  const handlePageClick = (page: number | string) => {
    if (typeof page === 'number' && page !== currentPage && !loading) {
      onPageChange(page);
    }
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className={`d-flex flex-column flex-md-row justify-content-between align-items-center ${className}`}>
      {showInfo && (
        <div className="mb-2 mb-md-0">
          <small className="text-muted">
            Showing {Math.min((currentPage - 1) * 30 + 1, totalCount)} to{' '}
            {Math.min(currentPage * 30, totalCount)} of {totalCount} entries
          </small>
        </div>
      )}
      
      <nav>
        <ul className="pagination mb-0">
          {/* Previous Button */}
          <li className={`page-item ${!hasPrevPage || loading ? 'disabled' : ''}`}>
            <button
              className="page-link"
              onClick={() => handlePageClick(currentPage - 1)}
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
                  className="page-link"
                  onClick={() => handlePageClick(page)}
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
              className="page-link"
              onClick={() => handlePageClick(currentPage + 1)}
              disabled={!hasNextPage || loading}
              aria-label="Next"
            >
              <span aria-hidden="true">&raquo;</span>
            </button>
          </li>
        </ul>
      </nav>
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
      <ul className="pagination justify-content-center mb-0">
        <li className={`page-item ${currentPage <= 1 || loading ? 'disabled' : ''}`}>
          <button
            className="page-link"
            onClick={() => onPageChange(currentPage - 1)}
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
            className="page-link"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages || loading}
          >
            Next
          </button>
        </li>
      </ul>
    </nav>
  );
}