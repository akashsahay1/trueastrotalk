'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import Image from 'next/image';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url?: string;
  stock_quantity: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Category {
  _id: string;
  name: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    document.body.className = '';
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/admin/products');
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
    setLoading(false);
  };

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
  };


  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const response = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchProducts();
      } else {
        alert('Error deleting product');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Error deleting product');
    }
  };


  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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
                          <a href="/admin/dashboard" className="breadcrumb-link">Dashboard</a>
                        </li>
                        <li className="breadcrumb-item">
                          <a href="#" className="breadcrumb-link">Products</a>
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
                    <h5 className="mb-0">Product List ({filteredProducts.length} total)</h5>
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
                      <div className="col-md-6">
                        <div className="form-group">
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Search by product name or description..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group">
                          <select
                            className="form-control"
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                          >
                            <option value="">All Categories</option>
                            {categories.map(category => (
                              <option key={category._id} value={category.name}>
                                {category.name}
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
                          }}
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    {/* Products Table */}
                    <div className="table-responsive">
                      <table className="table table-striped table-bordered">
                  <thead>
                    <tr>
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
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center">
                          {products.length === 0 ? 'No products found' : 'No products match your filters'}
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((product) => (
                        <tr key={product._id}>
                          <td>
                            <Image
                              src={product.image_url || '/uploads/2025/08/product-pic.jpg'}
                              alt={product.name}
                              width={50}
                              height={50}
                              className="img-thumbnail"
                              style={{ objectFit: 'cover' }}
                            />
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

          </div>
        </div>
      </div>
    </div>
  );
}