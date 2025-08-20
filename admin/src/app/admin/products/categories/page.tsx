'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { confirmDialogs, errorMessages } from '@/lib/sweetalert';

interface Category {
  _id: string;
  name: string;
  description?: string;
  is_active: boolean;
  product_count?: number;
  created_at: string;
  updated_at: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    document.body.className = '';
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/products/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
    setLoading(false);
  };


  const handleDelete = async (id: string) => {
    const confirmed = await confirmDialogs.deleteItem('category');
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/admin/products/categories/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchCategories();
      } else {
        const error = await response.json();
        alert(error.message || 'Error deleting category');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      errorMessages.deleteFailed('category');
    }
  };


  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
                  <div className="page-header">
                    <h2 className="pageheader-title">Product Categories</h2>
                  </div>
                  <div className="text-center">
                    <div className="spinner-border" role="status">
                      <span className="sr-only">Loading...</span>
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
                  <h2 className="pageheader-title">Product Categories</h2>
                  <p className="pageheader-text">Manage product categories and organize inventory</p>
                  <div className="page-breadcrumb">
                    <nav aria-label="breadcrumb">
                      <ol className="breadcrumb">
                        <li className="breadcrumb-item">
                          <Link href="/admin/dashboard" className="breadcrumb-link">Dashboard</Link>
                        </li>
                        <li className="breadcrumb-item">
                          <a href="/admin/products" className="breadcrumb-link">Products</a>
                        </li>
                        <li className="breadcrumb-item active" aria-current="page">Categories</li>
                      </ol>
                    </nav>
                  </div>
                </div>
              </div>
            </div>

      <div className="row">
        <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Category List ({filteredCategories.length} total)</h5>
              <div>
                <Link href="/admin/products" className="btn btn-outline-secondary mr-2">
                  <i className="fas fa-arrow-left mr-1"></i>Back to Products
                </Link>
                <Link href="/admin/products/categories/add" className="btn btn-primary">
                  <i className="fas fa-plus mr-2"></i>Add Category
                </Link>
              </div>
            </div>
            
            <div className="card-body">
              {/* Search */}
              <div className="row mb-3">
                <div className="col-md-6">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search categories..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Categories Table */}
              <div className="table-responsive">
                <table className="table table-striped table-bordered">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Description</th>
                      <th>Products</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCategories.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center">
                          {categories.length === 0 ? 'No categories found' : 'No categories match your search'}
                        </td>
                      </tr>
                    ) : (
                      filteredCategories.map((category) => (
                        <tr key={category._id}>
                          <td>
                            <strong>{category.name}</strong>
                          </td>
                          <td>
                            <span className="text-muted">
                              {category.description || 'No description'}
                            </span>
                          </td>
                          <td>
                            <span className="badge badge-info">
                              {category.product_count || 0} products
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${category.is_active ? 'badge-success' : 'badge-secondary'}`}>
                              {category.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td>{new Date(category.created_at).toLocaleDateString()}</td>
                          <td>
                            <Link
                              href={`/admin/products/categories/edit/${category._id}`}
                              className="btn btn-sm btn-outline-primary mr-1"
                              title="Edit"
                            >
                              <i className="fas fa-edit"></i>
                            </Link>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDelete(category._id)}
                              title="Delete"
                              disabled={!!(category.product_count && category.product_count > 0)}
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
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