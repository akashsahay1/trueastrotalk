import Swal from 'sweetalert2';

/**
 * SweetAlert2 utility functions for TrueAstroTalk Admin Panel
 * Provides consistent styling and behavior across the application
 */

// Custom theme colors matching the admin panel
const customTheme = {
  primaryColor: '#1877F2', // Facebook Blue (matching the app theme)
  successColor: '#28a745',
  errorColor: '#dc3545',
  warningColor: '#ffc107',
  infoColor: '#17a2b8'
};

// Inject custom styles for SweetAlert2
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    .swal2-title {
      font-size: 1.375rem !important;
    }
    .swal2-html-container {
      font-size: 0.875rem !important;
    }
    .swal2-popup {
      font-size: 0.875rem !important;
    }
  `;
  if (!document.querySelector('style[data-sweetalert-custom]')) {
    style.setAttribute('data-sweetalert-custom', 'true');
    document.head.appendChild(style);
  }
}

/**
 * Show confirmation dialog
 */
export async function showConfirmDialog(
  title: string,
  text?: string,
  confirmButtonText: string = 'Yes, delete it!',
  cancelButtonText: string = 'Cancel'
): Promise<boolean> {
  const result = await Swal.fire({
    title,
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: customTheme.errorColor,
    cancelButtonColor: customTheme.primaryColor,
    confirmButtonText,
    cancelButtonText,
    reverseButtons: true,
    focusCancel: true,
    customClass: {
      popup: 'swal-popup-custom',
      title: 'swal-title-custom',
      htmlContainer: 'swal-content-custom'
    }
  });

  return result.isConfirmed;
}

/**
 * Show success message
 */
export function showSuccessAlert(
  title: string,
  text?: string,
  timer: number = 2000
): Promise<unknown> {
  return Swal.fire({
    title,
    text,
    icon: 'success',
    confirmButtonColor: customTheme.successColor,
    timer,
    showConfirmButton: timer === 0,
    customClass: {
      popup: 'swal-popup-custom'
    }
  });
}

/**
 * Show error message
 */
export function showErrorAlert(
  title: string,
  text?: string
): Promise<unknown> {
  return Swal.fire({
    title,
    text,
    icon: 'error',
    confirmButtonColor: customTheme.errorColor,
    customClass: {
      popup: 'swal-popup-custom'
    }
  });
}

/**
 * Show info message
 */
export function showInfoAlert(
  title: string,
  text?: string
): Promise<unknown> {
  return Swal.fire({
    title,
    text,
    icon: 'info',
    confirmButtonColor: customTheme.infoColor,
    customClass: {
      popup: 'swal-popup-custom'
    }
  });
}

/**
 * Show loading alert
 */
export function showLoadingAlert(title: string = 'Processing...') {
  Swal.fire({
    title,
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    didOpen: () => {
      Swal.showLoading();
    },
    customClass: {
      popup: 'swal-popup-custom'
    }
  });
}

/**
 * Close any open SweetAlert2 dialog
 */
export function closeSweetAlert() {
  Swal.close();
}

/**
 * Specific confirmation dialogs for common actions
 */

export const confirmMessages = {
  /**
   * Generic delete confirmation
   */
  delete: (itemDescription: string = 'this item') =>
    showConfirmDialog(
      'Delete Confirmation',
      `Are you sure you want to delete ${itemDescription}? This action cannot be undone.`,
      'Yes, delete it!',
      'Cancel'
    ),
};

export const confirmDialogs = {
  /**
   * Delete confirmation for single item
   */
  deleteItem: (itemType: string = 'item') =>
    showConfirmDialog(
      'Delete Confirmation',
      `Are you sure you want to delete this ${itemType}? This action cannot be undone.`,
      'Yes, delete it!',
      'Cancel'
    ),

  /**
   * Delete confirmation for multiple items
   */
  deleteMultiple: (count: number, itemType: string = 'items') =>
    showConfirmDialog(
      'Delete Multiple Items',
      `Are you sure you want to delete ${count} selected ${itemType}? This action cannot be undone.`,
      `Yes, delete ${count} ${itemType}!`,
      'Cancel'
    ),

  /**
   * Logout confirmation
   */
  logout: () =>
    showConfirmDialog(
      'Logout Confirmation',
      'Are you sure you want to logout?',
      'Yes, logout',
      'Stay logged in'
    ),

  /**
   * Discard changes confirmation
   */
  discardChanges: () =>
    showConfirmDialog(
      'Discard Changes',
      'You have unsaved changes. Are you sure you want to discard them?',
      'Yes, discard',
      'Keep editing'
    ),

  /**
   * Status change confirmation
   */
  changeStatus: (action: string, itemType: string = 'item') =>
    showConfirmDialog(
      'Status Change',
      `Are you sure you want to ${action} this ${itemType}?`,
      `Yes, ${action}`,
      'Cancel'
    )
};

/**
 * Success messages for common actions
 */
export const successMessages = {
  deleted: (itemType: string = 'item') =>
    showSuccessAlert('Deleted!', `${itemType} has been deleted successfully.`),
  
  created: (itemType: string = 'item') =>
    showSuccessAlert('Created!', `${itemType} has been created successfully.`),

	added: (itemType: string = 'item') =>
    showSuccessAlert('Added!', `${itemType} has been added successfully.`),
  
  updated: (itemType: string = 'item') =>
    showSuccessAlert('Updated!', `${itemType} has been updated successfully.`),
  
  saved: () =>
    showSuccessAlert('Saved!', 'Changes have been saved successfully.')
};

/**
 * Error messages for common actions
 */
export const errorMessages = {
  deleteFailed: (itemType: string = 'item') =>
    showErrorAlert('Delete Failed', `Failed to delete ${itemType}. Please try again.`),
  
  createFailed: (itemType: string = 'item') =>
    showErrorAlert('Create Failed', `Failed to create ${itemType}. Please try again.`),
  
  updateFailed: (itemType: string = 'item') =>
    showErrorAlert('Update Failed', `Failed to update ${itemType}. Please try again.`),
  
  fetchError: (description: string = 'data') =>
    showErrorAlert('Fetch Error', `Failed to load ${description}. Please try again.`),
  
  validationError: (message: string) =>
    showErrorAlert('Validation Error', message),
  
  networkError: () =>
    showErrorAlert('Network Error', 'Unable to connect to server. Please check your connection.'),
  
  unauthorized: () =>
    showErrorAlert('Unauthorized', 'You are not authorized to perform this action.'),
  
  notFound: (itemType: string = 'item') =>
    showErrorAlert('Not Found', `${itemType} not found. It may have been deleted.`)
};