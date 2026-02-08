'use client';

import Header from '@/components/admin/Header';
import Sidebar from '@/components/admin/Sidebar';
import MediaLibrary from '@/components/admin/MediaLibrary';
import { useEffect, useState, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
// Removed unused import clearValidationErrors
import { successMessages, errorMessages, showLoadingAlert, closeSweetAlert } from '@/lib/sweetalert';
import AirDatePickerComponent from '@/components/admin/AirDatePickerComponent';
import { getCSRFToken } from '@/lib/csrf';

// Predefined rejection reasons for astrologer verification
const REJECTION_REASONS = [
  'Incomplete profile information',
  'Invalid or unclear profile photo',
  'Invalid or missing PAN card document',
  'Insufficient experience details',
  'Qualifications not verifiable',
  'Bank details incomplete or invalid',
  'Other (please specify below)'
];

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

interface AuditLogEntry {
  _id: string;
  action: string;
  previous_value: string;
  new_value: string;
  reason?: string;
  performed_by_name: string;
  created_at: string;
}

interface UserTimeline {
  created_at?: string;
  profile_submitted_at?: string;
  updated_at?: string;
  verified_at?: string;
  verified_by?: string;
}

function EditUserContent() {
  const searchParams = useSearchParams();
  const userId = searchParams?.get('id');

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [defaultCommission, setDefaultCommission] = useState(25);
  const [currentUserType, setCurrentUserType] = useState<string>('');

  // Fetch current logged-in user's type
  useEffect(() => {
    const fetchCurrentUserType = async () => {
      try {
        const response = await fetch('/api/auth/check');
        if (response.ok) {
          const data = await response.json();
          setCurrentUserType(data.userType || '');
        }
      } catch (error) {
        console.error('Failed to fetch current user type:', error);
      }
    };
    fetchCurrentUserType();
  }, []);

  const isCurrentUserManager = currentUserType === 'manager';

  const [formData, setFormData] = useState<FormData>({
    user_id: '',
    profile_image_id: '',
    social_profile_image_url: '',
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
  const [showProfileImageLibrary, setShowProfileImageLibrary] = useState(false);
  const [showPanCardLibrary, setShowPanCardLibrary] = useState(false);

  // Astrologer options state
  const [availableSkills, setAvailableSkills] = useState<string[]>([]);
  const [availableLanguages, setAvailableLanguages] = useState<string[]>([]);
  const [qualificationInput, setQualificationInput] = useState('');

  // Rejection reason state
  const [selectedRejectionReason, setSelectedRejectionReason] = useState<string>('');
  const [customRejectionMessage, setCustomRejectionMessage] = useState<string>('');

  // Rejection confirmation dialog state
  const [showRejectionConfirm, setShowRejectionConfirm] = useState(false);
  const [pendingVerificationStatus, setPendingVerificationStatus] = useState<string>('');

  // Audit log and timeline state
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [userTimeline, setUserTimeline] = useState<UserTimeline>({});
  const [showAuditHistory, setShowAuditHistory] = useState(false);

  // Define user type booleans for conditional rendering
  const isAstrologer = formData.user_type === 'astrologer';
  const isCustomer = formData.user_type === 'customer';

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

  const loadAuditLogs = async (id: string) => {
    try {
      const response = await fetch(`/api/users/${id}/audit`);
      const data = await response.json();

      if (response.ok && data.success) {
        setAuditLogs(data.logs || []);
      }
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    }
  };

  // Helper function to get profile completion checklist
  const getProfileCompletionChecklist = () => {
    const checks = [
      { label: 'Email Address', complete: !!formData.email_address.trim() },
      { label: 'Bio/Description', complete: !!formData.bio.trim() },
      { label: 'Skills (min 2)', complete: formData.skills.length >= 2 },
      { label: 'Languages (min 1)', complete: formData.languages.length >= 1 },
      { label: 'Experience Years', complete: formData.experience_years > 0 },
      { label: 'At Least One Rate', complete: formData.call_rate > 0 || formData.chat_rate > 0 || formData.video_rate > 0 },
      { label: 'PAN Card', complete: !!formData.pan_card_id },
      { label: 'Bank Account Holder', complete: !!formData.bank_details.account_holder_name.trim() },
      { label: 'Bank Account Number', complete: !!formData.bank_details.account_number.trim() },
      { label: 'Bank Name', complete: !!formData.bank_details.bank_name.trim() },
      { label: 'IFSC Code', complete: !!formData.bank_details.ifsc_code.trim() },
    ];
    return checks;
  };

  const isProfileCompleteForApproval = () => {
    const checks = getProfileCompletionChecklist();
    return checks.every(check => check.complete);
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
          user_id: user.user_id || '',
          profile_image_id: user.profile_image_id || '',
          social_profile_image_url: user.social_profile_image_url || '',
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
          experience_years: user.experience_years || 0,
          bio: user.bio || '',
          languages: user.languages ? (Array.isArray(user.languages) ? user.languages : user.languages.split(',').map((s: string) => s.trim()).filter((s: string) => s)) : [],
          qualifications: user.qualifications ? (Array.isArray(user.qualifications) ? user.qualifications : user.qualifications.split(',').map((s: string) => s.trim()).filter((s: string) => s)) : [],
          skills: user.skills ? (Array.isArray(user.skills) ? user.skills : user.skills.split(',').map((s: string) => s.trim()).filter((s: string) => s)) : [],
          call_rate: user.call_rate || 0,
          chat_rate: user.chat_rate || 0,
          video_rate: user.video_rate || 0,
          commission_percentage: {
            call: user.commission_percentage?.call || defaultCommission,
            chat: user.commission_percentage?.chat || defaultCommission,
            video: user.commission_percentage?.video || defaultCommission
          },
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

        // Set timeline data
        setUserTimeline({
          created_at: user.created_at,
          profile_submitted_at: user.profile_submitted_at,
          updated_at: user.updated_at,
          verified_at: user.verified_at,
          verified_by: user.verified_by,
        });

        // Load audit logs for astrologers
        if (user.user_type === 'astrologer' && userId) {
          loadAuditLogs(userId);
        }

        // Parse existing rejection reason if user is rejected
        if (user.verification_status === 'rejected' && user.verification_status_message) {
          const existingMessage = user.verification_status_message;
          // Check if the message matches any predefined reason
          const matchedReason = REJECTION_REASONS.find(reason =>
            existingMessage === reason || existingMessage.startsWith(reason)
          );

          if (matchedReason && matchedReason !== 'Other (please specify below)') {
            setSelectedRejectionReason(matchedReason);
            // Check if there's additional custom text after the predefined reason
            if (existingMessage.length > matchedReason.length) {
              const additionalText = existingMessage.substring(matchedReason.length).replace(/^[\s\-:]+/, '').trim();
              if (additionalText) {
                setCustomRejectionMessage(additionalText);
              }
            }
          } else {
            // It's a custom message, set as "Other"
            setSelectedRejectionReason('Other (please specify below)');
            setCustomRejectionMessage(existingMessage);
          }
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

        // Listen to Select2 change event for skills
        skillsSelect.on('change', () => {
          const selectedValues = skillsSelect.val() || [];
          setFormData(prev => ({
            ...prev,
            skills: selectedValues as string[]
          }));
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

        // Listen to Select2 change event for languages
        languagesSelect.on('change', () => {
          const selectedValues = languagesSelect.val() || [];
          setFormData(prev => ({
            ...prev,
            languages: selectedValues as string[]
          }));
        });
      }

      // Cleanup function
      return () => {
        if (skillsSelect.length && skillsSelect.hasClass('select2-hidden-accessible')) {
          skillsSelect.off('change');
          skillsSelect.select2('destroy');
        }
        if (languagesSelect.length && languagesSelect.hasClass('select2-hidden-accessible')) {
          languagesSelect.off('change');
          languagesSelect.select2('destroy');
        }
      };
    }
  }, [formData.user_type, availableSkills, availableLanguages]);

  // Sync Select2 values when formData is loaded from API (after fetch completes)
  useEffect(() => {
    if (typeof window !== 'undefined' && formData.user_type === 'astrologer' && !fetchLoading) {
      const windowWithJQuery = window as typeof window & { $?: unknown };
      if (!windowWithJQuery.$ || typeof windowWithJQuery.$ !== 'function') return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const $ = windowWithJQuery.$ as any;

      // Sync skills select2 with formData
      const skillsSelect = $('#skills-select');
      if (skillsSelect.length && skillsSelect.hasClass('select2-hidden-accessible')) {
        const currentVal = skillsSelect.val() || [];
        if (JSON.stringify(currentVal) !== JSON.stringify(formData.skills)) {
          skillsSelect.val(formData.skills).trigger('change.select2');
        }
      }

      // Sync languages select2 with formData
      const languagesSelect = $('#languages-select');
      if (languagesSelect.length && languagesSelect.hasClass('select2-hidden-accessible')) {
        const currentVal = languagesSelect.val() || [];
        if (JSON.stringify(currentVal) !== JSON.stringify(formData.languages)) {
          languagesSelect.val(formData.languages).trigger('change.select2');
        }
      }
    }
  }, [fetchLoading, formData.skills, formData.languages, formData.user_type]);

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
    const customErrors: { [key: string]: string } = {};

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

      // Rejection reason validation
      if (formData.verification_status === 'rejected') {
        if (!selectedRejectionReason) {
          customErrors.rejection_reason = 'Please select a rejection reason';
        }
        if (selectedRejectionReason === 'Other (please specify below)' && !customRejectionMessage.trim()) {
          customErrors.custom_rejection_message = 'Please provide the rejection reason';
        }
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
    setFieldErrors({});

    if (!validateUserForm()) {
      return;
    }

    showLoadingAlert('Updating user...');
    setLoading(true);

    try {
      const csrfToken = getCSRFToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (csrfToken) {
        headers['x-csrf-token'] = csrfToken;
      }

      // Prepare submission data with combined rejection message
      const submissionData = { ...formData };

      // Combine rejection reason into verification_status_message for astrologers
      if (formData.user_type === 'astrologer' && formData.verification_status === 'rejected') {
        if (selectedRejectionReason === 'Other (please specify below)') {
          submissionData.verification_status_message = customRejectionMessage.trim();
        } else if (customRejectionMessage.trim()) {
          // Predefined reason + additional details
          submissionData.verification_status_message = `${selectedRejectionReason} - ${customRejectionMessage.trim()}`;
        } else {
          // Just the predefined reason
          submissionData.verification_status_message = selectedRejectionReason;
        }
      } else if (formData.verification_status !== 'rejected') {
        // Clear the message if not rejected
        submissionData.verification_status_message = '';
      }

      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(submissionData),
      });

      const data = await response.json();

      if (response.ok) {
        closeSweetAlert();
        await successMessages.updated('User');

        // Update previews and form data from response
        if (data.user) {
          // Update profile image preview
          if (data.user.profile_image) {
            setImagePreview(data.user.profile_image);
          }
          // Update PAN card preview
          if (data.user.pan_card_image) {
            setPanCardPreview(data.user.pan_card_image);
          }
          // Update pan_card_id in form data if returned
          if (data.user.pan_card_id) {
            setFormData(prev => ({
              ...prev,
              pan_card_id: data.user.pan_card_id
            }));
          }
        }
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
                <i className="fa fa-circle-notch fa-spin fa-3x text-primary"></i>
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
                <div className="col-xl-8 col-lg-7 col-md-12 col-sm-12 col-12">

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
                                      onClick={() => setShowProfileImageLibrary(true)}
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
                            {!isCurrentUserManager && (
                              <option value="administrator">Administrator</option>
                            )}
                            <option value="manager">Manager</option>
                          </select>
                          {isCurrentUserManager && formData.user_type === 'administrator' && (
                            <small className="text-danger">You cannot set user type to Administrator</small>
                          )}
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

                        {/* Phone Number */}
                        <div className="col-md-6 mb-4">
                          <label className="label">Phone Number</label>
                          <input
                            type="tel"
                            className="form-control"
                            name="phone_number"
                            value={formData.phone_number}
                            onChange={handleInputChange}
                          />
                        </div>

                        {/* Gender */}
                        <div className="col-md-6 mb-4">
                          <label className="label">Gender</label>
                          <select
                            className="custom-select"
                            name="gender"
                            value={formData.gender}
                            onChange={handleInputChange}
                          >
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                          </select>
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
                            <option value="pending_verification">Pending Verification</option>
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
                            <option value="pending_verification">Pending Verification</option>
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
                            onChange={(e) => {
                              const newStatus = e.target.value;
                              // Show confirmation dialog for rejection
                              if (newStatus === 'rejected' && formData.verification_status !== 'rejected') {
                                setPendingVerificationStatus(newStatus);
                                setShowRejectionConfirm(true);
                              } else {
                                handleInputChange(e);
                                // Clear rejection reason when status changes away from rejected
                                if (newStatus !== 'rejected') {
                                  setSelectedRejectionReason('');
                                  setCustomRejectionMessage('');
                                }
                              }
                            }}
                          >
                            <option value="unverified">Unverified</option>
                            <option value="verified">Verified</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        </div>

                        {/* Rejection Reason Section - Only visible when status is 'rejected' */}
                        {formData.verification_status === 'rejected' && (
                          <div className="col-md-12 mb-4">
                            <div
                              className="p-3 rounded"
                              style={{
                                border: '1px solid #e4e4e4',
                                backgroundColor: '#f3f3f3'
                              }}
                            >
                              <h6 className="text-danger mb-3">
                                <i className="fas fa-exclamation-triangle mr-2"></i>
                                Rejection Reason (Required)
                              </h6>

                              <div className="mb-3">
                                <label className="label">Select Reason <span className="text-danger">*</span></label>
                                <select
                                  className={`custom-select ${fieldErrors.rejection_reason ? 'is-invalid' : ''}`}
                                  value={selectedRejectionReason}
                                  onChange={(e) => setSelectedRejectionReason(e.target.value)}
                                >
                                  <option value="">-- Select a reason --</option>
                                  {REJECTION_REASONS.map((reason) => (
                                    <option key={reason} value={reason}>{reason}</option>
                                  ))}
                                </select>
                                {fieldErrors.rejection_reason && (
                                  <div className="invalid-feedback">{fieldErrors.rejection_reason}</div>
                                )}
                              </div>

                              <div className="mb-3">
                                <label className="label">
                                  Additional Details
                                  {selectedRejectionReason === 'Other (please specify below)' && (
                                    <span className="text-danger"> *</span>
                                  )}
                                </label>
                                <textarea
                                  className={`form-control bg-white ${fieldErrors.custom_rejection_message ? 'is-invalid' : ''}`}
                                  value={customRejectionMessage}
                                  onChange={(e) => setCustomRejectionMessage(e.target.value)}
                                  rows={3}
                                  placeholder={
                                    selectedRejectionReason === 'Other (please specify below)'
                                      ? 'Please provide the rejection reason...'
                                      : 'Add any additional details or instructions for the astrologer (optional)...'
                                  }
                                />
                                {fieldErrors.custom_rejection_message && (
                                  <div className="invalid-feedback">{fieldErrors.custom_rejection_message}</div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

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
                            className={`form-control ${fieldErrors.account_holder_name ? 'is-invalid' : ''}`}
                            name="bank_details.account_holder_name"
                            value={formData.bank_details.account_holder_name}
                            onChange={handleInputChange}
                            placeholder="Full name as per bank records"
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
                            placeholder="Bank account number"
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
                            placeholder="Bank name"
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
                            placeholder="IFSC code (e.g., SBIN0001234)"
                            style={{ textTransform: 'uppercase' }}
                          />
                          {fieldErrors.ifsc_code && (
                            <div className="invalid-feedback">{fieldErrors.ifsc_code}</div>
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

                  {/* Submit Button */}
                  <div className="row">
                    <div className="col-12">
                      <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? (
                          <><i className="fa fa-circle-notch fa-spin mr-2"></i>Updating...</>
                        ) : (
                          <>Update Account</>
                        )}
                      </button>
                    </div>
                  </div>

                </div>

                {/* Sidebar for Astrologers - Timeline, Profile Checklist, Documents, Audit */}
                {isAstrologer && (
                  <div className="col-xl-4 col-lg-5 col-md-12 col-sm-12 col-12">

                    {/* Timeline Card */}
                    <div className="card mb-4">
                      <h5 className="card-header">
                        <i className="fas fa-clock mr-2"></i>Timeline
                      </h5>
                      <div className="card-body p-0">
                        <ul className="list-group list-group-flush">
                          <li className="list-group-item d-flex justify-content-between align-items-center">
                            <span><i className="fas fa-user-plus text-primary mr-2"></i>Account Created</span>
                            <small className="text-muted">
                              {userTimeline.created_at
                                ? new Date(userTimeline.created_at).toLocaleDateString('en-IN', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric'
                                  })
                                : 'N/A'}
                            </small>
                          </li>
                          <li className="list-group-item d-flex justify-content-between align-items-center">
                            <span><i className="fas fa-file-alt text-info mr-2"></i>Profile Submitted</span>
                            <small className="text-muted">
                              {userTimeline.profile_submitted_at
                                ? new Date(userTimeline.profile_submitted_at).toLocaleDateString('en-IN', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric'
                                  })
                                : 'Not yet'}
                            </small>
                          </li>
                          <li className="list-group-item d-flex justify-content-between align-items-center">
                            <span><i className="fas fa-edit text-warning mr-2"></i>Last Updated</span>
                            <small className="text-muted">
                              {userTimeline.updated_at
                                ? new Date(userTimeline.updated_at).toLocaleDateString('en-IN', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric'
                                  })
                                : 'N/A'}
                            </small>
                          </li>
                          {formData.verification_status === 'verified' && (
                            <li className="list-group-item d-flex justify-content-between align-items-center bg-light">
                              <span><i className="fas fa-check-circle text-success mr-2"></i>Verified</span>
                              <small className="text-success">
                                {userTimeline.verified_at
                                  ? new Date(userTimeline.verified_at).toLocaleDateString('en-IN', {
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric'
                                    })
                                  : 'N/A'}
                                {userTimeline.verified_by && ` by ${userTimeline.verified_by}`}
                              </small>
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>

                    {/* Profile Completion Checklist Card */}
                    <div className="card mb-4">
                      <h5 className="card-header d-flex justify-content-between align-items-center">
                        <span><i className="fas fa-tasks mr-2"></i>Profile Checklist</span>
                        <span className={`badge ${isProfileCompleteForApproval() ? 'badge-success' : 'badge-warning'}`}>
                          {getProfileCompletionChecklist().filter(c => c.complete).length}/{getProfileCompletionChecklist().length}
                        </span>
                      </h5>
                      <div className="card-body p-0">
                        <ul className="list-group list-group-flush">
                          {getProfileCompletionChecklist().map((check, index) => (
                            <li key={index} className="list-group-item d-flex justify-content-between align-items-center py-2">
                              <span className={check.complete ? 'text-success' : 'text-muted'}>
                                {check.label}
                              </span>
                              {check.complete ? (
                                <i className="fas fa-check-circle text-success"></i>
                              ) : (
                                <i className="fas fa-times-circle text-danger"></i>
                              )}
                            </li>
                          ))}
                        </ul>
                        {!isProfileCompleteForApproval() && (
                          <div className="card-footer bg-warning-light">
                            <small className="text-warning">
                              <i className="fas fa-exclamation-triangle mr-1"></i>
                              Profile incomplete - cannot be approved
                            </small>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Document Review Card */}
                    <div className="card mb-4">
                      <h5 className="card-header">
                        <i className="fas fa-file-image mr-2"></i>Document Verification
                      </h5>
                      <div className="card-body">
                        {panCardPreview ? (
                          <div className="text-center">
                            <p className="mb-2 font-weight-bold">PAN Card Document</p>
                            <a href={panCardPreview} target="_blank" rel="noopener noreferrer">
                              <Image
                                src={panCardPreview}
                                alt="PAN Card"
                                width={250}
                                height={150}
                                className="img-thumbnail mb-2"
                                style={{ objectFit: 'cover', cursor: 'zoom-in' }}
                              />
                            </a>
                            <p className="text-muted small mb-0">
                              <i className="fas fa-search-plus mr-1"></i>
                              Click to view full size
                            </p>
                          </div>
                        ) : (
                          <div className="text-center text-muted py-3">
                            <i className="fas fa-file-upload fa-2x mb-2"></i>
                            <p className="mb-0">No PAN card uploaded</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Audit History Card */}
                    <div className="card mb-4">
                      <h5
                        className="card-header d-flex justify-content-between align-items-center"
                        style={{ cursor: 'pointer' }}
                        onClick={() => setShowAuditHistory(!showAuditHistory)}
                      >
                        <span><i className="fas fa-history mr-2"></i>Review History</span>
                        <i className={`fas fa-chevron-${showAuditHistory ? 'up' : 'down'}`}></i>
                      </h5>
                      {showAuditHistory && (
                        <div className="card-body p-0">
                          {auditLogs.length > 0 ? (
                            <ul className="list-group list-group-flush">
                              {auditLogs.slice(0, 10).map((log) => (
                                <li key={log._id} className="list-group-item">
                                  <div className="d-flex justify-content-between">
                                    <span className={`badge ${
                                      log.new_value === 'verified' ? 'badge-success' :
                                      log.new_value === 'rejected' ? 'badge-danger' : 'badge-secondary'
                                    }`}>
                                      {log.previous_value} → {log.new_value}
                                    </span>
                                    <small className="text-muted">
                                      {new Date(log.created_at).toLocaleDateString('en-IN', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric'
                                      })}
                                    </small>
                                  </div>
                                  <small className="text-muted d-block mt-1">
                                    By: {log.performed_by_name}
                                  </small>
                                  {log.reason && (
                                    <small className="text-danger d-block">
                                      Reason: {log.reason}
                                    </small>
                                  )}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <div className="text-center text-muted py-3">
                              <i className="fas fa-inbox fa-2x mb-2"></i>
                              <p className="mb-0">No review history</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                  </div>
                )}
              </div>
            </form>

            {/* Rejection Confirmation Modal */}
            {showRejectionConfirm && (
              <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <div className="modal-dialog modal-dialog-centered">
                  <div className="modal-content">
                    <div className="modal-header bg-danger text-white">
                      <h5 className="modal-title">
                        <i className="fas fa-exclamation-triangle mr-2"></i>
                        Confirm Rejection
                      </h5>
                      <button
                        type="button"
                        className="close text-white"
                        onClick={() => {
                          setShowRejectionConfirm(false);
                          setPendingVerificationStatus('');
                        }}
                      >
                        <span>&times;</span>
                      </button>
                    </div>
                    <div className="modal-body">
                      <p>Are you sure you want to reject this astrologer&apos;s application?</p>
                      <p className="text-muted small mb-0">
                        The astrologer will be notified via email about this decision.
                        You will need to provide a rejection reason on the next step.
                      </p>
                    </div>
                    <div className="modal-footer">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => {
                          setShowRejectionConfirm(false);
                          setPendingVerificationStatus('');
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            verification_status: pendingVerificationStatus
                          }));
                          setShowRejectionConfirm(false);
                          setPendingVerificationStatus('');
                        }}
                      >
                        <i className="fas fa-times-circle mr-2"></i>
                        Yes, Reject Application
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

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
                <i className="fa fa-circle-notch fa-spin fa-3x text-primary"></i>
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