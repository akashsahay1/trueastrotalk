'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/admin/Header';
import Sidebar from '@/components/admin/Sidebar';
import MediaLibrary from '@/components/admin/MediaLibrary';
import Image from 'next/image';
import { validateForm, getProductFormRules, displayFieldErrors, clearValidationErrors } from '@/lib/client-validation';
import { successMessages, errorMessages, showLoadingAlert, closeSweetAlert } from '@/lib/sweetalert';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  compare_price?: number;
  cost_price?: number;
  category: string;
  brand?: string;
  sku?: string;
  barcode?: string;
  
  // Images
  primary_image?: string;
  image_url?: string;
  images?: string[];
  image_urls?: string[];
  
  // Details
  material?: string;
  weight?: number;
  dimensions?: string;
  color?: string;
  size?: string;
  
  // Status
  stock_quantity: number;
  is_active: boolean;
  is_featured?: boolean;
  is_bestseller?: boolean;
  status?: string;
  
  // Shipping
  shipping_weight?: number;
  shipping_cost?: number;
  free_shipping?: boolean;
  shipping_class?: string;
  
  // Tags
  tags?: string[];
  
  // Additional
  warranty?: string;
  return_policy?: string;
  care_instructions?: string;
  
  // Reviews (read-only)
  rating?: number;
  total_reviews?: number;
  total_sales?: number;
  
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
  const productId = params?.id as string;
  
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [mediaLibraryMode, setMediaLibraryMode] = useState<'primary' | 'gallery'>('primary');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});
  const [formData, setFormData] = useState({
    // Basic Information
    name: '',
    description: '',
    category: '',
    brand: '',
    
    // Pricing & Inventory
    price: '',
    compare_price: '',
    cost_price: '',
    stock_quantity: '',
    sku: '',
    barcode: '',
    
    // Images
    primary_image: '',
    image_url: '', // backward compatibility
    images: [] as string[],
    image_urls: [] as string[],
    
    // Product Details
    material: '',
    weight: '',
    dimensions: '',
    color: '',
    size: '',
    
    // Status & Visibility
    is_active: true,
    is_featured: false,
    is_bestseller: false,
    status: 'draft',
    
    // Shipping
    shipping_weight: '',
    shipping_cost: '',
    free_shipping: false,
    shipping_class: 'standard',
    
    // Tags
    tags: '',
    
    // Additional Information
    warranty: '',
    return_policy: '',
    care_instructions: '',
    
    // Reviews (display only)
    rating: 0,
    total_reviews: 0,
    total_sales: 0
  });

  const fetchProduct = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/products/${productId}`);
      if (response.ok) {
        const data = await response.json();
        const productData = data.product;
        setProduct(productData);
        
        // Convert tags array to string
        const tagsString = Array.isArray(productData.tags) 
          ? productData.tags.join(', ')
          : productData.tags || '';
        
        setFormData({
          name: productData.name || '',
          description: productData.description || '',
          category: productData.category || '',
          brand: productData.brand || '',
          
          price: productData.price ? productData.price.toString() : '',
          compare_price: productData.compare_price ? productData.compare_price.toString() : '',
          cost_price: productData.cost_price ? productData.cost_price.toString() : '',
          stock_quantity: productData.stock_quantity ? productData.stock_quantity.toString() : '',
          sku: productData.sku || '',
          barcode: productData.barcode || '',
          
          primary_image: productData.image_url || '',
          image_url: productData.image_url || '',
          images: productData.images || [],
          image_urls: productData.image_urls || [],
          
          material: productData.material || '',
          weight: productData.weight ? productData.weight.toString() : '',
          dimensions: productData.dimensions || '',
          color: productData.color || '',
          size: productData.size || '',
          
          is_active: productData.is_active !== undefined ? productData.is_active : true,
          is_featured: productData.is_featured || false,
          is_bestseller: productData.is_bestseller || false,
          status: productData.status || 'draft',
          
          shipping_weight: productData.shipping_weight ? productData.shipping_weight.toString() : '',
          shipping_cost: productData.shipping_cost ? productData.shipping_cost.toString() : '',
          free_shipping: productData.free_shipping || false,
          shipping_class: productData.shipping_class || 'standard',
          
          tags: tagsString,
          
          warranty: productData.warranty || '',
          return_policy: productData.return_policy || '',
          care_instructions: productData.care_instructions || '',
          
          rating: productData.rating || 0,
          total_reviews: productData.total_reviews || 0,
          total_sales: productData.total_sales || 0
        });
      } else {
        errorMessages.notFound('Product');
        router.push('/products');
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      errorMessages.networkError();
      router.push('/products');
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

    // Convert validation errors to field errors format
    const validationFieldErrors = displayFieldErrors(validation.errors);
    
    const allErrors = { ...validationFieldErrors, ...customErrors };
    
    if (Object.keys(allErrors).length > 0) {
      setFieldErrors(allErrors);
      
      const firstError = Object.values(allErrors)[0];
      errorMessages.updateFailed(`Validation Error: ${firstError}`);
      
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

    showLoadingAlert('Updating product...');
    setSaving(true);
    
    // Process tags string into array
    const tagsArray = formData.tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag !== '');
    
    const productData = {
      ...formData,
      price: parseFloat(formData.price),
      compare_price: formData.compare_price ? parseFloat(formData.compare_price) : undefined,
      cost_price: formData.cost_price ? parseFloat(formData.cost_price) : undefined,
      stock_quantity: parseInt(formData.stock_quantity),
      weight: formData.weight ? parseFloat(formData.weight) : undefined,
      shipping_weight: formData.shipping_weight ? parseFloat(formData.shipping_weight) : undefined,
      shipping_cost: formData.shipping_cost ? parseFloat(formData.shipping_cost) : undefined,
      tags: tagsArray,
      // Ensure backward compatibility
      image_url: formData.primary_image || formData.image_url
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
        closeSweetAlert();
        await successMessages.updated('Product');
        router.push('/products');
      } else {
        const error = await response.json();
        closeSweetAlert();
        errorMessages.updateFailed(`product: ${error.message || 'Unknown error occurred'}`);
      }
    } catch (error) {
      closeSweetAlert();
      errorMessages.networkError();
      console.error('Error updating product:', error);
    } finally {
      setSaving(false);
    }
  };

  const handlePrimaryImageSelect = (imageUrl: string) => {
    setFormData({ ...formData, primary_image: imageUrl, image_url: imageUrl });
    setShowMediaLibrary(false);
  };

  const handleGalleryImageSelect = (imageUrl: string) => {
    if (!formData.images.includes(imageUrl)) {
      setFormData({ 
        ...formData, 
        images: [...formData.images, imageUrl],
        image_urls: [...formData.image_urls, imageUrl]
      });
    }
    setShowMediaLibrary(false);
  };

  const handleRemovePrimaryImage = () => {
    setFormData({ ...formData, primary_image: '', image_url: '' });
  };

  const handleRemoveGalleryImage = (imageUrl: string) => {
    setFormData({ 
      ...formData, 
      images: formData.images.filter(img => img !== imageUrl),
      image_urls: formData.image_urls.filter(img => img !== imageUrl)
    });
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
                          <Link href="/dashboard" className="breadcrumb-link">Dashboard</Link>
                        </li>
                        <li className="breadcrumb-item">
                          <Link href="/products" className="breadcrumb-link">Products</Link>
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
                      {/* Basic Information */}
                      <h6 className="mb-3">Basic Information</h6>
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
                            <label>Tags</label>
                            <input
                              type="text"
                              className="form-control"
                              value={formData.tags}
                              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                              placeholder="Enter tags separated by commas"
                            />
                            <small className="form-text text-muted">
                              Separate multiple tags with commas
                            </small>
                          </div>
                        </div>
                      </div>
                      
                      <div className="row">
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
                        <div className="col-md-6">
                          <div className="form-group">
                            <label>Brand</label>
                            <input
                              type="text"
                              className="form-control"
                              value={formData.brand}
                              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                              placeholder="Enter brand name"
                            />
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
                        <div className="col-md-6">
                          <div className="form-group">
                            <label>SKU</label>
                            <input
                              type="text"
                              className="form-control"
                              value={formData.sku}
                              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                              placeholder="Stock Keeping Unit"
                            />
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="form-group">
                            <label>Barcode</label>
                            <input
                              type="text"
                              className="form-control"
                              value={formData.barcode}
                              onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                              placeholder="Product barcode"
                            />
                          </div>
                        </div>
                      </div>

                      <hr className="my-4" />

                      {/* Pricing & Inventory */}
                      <h6 className="mb-3">Pricing & Inventory</h6>
                      <div className="row">
                        <div className="col-md-4">
                          <div className="form-group">
                            <label>Regular Price (₹) *</label>
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
                            <label>Compare Price (₹)</label>
                            <input
                              type="number"
                              step="0.01"
                              className="form-control"
                              value={formData.compare_price}
                              onChange={(e) => setFormData({ ...formData, compare_price: e.target.value })}
                              placeholder="Original price"
                            />
                            <small className="form-text text-muted">Shows as struck-through price</small>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="form-group">
                            <label>Cost Price (₹)</label>
                            <input
                              type="number"
                              step="0.01"
                              className="form-control"
                              value={formData.cost_price}
                              onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                              placeholder="Your cost"
                            />
                            <small className="form-text text-muted">For profit calculations</small>
                          </div>
                        </div>
                      </div>

                      <div className="row">
                        <div className="col-md-6">
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
                        <div className="col-md-6">
                          <div className="form-group">
                            <label>Product Status</label>
                            <select
                              className="form-control"
                              value={formData.status}
                              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            >
                              <option value="draft">Draft</option>
                              <option value="active">Active</option>
                              <option value="archived">Archived</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="row">
                        <div className="col-md-4">
                          <div className="form-check mb-3">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id="is_active"
                              checked={formData.is_active}
                              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                            />
                            <label className="form-check-label" htmlFor="is_active">
                              Product is Active
                            </label>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="form-check mb-3">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id="is_featured"
                              checked={formData.is_featured}
                              onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                            />
                            <label className="form-check-label" htmlFor="is_featured">
                              Featured Product
                            </label>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="form-check mb-3">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id="is_bestseller"
                              checked={formData.is_bestseller}
                              onChange={(e) => setFormData({ ...formData, is_bestseller: e.target.checked })}
                            />
                            <label className="form-check-label" htmlFor="is_bestseller">
                              Bestseller
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Display analytics (read-only) */}
                      {(formData.rating > 0 || formData.total_reviews > 0 || formData.total_sales > 0) && (
                        <div className="row mt-4">
                          <div className="col-12">
                            <h6>Product Analytics</h6>
                            <div className="row">
                              <div className="col-md-4">
                                <div className="form-group">
                                  <label>Average Rating</label>
                                  <input
                                    type="number"
                                    className="form-control"
                                    value={formData.rating}
                                    disabled
                                    readOnly
                                  />
                                </div>
                              </div>
                              <div className="col-md-4">
                                <div className="form-group">
                                  <label>Total Reviews</label>
                                  <input
                                    type="number"
                                    className="form-control"
                                    value={formData.total_reviews}
                                    disabled
                                    readOnly
                                  />
                                </div>
                              </div>
                              <div className="col-md-4">
                                <div className="form-group">
                                  <label>Total Sales</label>
                                  <input
                                    type="number"
                                    className="form-control"
                                    value={formData.total_sales}
                                    disabled
                                    readOnly
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <hr className="my-4" />

                      {/* Images Section - Modern Design */}
                      <div className="card border-0 shadow-sm">
                        <div className="card-header bg-white border-0 pb-0">
                          <h5 className="card-title mb-0 text-dark">
                            <i className="fas fa-images text-primary mr-2"></i>
                            Product Media
                          </h5>
                          <small className="text-muted">Upload and manage product images</small>
                        </div>
                        <div className="card-body">
                          {/* Primary Image Section */}
                          <div className="row mb-4">
                            <div className="col-md-4">
                              <h6 className="font-weight-bold text-dark mb-3">
                                <span className="badge badge-primary badge-sm mr-2">PRIMARY</span>
                                Main Product Image
                              </h6>
                              
                              <div className="primary-image-container">
                                {formData.primary_image ? (
                                  <div className="image-preview-card position-relative">
                                    <Image
                                      src={formData.primary_image}
                                      alt="Primary Product Image"
                                      width={200}
                                      height={200}
                                      className="rounded shadow-sm"
                                      style={{ 
                                        objectFit: 'cover', 
                                        border: '3px solid #007bff',
                                        transition: 'all 0.3s ease'
                                      }}
                                    />
                                    <div className="image-overlay position-absolute">
                                      <button
                                        type="button"
                                        className="btn btn-danger btn-sm rounded-circle position-absolute"
                                        onClick={handleRemovePrimaryImage}
                                        style={{ 
                                          top: '8px', 
                                          right: '8px',
                                          width: '32px',
                                          height: '32px',
                                          padding: '0',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center'
                                        }}
                                      >
                                        <i className="fas fa-times" style={{ fontSize: '12px' }}></i>
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div 
                                    className="image-placeholder d-flex flex-column align-items-center justify-content-center rounded border-2"
                                    style={{ 
                                      width: '200px', 
                                      height: '200px', 
                                      backgroundColor: '#f8f9fa',
                                      borderStyle: 'dashed',
                                      borderColor: '#dee2e6',
                                      cursor: 'pointer',
                                      transition: 'all 0.3s ease'
                                    }}
                                    onClick={() => {
                                      setMediaLibraryMode('primary');
                                      setShowMediaLibrary(true);
                                    }}
                                  >
                                    <i className="fas fa-cloud-upload-alt text-muted mb-2" style={{ fontSize: '32px' }}></i>
                                    <span className="text-muted font-weight-bold">Upload Image</span>
                                    <small className="text-muted">Recommended: 800x800px</small>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="col-md-8">
                              <div className="d-flex flex-column h-100 justify-content-center">
                                <div className="mb-3">
                                  <button
                                    type="button"
                                    className="btn btn-primary btn-lg shadow-sm"
                                    onClick={() => {
                                      setMediaLibraryMode('primary');
                                      setShowMediaLibrary(true);
                                    }}
                                    style={{ borderRadius: '8px' }}
                                  >
                                    <i className="fas fa-folder-open mr-2"></i>
                                    {formData.primary_image ? 'Change Primary Image' : 'Select Primary Image'}
                                  </button>
                                </div>
                                
                                <div className="alert alert-info border-0 shadow-sm" style={{ borderRadius: '8px' }}>
                                  <i className="fas fa-info-circle mr-2"></i>
                                  <strong>Image Guidelines:</strong>
                                  <ul className="mb-0 mt-2 small">
                                    <li>Use high-quality images (minimum 800x800px)</li>
                                    <li>Square aspect ratio works best</li>
                                    <li>This image will be the main product thumbnail</li>
                                    <li>Supported formats: JPG, PNG, WebP</li>
                                  </ul>
                                </div>
                              </div>
                            </div>
                          </div>

                          <hr className="my-4" />

                          {/* Gallery Images Section */}
                          <div className="gallery-section">
                            <h6 className="font-weight-bold text-dark mb-3">
                              <span className="badge badge-secondary badge-sm mr-2">GALLERY</span>
                              Additional Product Images
                            </h6>
                            
                            <div className="gallery-grid">
                              <div className="row">
                                {/* Add Image Card */}
                                <div className="col-lg-2 col-md-3 col-sm-4 col-6 mb-3">
                                  <div 
                                    className="add-image-card d-flex flex-column align-items-center justify-content-center rounded border-2 h-100"
                                    style={{ 
                                      minHeight: '140px',
                                      backgroundColor: '#f8f9fa',
                                      borderStyle: 'dashed',
                                      borderColor: '#6c757d',
                                      cursor: 'pointer',
                                      transition: 'all 0.3s ease'
                                    }}
                                    onClick={() => {
                                      setMediaLibraryMode('gallery');
                                      setShowMediaLibrary(true);
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.backgroundColor = '#e9ecef';
                                      e.currentTarget.style.borderColor = '#495057';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor = '#f8f9fa';
                                      e.currentTarget.style.borderColor = '#6c757d';
                                    }}
                                  >
                                    <i className="fas fa-plus text-muted mb-2" style={{ fontSize: '24px' }}></i>
                                    <span className="small font-weight-bold text-muted">Add Image</span>
                                  </div>
                                </div>

                                {/* Gallery Images - Currently single image only */}
                                {formData.image_url && (
                                  <div className="col-lg-2 col-md-3 col-sm-4 col-6 mb-3">
                                    <div className="gallery-image-card position-relative">
                                      <Image
                                        src={formData.image_url}
                                        alt="Product Image"
                                        width={140}
                                        height={140}
                                        className="rounded shadow-sm w-100"
                                        style={{ 
                                          objectFit: 'cover',
                                          height: '140px',
                                          border: '2px solid #dee2e6',
                                          transition: 'all 0.3s ease'
                                        }}
                                      />
                                      <div className="image-overlay-actions position-absolute w-100 h-100 d-flex align-items-center justify-content-center"
                                           style={{ 
                                             top: 0, 
                                             left: 0, 
                                             backgroundColor: 'rgba(0,0,0,0.7)', 
                                             opacity: 0,
                                             transition: 'opacity 0.3s ease',
                                             borderRadius: '4px'
                                           }}
                                           onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                                           onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
                                      >
                                        <button
                                          type="button"
                                          className="btn btn-danger btn-sm rounded-circle"
                                          onClick={() => setFormData({ ...formData, image_url: '', primary_image: '' })}
                                          style={{ 
                                            width: '36px',
                                            height: '36px',
                                            padding: '0',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                          }}
                                        >
                                          <i className="fas fa-trash" style={{ fontSize: '14px' }}></i>
                                        </button>
                                      </div>
                                      <div className="position-absolute bg-dark text-white px-2 py-1 rounded"
                                           style={{ 
                                             top: '8px', 
                                             left: '8px',
                                             fontSize: '10px',
                                             fontWeight: 'bold'
                                           }}>
                                        #1
                                      </div>
                                    </div>
                                  </div>
                                )}
                                {/* This section can be extended for multiple images in the future */}
                                {false && formData.image_urls?.map((imageUrl, index) => (
                                  <div key={index} className="col-lg-2 col-md-3 col-sm-4 col-6 mb-3">
                                    <div className="gallery-image-card position-relative">
                                      <Image
                                        src={imageUrl}
                                        alt={`Gallery Image ${index + 1}`}
                                        width={140}
                                        height={140}
                                        className="rounded shadow-sm w-100"
                                        style={{ 
                                          objectFit: 'cover',
                                          height: '140px',
                                          border: '2px solid #dee2e6',
                                          transition: 'all 0.3s ease'
                                        }}
                                      />
                                      <div className="image-overlay-actions position-absolute w-100 h-100 d-flex align-items-center justify-content-center"
                                           style={{ 
                                             top: 0, 
                                             left: 0, 
                                             backgroundColor: 'rgba(0,0,0,0.7)', 
                                             opacity: 0,
                                             transition: 'opacity 0.3s ease',
                                             borderRadius: '4px'
                                           }}
                                           onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                                           onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
                                      >
                                        <button
                                          type="button"
                                          className="btn btn-danger btn-sm rounded-circle"
                                          onClick={() => handleRemoveGalleryImage(imageUrl)}
                                          style={{ 
                                            width: '36px',
                                            height: '36px',
                                            padding: '0',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                          }}
                                        >
                                          <i className="fas fa-trash" style={{ fontSize: '14px' }}></i>
                                        </button>
                                      </div>
                                      <div className="position-absolute bg-dark text-white px-2 py-1 rounded"
                                           style={{ 
                                             top: '8px', 
                                             left: '8px',
                                             fontSize: '10px',
                                             fontWeight: 'bold'
                                           }}>
                                        #{index + 1}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            {formData.image_url && (
                              <div className="mt-3 p-3 bg-light rounded">
                                <small className="text-muted">
                                  <i className="fas fa-images mr-1"></i>
                                  <strong>1</strong> image assigned to product
                                  • Multiple image gallery coming soon
                                </small>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <hr className="my-4" />

                      {/* Product Details */}
                      <h6 className="mb-3">Product Details</h6>
                      <div className="row">
                        <div className="col-md-6">
                          <div className="form-group">
                            <label>Material</label>
                            <input
                              type="text"
                              className="form-control"
                              value={formData.material}
                              onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                              placeholder="e.g., Cotton, Polyester, etc."
                            />
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="form-group">
                            <label>Weight</label>
                            <input
                              type="number"
                              step="0.01"
                              className="form-control"
                              value={formData.weight}
                              onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                              placeholder="Product weight in kg"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="row">
                        <div className="col-md-4">
                          <div className="form-group">
                            <label>Dimensions</label>
                            <input
                              type="text"
                              className="form-control"
                              value={formData.dimensions}
                              onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                              placeholder="L x W x H"
                            />
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="form-group">
                            <label>Color</label>
                            <input
                              type="text"
                              className="form-control"
                              value={formData.color}
                              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                              placeholder="Product color"
                            />
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="form-group">
                            <label>Size</label>
                            <input
                              type="text"
                              className="form-control"
                              value={formData.size}
                              onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                              placeholder="Product size"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="row">
                        <div className="col-md-4">
                          <div className="form-group">
                            <label>Warranty</label>
                            <input
                              type="text"
                              className="form-control"
                              value={formData.warranty}
                              onChange={(e) => setFormData({ ...formData, warranty: e.target.value })}
                              placeholder="e.g., 1 Year"
                            />
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="form-group">
                            <label>Return Policy</label>
                            <input
                              type="text"
                              className="form-control"
                              value={formData.return_policy}
                              onChange={(e) => setFormData({ ...formData, return_policy: e.target.value })}
                              placeholder="e.g., 30 Days"
                            />
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="form-group">
                            <label>Care Instructions</label>
                            <input
                              type="text"
                              className="form-control"
                              value={formData.care_instructions}
                              onChange={(e) => setFormData({ ...formData, care_instructions: e.target.value })}
                              placeholder="e.g., Machine wash cold"
                            />
                          </div>
                        </div>
                      </div>

                      <hr className="my-4" />

                      {/* Shipping */}
                      <h6 className="mb-3">Shipping Information</h6>
                      <div className="row">
                        <div className="col-md-4">
                          <div className="form-group">
                            <label>Shipping Weight (kg)</label>
                            <input
                              type="number"
                              step="0.01"
                              className="form-control"
                              value={formData.shipping_weight}
                              onChange={(e) => setFormData({ ...formData, shipping_weight: e.target.value })}
                              placeholder="Weight for shipping"
                            />
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="form-group">
                            <label>Shipping Cost (₹)</label>
                            <input
                              type="number"
                              step="0.01"
                              className="form-control"
                              value={formData.shipping_cost}
                              onChange={(e) => setFormData({ ...formData, shipping_cost: e.target.value })}
                              placeholder="Fixed shipping cost"
                            />
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="form-group">
                            <label>Shipping Class</label>
                            <select
                              className="form-control"
                              value={formData.shipping_class}
                              onChange={(e) => setFormData({ ...formData, shipping_class: e.target.value })}
                            >
                              <option value="standard">Standard</option>
                              <option value="express">Express</option>
                              <option value="overnight">Overnight</option>
                              <option value="free">Free Shipping</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="form-check mb-3">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="free_shipping"
                          checked={formData.free_shipping}
                          onChange={(e) => setFormData({ ...formData, free_shipping: e.target.checked })}
                        />
                        <label className="form-check-label" htmlFor="free_shipping">
                          Enable Free Shipping
                        </label>
                      </div>


                      <div className="form-row">
                        <div className="col-12">
                          <button
                            type="button"
                            className="btn btn-secondary mr-2"
                            onClick={() => router.push('/products')}
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
        onSelect={mediaLibraryMode === 'primary' ? handlePrimaryImageSelect : handleGalleryImageSelect}
        selectedImage={mediaLibraryMode === 'primary' ? formData.primary_image : ''}
      />
    </div>
  );
}