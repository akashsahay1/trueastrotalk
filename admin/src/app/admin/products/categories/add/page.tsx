'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';import Header from '@/components/admin/Header';
import Sidebar from '@/components/admin/Sidebar';
import { validateForm, getCategoryFormRules, displayFieldErrors, clearValidationErrors } from '@/lib/client-validation';
import { successMessages, errorMessages, showLoadingAlert, closeSweetAlert } from '@/lib/sweetalert';

export default function AddCategoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true
  });

  const validateCategoryForm = () => {
    clearValidationErrors();
    
    const formDataForValidation = {
      name: formData.name,
      description: formData.description
    };

    const rules = getCategoryFormRules();
    const validation = validateForm(formDataForValidation, rules);
    
    if (Object.keys(validation.errors).length > 0) {
      const fieldErrors = displayFieldErrors(validation.errors);
      setFieldErrors(fieldErrors);
      
      const firstError = Object.values(fieldErrors)[0];
      errorMessages.createFailed(`Validation Error: ${firstError}`);
      
      return false;
    }

    setFieldErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateCategoryForm()) {
      return;
    }

    showLoadingAlert('Creating category...');
    setLoading(true);
    
    try {
      const response = await fetch('/api/admin/products/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        closeSweetAlert();
        await successMessages.created('Category');
        router.push('/admin/products/categories');
      } else {
        const error = await response.json();
        closeSweetAlert();
        errorMessages.createFailed(`category: ${error.message || 'Unknown error occurred'}`);
      }
    } catch (error) {
      closeSweetAlert();
      errorMessages.networkError();
      console.error('Error saving category:', error);
    } finally {
      setLoading(false);
    }
  };

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
                  <h2 className="pageheader-title">Add New Category</h2>
                  <p className="pageheader-text">Create a new product category</p>
                  <div className="page-breadcrumb">
                    <nav aria-label="breadcrumb">
                      <ol className="breadcrumb">
                        <li className="breadcrumb-item">
                          <Link href="/admin/dashboard" className="breadcrumb-link">Dashboard</Link>
                        </li>
                        <li className="breadcrumb-item">
                          <a href="/admin/products" className="breadcrumb-link">Products</a>
                        </li>
                        <li className="breadcrumb-item">
                          <a href="/admin/products/categories" className="breadcrumb-link">Categories</a>
                        </li>
                        <li className="breadcrumb-item active" aria-current="page">Add Category</li>
                      </ol>
                    </nav>
                  </div>
                </div>
              </div>
            </div>

            {/* Add Category Form */}
            <div className="row">
              <div className="col-xl-8 col-lg-8 col-md-12 col-sm-12 col-12">
                <div className="card">
                  <div className="card-header">
                    <h5 className="mb-0">Category Information</h5>
                  </div>
                  <div className="card-body">
                    <form onSubmit={handleSubmit} id="categoryForm">
                      <div className="form-group">
                        <label>Category Name *</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                          placeholder="Enter category name"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label>Description</label>
                        <textarea
                          className="form-control"
                          rows={4}
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          placeholder="Enter category description (optional)"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label>Status</label>
                        <select
                          className="form-control"
                          value={formData.is_active.toString()}
                          onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'true' })}
                        >
                          <option value="true">Active</option>
                          <option value="false">Inactive</option>
                        </select>
                      </div>
                    </form>
                  </div>
                </div>
                
                <div className="mt-3">
                  <button
                    type="submit"
                    form="categoryForm"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-1"></i>Adding Category...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save mr-1"></i>Add Category
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}