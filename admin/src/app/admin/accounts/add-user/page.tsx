'use client';

import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { useEffect, useState, Suspense } from 'react';
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
  experience_years: number;
  bio: string;
  languages: string[];
  qualifications: string[];
  skills: string[];
  commission_rates: {
    call_rate: number;
    chat_rate: number;
    video_rate: number;
  };
}

interface AstrologerOptions {
  languages: string[];
  skills: string[];
}

function AddUserPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState<FormData>({
    profile_image: '',
    full_name: '',
    email_address: '',
    password: '',
    user_type: searchParams.get('type') || 'customer',
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
    experience_years: 0,
    bio: '',
    languages: [],
    qualifications: [],
    skills: [],
    commission_rates: {
      call_rate: 0,
      chat_rate: 0,
      video_rate: 0
    }
  });

  const [imageUploading, setImageUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});
  
  // Dropdown states
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showSkillDropdown, setShowSkillDropdown] = useState(false);

  // Astrologer options from API
  const [astrologerOptions, setAstrologerOptions] = useState<AstrologerOptions>({
    languages: [],
    skills: []
  });

  // Qualifications repeater field state
  const [qualificationInput, setQualificationInput] = useState('');
  const [optionsLoading, setOptionsLoading] = useState(true);

  useEffect(() => {
    document.body.className = '';
    loadAstrologerOptions();
  }, []);

  const loadAstrologerOptions = async () => {
    try {
      setOptionsLoading(true);
      const response = await fetch('/api/astrologer-options/active');
      const data = await response.json();
      
      if (response.ok) {
        setAstrologerOptions(data.data);
      } else {
        console.error('Failed to load astrologer options:', data.error);
        errorMessages.fetchError('Failed to load astrologer options');
      }
    } catch (error) {
      console.error('Error loading astrologer options:', error);
      errorMessages.networkError();
    } finally {
      setOptionsLoading(false);
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

  const validateUserForm = () => {
    // Clear previous validation errors
    clearValidationErrors();
    
    // Prepare form data for validation
    const formDataForValidation = {
      full_name: formData.full_name,
      email_address: formData.email_address,
      phone_number: formData.phone_number,
      password: formData.password,
      city: formData.city,
      state: formData.state,
      user_type: formData.user_type,
      account_status: formData.account_status
    };

    // Get validation rules (includes password for new users)
    const rules = getUserFormRules();
    
    // Validate form
    const validation = validateForm(formDataForValidation, rules);
    
    // Additional custom validations for add user
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
      } else {
        // Validate time format - accepts formats like "07:30 AM", "7:30 PM", "14:30"
        const timeRegex = /^(0?[1-9]|1[0-2]|2[0-3]):([0-5][0-9])(\s?(AM|PM|am|pm))?$|^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
        if (!timeRegex.test(formData.birth_time.trim())) {
          customErrors.birth_time = 'Please enter a valid time (e.g., 07:30 AM or 14:30)';
        }
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

      // Experience years validation for astrologers
      if (!formData.experience_years || formData.experience_years < 1) {
        customErrors.experience_years = 'Experience years is required for astrologers';
      }

      // Bio validation for astrologers
      if (!formData.bio.trim()) {
        customErrors.bio = 'Bio is required for astrologers';
      } else if (formData.bio.trim().length < 50) {
        customErrors.bio = 'Bio must be at least 50 characters';
      }

      // Languages validation for astrologers
      if (!formData.languages || formData.languages.length === 0) {
        customErrors.languages = 'At least one language is required for astrologers';
      }

      if (!formData.skills || formData.skills.length === 0) {
        customErrors.skills = 'At least one skill is required for astrologers';
      }

      if (!formData.qualifications || formData.qualifications.length === 0) {
        customErrors.qualifications = 'At least one qualification is required for astrologers';
      }

      // Commission rates validation (for astrologers, rates should be set)
      const { call_rate, chat_rate, video_rate } = formData.commission_rates;
      if (call_rate <= 0 || call_rate > 100) {
        customErrors.call_rate = 'Call rate must be between 1% and 100%';
      }
      if (chat_rate <= 0 || chat_rate > 100) {
        customErrors.chat_rate = 'Chat rate must be between 1% and 100%';
      }
      if (video_rate <= 0 || video_rate > 100) {
        customErrors.video_rate = 'Video rate must be between 1% and 100%';
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
      errorMessages.createFailed(`Validation Error: ${firstError}`);
      
      return false;
    }

    setFieldErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate form first
    if (!validateUserForm()) {
      return;
    }

    // Show loading alert
    showLoadingAlert('Creating user...');
    setLoading(true);

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
        closeSweetAlert();
        await successMessages.created('User');
        
        // Redirect to appropriate page
        let redirectPath = '/admin/accounts/customers';
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
              <div className="col-xl-12 col-12 col-md-12 col-sm-12 col-12">
                <div className="page-header">
                  <h2 className="pageheader-title">Add User</h2>
                  <p className="pageheader-text">Create a user account for the platform</p>
                  <div className="page-breadcrumb">
                    <nav aria-label="breadcrumb">
                      <ol className="breadcrumb">
                        <li className="breadcrumb-item">
                          <Link href="/admin/dashboard" className="breadcrumb-link">Dashboard</Link>
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
							<div className="row mb-4">
								<div className="col-xl-6 col-6 mb-4-12 col-md-6 col-sm-12 col-12">
									{/* Basic Information Card */}
									<div className="card mb-4">
										<h5 className="card-header">Basic Information</h5>
										<div className="card-body">

											{/* Profile Image Upload */}
											<div className="form-group row">
												<div className="col-12">
													<label className="label">Profile Image</label>
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
																		>×</button>
																	</>
																) : (
																	<div className="rounded-circle bg-light d-flex align-items-center justify-content-center text-muted position-relative" style={{ width: '80px', height: '80px', cursor: 'pointer', border: '2px dashed #dee2e6', transition: 'all 0.3s ease'}} onClick={() => document.getElementById('profile_image')?.click()} onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#1877F2';	e.currentTarget.style.backgroundColor = '#f8f9fa';	}} onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#dee2e6'; e.currentTarget.style.backgroundColor = '#f8f9fa';}}	title="Click to upload image">
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
											</div>

											<div className="form-group row">
												<div className="col-6 mb-4">
													<label className="label">Full Name <span className="text-danger">*</span></label>
													<input type="text" className="form-control" name="full_name" value={formData.full_name} onChange={handleInputChange} placeholder="" required />
												</div>
												<div className="col-6 mb-4">
													<label className="label">Phone Number <span className="text-danger">*</span></label>
													<input type="tel" className="form-control" name="phone_number" value={formData.phone_number} onChange={handleInputChange} placeholder="" required />
												</div>
												<div className="col-6 mb-4">
													<label className="label">Email Address <span className="text-danger">*</span></label>
													<input type="email" className="form-control" name="email_address" value={formData.email_address} onChange={handleInputChange} placeholder="" required />
												</div>
												<div className="col-6 mb-4">
													<label className="label">Password <span className="text-danger">*</span></label>
													<input type="password" className="form-control" name="password" value={formData.password} onChange={handleInputChange} placeholder="" required />							
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
													<input 
														type="text" 
														className={`form-control ${_fieldErrors.birth_time ? 'is-invalid' : ''}`} 
														name="birth_time" 
														value={formData.birth_time} 
														onChange={handleInputChange} 
														placeholder="07:30 AM" 
														required={isAstrologer} 
													/>
													{_fieldErrors.birth_time && (
														<div className="invalid-feedback d-block">
															{_fieldErrors.birth_time}
														</div>
													)}
												</div>
												<div className="col-4 mb-4">
													<label className="label">Birth Place {isAstrologer && <span className="text-danger">*</span>}</label>
													<input 
														type="text" 
														className={`form-control ${_fieldErrors.birth_place ? 'is-invalid' : ''}`} 
														name="birth_place" 
														value={formData.birth_place} 
														onChange={handleInputChange} 
														placeholder="" 
														required={isAstrologer} 
													/>
													{_fieldErrors.birth_place && (
														<div className="invalid-feedback d-block">
															{_fieldErrors.birth_place}
														</div>
													)}
												</div>
												<div className="col-12 mb-4">
													<label className="label">Address {isAstrologer && <span className="text-danger">*</span>}</label>
													<textarea 
														className="form-control"
														name="address"
														value={formData.address}
														onChange={handleInputChange}
														placeholder=""
														rows={3}
														required={isAstrologer}
													/>
												</div>
												<div className="col-6 mb-4">
													<label className="label">Country {isAstrologer && <span className="text-danger">*</span>}</label>
													<input 
														type="text" 
														className="form-control"
														name="country"
														value={formData.country}
														onChange={handleInputChange}
														placeholder=""
														required={isAstrologer}
													/>
												</div>
												<div className="col-6 mb-4">
													<label className="label">State {isAstrologer && <span className="text-danger">*</span>}</label>
													<input 
														type="text" 
														className="form-control"
														name="state"
														value={formData.state}
														onChange={handleInputChange}
														placeholder=""
														required={isAstrologer}
													/>
												</div>
												<div className="col-6 mb-4">
													<label className="label">City {isAstrologer && <span className="text-danger">*</span>}</label>
													<input 
														type="text" 
														className="form-control"
														name="city"
														value={formData.city}
														onChange={handleInputChange}
														placeholder=""
														required={isAstrologer}
													/>
												</div>
												<div className="col-6 mb-4">
													<label className="label">ZIP Code {isAstrologer && <span className="text-danger">*</span>}</label>
													<input 
														type="text" 
														className="form-control"
														name="zip"
														value={formData.zip}
														onChange={handleInputChange}
														placeholder=""
														required={isAstrologer}
													/>
												</div>

												{/* Astrologer Professional Information */}
												{isAstrologer && (
													<>
														<div className="col-6 mb-4">
															<label className="label">Experience Years <span className="text-danger">*</span></label>
															<input 
																type="number" 
																className="form-control"
																name="experience_years"
																value={formData.experience_years}
																onChange={handleInputChange}
																placeholder=""
																min="1"
																required
															/>
														</div>
														<div className="col-6 mb-4">
															<label className="label">Languages <span className="text-danger">*</span></label>
															<div className="dropdown">
																<input
																	type="text"
																	className="form-control dropdown-toggle"
																	value={formData.languages.join(', ') || 'Select languages...'}
																	onFocus={() => setShowLanguageDropdown(true)}
																	readOnly
																	style={{ cursor: 'pointer' }}
																	data-toggle="dropdown"
																/>
																{showLanguageDropdown && (
																	<div className="dropdown-menu show w-100" style={{ maxHeight: '200px', overflowY: 'auto' }}>
																		<div className="px-3 py-2">
																			<div className="d-flex justify-content-between align-items-center mb-2">
																				<small className="text-muted">Select Languages</small>
																				<button
																					type="button"
																					className="btn btn-sm btn-outline-secondary"
																					onClick={() => setShowLanguageDropdown(false)}
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
																					{astrologerOptions.languages.map((language) => (
																						<div key={language} className="form-check">
																							<input
																								type="checkbox"
																								className="form-check-input"
																								id={`lang-${language}`}
																								checked={formData.languages.includes(language)}
																								onChange={() => toggleLanguage(language)}
																							/>
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
																	<small className="text-muted">Selected: </small>
																	<div className="d-flex flex-wrap">
																		{formData.languages.map((lang, index) => (
																			<span key={index} className="badge badge-success mr-1 mb-1">
																				{lang}
																				<button 
																					type="button" 
																					className="btn btn-sm ml-1 p-0" 
																					style={{ background: 'none', border: 'none', color: 'white' }} 
																					onClick={() => toggleLanguage(lang)}
																				>
																					×
																				</button>
																			</span>
																		))}
																	</div>
																</div>
															)}
														</div>
														<div className="col-12">
															<label className="label">About Me <span className="text-danger">*</span></label>
															<textarea 
																className="form-control"
																name="bio"
																value={formData.bio}
																onChange={handleInputChange}
																placeholder="Tell us about your experience and approach to astrology..."
																rows={4}
																required
															/>
															<small className="form-text text-muted">Minimum 50 characters</small>
														</div>
														<div className="col-6 mb-4">
															<label className="label">Qualifications <span className="text-danger">*</span></label>
															<div className="input-group mb-2">
																<input 
																	type="text" 
																	className="form-control"
																	value={qualificationInput}
																	onChange={(e) => setQualificationInput(e.target.value)}
																	placeholder="Enter qualification"
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
															{formData.qualifications.length > 0 && (
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
																				<small className="text-muted">Select Skills</small>
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
														</div>
														<div className="col-4 mb-4">
															<label className="label">Call Rate (₹/min) <span className="text-danger">*</span></label>
															<input 
																type="number" 
																className="form-control"
																name="commission_rates.call_rate"
																value={formData.commission_rates.call_rate}
																onChange={handleInputChange}
																placeholder=""
																min="0"
																required={isAstrologer}
															/>
														</div>
														<div className="col-4 mb-4">
															<label className="label">Chat Rate (₹/min) <span className="text-danger">*</span></label>
															<input 
																type="number" 
																className="form-control"
																name="commission_rates.chat_rate"
																value={formData.commission_rates.chat_rate}
																onChange={handleInputChange}
																placeholder=""
																min="0"
																required={isAstrologer}
															/>
														</div>
														<div className="col-4 mb-4">
															<label className="label">Video Rate (₹/min) <span className="text-danger">*</span></label>
															<input 
																type="number" 
																className="form-control"
																name="commission_rates.video_rate"
																value={formData.commission_rates.video_rate}
																onChange={handleInputChange}
																placeholder=""
																min="0"
																required={isAstrologer}
															/>
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
												<div className="col-4 mb-4">
													<div className="form-check mt-4">
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
												<div className="col-12">
													<label className="label">Verification Status Message</label>
													<textarea className="form-control" name="verification_status_message" value={formData.verification_status_message} onChange={handleInputChange} placeholder="" rows={3}/>
													<small className="form-text text-muted">
														This message will be shown to the user regarding their verification status
													</small>
												</div>
											</div>								
										</div>
									</div>
									<div className="row">
										<div className="col-12">
											<div className="text-left">									
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
								<div className="col-xl-6 col-6 mb-4-12 col-md-6 col-sm-12 col-12">
									
								</div>
							</div>
            </form>
          </div>
        </div>
      </div>
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