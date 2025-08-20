'use client';

import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import MediaLibrary from '@/components/MediaLibrary';
import { useEffect, useState, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { validateForm, getUserFormRules, displayFieldErrors, clearValidationErrors } from '@/lib/validation';
import { successMessages, errorMessages, showLoadingAlert, closeSweetAlert } from '@/lib/sweetalert';
import AirDatePickerComponent from '@/components/AirDatePickerComponent';

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
  experience_years: number;
  bio: string;
}

interface AstrologerOptions {
  languages: string[];
  skills: string[];
}

function EditUserContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('id');

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});

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
    experience_years: 0,
    bio: ''
  });

  const [qualificationInput, setQualificationInput] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [isMediaLibraryOpen, setIsMediaLibraryOpen] = useState(false);

  // Dropdown states for languages and skills
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showSkillDropdown, setShowSkillDropdown] = useState(false);

  // Astrologer options from API
  const [astrologerOptions, setAstrologerOptions] = useState<AstrologerOptions>({
    languages: [],
    skills: []
  });
  const [optionsLoading, setOptionsLoading] = useState(true);

  const loadAstrologerOptions = async () => {
    try {
      setOptionsLoading(true);
      const response = await fetch('/api/astrologer-options/active');
      const data = await response.json();

      if (response.ok) {
        setAstrologerOptions(data.data);
      } else {
        console.error('Failed to load astrologer options:', data.error);
      }
    } catch (error) {
      console.error('Error loading astrologer options:', error);
    } finally {
      setOptionsLoading(false);
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

        // Format dates for input fields
        const formatDate = (dateString: string) => {
          if (!dateString) return '';
          try {
            return new Date(dateString).toISOString().split('T')[0];
          } catch {
            return '';
          }
        };

        setFormData({
          profile_image: user.profile_image || '',
          full_name: user.full_name || '',
          email_address: user.email_address || '',
          password: '', // Keep password empty for security
          user_type: user.user_type || 'customer',
          auth_type: user.auth_type || 'email',
          phone_number: user.phone_number || '',
          gender: user.gender || 'male',
          date_of_birth: formatDate(user.date_of_birth),
          birth_time: user.birth_time || '',
          birth_place: user.birth_place || '',
          address: user.address || '',
          city: user.city || '',
          state: user.state || '',
          country: user.country || 'India',
          zip: user.zip || '',
          account_status: user.account_status || 'active',
          is_online: user.is_online || false,
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
          experience_years: user.experience_years || 0,
          bio: user.bio || ''
        });

        // Set image preview if profile image exists
        if (user.profile_image) {
          setImagePreview(user.profile_image);
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
  }, [userId]);

  useEffect(() => {
    document.body.className = '';

    if (!userId) {
      setError('User ID is required');
      setFetchLoading(false);
      return;
    }

    loadAstrologerOptions();
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

  const toggleLanguage = (language: string) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.includes(language)
        ? prev.languages.filter(l => l !== language)
        : [...prev.languages, language]
    }));
  };

  const toggleSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const handleImageSelect = (imageUrl: string) => {
    setFormData(prev => ({
      ...prev,
      profile_image: imageUrl
    }));
    setImagePreview(imageUrl);
    setError(''); // Clear any previous errors
  };

  const openMediaLibrary = () => {
    setIsMediaLibraryOpen(true);
  };

  const removeImage = () => {
    setFormData(prev => ({
      ...prev,
      profile_image: ''
    }));
    setImagePreview('');
  };

  const validateUserForm = () => {
    // Clear previous validation errors
    clearValidationErrors();

    // Prepare form data for validation
    const formDataForValidation = {
      full_name: formData.full_name,
      email_address: formData.email_address,
      phone_number: formData.phone_number,
      city: formData.city,
      state: formData.state,
      user_type: formData.user_type,
      account_status: formData.account_status
    };

    // Get validation rules
    const rules = getUserFormRules(formData.user_type);

    // Validate form
    const validation = validateForm(formDataForValidation, rules);

    // Additional custom validations for edit user
    const customErrors: {[key: string]: string} = {};

    // Date of birth validation
    if (!formData.date_of_birth) {
      customErrors.date_of_birth = 'Date of birth is required';
    } else {
      const birthDate = new Date(formData.date_of_birth);
      const today = new Date();
      const minAge = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate());
      const maxAge = new Date(today.getFullYear() - 13, today.getMonth(), today.getDate());

      if (birthDate > maxAge) {
        customErrors.date_of_birth = 'User must be at least 13 years old';
      } else if (birthDate < minAge) {
        customErrors.date_of_birth = 'Please enter a valid birth date';
      }
    }

    // Gender validation
    if (!formData.gender) {
      customErrors.gender = 'Gender is required';
    }

    // Country validation
    if (!formData.country.trim()) {
      customErrors.country = 'Country is required';
    }

    // Astrologer-specific validation
    if (formData.user_type === 'astrologer') {
      // Birth time validation for astrologers
      if (!formData.birth_time) {
        customErrors.birth_time = 'Birth time is required for astrologers';
      }

      // Birth place validation for astrologers
      if (!formData.birth_place.trim()) {
        customErrors.birth_place = 'Birth place is required for astrologers';
      }

      // Address validation for astrologers
      if (!formData.address.trim()) {
        customErrors.address = 'Address is required for astrologers';
      }

      // ZIP code validation for astrologers
      if (!formData.zip.trim()) {
        customErrors.zip = 'ZIP code is required for astrologers';
      }

      if (formData.experience_years < 0 || formData.experience_years > 50) {
        customErrors.experience_years = 'Experience must be between 0 and 50 years';
      }

      // Commission rates validation
      const validateRate = (rate: number, fieldName: string, displayName: string) => {
        if (rate < 0 || rate > 100) {
          customErrors[fieldName] = `${displayName} must be between 0% and 100%`;
        }
      };

      validateRate(formData.commission_rates.call_rate, 'call_rate', 'Call commission rate');
      validateRate(formData.commission_rates.chat_rate, 'chat_rate', 'Chat commission rate');
      validateRate(formData.commission_rates.video_rate, 'video_rate', 'Video commission rate');

      if (formData.languages.length === 0) {
        customErrors.languages = 'At least one language is required for astrologers';
      }

      if (formData.skills.length === 0) {
        customErrors.skills = 'At least one skill is required for astrologers';
      }

      if (formData.qualifications.length === 0) {
        customErrors.qualifications = 'At least one qualification is required for astrologers';
      }

      if (!formData.bio || formData.bio.trim().length === 0) {
        customErrors.bio = 'Professional bio is required for astrologers';
      }
    }

    // Combine all errors
    const allErrors = { ...validation.errors, ...customErrors };

    // Display errors on form fields
    if (Object.keys(allErrors).length > 0) {
      displayFieldErrors(allErrors);
      setFieldErrors(allErrors);

      // Show first error in SweetAlert
      const firstError = Object.values(allErrors)[0];
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

    // Validate form first
    if (!validateUserForm()) {
      return;
    }

    // Show loading alert
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
          qualifications: formData.qualifications.join(','), // Keep as qualifications for backend
          skills: formData.skills.join(','),
          languages: formData.languages.join(','),
          commission_rates: {
            call_rate: formData.commission_rates.call_rate,
            chat_rate: formData.commission_rates.chat_rate,
            video_rate: formData.commission_rates.video_rate,
          },
        }),
      });

      const data = await response.json();

      if (response.ok) {
        closeSweetAlert();
        await successMessages.updated('User');

        // Redirect to appropriate page
        let redirectPath = '/admin/accounts/customers'; // default
        if (formData.user_type === 'administrator') {
          redirectPath = '/admin/accounts/admins';
        } else if (formData.user_type === 'manager') {
          redirectPath = '/admin/accounts/managers';
        } else if (formData.user_type === 'astrologer') {
          redirectPath = '/admin/accounts/astrologers';
        } else if (formData.user_type === 'customer') {
          redirectPath = '/admin/accounts/customers';
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

  const isAstrologer = formData.user_type === 'astrologer';

  if (fetchLoading) {
    return (
      <div className="dashboard-main-wrapper">
        <Header />
        <Sidebar />

        <div className="dashboard-wrapper">
          <div className="dashboard-ecommerce">
            <div className="container-fluid dashboard-content">
              <div className="row">
                <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12 mb-4">
                  <div className="text-center p-5">
                    <i className="fas fa-spinner fa-spin fa-3x text-primary"></i>
                    <p className="mt-3">Loading user data...</p>
                  </div>
                </div>
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
              <div className="row">
                <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12">
                  <div className="alert alert-danger">
                    User ID is required to edit a user.
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
                  <h2 className="pageheader-title">Edit User</h2>
                  <p className="pageheader-text">Update user account information</p>
                  <div className="page-breadcrumb">
                    <nav aria-label="breadcrumb">
                      <ol className="breadcrumb">
                        <li className="breadcrumb-item">
                          <Link href="/admin/dashboard" className="breadcrumb-link">Dashboard</Link>
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

              <div className="row">
                <div className="col-xl-6 col-lg-6 col-md-6 col-sm-12 col-12 mb-4">
									{/* Basic Information Card */}
                  <div className="card mb-4">
                    <h5 className="card-header">Basic Information</h5>
                    <div className="card-body">

                      {/* Profile Image Upload */}
                      <div className="form-group row">
                        <div className="col-12 mb-4">
                          <label className="label">Profile Image</label>
                          <div className="d-flex align-items-start">
                            <div className="mr-3 text-center">
                              <div className="position-relative">
                                {imagePreview || formData.profile_image ? (
                                  <>
                                    <Image src={imagePreview || formData.profile_image} alt="Profile Preview" className="rounded-circle" style={{ objectFit: 'cover', cursor: 'pointer', border: '2px solid #dee2e6' }} onClick={openMediaLibrary} title="Click to change image" width={80} height={80} />
                                    <button type="button" className="btn btn-danger btn-sm position-absolute" style={{ top: '-5px', right: '-5px', width: '25px', height: '25px', borderRadius: '50%', padding: '0', fontSize: '14px' }} onClick={removeImage} title="Remove Image">
                                      ×
                                    </button>
                                  </>
                                ) : (
                                  <div
                                    className="rounded-circle bg-light d-flex align-items-center justify-content-center text-muted position-relative" style={{ width: '80px', height: '80px', cursor: 'pointer', border: '2px dashed #dee2e6', transition: 'all 0.3s ease' }} onClick={openMediaLibrary} onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#1877F2'; e.currentTarget.style.backgroundColor = '#f8f9fa'; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#dee2e6'; e.currentTarget.style.backgroundColor = '#f8f9fa'; }} title="Click to select image from media library"
                                  >
                                    <i className="fas fa-plus fa-lg text-primary"></i>
                                  </div>
                                )}
                              </div>
                              {formData.profile_image && (
                                <div className="mt-2 text-success text-center">
                                  <i className="fas fa-check-circle mr-1"></i>
                                  <small>Image Added!</small>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="form-group row">
                        <div className="col-6 mb-4">
                          <label className="label">User Type <span className="text-danger">*</span></label>
                          <select className="custom-select" name="user_type" value={formData.user_type} onChange={handleInputChange} required>
                            <option value="customer">Customer</option>
                            <option value="astrologer">Astrologer</option>
                            <option value="administrator">Administrator</option>
                            <option value="manager">Manager</option>
                          </select>
                        </div>
                        <div className="col-6 mb-4">
                          <label className="label">Account Status <span className="text-danger">*</span></label>
                          <select className="custom-select" name="account_status" value={formData.account_status} onChange={handleInputChange} required>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="banned">Banned</option>
                          </select>
                        </div>
                        <div className="col-6 mb-4">
                          <label className="label">Gender <span className="text-danger">*</span></label>
                          <select className="custom-select" name="gender" value={formData.gender} onChange={handleInputChange} required>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        <div className="col-6 mb-4">
                          <label className="label">Authentication Type</label>
                          <select className="custom-select" name="auth_type" value={formData.auth_type} onChange={handleInputChange}>
                            <option value="email">Email</option>
                            <option value="phone">Phone</option>
                            <option value="google">Google</option>
                          </select>
                        </div>
                        <div className="col-6 mb-4">
                          <label className="label">Full Name <span className="text-danger">*</span></label>
                          <input type="text" className={`form-control ${fieldErrors.full_name ? 'is-invalid' : ''}`} name="full_name" value={formData.full_name} onChange={handleInputChange} placeholder="" required />
                          {fieldErrors.full_name && (
                            <div className="invalid-feedback d-block">
                              {fieldErrors.full_name}
                            </div>
                          )}
                        </div>
                        <div className="col-6 mb-4">
                          <label className="label">Password (Leave empty for unchanged)</label>
                          <input type="password" className="form-control" name="password" value={formData.password} onChange={handleInputChange} placeholder="" />
                        </div>
                        <div className="col-6 mb-4">
                          <label className="label">Email Address <span className="text-danger">*</span></label>
                          <input type="email" className={`form-control ${fieldErrors.email_address ? 'is-invalid' : ''}`} name="email_address" value={formData.email_address} onChange={handleInputChange} placeholder="" required />
                          {fieldErrors.email_address && (
                            <div className="invalid-feedback d-block">
                              {fieldErrors.email_address}
                            </div>
                          )}
                        </div>
                        <div className="col-6 mb-4">
                          <label className="label">Phone Number <span className="text-danger">*</span></label>
                          <input type="tel" className={`form-control ${fieldErrors.phone_number ? 'is-invalid' : ''}`} name="phone_number" value={formData.phone_number} onChange={handleInputChange} placeholder="+91XXXXXXXXXX" required />
                          {fieldErrors.phone_number && (
                            <div className="invalid-feedback d-block">
                              {fieldErrors.phone_number}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
									{/* Personal Information Card */}
									<div className="card mb-4">
											<h5 className="card-header">Personal Information</h5>
											<div className="card-body">
												<div className="form-group row">
													<div className="col-4 mb-4">
														<label className="label">Birth Date {isAstrologer && <span className="text-danger">*</span>}</label>
														<AirDatePickerComponent
															className="form-control"
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
													</div>
													<div className="col-4 mb-4">
														<label className="label">Birth Time {isAstrologer && <span className="text-danger">*</span>}</label>
														<input type="time" className="form-control" name="birth_time" value={formData.birth_time} onChange={handleInputChange} required={isAstrologer} />
													</div>
													<div className="col-4 mb-4">
														<label className="label">Birth Place {isAstrologer && <span className="text-danger">*</span>}</label>
														<input type="text" className="form-control" name="birth_place" value={formData.birth_place} onChange={handleInputChange} placeholder="" required={isAstrologer} />
													</div>
													{/* Address Information */}
													<div className="col-6 mb-4">
														<label className="label">Country {isAstrologer && <span className="text-danger">*</span>}</label>
														<input type="text" className="form-control" name="country" value={formData.country} onChange={handleInputChange} placeholder="" required={isAstrologer} />
													</div>
													<div className="col-6 mb-4">
														<label className="label">State {isAstrologer && <span className="text-danger">*</span>}</label>
														<input type="text" className="form-control" name="state" value={formData.state} onChange={handleInputChange} placeholder="" required={isAstrologer} />
													</div>
													<div className="col-6 mb-4">
														<label className="label">City {isAstrologer && <span className="text-danger">*</span>}</label>
														<input type="text" className="form-control" name="city" value={formData.city} onChange={handleInputChange} placeholder="" required={isAstrologer} />
													</div>
													<div className="col-6 mb-4">
														<label className="label">ZIP Code {isAstrologer && <span className="text-danger">*</span>}</label>
														<input type="text" className="form-control" name="zip" value={formData.zip} onChange={handleInputChange} placeholder="" required={isAstrologer} />
													</div>
													<div className="col-12 mb-4">
														<label className="label">Address {isAstrologer && <span className="text-danger">*</span>}</label>
														<textarea className="form-control" name="address" value={formData.address} onChange={handleInputChange} placeholder="" rows={3} required={isAstrologer} />
													</div>
												{/* Astrologer Professional Information */}
												{isAstrologer && (
													<>
														{/* Professional Bio */}
															<div className="col-12 mb-4">
																<label className="label">About Me <span className="text-danger">*</span></label>
																<textarea className={`form-control ${fieldErrors.bio ? 'is-invalid' : ''}`} name="bio" value={formData.bio} onChange={handleInputChange} placeholder="" rows={4} required={isAstrologer} />
																{fieldErrors.bio && (
																	<div className="invalid-feedback">
																		{fieldErrors.bio}
																	</div>
																)}
															</div>
															<div className="col-6 mb-4">
																<label className="label">Experience Years <span className="text-danger">*</span></label>
																<input type="number" className={`form-control ${fieldErrors.experience_years ? 'is-invalid' : ''}`} name="experience_years" value={formData.experience_years} onChange={handleInputChange} placeholder="" min="1" required={isAstrologer} />
																{fieldErrors.experience_years && (
																	<div className="invalid-feedback d-block">
																		{fieldErrors.experience_years}
																	</div>
																)}
															</div>
															<div className="col-6 mb-4">
																<label className="label">Languages <span className="text-danger">*</span></label>
																<div className="dropdown">
																	<input type="text" className="form-control dropdown-toggle" value={formData.languages.join(', ') || 'Select languages...'} onFocus={() => setShowLanguageDropdown(true)} readOnly style={{ cursor: 'pointer' }} data-toggle="dropdown" />
																	{showLanguageDropdown && (
																		<div className="dropdown-menu show w-100" style={{ maxHeight: '200px', overflowY: 'auto' }}>
																			<div className="px-3 py-2">
																				<div className="d-flex justify-content-between align-items-center mb-2">
																					<small className="text-muted">Select Languages</small>
																					<button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setShowLanguageDropdown(false)}>
																						<i className="fas fa-times"></i>
																					</button>
																				</div>
																				{optionsLoading ? (
																					<div className="text-center py-2">
																						<i className="fas fa-spinner fa-spin"></i>
																						<small className="d-block text-muted">Loading...</small>
																					</div>
																				) : (
																					<div style={{ maxHeight: '150px', overflowY: 'auto' }}>
																						{astrologerOptions.languages.map((language) => (
																							<div key={language} className="form-check">
																								<input type="checkbox" className="form-check-input" id={`lang-${language}`} checked={formData.languages.includes(language)} onChange={() => toggleLanguage(language)} />
																								<label className="form-check-label" htmlFor={`lang-${language}`}>
																									{language}
																								</label>
																							</div>
																						))}
																					</div>
																				)}
																			</div>
																		</div>
																	)}
																</div>
																{formData.languages.length > 0 && (
																	<div className="mt-2">
																		<div className="d-flex flex-wrap">
																			{formData.languages.map((lang, index) => (
																				<span key={index} className="badge badge-success mr-1 mb-1">
																					{lang}
																					<button type="button" className="btn btn-sm ml-1 p-0" style={{ background: 'none', border: 'none', color: 'white' }} onClick={() => toggleLanguage(lang)}>
																						×
																					</button>
																				</span>
																			))}
																		</div>
																	</div>
																)}
																{fieldErrors.languages && (
																	<div className="text-danger small mt-1">
																		{fieldErrors.languages}
																	</div>
																)}
															</div>
															<div className="col-6 mb-4">
																<label className="label">Qualifications <span className="text-danger">*</span></label>
																<div className="input-group mb-2">
																	<input type="text" className="form-control" value={qualificationInput} onChange={(e) => setQualificationInput(e.target.value)} placeholder="Add qualification" onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addQualification())} />
																	<div className="input-group-append">
																		<button type="button" className="btn btn-outline-primary" onClick={addQualification}>
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
																{fieldErrors.qualifications && (
																	<div className="text-danger small mt-1">
																		{fieldErrors.qualifications}
																	</div>
																)}
															</div>
															<div className="col-6 mb-4">
																<label className="label">Skills <span className="text-danger">*</span></label>
																<div className="dropdown">
																	<input
																		type="text"
																		className="form-control dropdown-toggle"
																		value={formData.skills.join(', ') || 'Select skills...'}
																		onFocus={() => setShowSkillDropdown(true)}
																		readOnly
																		style={{ cursor: 'pointer' }}
																		data-toggle="dropdown"
																	/>
																	{showSkillDropdown && (
																		<div className="dropdown-menu show w-100" style={{ maxHeight: '200px', overflowY: 'auto' }}>
																			<div className="px-3 py-2">
																				<div className="d-flex justify-content-between align-items-center mb-2">
																					<button
																						type="button"
																						className="btn btn-sm btn-outline-secondary"
																						onClick={() => setShowSkillDropdown(false)}
																					>
																						<i className="fas fa-times"></i>
																					</button>
																				</div>
																				{optionsLoading ? (
																					<div className="text-center py-2">
																						<i className="fas fa-spinner fa-spin"></i>
																						<small className="d-block text-muted">Loading...</small>
																					</div>
																				) : (
																					<div style={{ maxHeight: '150px', overflowY: 'auto' }}>
																						{astrologerOptions.skills.map((skill) => (
																							<div key={skill} className="form-check">
																								<input
																									type="checkbox"
																									className="form-check-input"
																									id={`skill-${skill}`}
																									checked={formData.skills.includes(skill)}
																									onChange={() => toggleSkill(skill)}
																								/>
																								<label className="form-check-label" htmlFor={`skill-${skill}`}>
																									{skill}
																								</label>
																							</div>
																						))}
																					</div>
																				)}
																			</div>
																		</div>
																	)}
																</div>
																{formData.skills.length > 0 && (
																	<div className="mt-2">
																		<div className="d-flex flex-wrap">
																			{formData.skills.map((skill, index) => (
																				<span key={index} className="badge badge-info mr-1 mb-1">
																					{skill}
																					<button
																						type="button"
																						className="btn btn-sm ml-1 p-0"
																						style={{ background: 'none', border: 'none', color: 'white' }}
																						onClick={() => toggleSkill(skill)}
																					>
																						×
																					</button>
																				</span>
																			))}
																		</div>
																	</div>
																)}
																{fieldErrors.skills && (
																	<div className="text-danger small mt-1">
																		{fieldErrors.skills}
																	</div>
																)}
															</div>
															<div className="col-4 mb-4">
																<label className="label">Call Rate (₹/min) <span className="text-danger">*</span></label>
																<input type="number" className={`form-control ${fieldErrors.call_rate ? 'is-invalid' : ''}`} name="commission_rates.call_rate" value={formData.commission_rates.call_rate} onChange={handleInputChange} placeholder="" min="0" max="100" required={isAstrologer} />
																{fieldErrors.call_rate && (
																	<div className="invalid-feedback d-block">
																		{fieldErrors.call_rate}
																	</div>
																)}
															</div>
															<div className="col-4 mb-4">
																<label className="label">Chat Rate (₹/min) <span className="text-danger">*</span></label>
																<input type="number" className={`form-control ${fieldErrors.chat_rate ? 'is-invalid' : ''}`} name="commission_rates.chat_rate" value={formData.commission_rates.chat_rate} onChange={handleInputChange} placeholder="" min="0" max="100" required={isAstrologer} />
																{fieldErrors.chat_rate && (
																	<div className="invalid-feedback d-block">
																		{fieldErrors.chat_rate}
																	</div>
																)}
															</div>
															<div className="col-4 mb-4">
																<label className="label">Video Rate (₹/min) <span className="text-danger">*</span></label>
																<input type="number" className={`form-control ${fieldErrors.video_rate ? 'is-invalid' : ''}`} name="commission_rates.video_rate" value={formData.commission_rates.video_rate} onChange={handleInputChange} placeholder="" min="0" max="100" required={isAstrologer} />
																{fieldErrors.video_rate && (
																	<div className="invalid-feedback d-block">
																		{fieldErrors.video_rate}
																	</div>
																)}
															</div>
													</>
												)}
											</div>
											</div>
									</div>
									{/* Account Settings Card */}
									<div className="card mb-4">
										<h5 className="card-header">Account Settings</h5>
										<div className="card-body">

											<div className="form-group row">
												<div className="col-4 mb-4">
													<label className="label">Verification Status</label>
													<select className="custom-select" name="verification_status" value={formData.verification_status} onChange={handleInputChange}>
														<option value="pending">Pending</option>
														<option value="verified">Verified</option>
														<option value="rejected">Rejected</option>
													</select>
												</div>
												<div className="col-4 mb-4">
													<div className="form-check mt-4">
														<input className="form-check-input" type="checkbox" id="is_online" name="is_online" checked={formData.is_online} onChange={handleInputChange} />
														<label className="form-check-label" htmlFor="is_online">
															Currently Online
														</label>
													</div>
												</div>
											</div>

											<div className="form-group row">
												<div className="col-12 mb-4">
													<label className="label">Verification Status Message</label>
													<textarea className="form-control" name="verification_status_message" value={formData.verification_status_message} onChange={handleInputChange} placeholder="" rows={3} />
													<small className="form-text text-muted">
														This message will be shown to the user regarding their verification status
													</small>
												</div>
											</div>
										</div>
									</div>
									<div className="row">
										<div className="col-12 mb-4">
											<button type="submit" className="btn btn-primary" disabled={loading}>
												{loading ? (
													<>
														<i className="fas fa-spinner fa-spin mr-2"></i> Updating...
													</>
												) : (
													<>
														Update Account
													</>
												)}
											</button>
										</div>
									</div>
                </div>
              </div>
          	</form>

            {/* Media Library Modal */}
            <MediaLibrary
              isOpen={isMediaLibraryOpen}
              onClose={() => setIsMediaLibraryOpen(false)}
              onSelect={handleImageSelect}
              selectedImage={formData.profile_image}
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
              <div className="row">
                <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12 mb-4">
                  <div className="text-center p-5">
                    <i className="fas fa-spinner fa-spin fa-3x text-primary"></i>
                    <p className="mt-3">Loading page...</p>
                  </div>
                </div>
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
