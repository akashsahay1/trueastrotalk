'use client';

import React, { useEffect } from 'react';
import { Button } from './Button';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: ModalSize;
  children: React.ReactNode;
  className?: string;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  size = 'md',
  children,
  className = '',
  closeOnBackdrop = true,
  closeOnEscape = true,
  showCloseButton = true
}: ModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (closeOnEscape && e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, closeOnEscape, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (closeOnBackdrop && e.target === e.currentTarget) {
      onClose();
    }
  };

  const sizeClass = size !== 'md' ? `modal-${size}` : '';

  return (
    <div 
      className="modal fade show" 
      style={{ display: 'block' }}
      onClick={handleBackdropClick}
    >
      <div className={`modal-dialog ${sizeClass} ${className}`}>
        <div className="modal-content">
          {(title || showCloseButton) && (
            <div className="modal-header">
              {title && <h5 className="modal-title">{title}</h5>}
              {showCloseButton && (
                <button
                  type="button"
                  className="close"
                  onClick={onClose}
                  aria-label="Close"
                >
                  <span aria-hidden="true">&times;</span>
                </button>
              )}
            </div>
          )}
          <div className="modal-body">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

// Specialized Modal Components
interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'success';
  loading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  loading = false
}: ConfirmModalProps) {
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={title} 
      size="sm"
      closeOnBackdrop={!loading}
      closeOnEscape={!loading}
    >
      <div className="mb-4">
        <p>{message}</p>
      </div>
      <div className="d-flex justify-content-end">
        <Button
          variant="secondary"
          className="mr-2"
          onClick={onClose}
          disabled={loading}
        >
          {cancelText}
        </Button>
        <Button
          variant={variant}
          onClick={onConfirm}
          loading={loading}
        >
          {confirmText}
        </Button>
      </div>
    </Modal>
  );
}

// Filter Modal Component
interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: any) => void;
  onClear: () => void;
  title?: string;
  children: React.ReactNode;
  hasActiveFilters?: boolean;
  loading?: boolean;
}

export function FilterModal({
  isOpen,
  onClose,
  onApply,
  onClear,
  title = 'Filters',
  children,
  hasActiveFilters = false,
  loading = false
}: FilterModalProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const filters: Record<string, string> = {};
    
    formData.forEach((value, key) => {
      filters[key] = value.toString();
    });
    
    onApply(filters);
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={title}
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        {children}
        
        <div className="d-flex justify-content-between mt-4">
          <div>
            {hasActiveFilters && (
              <Button
                type="button"
                variant="outline-warning"
                onClick={onClear}
                disabled={loading}
              >
                Clear Filters
              </Button>
            )}
          </div>
          <div>
            <Button
              type="button"
              variant="secondary"
              className="mr-2"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={loading}
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

// Form Modal Component
interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => void;
  title: string;
  children: React.ReactNode;
  submitText?: string;
  cancelText?: string;
  loading?: boolean;
  size?: ModalSize;
}

export function FormModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  children,
  submitText = 'Save',
  cancelText = 'Cancel',
  loading = false,
  size = 'md'
}: FormModalProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    onSubmit(formData);
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={title}
      size={size}
      closeOnBackdrop={!loading}
      closeOnEscape={!loading}
    >
      <form onSubmit={handleSubmit}>
        {children}
        
        <div className="d-flex justify-content-end mt-4">
          <Button
            type="button"
            variant="secondary"
            className="mr-2"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
          >
            {submitText}
          </Button>
        </div>
      </form>
    </Modal>
  );
}