'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Header from '@/components/admin/Header';
import Sidebar from '@/components/admin/Sidebar';
import { confirmDialogs, errorMessages } from '@/lib/sweetalert';
import { Pagination } from '@/components/admin/ui/Pagination';

interface Category {
  _id: string;
  name: string;
  description?: string;
  is_active: boolean;
  product_count?: number;
  created_at: string;
  updated_at: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [modalAnimating, setModalAnimating] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(searchTerm && { search: searchTerm })
      });
      
      const response = await fetch(`/api/admin/products/categories?${params}`);
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
        setPagination({
          total: data.pagination?.total || data.categories?.length || 0,
          page: data.pagination?.page || 1,
          limit: data.pagination?.limit || 20,
          totalPages: data.pagination?.totalPages || Math.ceil((data.categories?.length || 0) / 20)
        });
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, searchTerm]);

  useEffect(() => {
    document.body.className = '';
    fetchCategories();
  }, [pagination.page, searchTerm, fetchCategories]);

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

  const handleBulkDelete = async () => {
    if (selectedCategories.length === 0) return;
    
    const confirmed = await confirmDialogs.deleteItem(`${selectedCategories.length} categories`);
    if (!confirmed) return;

    setBulkLoading(true);
    try {
      const deletePromises = selectedCategories.map(id => 
        fetch(`/api/admin/products/categories/${id}`, { method: 'DELETE' })
      );
      
      await Promise.all(deletePromises);
      setSelectedCategories([]);
      fetchCategories();
    } catch (error) {
      console.error('Error deleting categories:', error);
      errorMessages.deleteFailed('categories');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCategories(categories.map(c => c._id));
    } else {
      setSelectedCategories([]);
    }
  };

  const handleSelectCategory = (categoryId: string, checked: boolean) => {
    if (checked) {
      setSelectedCategories([...selectedCategories, categoryId]);
    } else {
      setSelectedCategories(selectedCategories.filter(id => id !== categoryId));
    }
  };

  // const handleSearch = () => {
  //   setPagination(prev => ({ ...prev, page: 1 }));
  //   fetchCategories();
  // };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  // const openModal = () => {
  //   setShowFilterModal(true);
  //   setTimeout(() => setModalAnimating(true), 10);
  // };

  const closeModal = () => {
    setModalAnimating(false);
    setTimeout(() => setShowFilterModal(false), 300);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setPagination(prev => ({ ...prev, page: 1 }));
    closeModal();
  };

  const applyFilters = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    closeModal();
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
                          <Link href="/dashboard" className="breadcrumb-link">Dashboard</Link>
                        </li>
                        <li className="breadcrumb-item">
                          <Link href="/products" className="breadcrumb-link">Products</Link>
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
          <div className="card mb-4">
            <div className="card-body">
              <div className='d-flex justify-content-end align-items-center mb-3'>
                {selectedCategories.length > 0 && (
                  <button 
                    className="btn btn-danger mr-2"
                    onClick={handleBulkDelete}
                    disabled={bulkLoading}
                  >
                    {bulkLoading ? (
                      <><i className="fas fa-spinner fa-spin mr-1"></i>Deleting...</>
                    ) : (
                      <><i className="fas fa-trash mr-1"></i>Delete Selected ({selectedCategories.length})</>
                    )}
                  </button>
                )}
                <button 
                  className="btn btn-outline-secondary mr-2"
                  onClick={() => setShowFilterModal(true)}
                >
                  <i className="fas fa-filter mr-1"></i>
                  Filters {searchTerm && <span className="badge badge-primary ml-1">•</span>}
                </button>
                <Link href="/products/categories/add" className="btn btn-primary">Add New</Link>
              </div>

              {/* Categories Table */}
              <div className="table-responsive">
                <table className="table table-striped m-0">
                  <thead>
                    <tr>
                      <th style={{width: "40px"}}>
                        <input
                          type="checkbox"
                          checked={selectedCategories.length === categories.length && categories.length > 0}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                        />
                      </th>
                      <th>Name</th>
                      <th>Description</th>
                      <th>Products</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center">
                          {loading ? 'Loading...' : 'No categories found'}
                        </td>
                      </tr>
                    ) : (
                      categories.map((category) => (
                        <tr key={category._id}>
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedCategories.includes(category._id)}
                              onChange={(e) => handleSelectCategory(category._id, e.target.checked)}
                            />
                          </td>
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
                              href={`/products/categories/edit/${category._id}`}
                              className="btn btn-sm btn-warning mr-1"
                              title="Edit"
                            >
                              <i className="fas fa-edit"></i>
                            </Link>
                            <button
                              className="btn btn-sm btn-danger"
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

            {/* Pagination */}
            <div className="row">
              <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12">
                <Pagination
                  pagination={{
                    currentPage: pagination.page,
                    totalPages: pagination.totalPages,
                    totalCount: pagination.total,
                    hasNextPage: pagination.page < pagination.totalPages,
                    hasPrevPage: pagination.page > 1
                  }}
                  onPageChange={handlePageChange}
                  loading={loading}
                  className="mt-3"
                  limit={limit}
                />
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Filter Modal */}
      {showFilterModal && (
        <div className={`modal fade ${modalAnimating ? 'show' : ''}`} style={{display: 'block'}} tabIndex={-1} role="dialog">
          <div className="modal-dialog modal-dialog-centered modal-md" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Filter Categories</h5>
                <button 
                  type="button" 
                  className="close" 
                  onClick={closeModal}
                >
                  <span>&times;</span>
                </button>
              </div>
              <div className="modal-body">
                {/* Search Field */}
                <div className="form-group">
                  <label>Search</label>
                  <input 
                    type="text" 
                    className="form-control form-control-sm" 
                    placeholder="Search by category name or description"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary btn-sm" 
                  onClick={clearFilters}
                >
                  Clear All
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary btn-sm" 
                  onClick={applyFilters}
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Backdrop */}
      {showFilterModal && (
        <div 
          className={`modal-backdrop fade ${modalAnimating ? 'show' : ''}`}
          onClick={closeModal}
        ></div>
      )}
    </div>
  );
}