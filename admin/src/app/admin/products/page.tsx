'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import Image from 'next/image';
import { confirmDialogs, errorMessages } from '@/lib/sweetalert';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  featured_image?: string;
  stock_quantity: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Category {
  _id: string;
  name: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);

  useEffect(() => {
    document.body.className = '';
    fetchProducts();
  }, [pagination.page, searchTerm, selectedCategory]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(selectedCategory && { category: selectedCategory })
      });
      
      const response = await fetch(`/api/admin/products?${params}`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
        setPagination({
          total: data.pagination?.total || 0,
          page: data.pagination?.page || 1,
          limit: data.pagination?.limit || 20,
          totalPages: data.pagination?.totalPages || 0
        });
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/products/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories ? data.categories.map((cat: any) => cat.name) : []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirmDialogs.deleteItem('product');
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchProducts();
      } else {
        errorMessages.deleteFailed('product');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      errorMessages.deleteFailed('product');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) return;
    
    const confirmed = await confirmDialogs.deleteItem(`${selectedProducts.length} products`);
    if (!confirmed) return;

    setBulkLoading(true);
    try {
      const deletePromises = selectedProducts.map(id => 
        fetch(`/api/admin/products/${id}`, { method: 'DELETE' })
      );
      
      await Promise.all(deletePromises);
      setSelectedProducts([]);
      fetchProducts();
    } catch (error) {
      console.error('Error deleting products:', error);
      errorMessages.deleteFailed('products');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(products.map(p => p._id));
    } else {
      setSelectedProducts([]);
    }
  };

  const handleSelectProduct = (productId: string, checked: boolean) => {
    if (checked) {
      setSelectedProducts([...selectedProducts, productId]);
    } else {
      setSelectedProducts(selectedProducts.filter(id => id !== productId));
    }
  };

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchProducts();
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
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
                    <h2 className="pageheader-title">Products</h2>
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
                  <h2 className="pageheader-title">Products Management</h2>
                  <p className="pageheader-text">Manage all products and inventory</p>
                  <div className="page-breadcrumb">
                    <nav aria-label="breadcrumb">
                      <ol className="breadcrumb">
                        <li className="breadcrumb-item">
                          <Link href="/admin/dashboard" className="breadcrumb-link">Dashboard</Link>
                        </li>
                        <li className="breadcrumb-item">
                          <span className="breadcrumb-link">Products</span>
                        </li>
                        <li className="breadcrumb-item active" aria-current="page">All Products</li>
                      </ol>
                    </nav>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters and Actions */}
            <div className="row">
              <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12">
                <div className="card">
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">Product List ({pagination.total} Total)</h5>
                    <div>
                      <Link href="/admin/products/categories" className="btn btn-outline-secondary mr-2">
                        <i className="fas fa-tags mr-1"></i>Manage Categories
                      </Link>
                      <Link href="/admin/products/add" className="btn btn-primary">
                        <i className="fas fa-plus mr-2"></i>Add Product
                      </Link>
                    </div>
                  </div>
            
                  <div className="card-body">
                    {/* Search and Filter Form */}
                    <div className="row mb-3">
                      <div className="col-md-4">
                        <div className="form-group">
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Search by product name or description..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                          />
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="form-group">
                          <select
                            className="form-control"
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                          >
                            <option value="">All Categories</option>
                            {categories.map(category => (
                              <option key={category} value={category}>
                                {category}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="col-md-2">
                        <button 
                          type="button" 
                          className="btn btn-outline-secondary"
                          onClick={() => {
                            setSearchTerm('');
                            setSelectedCategory('');
                            setPagination(prev => ({ ...prev, page: 1 }));
                          }}
                        >
                          Clear
                        </button>
                      </div>
                      <div className="col-md-3">
                        {selectedProducts.length > 0 && (
                          <button 
                            type="button" 
                            className="btn btn-danger"
                            onClick={handleBulkDelete}
                            disabled={bulkLoading}
                          >
                            {bulkLoading ? (
                              <><i className="fas fa-spinner fa-spin mr-1"></i>Deleting...</>
                            ) : (
                              <><i className="fas fa-trash mr-1"></i>Delete Selected ({selectedProducts.length})</>
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Products Table */}
                    <div className="table-responsive">
                      <table className="table table-striped table-bordered m-0">
                  <thead>
                    <tr>
                      <th width="40">
                        <input
                          type="checkbox"
                          checked={selectedProducts.length === products.length && products.length > 0}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                        />
                      </th>
                      <th>Image</th>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="text-center">
                          {loading ? 'Loading...' : 'No products found'}
                        </td>
                      </tr>
                    ) : (
                      products.map((product) => (
                        <tr key={product._id}>
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedProducts.includes(product._id)}
                              onChange={(e) => handleSelectProduct(product._id, e.target.checked)}
                            />
                          </td>
                          <td>
                            {product.featured_image ? (
                              <img
                                src={product.featured_image}
                                alt={product.name}
                                width="50"
                                height="50"
                                className="img-thumbnail"
                                style={{ objectFit: 'cover' }}
                                onError={(e) => {
                                  console.error('Failed to load image:', product.featured_image);
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <div 
                                className="img-thumbnail d-flex align-items-center justify-content-center" 
                                style={{ 
                                  width: '50px', 
                                  height: '50px', 
                                  cursor: 'pointer',
                                  backgroundColor: '#f8f9fa',
                                  border: '1px dashed #dee2e6'
                                }}
                                onClick={() => {
                                  // TODO: Open media library modal
                                  console.log('Open media library for product:', product._id);
                                }}
                                title="Click to add image"
                              >
                                <i className="fas fa-image text-muted"></i>
                              </div>
                            )}
                          </td>
                          <td>
                            <div>
                              <strong>{product.name}</strong>
                              <br />
                              <small className="text-muted">
                                {product.description.length > 50 
                                  ? product.description.substring(0, 50) + '...'
                                  : product.description
                                }
                              </small>
                            </div>
                          </td>
                          <td>
                            <span className="badge badge-secondary">{product.category}</span>
                          </td>
                          <td>₹{product.price.toFixed(2)}</td>
                          <td>
                            <span className={`badge ${product.stock_quantity > 10 ? 'badge-success' : product.stock_quantity > 0 ? 'badge-warning' : 'badge-danger'}`}>
                              {product.stock_quantity}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${product.is_active ? 'badge-success' : 'badge-secondary'}`}>
                              {product.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td>{new Date(product.created_at).toLocaleDateString()}</td>
                          <td>
                            <Link
                              href={`/admin/products/edit/${product._id}`}
                              className="btn btn-sm btn-outline-primary mr-1"
                              title="Edit"
                            >
                              <i className="fas fa-edit"></i>
                            </Link>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDelete(product._id)}
                              title="Delete"
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
            {pagination.totalPages > 1 && (
              <div className="row mt-4">
                <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12">
                  <nav aria-label="Products pagination">
                    <ul className="pagination justify-content-center">
                      <li className={`page-item ${pagination.page === 1 ? 'disabled' : ''}`}>
                        <button 
                          className="page-link" 
                          onClick={() => handlePageChange(pagination.page - 1)}
                          disabled={pagination.page === 1 || loading}
                        >
                          Previous
                        </button>
                      </li>
                      
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        const startPage = Math.max(1, pagination.page - 2);
                        const pageNum = startPage + i;
                        if (pageNum > pagination.totalPages) return null;
                        
                        return (
                          <li key={pageNum} className={`page-item ${pagination.page === pageNum ? 'active' : ''}`}>
                            <button 
                              className="page-link" 
                              onClick={() => handlePageChange(pageNum)}
                              disabled={loading}
                            >
                              {pageNum}
                            </button>
                          </li>
                        );
                      })}
                      
                      <li className={`page-item ${pagination.page === pagination.totalPages ? 'disabled' : ''}`}>
                        <button 
                          className="page-link" 
                          onClick={() => handlePageChange(pagination.page + 1)}
                          disabled={pagination.page === pagination.totalPages || loading}
                        >
                          Next
                        </button>
                      </li>
                    </ul>
                  </nav>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}