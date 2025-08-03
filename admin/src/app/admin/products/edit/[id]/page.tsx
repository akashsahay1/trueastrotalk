'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import MediaLibrary from '@/components/MediaLibrary';
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

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  
  const [, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock_quantity: '',
    is_active: true,
    image_url: ''
  });

	  const fetchProduct = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/products/${productId}`);
      if (response.ok) {
        const data = await response.json();
        const productData = data.product;
        setProduct(productData);
        setFormData({
          name: productData.name,
          description: productData.description,
          price: productData.price.toString(),
          category: productData.category,
          stock_quantity: productData.stock_quantity.toString(),
          is_active: productData.is_active,
          image_url: productData.image_url || ''
        });
      } else {
        alert('Product not found');
        router.push('/admin/products');
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      alert('Error loading product');
      router.push('/admin/products');
    } finally {
      setLoading(false);
    }
  }, [productId, router]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/products/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, []);

  useEffect(() => {
    document.body.className = '';
    if (productId) {
      fetchProduct();
      fetchCategories();
    }
  }, [productId, fetchProduct, fetchCategories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    const productData = {
      ...formData,
      price: parseFloat(formData.price),
      stock_quantity: parseInt(formData.stock_quantity)
    };

    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      if (response.ok) {
        alert('Product updated successfully!');
        router.push('/admin/products');
      } else {
        const error = await response.json();
        alert(error.message || 'Error updating product');
      }
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Error updating product');
    } finally {
      setSaving(false);
    }
  };

  const handleImageSelect = (imageUrl: string) => {
    setFormData({ ...formData, image_url: imageUrl });
    setShowMediaLibrary(false);
  };

  const handleRemoveImage = () => {
    setFormData({ ...formData, image_url: '' });
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
                    <p className="mt-2">Loading product...</p>
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
                  <h2 className="pageheader-title">Edit Product</h2>
                  <p className="pageheader-text">Update product information</p>
                  <div className="page-breadcrumb">
                    <nav aria-label="breadcrumb">
                      <ol className="breadcrumb">
                        <li className="breadcrumb-item">
                          <a href="/admin/dashboard" className="breadcrumb-link">Dashboard</a>
                        </li>
                        <li className="breadcrumb-item">
                          <a href="/admin/products" className="breadcrumb-link">Products</a>
                        </li>
                        <li className="breadcrumb-item active" aria-current="page">Edit Product</li>
                      </ol>
                    </nav>
                  </div>
                </div>
              </div>
            </div>

            {/* Edit Product Form */}
            <div className="row">
              <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12">
                <div className="card">
                  <div className="card-header">
                    <h5 className="mb-0">Product Information</h5>
                  </div>
                  <div className="card-body">
                    <form onSubmit={handleSubmit}>
                      <div className="row">
                        <div className="col-md-6">
                          <div className="form-group">
                            <label>Product Name *</label>
                            <input
                              type="text"
                              className="form-control"
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              required
                            />
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="form-group">
                            <label>Category *</label>
                            <select
                              className="form-control"
                              value={formData.category}
                              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                              required
                            >
                              <option value="">Select Category</option>
                              {categories.map(category => (
                                <option key={category._id} value={category.name}>
                                  {category.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                      
                      <div className="form-group">
                        <label>Description</label>
                        <textarea
                          className="form-control"
                          rows={4}
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                      </div>
                      
                      <div className="row">
                        <div className="col-md-4">
                          <div className="form-group">
                            <label>Price (₹) *</label>
                            <input
                              type="number"
                              step="0.01"
                              className="form-control"
                              value={formData.price}
                              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                              required
                            />
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="form-group">
                            <label>Stock Quantity *</label>
                            <input
                              type="number"
                              className="form-control"
                              value={formData.stock_quantity}
                              onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                              required
                            />
                          </div>
                        </div>
                        <div className="col-md-4">
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
                        </div>
                      </div>
                      
                      <div className="form-group">
                        <label>Product Image</label>
                        <div className="d-flex align-items-center">
                          {formData.image_url ? (
                            <div className="mr-3">
                              <Image
                                src={formData.image_url}
                                alt="Product"
                                width={120}
                                height={120}
                                className="img-thumbnail"
                                style={{ objectFit: 'cover' }}
                              />
                              <div className="mt-2">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={handleRemoveImage}
                                >
                                  <i className="fas fa-trash"></i> Remove
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div 
                              className="border d-flex align-items-center justify-content-center mr-3"
                              style={{ width: '120px', height: '120px', backgroundColor: '#f8f9fa' }}
                            >
                              <i className="fas fa-image text-muted" style={{ fontSize: '24px' }}></i>
                            </div>
                          )}
                          <div>
                            <button
                              type="button"
                              className="btn btn-outline-primary"
                              onClick={() => setShowMediaLibrary(true)}
                            >
                              <i className="fas fa-folder-open"></i> {formData.image_url ? 'Change Image' : 'Select Image'}
                            </button>
                            <small className="form-text text-muted d-block mt-1">
                              Click to select an image from the media library or upload a new one
                            </small>
                          </div>
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="col-12">
                          <button
                            type="button"
                            className="btn btn-secondary mr-2"
                            onClick={() => router.push('/admin/products')}
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
                                <i className="fas fa-spinner fa-spin mr-1"></i>Updating Product...
                              </>
                            ) : (
                              <>
                                <i className="fas fa-save mr-1"></i>Update Product
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

      {/* Media Library */}
      <MediaLibrary
        isOpen={showMediaLibrary}
        onClose={() => setShowMediaLibrary(false)}
        onSelect={handleImageSelect}
        selectedImage={formData.image_url}
      />
    </div>
  );
}