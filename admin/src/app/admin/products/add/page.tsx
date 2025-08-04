'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import MediaLibrary from '@/components/MediaLibrary';
import Image from 'next/image';
import { validateForm, getProductFormRules, displayFieldErrors, clearValidationErrors } from '@/lib/validation';
import { successMessages, errorMessages, showLoadingAlert, closeSweetAlert } from '@/lib/sweetalert';

interface Category {
  _id: string;
  name: string;
}

export default function AddProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock_quantity: '',
    is_active: true,
    image_url: ''
  });

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
  };

  const validateProductForm = () => {
    clearValidationErrors();
    
    const formDataForValidation = {
      name: formData.name,
      description: formData.description,
      price: formData.price,
      category: formData.category,
      stock_quantity: formData.stock_quantity
    };

    const rules = getProductFormRules();
    const validation = validateForm(formDataForValidation, rules);
    
    const customErrors: {[key: string]: string} = {};

    if (!formData.category.trim()) {
      customErrors.category = 'Please select a category';
    }

    const allErrors = { ...validation.errors, ...customErrors };
    
    if (Object.keys(allErrors).length > 0) {
      displayFieldErrors(allErrors);
      setFieldErrors(allErrors);
      
      const firstError = Object.values(allErrors)[0];
      errorMessages.createFailed(`Validation Error: ${firstError}`);
      
      return false;
    }

    setFieldErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateProductForm()) {
      return;
    }

    showLoadingAlert('Creating product...');
    setLoading(true);
    
    const productData = {
      ...formData,
      price: parseFloat(formData.price),
      stock_quantity: parseInt(formData.stock_quantity)
    };

    try {
      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      if (response.ok) {
        closeSweetAlert();
        await successMessages.created('Product');
        router.push('/admin/products');
      } else {
        const error = await response.json();
        closeSweetAlert();
        errorMessages.createFailed(`product: ${error.message || 'Unknown error occurred'}`);
      }
    } catch (error) {
      closeSweetAlert();
      errorMessages.networkError();
      console.error('Error saving product:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (imageUrl: string) => {
    setFormData({ ...formData, image_url: imageUrl });
    setShowMediaLibrary(false);
  };

  const handleRemoveImage = () => {
    setFormData({ ...formData, image_url: '' });
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
                  <h2 className="pageheader-title">Add New Product</h2>
                  <p className="pageheader-text">Create a new product for your store</p>
                  <div className="page-breadcrumb">
                    <nav aria-label="breadcrumb">
                      <ol className="breadcrumb">
                        <li className="breadcrumb-item">
                          <a href="/admin/dashboard" className="breadcrumb-link">Dashboard</a>
                        </li>
                        <li className="breadcrumb-item">
                          <a href="/admin/products" className="breadcrumb-link">Products</a>
                        </li>
                        <li className="breadcrumb-item active" aria-current="page">Add Product</li>
                      </ol>
                    </nav>
                  </div>
                </div>
              </div>
            </div>

            {/* Add Product Form */}
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
                            disabled={loading}
                          >
                            <i className="fas fa-arrow-left mr-1"></i>Cancel
                          </button>
                          <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                          >
                            {loading ? (
                              <>
                                <i className="fas fa-spinner fa-spin mr-1"></i>Adding Product...
                              </>
                            ) : (
                              <>
                                <i className="fas fa-save mr-1"></i>Add Product
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