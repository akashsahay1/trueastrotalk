'use client';

import Header from '@/components/admin/Header';
import Sidebar from '@/components/admin/Sidebar';
import MediaLibrary from '@/components/admin/MediaLibrary';
import { useEffect, useState, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { validateForm, getUserFormRules, displayFieldErrors, clearValidationErrors } from '@/lib/client-validation';
import { successMessages, errorMessages, showLoadingAlert, closeSweetAlert } from '@/lib/sweetalert';
import AirDatePickerComponent from '@/components/admin/AirDatePickerComponent';

interface FormData {
  profile_image_id: string;
  social_auth_profile_image: string;
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
  qualifications: string[];
  skills: string[];
  languages: string[];
  commission_rates: {
    call_rate: number;
    chat_rate: number;
    video_rate: number;
  };
  commission_percentage: {
    call: number;
    chat: number;
    video: number;
  };
  experience_years: number;
  bio: string;
  // Bank details for astrologer payouts
  bank_details: {
    account_holder_name: string;
    account_number: string;
    bank_name: string;
    ifsc_code: string;
  };
}

function EditUserContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams?.get('id');

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});
  const [defaultCommission, setDefaultCommission] = useState(25);

  const [formData, setFormData] = useState<FormData>({
    profile_image_id: '',
    social_auth_profile_image: '',
    pan_card_id: '',
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
    is_featured: false,
    verification_status: 'pending',
    verification_status_message: '',
    qualifications: [],
    skills: [],
    languages: [],
    commission_rates: {
      call_rate: 0,
      chat_rate: 0,
      video_rate: 0
    },
    commission_percentage: {
      call: defaultCommission,
      chat: defaultCommission,
      video: defaultCommission
    },
    experience_years: 0,
    bio: '',
    bank_details: {
      account_holder_name: '',
      account_number: '',
      bank_name: '',
      ifsc_code: ''
    }
  });

  const [imagePreview, setImagePreview] = useState('');
  const [isMediaLibraryOpen, setIsMediaLibraryOpen] = useState(false);
  const [panCardUploading, setPanCardUploading] = useState(false);
  const [panCardPreview, setPanCardPreview] = useState('');
  const [showPanCardLibrary, setShowPanCardLibrary] = useState(false);

  // Define user type booleans for conditional rendering
  const isAstrologer = formData.user_type === 'astrologer';
  const isCustomer = formData.user_type === 'customer';
  const isAdmin = formData.user_type === 'administrator';
  const isManager = formData.user_type === 'manager';

  const loadAdminSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings/general');
      const data = await response.json();
      
      if (response.ok && data.config?.commission?.defaultRate) {
        const defaultRate = data.config.commission.defaultRate;
        setDefaultCommission(defaultRate);
      }
    } catch (error) {
      console.error('Failed to load admin settings:', error);
    }
  };

  const fetchUser = useCallback(async () => {
    if (!userId) return;

    setFetchLoading(true);
    try {
      const response = await fetch(`/api/users/${userId}`);
      const data = await response.json();

      if (response.ok) {
        const user = data.user;

        const formatDate = (dateString: string) => {
          if (!dateString) return '';
          try {
            return new Date(dateString).toISOString().split('T')[0];
          } catch {
            return '';
          }
        };

        const formatTime = (timeString: string) => {
          if (!timeString) return '';
          if (/^\d{2}:\d{2}$/.test(timeString)) {
            return timeString;
          }
          if (/^\d{2}:\d{2}:\d{2}$/.test(timeString)) {
            return timeString.substring(0, 5);
          }
          try {
            const date = new Date(timeString);
            if (!isNaN(date.getTime())) {
              return date.toTimeString().substring(0, 5);
            }
          } catch {
            // Fallback
          }
          return timeString;
        };

        setFormData({
          profile_image_id: user.profile_image_id || '',
          social_auth_profile_image: user.social_auth_profile_image || '',
          pan_card_id: user.pan_card_id || '',
          full_name: user.full_name || '',
          email_address: user.email_address || '',
          password: '', // Keep password empty for security
          user_type: user.user_type || 'customer',
          auth_type: user.auth_type || 'email',
          phone_number: user.phone_number || '',
          gender: user.gender || 'male',
          date_of_birth: formatDate(user.date_of_birth),
          birth_time: formatTime(user.birth_time),
          birth_place: user.birth_place || '',
          address: user.address || '',
          city: user.city || '',
          state: user.state || '',
          country: user.country || 'India',
          zip: user.zip || '',
          account_status: user.account_status || 'active',
          is_online: user.is_online || false,
          is_featured: user.is_featured || false,
          verification_status: user.verification_status || 'pending',
          verification_status_message: user.verification_status_message || '',
          qualifications: user.qualifications ? (Array.isArray(user.qualifications) ? user.qualifications : user.qualifications.split(',').map((s: string) => s.trim()).filter((s: string) => s)) : [],
          skills: user.skills ? (Array.isArray(user.skills) ? user.skills : user.skills.split(',').map((s: string) => s.trim()).filter((s: string) => s)) : [],
          languages: user.languages ? (Array.isArray(user.languages) ? user.languages : user.languages.split(',').map((s: string) => s.trim()).filter((s: string) => s)) : [],
          commission_rates: {
            call_rate: user.commission_rates?.call_rate || user.call_rate || 0,
            chat_rate: user.commission_rates?.chat_rate || user.chat_rate || 0,
            video_rate: user.commission_rates?.video_rate || user.video_rate || 0
          },
          commission_percentage: {
            call: user.commission_percentage?.call || defaultCommission,
            chat: user.commission_percentage?.chat || defaultCommission,
            video: user.commission_percentage?.video || defaultCommission
          },
          experience_years: user.experience_years || 0,
          bio: user.bio || '',
          bank_details: {
            account_holder_name: user.bank_details?.account_holder_name || '',
            account_number: user.bank_details?.account_number || '',
            bank_name: user.bank_details?.bank_name || '',
            ifsc_code: user.bank_details?.ifsc_code || ''
          }
        });

        if (user.profile_image) {
          setImagePreview(user.profile_image);
        }
        
        if (user.pan_card_image) {
          setPanCardPreview(user.pan_card_image);
        }
      } else {
        setError(data.error || 'Failed to fetch user data');
      }
    } catch (error) {
      setError('An error occurred while fetching user data');
      console.error('Fetch user error:', error);
    } finally {
      setFetchLoading(false);
    }
  }, [userId, defaultCommission]);

  useEffect(() => {
    document.body.className = '';

    if (!userId) {
      setError('User ID is required');
      setFetchLoading(false);
      return;
    }

    loadAdminSettings();
    fetchUser();
  }, [userId, fetchUser]);

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

  const handleImageSelect = (imageUrl: string, mediaId?: string) => {
    setFormData(prev => ({
      ...prev,
      profile_image_id: mediaId || '',
      social_auth_profile_image: ''
    }));
    setImagePreview(imageUrl);
    setError('');
  };

  const handlePanCardSelect = (imageUrl: string, mediaId?: string) => {
    setFormData(prev => ({
      ...prev,
      pan_card_id: mediaId || ''
    }));
    setPanCardPreview(imageUrl);
    setShowPanCardLibrary(false);
  };

  const removePanCard = () => {
    setFormData(prev => ({
      ...prev,
      pan_card_id: ''
    }));
    setPanCardPreview('');
  };

  const openMediaLibrary = () => {
    setIsMediaLibraryOpen(true);
  };

  const removeImage = () => {
    setFormData(prev => ({
      ...prev,
      profile_image_id: '',
      social_auth_profile_image: ''
    }));
    setImagePreview('');
  };

  const validateUserForm = () => {
    clearValidationErrors();

    const customErrors: {[key: string]: string} = {};

    // Basic validations for all user types
    if (!formData.full_name.trim()) {
      customErrors.full_name = 'Full name is required';
    }

    if (!formData.email_address.trim()) {
      customErrors.email_address = 'Email address is required';
    }

    // Password validation for edit (optional unless changing)
    if (formData.password && formData.password.length < 6) {
      customErrors.password = 'Password must be at least 6 characters';
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
      if (formData.commission_rates.call_rate <= 0) {
        customErrors.call_rate = 'Call rate must be greater than 0';
      }
      if (formData.commission_rates.chat_rate <= 0) {
        customErrors.chat_rate = 'Chat rate must be greater than 0';
      }
      if (formData.commission_rates.video_rate <= 0) {
        customErrors.video_rate = 'Video rate must be greater than 0';
      }
      
      // PAN Card validation
      if (!formData.pan_card_id || formData.pan_card_id.trim() === '') {
        customErrors.pan_card = 'PAN card upload is required for astrologers';
      }
      
      // Bank details validation
      if (!formData.bank_details.account_holder_name.trim()) {
        customErrors.bank_account_holder_name = 'Account holder name is required';
      }
      if (!formData.bank_details.account_number.trim()) {
        customErrors.bank_account_number = 'Account number is required';
      }
      if (!formData.bank_details.bank_name.trim()) {
        customErrors.bank_bank_name = 'Bank name is required';
      }
      if (!formData.bank_details.ifsc_code.trim()) {
        customErrors.bank_ifsc_code = 'IFSC code is required';
      } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.bank_details.ifsc_code)) {
        customErrors.bank_ifsc_code = 'Invalid IFSC code format';
      }
    }

    if (Object.keys(customErrors).length > 0) {
      setFieldErrors(customErrors);
      const firstError = Object.values(customErrors)[0];
      errorMessages.updateFailed(`Validation Error: ${firstError}`);
      return false;
    }

    setFieldErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setFieldErrors({});

    if (!validateUserForm()) {
      return;
    }

    showLoadingAlert('Updating user...');
    setLoading(true);

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          qualifications: formData.qualifications.join(','),
          skills: formData.skills.join(','),
          languages: formData.languages.join(','),
          call_rate: formData.commission_rates.call_rate,
          chat_rate: formData.commission_rates.chat_rate,
          video_rate: formData.commission_rates.video_rate,
          commission_percentage: formData.commission_percentage,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        closeSweetAlert();
        await successMessages.updated('User');

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
        errorMessages.updateFailed(`user: ${data.error || 'Unknown error occurred'}`);
        setError(data.error || 'Failed to update user');
      }
    } catch (error) {
      closeSweetAlert();
      errorMessages.networkError();
      setError('An error occurred. Please try again.');
      console.error('Update user error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="dashboard-main-wrapper">
        <Header />
        <Sidebar />
        <div className="dashboard-wrapper">
          <div className="dashboard-ecommerce">
            <div className="container-fluid dashboard-content">
              <div className="text-center p-5">
                <i className="fas fa-spinner fa-spin fa-3x text-primary"></i>
                <p className="mt-3">Loading user data...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="dashboard-main-wrapper">
        <Header />
        <Sidebar />
        <div className="dashboard-wrapper">
          <div className="dashboard-ecommerce">
            <div className="container-fluid dashboard-content">
              <div className="alert alert-danger">
                User ID is required to edit a user.
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
              <div className="col-xl-12">
                <div className="page-header">
                  <h2 className="pageheader-title">Edit User</h2>
                  <p className="pageheader-text">Update user account information</p>
                  <div className="page-breadcrumb">
                    <nav aria-label="breadcrumb">
                      <ol className="breadcrumb">
                        <li className="breadcrumb-item">
                          <Link href="/dashboard" className="breadcrumb-link">Dashboard</Link>
                        </li>
                        <li className="breadcrumb-item">
                          <span className="breadcrumb-link">Accounts</span>
                        </li>
                        <li className="breadcrumb-item active" aria-current="page">Edit User</li>
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
                                      alt="Profile Preview"
                                      width={80}
                                      height={80}
                                      className="rounded-circle"
                                      style={{ width: '80px', height: '80px', objectFit: 'cover', cursor: 'pointer', border: '2px solid #dee2e6' }}
                                      onClick={openMediaLibrary}
                                    />
                                    <button
                                      type="button"
                                      className="btn btn-danger btn-sm position-absolute"
                                      style={{ top: '-5px', right: '-5px', width: '25px', height: '25px', borderRadius: '50%', padding: '0' }}
                                      onClick={removeImage}
                                    >×</button>
                                  </>
                                ) : (
                                  <div 
                                    className="rounded-circle bg-light d-flex align-items-center justify-content-center"
                                    style={{ width: '80px', height: '80px', cursor: 'pointer', border: '2px dashed #dee2e6' }}
                                    onClick={openMediaLibrary}
                                  >
                                    <i className="fas fa-plus fa-lg text-primary"></i>
                                  </div>
                                )}
                              </div>
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

                        {/* Password */}
                        <div className="col-md-6 mb-4">
                          <label className="label">
                            Password (Leave empty to keep current)
                          </label>
                          <input 
                            type="password" 
                            className={`form-control ${fieldErrors.password ? 'is-invalid' : ''}`}
                            name="password" 
                            value={formData.password} 
                            onChange={handleInputChange}
                            placeholder="Enter new password or leave empty"
                          />
                          {fieldErrors.password && (
                            <div className="invalid-feedback">{fieldErrors.password}</div>
                          )}
                        </div>

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

                        {/* PAN Card Upload */}
                        <div className={`col-md-12 mb-4 ${!isAstrologer ? 'd-none' : ''}`}>
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
                                  style={{ width: '100%', height: 'auto', maxWidth: '400px', objectFit: 'cover' }}
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

                  {/* Bank Details Card - For Astrologers */}
                  <div className={`card mb-4 ${!isAstrologer ? 'd-none' : ''}`}>
                    <h5 className="card-header">Bank Details</h5>
                    <div className="card-body">
                      <div className="row">
                        <div className="col-md-6 mb-4">
                          <label className="label">Account Holder Name <span className="text-danger">*</span></label>
                          <input 
                            type="text" 
                            className={`form-control ${fieldErrors.bank_account_holder_name ? 'is-invalid' : ''}`}
                            name="bank_details.account_holder_name"
                            value={formData.bank_details.account_holder_name}
                            onChange={handleInputChange}
                            placeholder="Full name as per bank records"
                          />
                          {fieldErrors.bank_account_holder_name && (
                            <div className="invalid-feedback">{fieldErrors.bank_account_holder_name}</div>
                          )}
                        </div>

                        <div className="col-md-6 mb-4">
                          <label className="label">Account Number <span className="text-danger">*</span></label>
                          <input 
                            type="text" 
                            className={`form-control ${fieldErrors.bank_account_number ? 'is-invalid' : ''}`}
                            name="bank_details.account_number"
                            value={formData.bank_details.account_number}
                            onChange={handleInputChange}
                            placeholder="Bank account number"
                          />
                          {fieldErrors.bank_account_number && (
                            <div className="invalid-feedback">{fieldErrors.bank_account_number}</div>
                          )}
                        </div>

                        <div className="col-md-6 mb-4">
                          <label className="label">Bank Name <span className="text-danger">*</span></label>
                          <input 
                            type="text" 
                            className={`form-control ${fieldErrors.bank_bank_name ? 'is-invalid' : ''}`}
                            name="bank_details.bank_name"
                            value={formData.bank_details.bank_name}
                            onChange={handleInputChange}
                            placeholder="Bank name"
                          />
                          {fieldErrors.bank_bank_name && (
                            <div className="invalid-feedback">{fieldErrors.bank_bank_name}</div>
                          )}
                        </div>

                        <div className="col-md-6 mb-4">
                          <label className="label">IFSC Code <span className="text-danger">*</span></label>
                          <input 
                            type="text" 
                            className={`form-control ${fieldErrors.bank_ifsc_code ? 'is-invalid' : ''}`}
                            name="bank_details.ifsc_code"
                            value={formData.bank_details.ifsc_code}
                            onChange={handleInputChange}
                            placeholder="IFSC code (e.g., SBIN0001234)"
                            style={{ textTransform: 'uppercase' }}
                          />
                          {fieldErrors.bank_ifsc_code && (
                            <div className="invalid-feedback">{fieldErrors.bank_ifsc_code}</div>
                          )}
                          <small className="text-muted">11-character IFSC code for fund transfers</small>
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
                            name="commission_rates.call_rate"
                            value={formData.commission_rates.call_rate}
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
                            name="commission_rates.chat_rate"
                            value={formData.commission_rates.chat_rate}
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
                            name="commission_rates.video_rate"
                            value={formData.commission_rates.video_rate}
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

                  {/* Submit Button */}
                  <div className="row">
                    <div className="col-12">
                      <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? (
                          <><i className="fas fa-spinner fa-spin mr-2"></i>Updating...</>
                        ) : (
                          <>Update Account</>
                        )}
                      </button>
                      <Link href="/accounts/customers" className="btn btn-secondary ml-2">
                        Cancel
                      </Link>
                    </div>
                  </div>

                </div>
              </div>
            </form>

            {/* Media Library Modals */}
            <MediaLibrary
              isOpen={isMediaLibraryOpen}
              onClose={() => setIsMediaLibraryOpen(false)}
              onSelect={handleImageSelect}
              selectedImage={imagePreview}
            />
            
            <MediaLibrary
              isOpen={showPanCardLibrary}
              onClose={() => setShowPanCardLibrary(false)}
              onSelect={handlePanCardSelect}
              selectedImage={panCardPreview}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EditUserPage() {
  return (
    <Suspense fallback={
      <div className="dashboard-main-wrapper">
        <Header />
        <Sidebar />
        <div className="dashboard-wrapper">
          <div className="dashboard-ecommerce">
            <div className="container-fluid dashboard-content">
              <div className="text-center p-5">
                <i className="fas fa-spinner fa-spin fa-3x text-primary"></i>
                <p className="mt-3">Loading page...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    }>
      <EditUserContent />
    </Suspense>
  );
}