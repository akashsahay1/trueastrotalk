'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';

interface Category {
  _id: string;
  name: string;
  description?: string;
  is_active: boolean;
  product_count?: number;
  created_at: string;
  updated_at: string;
}

export default function EditCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const categoryId = params.id as string;
  
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true
  });

  const fetchCategory = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/products/categories/${categoryId}`);
      if (response.ok) {
        const data = await response.json();
        const categoryData = data.category;
        setCategory(categoryData);
        setFormData({
          name: categoryData.name,
          description: categoryData.description || '',
          is_active: categoryData.is_active
        });
      } else {
        alert('Category not found');
        router.push('/admin/products/categories');
      }
    } catch (error) {
      console.error('Error fetching category:', error);
      alert('Error loading category');
      router.push('/admin/products/categories');
    } finally {
      setLoading(false);
    }
  }, [categoryId, router]);

  useEffect(() => {
    document.body.className = '';
    if (categoryId) {
      fetchCategory();
    }
  }, [categoryId, fetchCategory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const response = await fetch(`/api/admin/products/categories/${categoryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert('Category updated successfully!');
        router.push('/admin/products/categories');
      } else {
        const error = await response.json();
        alert(error.message || 'Error updating category');
      }
    } catch (error) {
      console.error('Error updating category:', error);
      alert('Error updating category');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-main-wrapper">
        <Header />
        <Sidebar />
        <div className="dashboard-wrapper">
          <div className="dashboard-ecommerce">
            <div className="container-fluid dashboard-content">
              <div className="row">
                <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12">
                  <div className="text-center">
                    <div className="spinner-border" role="status">
                      <span className="sr-only">Loading...</span>
                    </div>
                    <p className="mt-2">Loading category...</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
                  <h2 className="pageheader-title">Edit Category</h2>
                  <p className="pageheader-text">Update category information</p>
                  <div className="page-breadcrumb">
                    <nav aria-label="breadcrumb">
                      <ol className="breadcrumb">
                        <li className="breadcrumb-item">
                          <a href="/admin/dashboard" className="breadcrumb-link">Dashboard</a>
                        </li>
                        <li className="breadcrumb-item">
                          <a href="/admin/products" className="breadcrumb-link">Products</a>
                        </li>
                        <li className="breadcrumb-item">
                          <a href="/admin/products/categories" className="breadcrumb-link">Categories</a>
                        </li>
                        <li className="breadcrumb-item active" aria-current="page">Edit Category</li>
                      </ol>
                    </nav>
                  </div>
                </div>
              </div>
            </div>

            {/* Edit Category Form */}
            <div className="row">
              <div className="col-xl-8 col-lg-8 col-md-12 col-sm-12 col-12">
                <div className="card">
                  <div className="card-header">
                    <h5 className="mb-0">Category Information</h5>
                  </div>
                  <div className="card-body">
                    <form onSubmit={handleSubmit}>
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

                      {category && category.product_count && category.product_count > 0 && (
                        <div className="alert alert-info">
                          <i className="fas fa-info-circle mr-2"></i>
                          This category is currently used by {category.product_count} product(s).
                        </div>
                      )}

                      <div className="form-row">
                        <div className="col-12">
                          <button
                            type="button"
                            className="btn btn-secondary mr-2"
                            onClick={() => router.push('/admin/products/categories')}
                            disabled={saving}
                          >
                            <i className="fas fa-arrow-left mr-1"></i>Cancel
                          </button>
                          <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={saving}
                          >
                            {saving ? (
                              <>
                                <i className="fas fa-spinner fa-spin mr-1"></i>Updating Category...
                              </>
                            ) : (
                              <>
                                <i className="fas fa-save mr-1"></i>Update Category
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </form>
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