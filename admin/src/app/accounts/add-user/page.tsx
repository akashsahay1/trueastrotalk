'use client';

import Header from '@/components/admin/Header';
import Sidebar from '@/components/admin/Sidebar';
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
// Removed unused import clearValidationErrors
import { successMessages, errorMessages, showLoadingAlert, closeSweetAlert } from '@/lib/sweetalert';
import AirDatePickerComponent from '@/components/admin/AirDatePickerComponent';
import MediaLibrary from '@/components/admin/MediaLibrary';
import { getCSRFToken } from '@/lib/csrf';

interface FormData {
  user_id: string;
  profile_image_id: string;
  social_profile_image_url: string;
  pan_card_id: string; // Reference to media collection for PAN card document
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
  is_featured: boolean;
  verification_status: string;
  verification_status_message: string;
  experience_years: number;
  bio: string;
  languages: string[];
  qualifications: string[];
  skills: string[];
  call_rate: number;
  chat_rate: number;
  video_rate: number;
  commission_percentage: {
    call: number;
    chat: number;
    video: number;
  };
  // Bank details for astrologer payouts
  bank_details: {
    account_holder_name: string;
    account_number: string;
    bank_name: string;
    ifsc_code: string;
  };
}

function AddUserPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [defaultCommission, setDefaultCommission] = useState(25);
  
  const [formData, setFormData] = useState<FormData>({
    user_id: '',
    profile_image_id: '',
    social_profile_image_url: '',
    pan_card_id: '',
    full_name: '',
    email_address: '',
    password: '',
    user_type: searchParams?.get('type') || 'customer',
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
    is_featured: false,
    verification_status: 'pending',
    verification_status_message: '',
    experience_years: 0,
    bio: '',
    languages: [],
    qualifications: [],
    skills: [],
    call_rate: 0,
    chat_rate: 0,
    video_rate: 0,
    commission_percentage: {
      call: defaultCommission,
      chat: defaultCommission,
      video: defaultCommission
    },
    bank_details: {
      account_holder_name: '',
      account_number: '',
      bank_name: '',
      ifsc_code: ''
    }
  });

  const [imagePreview, setImagePreview] = useState('');
  const [panCardPreview, setPanCardPreview] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});
  const [showProfileImageLibrary, setShowProfileImageLibrary] = useState(false);
  const [showPanCardLibrary, setShowPanCardLibrary] = useState(false);
  
  // Astrologer options state
  const [availableSkills, setAvailableSkills] = useState<string[]>([]);
  const [availableLanguages, setAvailableLanguages] = useState<string[]>([]);
  const [qualificationInput, setQualificationInput] = useState('');

  // Define user type booleans for conditional rendering
  const isAstrologer = formData.user_type === 'astrologer';
  const isCustomer = formData.user_type === 'customer';
  const isAdmin = formData.user_type === 'administrator';
  const isManager = formData.user_type === 'manager';

  useEffect(() => {
    document.body.className = '';
    loadAdminSettings();
    
    // Update user type from URL parameter
    const userType = searchParams?.get('type');
    if (userType && ['customer', 'astrologer', 'administrator', 'manager'].includes(userType)) {
      setFormData(prev => ({
        ...prev,
        user_type: userType
      }));
      
      // Load astrologer options if astrologer type
      if (userType === 'astrologer') {
        loadAstrologerOptions();
      }
    }
  }, [searchParams]);

  // Load astrologer options when user type changes to astrologer
  useEffect(() => {
    if (formData.user_type === 'astrologer') {
      loadAstrologerOptions();
    }
  }, [formData.user_type]);

  // Initialize select2 for Skills and Languages
  useEffect(() => {
    if (typeof window !== 'undefined' && formData.user_type === 'astrologer') {
      // Access jQuery through window object
      const windowWithJQuery = window as typeof window & { $?: unknown };
      if (!windowWithJQuery.$ || typeof windowWithJQuery.$ !== 'function') return;
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const $ = windowWithJQuery.$ as any;
      
      // Initialize select2 for skills
      const skillsSelect = $('#skills-select');
      if (skillsSelect.length && !skillsSelect.hasClass('select2-hidden-accessible')) {
        skillsSelect.select2({
          placeholder: 'Select skills...',
          allowClear: true,
          closeOnSelect: false
        });
      }

      // Initialize select2 for languages  
      const languagesSelect = $('#languages-select');
      if (languagesSelect.length && !languagesSelect.hasClass('select2-hidden-accessible')) {
        languagesSelect.select2({
          placeholder: 'Select languages...',
          allowClear: true,
          closeOnSelect: false
        });
      }

      // Cleanup function
      return () => {
        if (skillsSelect.length && skillsSelect.hasClass('select2-hidden-accessible')) {
          skillsSelect.select2('destroy');
        }
        if (languagesSelect.length && languagesSelect.hasClass('select2-hidden-accessible')) {
          languagesSelect.select2('destroy');
        }
      };
    }
  }, [formData.user_type, availableSkills, availableLanguages]);

  const loadAdminSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings/general');
      const data = await response.json();
      
      if (response.ok && data.config?.commission?.defaultRate) {
        const defaultRate = data.config.commission.defaultRate;
        setDefaultCommission(defaultRate);
        setFormData(prev => ({
          ...prev,
          commission_percentage: {
            call: defaultRate,
            chat: defaultRate,
            video: defaultRate
          }
        }));
      }
    } catch (error) {
      console.error('Failed to load admin settings:', error);
    }
  };

  const loadAstrologerOptions = async () => {
    try {
      const response = await fetch('/api/astrologer-options/active');
      const data = await response.json();
      
      if (response.ok && data.success) {
        setAvailableSkills(data.data.skills || []);
        setAvailableLanguages(data.data.languages || []);
      }
    } catch (error) {
      console.error('Failed to load astrologer options:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else if (name.includes('.')) {
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

  const handleProfileImageSelect = (imageUrl: string, mediaId?: string) => {
    setFormData(prev => ({
      ...prev,
      profile_image_id: mediaId || '',
      social_profile_image_url: ''
    }));
    setImagePreview(imageUrl);
    setShowProfileImageLibrary(false);
  };

  const removeImage = () => {
    setFormData(prev => ({
      ...prev,
      profile_image_id: '',
      social_profile_image_url: ''
    }));
    setImagePreview('');
  };

  const handlePanCardSelect = (imageUrl: string, mediaId?: string) => {
    setFormData(prev => ({
      ...prev,
      pan_card_id: mediaId || ''
    }));
    setPanCardPreview(imageUrl);
    setShowPanCardLibrary(false);
    setFieldErrors(prev => ({ ...prev, pan_card: '' }));
  };

  const removePanCard = () => {
    setFormData(prev => ({
      ...prev,
      pan_card_id: ''
    }));
    setPanCardPreview('');
    setFieldErrors(prev => ({ ...prev, pan_card: '' }));
  };


  const addQualification = () => {
    const qualification = qualificationInput.trim();
    if (qualification && !formData.qualifications.includes(qualification)) {
      // Capitalize first letter
      const capitalizedQualification = qualification.charAt(0).toUpperCase() + qualification.slice(1);
      setFormData(prev => ({
        ...prev,
        qualifications: [...prev.qualifications, capitalizedQualification]
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

  const validateUserForm = () => {
    const customErrors: {[key: string]: string} = {};

    // Basic validations for all user types
    if (!formData.full_name.trim()) {
      customErrors.full_name = 'Full name is required';
    }

    if (!formData.email_address.trim()) {
      customErrors.email_address = 'Email address is required';
    }

    // Password validation - ONLY for admin and manager
    if (formData.user_type === 'administrator' || formData.user_type === 'manager') {
      if (!formData.password || formData.password.length < 6) {
        customErrors.password = 'Password is required (minimum 6 characters)';
      }
    }

    // Customer-specific validations
    if (formData.user_type === 'customer') {
      if (!formData.date_of_birth) {
        customErrors.date_of_birth = 'Date of birth is required';
      }
      if (!formData.birth_time) {
        customErrors.birth_time = 'Birth time is required';
      }
      if (!formData.birth_place.trim()) {
        customErrors.birth_place = 'Birth place is required';
      }
      if (!formData.address.trim()) {
        customErrors.address = 'Address is required';
      }
      if (!formData.city.trim()) {
        customErrors.city = 'City is required';
      }
      if (!formData.state.trim()) {
        customErrors.state = 'State is required';
      }
      if (!formData.country.trim()) {
        customErrors.country = 'Country is required';
      }
      if (!formData.zip.trim()) {
        customErrors.zip = 'ZIP code is required';
      }
    }

    // Astrologer-specific validations
    if (formData.user_type === 'astrologer') {
      if (!formData.address.trim()) {
        customErrors.address = 'Address is required';
      }
      if (!formData.city.trim()) {
        customErrors.city = 'City is required';
      }
      if (!formData.state.trim()) {
        customErrors.state = 'State is required';
      }
      if (!formData.country.trim()) {
        customErrors.country = 'Country is required';
      }
      if (!formData.zip.trim()) {
        customErrors.zip = 'ZIP code is required';
      }
      if (formData.call_rate <= 0) {
        customErrors.call_rate = 'Call rate must be greater than 0';
      }
      if (formData.chat_rate <= 0) {
        customErrors.chat_rate = 'Chat rate must be greater than 0';
      }
      if (formData.video_rate <= 0) {
        customErrors.video_rate = 'Video rate must be greater than 0';
      }
      
      // PAN Card validation
      if (!formData.pan_card_id || formData.pan_card_id.trim() === '') {
        customErrors.pan_card = 'PAN card upload is required for astrologers';
      }
      
      // Bank details validation
      if (!formData.bank_details.account_holder_name.trim()) {
        customErrors.account_holder_name = 'Account holder name is required';
      }
      if (!formData.bank_details.account_number.trim()) {
        customErrors.account_number = 'Account number is required';
      }
      if (!formData.bank_details.bank_name.trim()) {
        customErrors.bank_name = 'Bank name is required';
      }
      if (!formData.bank_details.ifsc_code.trim()) {
        customErrors.ifsc_code = 'IFSC code is required';
      } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.bank_details.ifsc_code.trim())) {
        customErrors.ifsc_code = 'Please enter a valid IFSC code (e.g., SBIN0123456)';
      }
      
      // Account number validation (basic check for numeric and length)
      const accountNumber = formData.bank_details.account_number.trim();
      if (accountNumber && (!/^\d+$/.test(accountNumber) || accountNumber.length < 9 || accountNumber.length > 18)) {
        customErrors.account_number = 'Please enter a valid account number (9-18 digits)';
      }
    }

    if (Object.keys(customErrors).length > 0) {
      setFieldErrors(customErrors);
      const firstError = Object.values(customErrors)[0];
      errorMessages.createFailed(`Validation Error: ${firstError}`);
      return false;
    }

    setFieldErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateUserForm()) {
      return;
    }

    showLoadingAlert('Creating user...');
    setLoading(true);

    try {
      const csrfToken = getCSRFToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (csrfToken) {
        headers['x-csrf-token'] = csrfToken;
      }

      const response = await fetch('/api/users/create', {
        method: 'POST',
        headers,
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        closeSweetAlert();
        await successMessages.created('User');
        
        let redirectPath = '/accounts/customers';
        if (formData.user_type === 'administrator') {
          redirectPath = '/accounts/admins';
        } else if (formData.user_type === 'manager') {
          redirectPath = '/accounts/managers';
        } else if (formData.user_type === 'astrologer') {
          redirectPath = '/accounts/astrologers';
        }
        
        router.push(redirectPath);
      } else {
        closeSweetAlert();
        errorMessages.createFailed(`user: ${data.error || 'Unknown error occurred'}`);
        setError(data.error || 'Failed to create user');
      }
    } catch (error) {
      closeSweetAlert();
      errorMessages.networkError();
      setError('An error occurred. Please try again.');
      console.error('Create user error:', error);
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
              <div className="col-xl-12 col-12 col-md-12 col-sm-12 col-12">
                <div className="page-header">
                  <h2 className="pageheader-title">Add User</h2>
                  <p className="pageheader-text">Create a user account for the platform</p>
                  <div className="page-breadcrumb">
                    <nav aria-label="breadcrumb">
                      <ol className="breadcrumb">
                        <li className="breadcrumb-item">
                          <Link href="/dashboard" className="breadcrumb-link">Dashboard</Link>
                        </li>
                        <li className="breadcrumb-item">
                          <span className="breadcrumb-link">Accounts</span>
                        </li>
                        <li className="breadcrumb-item active" aria-current="page">Add User</li>
                      </ol>
                    </nav>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="row">
                <div className="col-xl-12">
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-xl-8 col-lg-8 col-md-12 col-sm-12 col-12">
                  
                  {/* Basic Information Card - Always Visible */}
                  <div className="card mb-4">
                    <h5 className="card-header">Basic Information</h5>
                    <div className="card-body">
                      <div className="row">
                        {/* Profile Image */}
                        <div className="col-md-12 mb-4">
                          <label className="label">Profile Image (Optional)</label>
                          <div className="d-flex align-items-start">
                            <div className="mr-3 text-center">
                              <div className="position-relative">
                                {imagePreview ? (
                                  <>
                                    <Image
                                      src={imagePreview}
                                      alt='Profile Preview'
                                      width={80}
                                      height={80}
                                      className='rounded-circle'
                                      style={{ width: '80px', height: '80px', objectFit: 'cover', cursor: 'pointer', border: '2px solid #dee2e6' }}
                                      onClick={() => setShowProfileImageLibrary(true)}
                                    />
                                    <button
                                      type="button"
                                      className="btn btn-danger btn-sm position-absolute"
                                      style={{ top: '-5px', right: '-5px', width: '25px', height: '25px', borderRadius: '50%', padding: '0' }}
                                      onClick={removeImage}
                                    >
                                      <i className="fas fa-times fa-xs"></i>
                                    </button>
                                  </>
                                ) : (
                                  <div 
                                    className="rounded-circle bg-light d-flex align-items-center justify-content-center"
                                    style={{ width: '80px', height: '80px', cursor: 'pointer', border: '2px dashed #dee2e6' }}
                                    onClick={() => setShowProfileImageLibrary(true)}
                                  >
                                    <i className="fas fa-camera fa-lg text-primary"></i>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex-1">
                              <small className="text-muted d-block">Click to choose a profile image from media library</small>
                              <small className="text-muted">Supported formats: JPG, PNG, WebP</small>
                            </div>
                          </div>
                        </div>

                        {/* User Type */}
                        <div className="col-md-6 mb-4">
                          <label className="label">User Type <span className="text-danger">*</span></label>
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

                        {/* Full Name */}
                        <div className="col-md-6 mb-4">
                          <label className="label">Full Name <span className="text-danger">*</span></label>
                          <input 
                            type="text" 
                            className={`form-control ${fieldErrors.full_name ? 'is-invalid' : ''}`}
                            name="full_name" 
                            value={formData.full_name} 
                            onChange={handleInputChange} 
                            required 
                          />
                          {fieldErrors.full_name && (
                            <div className="invalid-feedback">{fieldErrors.full_name}</div>
                          )}
                        </div>

                        {/* Email Address */}
                        <div className="col-md-6 mb-4">
                          <label className="label">Email Address <span className="text-danger">*</span></label>
                          <input 
                            type="email" 
                            className={`form-control ${fieldErrors.email_address ? 'is-invalid' : ''}`}
                            name="email_address" 
                            value={formData.email_address} 
                            onChange={handleInputChange} 
                            required 
                          />
                          {fieldErrors.email_address && (
                            <div className="invalid-feedback">{fieldErrors.email_address}</div>
                          )}
                        </div>

                        {/* Password - Only for Admin and Manager */}
                        {(isAdmin || isManager) && (
                          <div className="col-md-6 mb-4">
                            <label className="label">
                              Password
                              <span className="text-danger"> *</span>
                            </label>
                            <input
                              type="password"
                              className={`form-control ${fieldErrors.password ? 'is-invalid' : ''}`}
                              name="password"
                              value={formData.password}
                              onChange={handleInputChange}
                              required
                            />
                            {fieldErrors.password && (
                              <div className="invalid-feedback">{fieldErrors.password}</div>
                            )}
                          </div>
                        )}

                        {/* Auth Type - Only for Customers */}
                        {isCustomer && (
                          <div className="col-md-6 mb-4">
                            <label className="label">Authentication Type</label>
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
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Customer Information Card */}
                  <div className={`card mb-4 ${!isCustomer ? 'd-none' : ''}`}>
                    <h5 className="card-header">Customer Information</h5>
                    <div className="card-body">
                      <div className="row">
                        <div className="col-md-4 mb-4">
                          <label className="label">Birth Date <span className="text-danger">*</span></label>
                          <AirDatePickerComponent
                            className={`form-control ${fieldErrors.date_of_birth ? 'is-invalid' : ''}`}
                            placeholder="Select birth date"
                            value={formData.date_of_birth}
                            onChange={(date: string) => {
                              setFormData(prev => ({
                                ...prev,
                                date_of_birth: date
                              }));
                            }}
                            maxDate={new Date()}
                            minDate={new Date('1900-01-01')}
                          />
                          {fieldErrors.date_of_birth && (
                            <div className="invalid-feedback d-block">{fieldErrors.date_of_birth}</div>
                          )}
                        </div>

                        <div className="col-md-4 mb-4">
                          <label className="label">Birth Time <span className="text-danger">*</span></label>
                          <input 
                            type="text" 
                            className={`form-control ${fieldErrors.birth_time ? 'is-invalid' : ''}`}
                            name="birth_time" 
                            value={formData.birth_time} 
                            onChange={handleInputChange} 
                            placeholder="07:30 AM"
                          />
                          {fieldErrors.birth_time && (
                            <div className="invalid-feedback">{fieldErrors.birth_time}</div>
                          )}
                        </div>

                        <div className="col-md-4 mb-4">
                          <label className="label">Birth Place <span className="text-danger">*</span></label>
                          <input 
                            type="text" 
                            className={`form-control ${fieldErrors.birth_place ? 'is-invalid' : ''}`}
                            name="birth_place" 
                            value={formData.birth_place} 
                            onChange={handleInputChange}
                          />
                          {fieldErrors.birth_place && (
                            <div className="invalid-feedback">{fieldErrors.birth_place}</div>
                          )}
                        </div>

                        <div className="col-md-12 mb-4">
                          <label className="label">Address <span className="text-danger">*</span></label>
                          <textarea 
                            className={`form-control ${fieldErrors.address ? 'is-invalid' : ''}`}
                            name="address"
                            value={formData.address}
                            onChange={handleInputChange}
                            rows={2}
                          />
                          {fieldErrors.address && (
                            <div className="invalid-feedback">{fieldErrors.address}</div>
                          )}
                        </div>

                        <div className="col-md-3 mb-4">
                          <label className="label">Country <span className="text-danger">*</span></label>
                          <input 
                            type="text" 
                            className={`form-control ${fieldErrors.country ? 'is-invalid' : ''}`}
                            name="country"
                            value={formData.country}
                            onChange={handleInputChange}
                          />
                          {fieldErrors.country && (
                            <div className="invalid-feedback">{fieldErrors.country}</div>
                          )}
                        </div>

                        <div className="col-md-3 mb-4">
                          <label className="label">State <span className="text-danger">*</span></label>
                          <input 
                            type="text" 
                            className={`form-control ${fieldErrors.state ? 'is-invalid' : ''}`}
                            name="state"
                            value={formData.state}
                            onChange={handleInputChange}
                          />
                          {fieldErrors.state && (
                            <div className="invalid-feedback">{fieldErrors.state}</div>
                          )}
                        </div>

                        <div className="col-md-3 mb-4">
                          <label className="label">City <span className="text-danger">*</span></label>
                          <input 
                            type="text" 
                            className={`form-control ${fieldErrors.city ? 'is-invalid' : ''}`}
                            name="city"
                            value={formData.city}
                            onChange={handleInputChange}
                          />
                          {fieldErrors.city && (
                            <div className="invalid-feedback">{fieldErrors.city}</div>
                          )}
                        </div>

                        <div className="col-md-3 mb-4">
                          <label className="label">ZIP Code <span className="text-danger">*</span></label>
                          <input 
                            type="text" 
                            className={`form-control ${fieldErrors.zip ? 'is-invalid' : ''}`}
                            name="zip"
                            value={formData.zip}
                            onChange={handleInputChange}
                          />
                          {fieldErrors.zip && (
                            <div className="invalid-feedback">{fieldErrors.zip}</div>
                          )}
                        </div>

                        <div className="col-md-6 mb-4">
                          <label className="label">Account Status</label>
                          <select 
                            className="custom-select" 
                            name="account_status" 
                            value={formData.account_status} 
                            onChange={handleInputChange}
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="banned">Banned</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Astrologer Information Card */}
                  <div className={`card mb-4 ${!isAstrologer ? 'd-none' : ''}`}>
                    <h5 className="card-header">Astrologer Information</h5>
                    <div className="card-body">
                      <div className="row">
                        <div className="col-md-12 mb-4">
                          <label className="label">Address <span className="text-danger">*</span></label>
                          <textarea 
                            className={`form-control ${fieldErrors.address ? 'is-invalid' : ''}`}
                            name="address"
                            value={formData.address}
                            onChange={handleInputChange}
                            rows={2}
                          />
                          {fieldErrors.address && (
                            <div className="invalid-feedback">{fieldErrors.address}</div>
                          )}
                        </div>

                        <div className="col-md-3 mb-4">
                          <label className="label">Country <span className="text-danger">*</span></label>
                          <input 
                            type="text" 
                            className={`form-control ${fieldErrors.country ? 'is-invalid' : ''}`}
                            name="country"
                            value={formData.country}
                            onChange={handleInputChange}
                          />
                          {fieldErrors.country && (
                            <div className="invalid-feedback">{fieldErrors.country}</div>
                          )}
                        </div>

                        <div className="col-md-3 mb-4">
                          <label className="label">State <span className="text-danger">*</span></label>
                          <input 
                            type="text" 
                            className={`form-control ${fieldErrors.state ? 'is-invalid' : ''}`}
                            name="state"
                            value={formData.state}
                            onChange={handleInputChange}
                          />
                          {fieldErrors.state && (
                            <div className="invalid-feedback">{fieldErrors.state}</div>
                          )}
                        </div>

                        <div className="col-md-3 mb-4">
                          <label className="label">City <span className="text-danger">*</span></label>
                          <input 
                            type="text" 
                            className={`form-control ${fieldErrors.city ? 'is-invalid' : ''}`}
                            name="city"
                            value={formData.city}
                            onChange={handleInputChange}
                          />
                          {fieldErrors.city && (
                            <div className="invalid-feedback">{fieldErrors.city}</div>
                          )}
                        </div>

                        <div className="col-md-3 mb-4">
                          <label className="label">ZIP Code <span className="text-danger">*</span></label>
                          <input 
                            type="text" 
                            className={`form-control ${fieldErrors.zip ? 'is-invalid' : ''}`}
                            name="zip"
                            value={formData.zip}
                            onChange={handleInputChange}
                          />
                          {fieldErrors.zip && (
                            <div className="invalid-feedback">{fieldErrors.zip}</div>
                          )}
                        </div>

                        <div className="col-md-6 mb-4">
                          <label className="label">Account Status</label>
                          <select 
                            className="custom-select" 
                            name="account_status" 
                            value={formData.account_status} 
                            onChange={handleInputChange}
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="banned">Banned</option>
                          </select>
                        </div>

                        <div className="col-md-6 mb-4">
                          <label className="label">Verification Status</label>
                          <select 
                            className="custom-select"
                            name="verification_status"
                            value={formData.verification_status}
                            onChange={handleInputChange}
                          >
                            <option value="pending">Pending</option>
                            <option value="verified">Verified</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        </div>

                        <div className="col-md-12 mb-4">
                          <div className="form-check">
                            <input 
                              className="form-check-input" 
                              type="checkbox" 
                              id="is_featured"
                              name="is_featured"
                              checked={formData.is_featured}
                              onChange={handleInputChange}
                            />
                            <label className="form-check-label" htmlFor="is_featured">
                              Featured Astrologer
                            </label>
                          </div>
                        </div>

                        {/* Bio */}
                        <div className="col-md-12 mb-4">
                          <label className="label">Bio</label>
                          <textarea 
                            className="form-control"
                            name="bio"
                            value={formData.bio}
                            onChange={handleInputChange}
                            rows={3}
                            placeholder="Brief description about the astrologer..."
                          />
                          <small className="text-muted">Professional background and specialization</small>
                        </div>

                        {/* Experience Years & Skills Row */}
                        <div className="col-6 mb-4">
                          <label className="label">Experience Years</label>
                          <input 
                            type="number" 
                            className="form-control"
                            name="experience_years"
                            value={formData.experience_years}
                            onChange={handleInputChange}
                            min="0"
                            max="50"
                          />
                          <small className="text-muted">Years of experience in astrology</small>
                        </div>

                        <div className="col-6 mb-4">
                          <label className="label">Skills</label>
                          <select 
                            className="form-control select2-multiple" 
                            multiple 
                            id="skills-select"
                            value={formData.skills}
                            onChange={(e) => {
                              const selectedValues = Array.from((e.target as HTMLSelectElement).selectedOptions, option => option.value);
                              setFormData(prev => ({
                                ...prev,
                                skills: selectedValues
                              }));
                            }}
                          >
                            {availableSkills.map((skill) => (
                              <option key={skill} value={skill}>{skill}</option>
                            ))}
                          </select>
                        </div>

                        {/* Languages & Qualifications Row */}
                        <div className="col-6 mb-4">
                          <label className="label">Languages</label>
                          <select 
                            className="form-control select2-multiple" 
                            multiple 
                            id="languages-select"
                            value={formData.languages}
                            onChange={(e) => {
                              const selectedValues = Array.from((e.target as HTMLSelectElement).selectedOptions, option => option.value);
                              setFormData(prev => ({
                                ...prev,
                                languages: selectedValues
                              }));
                            }}
                          >
                            {availableLanguages.map((language) => (
                              <option key={language} value={language}>{language}</option>
                            ))}
                          </select>
                        </div>

                        <div className="col-6 mb-4">
                          <label className="label">Qualifications</label>
                          <div className="qualifications-tag-input">
                            <div 
                              className="select2-selection select2-selection--multiple form-control" 
                              onClick={(e) => {
                                const input = e.currentTarget.querySelector('input');
                                if (input) input.focus();
                              }}
                              style={{
                                display: 'flex',
                                flexWrap: 'nowrap',
                                overflowX: 'auto',
                                overflowY: 'hidden',
                                whiteSpace: 'nowrap',
                                minHeight: '38px',
                                maxHeight: '38px',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '4px 8px'
                              }}
                            >
                              {formData.qualifications.map((qual, index) => (
                                <span key={index} className="select2-selection__choice" style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
                                  <span 
                                    className="select2-selection__choice__remove" 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeQualification(index);
                                    }}
                                  >
                                    ×
                                  </span>
                                  {qual}
                                </span>
                              ))}
                              <input 
                                type="text" 
                                className="select2-search__field"
                                value={qualificationInput} 
                                onChange={(e) => setQualificationInput(e.target.value)} 
                                placeholder={formData.qualifications.length === 0 ? "Add qualifications..." : ""} 
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    addQualification();
                                  }
                                  if (e.key === 'Backspace' && qualificationInput === '' && formData.qualifications.length > 0) {
                                    removeQualification(formData.qualifications.length - 1);
                                  }
                                }}
                                style={{
                                  border: 'none',
                                  outline: 'none',
                                  flexGrow: 1,
                                  minWidth: '120px',
                                  background: 'transparent'
                                }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* PAN Card Upload */}
                        <div className="col-md-12 mb-4">
                          <label className="label">PAN Card <span className="text-danger">*</span></label>
                          <div className="mb-3">
                            {panCardPreview ? (
                              <div className="position-relative" style={{ cursor: 'pointer' }} onClick={() => setShowPanCardLibrary(true)}>
                                <Image
                                  src={panCardPreview}
                                  alt='PAN Card Preview'
                                  width={400}
                                  height={250}
                                  className='img-thumbnail'
                                  style={{ width: '100%', height: 'auto', objectFit: 'cover' }}
                                />
                                <button
                                  type="button"
                                  className="btn btn-danger btn-sm position-absolute"
                                  style={{ top: '10px', right: '10px' }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removePanCard();
                                  }}
                                >
                                  <i className="fas fa-times"></i> Remove
                                </button>
                              </div>
                            ) : (
                              <div 
                                className="bg-light d-flex align-items-center justify-content-center"
                                style={{ 
                                  width: '100%', 
                                  height: '200px', 
                                  cursor: 'pointer', 
                                  border: '2px dashed #dee2e6',
                                  borderRadius: '8px'
                                }}
                                onClick={() => setShowPanCardLibrary(true)}
                              >
                                <div className="text-center">
                                  <i className="fas fa-file-upload fa-3x text-primary mb-2"></i>
                                  <div className="text-primary font-weight-bold">Click to upload PAN Card</div>
                                  <small className="text-muted">JPG, PNG files supported</small>
                                </div>
                              </div>
                            )}
                          </div>
                          {fieldErrors.pan_card && (
                            <div className="text-danger small">
                              <i className="fas fa-exclamation-circle"></i> {fieldErrors.pan_card}
                            </div>
                          )}
                          <small className="text-muted">Click to select PAN card from media library</small>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Astrologer Rates & Commission Card */}
                  <div className={`card mb-4 ${!isAstrologer ? 'd-none' : ''}`}>
                    <h5 className="card-header">Rates & Commission</h5>
                    <div className="card-body">
                      <div className="row">
                        <div className="col-md-4 mb-4">
                          <label className="label">Call Rate (₹/min) <span className="text-danger">*</span></label>
                          <input 
                            type="number" 
                            className={`form-control ${fieldErrors.call_rate ? 'is-invalid' : ''}`}
                            name="call_rate"
                            value={formData.call_rate}
                            onChange={handleInputChange}
                            min="0"
                          />
                          {fieldErrors.call_rate && (
                            <div className="invalid-feedback">{fieldErrors.call_rate}</div>
                          )}
                        </div>

                        <div className="col-md-4 mb-4">
                          <label className="label">Chat Rate (₹/min) <span className="text-danger">*</span></label>
                          <input 
                            type="number" 
                            className={`form-control ${fieldErrors.chat_rate ? 'is-invalid' : ''}`}
                            name="chat_rate"
                            value={formData.chat_rate}
                            onChange={handleInputChange}
                            min="0"
                          />
                          {fieldErrors.chat_rate && (
                            <div className="invalid-feedback">{fieldErrors.chat_rate}</div>
                          )}
                        </div>

                        <div className="col-md-4 mb-4">
                          <label className="label">Video Rate (₹/min) <span className="text-danger">*</span></label>
                          <input 
                            type="number" 
                            className={`form-control ${fieldErrors.video_rate ? 'is-invalid' : ''}`}
                            name="video_rate"
                            value={formData.video_rate}
                            onChange={handleInputChange}
                            min="0"
                          />
                          {fieldErrors.video_rate && (
                            <div className="invalid-feedback">{fieldErrors.video_rate}</div>
                          )}
                        </div>

                        <div className="col-md-4 mb-4">
                          <label className="label">Call Commission (%)</label>
                          <input 
                            type="number" 
                            className="form-control"
                            name="commission_percentage.call"
                            value={formData.commission_percentage.call}
                            onChange={handleInputChange}
                            min="0"
                            max="100"
                          />
                          <small className="text-muted">Platform commission percentage</small>
                        </div>

                        <div className="col-md-4 mb-4">
                          <label className="label">Chat Commission (%)</label>
                          <input 
                            type="number" 
                            className="form-control"
                            name="commission_percentage.chat"
                            value={formData.commission_percentage.chat}
                            onChange={handleInputChange}
                            min="0"
                            max="100"
                          />
                          <small className="text-muted">Platform commission percentage</small>
                        </div>

                        <div className="col-md-4 mb-4">
                          <label className="label">Video Commission (%)</label>
                          <input 
                            type="number" 
                            className="form-control"
                            name="commission_percentage.video"
                            value={formData.commission_percentage.video}
                            onChange={handleInputChange}
                            min="0"
                            max="100"
                          />
                          <small className="text-muted">Platform commission percentage</small>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bank Details Card - Only for Astrologers */}
                  <div className={`card mb-4 ${!isAstrologer ? 'd-none' : ''}`}>
                    <h5 className="card-header">Bank Details (For Payouts)</h5>
                    <div className="card-body">
                      <div className="row">
                        <div className="col-md-6 mb-4">
                          <label className="label">Account Holder Name <span className="text-danger">*</span></label>
                          <input 
                            type="text" 
                            className={`form-control ${fieldErrors.account_holder_name ? 'is-invalid' : ''}`}
                            name="bank_details.account_holder_name"
                            value={formData.bank_details.account_holder_name}
                            onChange={handleInputChange}
                            placeholder="Enter name as per bank account"
                          />
                          {fieldErrors.account_holder_name && (
                            <div className="invalid-feedback">{fieldErrors.account_holder_name}</div>
                          )}
                        </div>

                        <div className="col-md-6 mb-4">
                          <label className="label">Account Number <span className="text-danger">*</span></label>
                          <input 
                            type="text" 
                            className={`form-control ${fieldErrors.account_number ? 'is-invalid' : ''}`}
                            name="bank_details.account_number"
                            value={formData.bank_details.account_number}
                            onChange={handleInputChange}
                            placeholder="Enter bank account number"
                          />
                          {fieldErrors.account_number && (
                            <div className="invalid-feedback">{fieldErrors.account_number}</div>
                          )}
                        </div>

                        <div className="col-md-6 mb-4">
                          <label className="label">Bank Name <span className="text-danger">*</span></label>
                          <input 
                            type="text" 
                            className={`form-control ${fieldErrors.bank_name ? 'is-invalid' : ''}`}
                            name="bank_details.bank_name"
                            value={formData.bank_details.bank_name}
                            onChange={handleInputChange}
                            placeholder="Enter bank name"
                          />
                          {fieldErrors.bank_name && (
                            <div className="invalid-feedback">{fieldErrors.bank_name}</div>
                          )}
                        </div>

                        <div className="col-md-6 mb-4">
                          <label className="label">IFSC Code <span className="text-danger">*</span></label>
                          <input 
                            type="text" 
                            className={`form-control ${fieldErrors.ifsc_code ? 'is-invalid' : ''}`}
                            name="bank_details.ifsc_code"
                            value={formData.bank_details.ifsc_code}
                            onChange={handleInputChange}
                            placeholder="e.g., SBIN0123456"
                            style={{ textTransform: 'uppercase' }}
                          />
                          {fieldErrors.ifsc_code && (
                            <div className="invalid-feedback">{fieldErrors.ifsc_code}</div>
                          )}
                          <small className="text-muted">11-character alphanumeric code</small>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="row">
                    <div className="col-12">
                      <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? (
                          <><i className="fas fa-spinner fa-spin mr-2"></i>Processing...</>
                        ) : (
                          <>Create Account</>
                        )}
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
      
      {/* Media Library Modals */}
      <MediaLibrary
        isOpen={showProfileImageLibrary}
        onClose={() => setShowProfileImageLibrary(false)}
        onSelect={handleProfileImageSelect}
        selectedImage={imagePreview}
      />
      
      <MediaLibrary
        isOpen={showPanCardLibrary}
        onClose={() => setShowPanCardLibrary(false)}
        onSelect={handlePanCardSelect}
        selectedImage={panCardPreview}
      />
    </div>
  );
}

export default function AddUserPage() {
  return (
    <Suspense fallback={
      <div className="dashboard-main-wrapper">
        <Header />
        <Sidebar />
        <div className="dashboard-wrapper">
          <div className="dashboard-ecommerce">
            <div className="container-fluid dashboard-content">
              <div className="text-center">
                <i className="fas fa-spinner fa-spin fa-3x text-primary"></i>
                <p className="mt-3">Loading...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    }>
      <AddUserPageContent />
    </Suspense>
  );
}