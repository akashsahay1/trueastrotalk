'use client';

import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

interface FormData {
  profile_image: string;
  full_name: string;
  email_address: string;
  password: string;
  user_type: string;
  auth_type: string;
  phone_number: string;
  gender: string;
  date_of_birth: string;
  birth_time: string;
  birth_place: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zip: string;
  account_status: string;
  is_online: boolean;
  is_verified: boolean;
  qualifications: string[];
  skills: string[];
  commission_rates: {
    call_rate: number;
    chat_rate: number;
    video_rate: number;
  };
}

export default function AddUserPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState<FormData>({
    profile_image: '',
    full_name: '',
    email_address: '',
    password: '',
    user_type: 'customer',
    auth_type: 'email',
    phone_number: '',
    gender: 'male',
    date_of_birth: '',
    birth_time: '',
    birth_place: '',
    address: '',
    city: '',
    state: '',
    country: 'India',
    zip: '',
    account_status: 'active',
    is_online: false,
    is_verified: true,
    qualifications: [],
    skills: [],
    commission_rates: {
      call_rate: 0,
      chat_rate: 0,
      video_rate: 0
    }
  });

  const [qualificationInput, setQualificationInput] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [imageUploading, setImageUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState('');

  useEffect(() => {
    document.body.className = '';
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else if (name.includes('.')) {
      // Handle nested objects like commission_rates.call_rate
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof FormData] as Record<string, unknown>),
          [child]: type === 'number' ? Number(value) : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'number' ? Number(value) : value
      }));
    }
  };

  const addQualification = () => {
    if (qualificationInput.trim()) {
      setFormData(prev => ({
        ...prev,
        qualifications: [...prev.qualifications, qualificationInput.trim()]
      }));
      setQualificationInput('');
    }
  };

  const removeQualification = (index: number) => {
    setFormData(prev => ({
      ...prev,
      qualifications: prev.qualifications.filter((_, i) => i !== index)
    }));
  };

  const addSkill = () => {
    if (skillInput.trim()) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skillInput.trim()]
      }));
      setSkillInput('');
    }
  };

  const removeSkill = (index: number) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Only JPEG, PNG, and WebP are allowed.');
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError('File size too large. Maximum size is 5MB.');
      return;
    }

    setImageUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setFormData(prev => ({
          ...prev,
          profile_image: data.url
        }));
        setImagePreview(data.url);
      } else {
        setError(data.error || 'Failed to upload image');
      }
    } catch (error) {
      setError('Failed to upload image. Please try again.');
      console.error('Image upload error:', error);
    } finally {
      setImageUploading(false);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({
      ...prev,
      profile_image: ''
    }));
    setImagePreview('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('User created successfully!');
        setTimeout(() => {
          router.push(`/admin/accounts/${formData.user_type === 'administrator' ? 'admins' : formData.user_type === 'manager' ? 'managers' : formData.user_type}s`);
        }, 2000);
      } else {
        setError(data.error || 'Failed to create user');
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
      console.error('Create user error:', error);
    } finally {
      setLoading(false);
    }
  };

  const isAstrologer = formData.user_type === 'astrologer';

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
                  <h2 className="pageheader-title">Add New User</h2>
                  <p className="pageheader-text">Create a new user account for the platform</p>
                  <div className="page-breadcrumb">
                    <nav aria-label="breadcrumb">
                      <ol className="breadcrumb">
                        <li className="breadcrumb-item">
                          <a href="/admin/dashboard" className="breadcrumb-link">Dashboard</a>
                        </li>
                        <li className="breadcrumb-item">
                          <a href="#" className="breadcrumb-link">Accounts</a>
                        </li>
                        <li className="breadcrumb-item active" aria-current="page">Add User</li>
                      </ol>
                    </nav>
                  </div>
                </div>
              </div>
            </div>

            {/* Error and Success Messages */}
            {error && (
              <div className="row">
                <div className="col-xl-12">
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                </div>
              </div>
            )}
            
            {success && (
              <div className="row">
                <div className="col-xl-12">
                  <div className="alert alert-success" role="alert">
                    {success}
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Basic Information Card */}
              <div className="row mb-4">
                <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12">
                  <div className="card">
                    <h5 className="card-header">Basic Information</h5>
                    <div className="card-body">

                      {/* Profile Image Upload */}
                      <div className="form-group row">
                        <div className="col-lg-12">
                          <label className="col-form-label">Profile Image</label>
                          <div className="d-flex align-items-start">
                            <div className="mr-3 text-center">
                              <div className="position-relative">
                                {imagePreview || formData.profile_image ? (
                                  <>
																		<Image
																			src={imagePreview || formData.profile_image}
																			alt='Profile Preview'
																			width={80}
																			height={80}
																			className='rounded-circle'
																			style={{ width: '80px', height: '80px', objectFit: 'cover', cursor: 'pointer', border: '2px solid #dee2e6' }}
																			title="Click to change image"
																			onClick={() => document.getElementById('profile_image')?.click()}
																		/>
                                    <button
                                      type="button"
                                      className="btn btn-danger btn-sm position-absolute"
                                      style={{ top: '-5px', right: '-5px', width: '25px', height: '25px', borderRadius: '50%', padding: '0', fontSize: '14px' }}
                                      onClick={removeImage}
                                      title="Remove Image"
                                    >
                                      ×
                                    </button>
                                  </>
                                ) : (
                                  <div 
                                    className="rounded-circle bg-light d-flex align-items-center justify-content-center text-muted position-relative"
                                    style={{ 
                                      width: '80px', 
                                      height: '80px', 
                                      cursor: 'pointer', 
                                      border: '2px dashed #dee2e6',
                                      transition: 'all 0.3s ease'
                                    }}
                                    onClick={() => document.getElementById('profile_image')?.click()}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.borderColor = '#1877F2';
                                      e.currentTarget.style.backgroundColor = '#f8f9fa';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.borderColor = '#dee2e6';
                                      e.currentTarget.style.backgroundColor = '#f8f9fa';
                                    }}
                                    title="Click to upload image"
                                  >
                                    {imageUploading ? (
                                      <i className="fas fa-spinner fa-spin fa-lg"></i>
                                    ) : (
                                      <i className="fas fa-plus fa-lg text-primary"></i>
                                    )}
                                  </div>
                                )}
                              </div>
                              <small className="form-text text-muted mt-2 d-block">
                                Max file size: 5MB
                              </small>
                              {formData.profile_image && (
                                <div className="mt-2 text-success text-center">
                                  <i className="fas fa-check-circle mr-1"></i>
                                  <small>Image uploaded successfully</small>
                                </div>
                              )}
                              {/* Hidden file input */}
                              <input
                                type="file"
                                id="profile_image"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={handleImageUpload}
                                disabled={imageUploading}
                                style={{ display: 'none' }}
                              />
                            </div>
                            <div className="flex-grow-1">
                              {imageUploading && (
                                <div className="mt-2 text-primary">
                                  <i className="fas fa-spinner fa-spin mr-2"></i>
                                  Uploading image...
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="form-group row">
                        <div className="col-lg-3">
                          <label className="col-form-label">User Type <span className="text-danger">*</span></label>
                          <select 
                            className="custom-select"
                            name="user_type"
                            value={formData.user_type}
                            onChange={handleInputChange}
                            required
                          >
                            <option value="customer">Customer</option>
                            <option value="astrologer">Astrologer</option>
                            <option value="administrator">Administrator</option>
                            <option value="manager">Manager</option>
                          </select>
                        </div>
                        <div className="col-lg-3">
                          <label className="col-form-label">Account Status <span className="text-danger">*</span></label>
                          <select 
                            className="custom-select"
                            name="account_status"
                            value={formData.account_status}
                            onChange={handleInputChange}
                            required
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="banned">Banned</option>
                          </select>
                        </div>
                        <div className="col-lg-3">
                          <label className="col-form-label">Gender <span className="text-danger">*</span></label>
                          <select 
                            className="custom-select"
                            name="gender"
                            value={formData.gender}
                            onChange={handleInputChange}
                            required
                          >
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        <div className="col-lg-3">
                          <label className="col-form-label">Authentication Type</label>
                          <select 
                            className="custom-select"
                            name="auth_type"
                            value={formData.auth_type}
                            onChange={handleInputChange}
                          >
                            <option value="email">Email</option>
                            <option value="phone">Phone</option>
                            <option value="google">Google</option>
                          </select>
                        </div>
                      </div>

                      <div className="form-group row">
                        <div className="col-lg-6">
                          <label className="col-form-label">Full Name <span className="text-danger">*</span></label>
                          <input 
                            type="text" 
                            className="form-control"
                            name="full_name"
                            value={formData.full_name}
                            onChange={handleInputChange}
                            placeholder="Enter full name"
                            required
                          />
                        </div>
                        <div className="col-lg-6">
                          <label className="col-form-label">Password <span className="text-danger">*</span></label>
                          <input 
                            type="password" 
                            className="form-control"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            placeholder="Enter password"
                            required
                          />
                        </div>
                      </div>

                      <div className="form-group row">
                        <div className="col-lg-6">
                          <label className="col-form-label">Email Address <span className="text-danger">*</span></label>
                          <input 
                            type="email" 
                            className="form-control"
                            name="email_address"
                            value={formData.email_address}
                            onChange={handleInputChange}
                            placeholder="Enter email address"
                            required
                          />
                        </div>
                        <div className="col-lg-6">
                          <label className="col-form-label">Phone Number <span className="text-danger">*</span></label>
                          <input 
                            type="tel" 
                            className="form-control"
                            name="phone_number"
                            value={formData.phone_number}
                            onChange={handleInputChange}
                            placeholder="+91XXXXXXXXXX"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Personal Information Card */}
              <div className="row mb-4">
                <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12">
                  <div className="card">
                    <h5 className="card-header">Personal Information</h5>
                    <div className="card-body">

                      <div className="form-group row">
                        <div className="col-lg-4">
                          <label className="col-form-label">Date of Birth {isAstrologer && <span className="text-danger">*</span>}</label>
                          <input 
                            type="date" 
                            className="form-control"
                            name="date_of_birth"
                            value={formData.date_of_birth}
                            onChange={handleInputChange}
                            required={isAstrologer}
                          />
                        </div>
                        <div className="col-lg-4">
                          <label className="col-form-label">Birth Time {isAstrologer && <span className="text-danger">*</span>}</label>
                          <input 
                            type="time" 
                            className="form-control"
                            name="birth_time"
                            value={formData.birth_time}
                            onChange={handleInputChange}
                            required={isAstrologer}
                          />
                        </div>
                        <div className="col-lg-4">
                          <label className="col-form-label">Birth Place {isAstrologer && <span className="text-danger">*</span>}</label>
                          <input 
                            type="text" 
                            className="form-control"
                            name="birth_place"
                            value={formData.birth_place}
                            onChange={handleInputChange}
                            placeholder="Birth place"
                            required={isAstrologer}
                          />
                        </div>
                      </div>

                      <div className="form-group row">
                        <div className="col-lg-12">
                          <label className="col-form-label">Address {isAstrologer && <span className="text-danger">*</span>}</label>
                          <textarea 
                            className="form-control"
                            name="address"
                            value={formData.address}
                            onChange={handleInputChange}
                            placeholder="Enter full address"
                            rows={3}
                            required={isAstrologer}
                          />
                        </div>
                      </div>

                      <div className="form-group row">
                        <div className="col-lg-3">
                          <label className="col-form-label">City {isAstrologer && <span className="text-danger">*</span>}</label>
                          <input 
                            type="text" 
                            className="form-control"
                            name="city"
                            value={formData.city}
                            onChange={handleInputChange}
                            placeholder="City"
                            required={isAstrologer}
                          />
                        </div>
                        <div className="col-lg-3">
                          <label className="col-form-label">State {isAstrologer && <span className="text-danger">*</span>}</label>
                          <input 
                            type="text" 
                            className="form-control"
                            name="state"
                            value={formData.state}
                            onChange={handleInputChange}
                            placeholder="State"
                            required={isAstrologer}
                          />
                        </div>
                        <div className="col-lg-3">
                          <label className="col-form-label">Country {isAstrologer && <span className="text-danger">*</span>}</label>
                          <input 
                            type="text" 
                            className="form-control"
                            name="country"
                            value={formData.country}
                            onChange={handleInputChange}
                            placeholder="Country"
                            required={isAstrologer}
                          />
                        </div>
                        <div className="col-lg-3">
                          <label className="col-form-label">ZIP Code {isAstrologer && <span className="text-danger">*</span>}</label>
                          <input 
                            type="text" 
                            className="form-control"
                            name="zip"
                            value={formData.zip}
                            onChange={handleInputChange}
                            placeholder="ZIP Code"
                            required={isAstrologer}
                          />
                        </div>
                      </div>

                      {/* Astrologer Professional Information */}
                      {isAstrologer && (
                        <>
                          <div className="form-group row">
                            <div className="col-lg-6">
                              <label className="col-form-label">Qualifications <span className="text-danger">*</span></label>
                              <div className="input-group mb-2">
                                <input 
                                  type="text" 
                                  className="form-control"
                                  value={qualificationInput}
                                  onChange={(e) => setQualificationInput(e.target.value)}
                                  placeholder="Add qualification"
                                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addQualification())}
                                />
                                <div className="input-group-append">
                                  <button 
                                    type="button" 
                                    className="btn btn-outline-primary"
                                    onClick={addQualification}
                                  >
                                    <i className="fas fa-plus"></i>
                                  </button>
                                </div>
                              </div>
                              <div className="d-flex flex-wrap">
                                {formData.qualifications.map((qual, index) => (
                                  <span key={index} className="badge badge-primary mr-2 mb-2">
                                    {qual}
                                    <button 
                                      type="button" 
                                      className="btn btn-sm ml-1 p-0"
                                      style={{ background: 'none', border: 'none', color: 'white' }}
                                      onClick={() => removeQualification(index)}
                                    >
                                      ×
                                    </button>
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="col-lg-6">
                              <label className="col-form-label">Skills <span className="text-danger">*</span></label>
                              <div className="input-group mb-2">
                                <input 
                                  type="text" 
                                  className="form-control"
                                  value={skillInput}
                                  onChange={(e) => setSkillInput(e.target.value)}
                                  placeholder="Add skill"
                                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                                />
                                <div className="input-group-append">
                                  <button 
                                    type="button" 
                                    className="btn btn-outline-primary"
                                    onClick={addSkill}
                                  >
                                    <i className="fas fa-plus"></i>
                                  </button>
                                </div>
                              </div>
                              <div className="d-flex flex-wrap">
                                {formData.skills.map((skill, index) => (
                                  <span key={index} className="badge badge-info mr-2 mb-2">
                                    {skill}
                                    <button 
                                      type="button" 
                                      className="btn btn-sm ml-1 p-0"
                                      style={{ background: 'none', border: 'none', color: 'white' }}
                                      onClick={() => removeSkill(index)}
                                    >
                                      ×
                                    </button>
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="form-group row">
                            <div className="col-lg-4">
                              <label className="col-form-label">Call Rate (₹/min) <span className="text-danger">*</span></label>
                              <input 
                                type="number" 
                                className="form-control"
                                name="commission_rates.call_rate"
                                value={formData.commission_rates.call_rate}
                                onChange={handleInputChange}
                                placeholder="Call rate per minute"
                                min="0"
                                required={isAstrologer}
                              />
                            </div>
                            <div className="col-lg-4">
                              <label className="col-form-label">Chat Rate (₹/min) <span className="text-danger">*</span></label>
                              <input 
                                type="number" 
                                className="form-control"
                                name="commission_rates.chat_rate"
                                value={formData.commission_rates.chat_rate}
                                onChange={handleInputChange}
                                placeholder="Chat rate per minute"
                                min="0"
                                required={isAstrologer}
                              />
                            </div>
                            <div className="col-lg-4">
                              <label className="col-form-label">Video Rate (₹/min) <span className="text-danger">*</span></label>
                              <input 
                                type="number" 
                                className="form-control"
                                name="commission_rates.video_rate"
                                value={formData.commission_rates.video_rate}
                                onChange={handleInputChange}
                                placeholder="Video rate per minute"
                                min="0"
                                required={isAstrologer}
                              />
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Account Settings Card */}
              <div className="row mb-4">
                <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12">
                  <div className="card">
                    <h5 className="card-header">Account Settings</h5>
                    <div className="card-body">
                      <div className="form-group row">
                        <div className="col-lg-4">
                          <div className="form-check">
                            <input 
                              className="form-check-input" 
                              type="checkbox" 
                              id="add_is_verified"
                              name="is_verified"
                              checked={formData.is_verified}
                              onChange={handleInputChange}
                            />
                            <label className="form-check-label" htmlFor="add_is_verified">
                              Verified Account
                            </label>
                          </div>
                        </div>
                        <div className="col-lg-4">
                          <div className="form-check">
                            <input 
                              className="form-check-input" 
                              type="checkbox" 
                              id="add_is_online"
                              name="is_online"
                              checked={formData.is_online}
                              onChange={handleInputChange}
                            />
                            <label className="form-check-label" htmlFor="add_is_online">
                              Currently Online
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="form-group row">
                        <div className="col-lg-12">
                          <div className="text-right">
                            <Link href="/admin/accounts/customers" className="btn btn-light mr-2">
                              Cancel
                            </Link>
                            <button 
                              type="submit" 
                              className="btn btn-primary"
                              disabled={loading}
                            >
                              {loading ? (
                                <>
                                  <i className="fas fa-spinner fa-spin mr-2"></i>
                                  Creating...
                                </>
                              ) : (
                                <>
                                  <i className="fas fa-plus mr-2"></i>
                                  Create User
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
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}