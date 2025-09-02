/**
 * User Fields Configuration
 * Defines all possible user document fields and their organization by role
 */

export interface UserField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'tel' | 'date' | 'time' | 'textarea' | 'select' | 'number' | 'checkbox' | 'multiselect' | 'file';
  required: boolean;
  validation?: {
    min?: number;
    max?: number;
    pattern?: RegExp;
    message?: string;
  };
  options?: { value: string; label: string }[];
  placeholder?: string;
  helpText?: string;
  defaultValue?: string | number | boolean | string[];
}

export interface FieldGroup {
  title: string;
  description?: string;
  fields: UserField[];
  order: number;
}

// All possible user document fields
export const ALL_USER_FIELDS: Record<string, UserField> = {
  // Basic Information
  profile_image: {
    name: 'profile_image',
    label: 'Profile Image',
    type: 'file',
    required: false,
    helpText: 'Upload a profile picture (max 5MB)'
  },
  full_name: {
    name: 'full_name',
    label: 'Full Name',
    type: 'text',
    required: true,
    validation: { min: 2, max: 100, message: 'Name must be between 2-100 characters' },
    placeholder: 'Enter full name'
  },
  email_address: {
    name: 'email_address',
    label: 'Email Address',
    type: 'email',
    required: true,
    placeholder: 'Enter email address'
  },
  password: {
    name: 'password',
    label: 'Password',
    type: 'password',
    required: true,
    validation: { min: 8, message: 'Password must be at least 8 characters' },
    placeholder: 'Enter password',
    helpText: 'Minimum 8 characters with uppercase, lowercase, number and special character'
  },
  phone_number: {
    name: 'phone_number',
    label: 'Phone Number',
    type: 'tel',
    required: true,
    validation: { pattern: /^[+]?[\d\s\-()]{10,15}$/, message: 'Enter a valid phone number' },
    placeholder: 'Enter phone number'
  },
  gender: {
    name: 'gender',
    label: 'Gender',
    type: 'select',
    required: true,
    options: [
      { value: 'male', label: 'Male' },
      { value: 'female', label: 'Female' },
      { value: 'other', label: 'Other' }
    ],
    defaultValue: 'male'
  },

  // Account Settings
  user_type: {
    name: 'user_type',
    label: 'User Type',
    type: 'select',
    required: true,
    options: [
      { value: 'administrator', label: 'Administrator' },
      { value: 'manager', label: 'Manager' },
      { value: 'astrologer', label: 'Astrologer' },
      { value: 'customer', label: 'Customer' }
    ],
    defaultValue: 'customer'
  },
  auth_type: {
    name: 'auth_type',
    label: 'Authentication Type',
    type: 'select',
    required: true,
    options: [
      { value: 'email', label: 'Email & Password' },
      { value: 'google', label: 'Google OAuth' },
      { value: 'phone', label: 'Phone OTP' }
    ],
    defaultValue: 'email'
  },
  account_status: {
    name: 'account_status',
    label: 'Account Status',
    type: 'select',
    required: true,
    options: [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
      { value: 'suspended', label: 'Suspended' },
      { value: 'banned', label: 'Banned' }
    ],
    defaultValue: 'active'
  },
  verification_status: {
    name: 'verification_status',
    label: 'Verification Status',
    type: 'select',
    required: true,
    options: [
      { value: 'pending', label: 'Pending' },
      { value: 'verified', label: 'Verified' },
      { value: 'rejected', label: 'Rejected' }
    ],
    defaultValue: 'pending'
  },
  verification_status_message: {
    name: 'verification_status_message',
    label: 'Verification Message',
    type: 'textarea',
    required: false,
    placeholder: 'Add verification notes (optional)',
    helpText: 'Internal notes about verification status'
  },
  is_online: {
    name: 'is_online',
    label: 'Online Status',
    type: 'checkbox',
    required: false,
    defaultValue: false
  },

  // Personal Information (Birth Details - mainly for astrologers)
  date_of_birth: {
    name: 'date_of_birth',
    label: 'Date of Birth',
    type: 'date',
    required: false,
    helpText: 'Required for astrological calculations'
  },
  birth_time: {
    name: 'birth_time',
    label: 'Birth Time',
    type: 'time',
    required: false,
    placeholder: 'HH:MM AM/PM',
    helpText: 'Exact time of birth for accurate astrological readings'
  },
  birth_place: {
    name: 'birth_place',
    label: 'Birth Place',
    type: 'text',
    required: false,
    placeholder: 'City, State, Country',
    helpText: 'Place of birth for astrological calculations'
  },

  // Address Information
  address: {
    name: 'address',
    label: 'Street Address',
    type: 'textarea',
    required: false,
    placeholder: 'Enter complete address'
  },
  city: {
    name: 'city',
    label: 'City',
    type: 'text',
    required: false,
    placeholder: 'Enter city name'
  },
  state: {
    name: 'state',
    label: 'State/Province',
    type: 'text',
    required: false,
    placeholder: 'Enter state or province'
  },
  country: {
    name: 'country',
    label: 'Country',
    type: 'text',
    required: true,
    defaultValue: 'India',
    placeholder: 'Enter country name'
  },
  zip: {
    name: 'zip',
    label: 'ZIP/Postal Code',
    type: 'text',
    required: false,
    placeholder: 'Enter postal code'
  },

  // Professional Information (Astrologers)
  experience_years: {
    name: 'experience_years',
    label: 'Years of Experience',
    type: 'number',
    required: false,
    validation: { min: 0, max: 50, message: 'Experience must be between 0-50 years' },
    defaultValue: 0,
    placeholder: 'Enter years of experience'
  },
  bio: {
    name: 'bio',
    label: 'Biography',
    type: 'textarea',
    required: false,
    validation: { max: 2000, message: 'Biography cannot exceed 2000 characters' },
    placeholder: 'Write a brief biography...',
    helpText: 'Describe professional background and expertise'
  },
  qualifications: {
    name: 'qualifications',
    label: 'Qualifications',
    type: 'multiselect',
    required: false,
    defaultValue: [],
    helpText: 'Select relevant educational qualifications and certifications'
  },
  skills: {
    name: 'skills',
    label: 'Skills/Specializations',
    type: 'multiselect',
    required: false,
    defaultValue: [],
    helpText: 'Select areas of astrological expertise'
  },
  languages: {
    name: 'languages',
    label: 'Languages',
    type: 'multiselect',
    required: false,
    defaultValue: [],
    helpText: 'Languages spoken for consultations'
  },

  // Service Rates (Astrologers)
  call_rate: {
    name: 'call_rate',
    label: 'Call Rate (₹/minute)',
    type: 'number',
    required: false,
    validation: { min: 0, max: 200, message: 'Rate must be between ₹0-₹200 per minute' },
    defaultValue: 50,
    placeholder: 'Enter call rate per minute'
  },
  chat_rate: {
    name: 'chat_rate',
    label: 'Chat Rate (₹/minute)',
    type: 'number',
    required: false,
    validation: { min: 0, max: 200, message: 'Rate must be between ₹0-₹200 per minute' },
    defaultValue: 30,
    placeholder: 'Enter chat rate per minute'
  },
  video_rate: {
    name: 'video_rate',
    label: 'Video Call Rate (₹/minute)',
    type: 'number',
    required: false,
    validation: { min: 0, max: 200, message: 'Rate must be between ₹0-₹200 per minute' },
    defaultValue: 80,
    placeholder: 'Enter video call rate per minute'
  }
};

// Field groups by user type
export const USER_TYPE_FIELD_GROUPS: Record<string, FieldGroup[]> = {
  administrator: [
    {
      title: 'Basic Information',
      description: 'Essential account details',
      order: 1,
      fields: [
        ALL_USER_FIELDS.profile_image,
        ALL_USER_FIELDS.full_name,
        ALL_USER_FIELDS.email_address,
        ALL_USER_FIELDS.password,
        ALL_USER_FIELDS.phone_number,
        ALL_USER_FIELDS.gender
      ]
    },
    {
      title: 'Account Settings',
      description: 'Account configuration and permissions',
      order: 2,
      fields: [
        { ...ALL_USER_FIELDS.user_type, defaultValue: 'administrator' },
        ALL_USER_FIELDS.auth_type,
        ALL_USER_FIELDS.account_status,
        ALL_USER_FIELDS.verification_status,
        ALL_USER_FIELDS.verification_status_message,
        ALL_USER_FIELDS.is_online
      ]
    },
    {
      title: 'Contact Information',
      description: 'Address and location details',
      order: 3,
      fields: [
        ALL_USER_FIELDS.address,
        ALL_USER_FIELDS.city,
        ALL_USER_FIELDS.state,
        ALL_USER_FIELDS.country,
        ALL_USER_FIELDS.zip
      ]
    }
  ],

  manager: [
    {
      title: 'Basic Information',
      description: 'Essential account details',
      order: 1,
      fields: [
        ALL_USER_FIELDS.profile_image,
        ALL_USER_FIELDS.full_name,
        ALL_USER_FIELDS.email_address,
        ALL_USER_FIELDS.password,
        ALL_USER_FIELDS.phone_number,
        ALL_USER_FIELDS.gender
      ]
    },
    {
      title: 'Account Settings',
      description: 'Account configuration and permissions',
      order: 2,
      fields: [
        { ...ALL_USER_FIELDS.user_type, defaultValue: 'manager' },
        ALL_USER_FIELDS.auth_type,
        ALL_USER_FIELDS.account_status,
        ALL_USER_FIELDS.verification_status,
        ALL_USER_FIELDS.verification_status_message,
        ALL_USER_FIELDS.is_online
      ]
    },
    {
      title: 'Contact Information',
      description: 'Address and location details',
      order: 3,
      fields: [
        ALL_USER_FIELDS.address,
        ALL_USER_FIELDS.city,
        ALL_USER_FIELDS.state,
        ALL_USER_FIELDS.country,
        ALL_USER_FIELDS.zip
      ]
    }
  ],

  customer: [
    {
      title: 'Basic Information',
      description: 'Essential account details',
      order: 1,
      fields: [
        ALL_USER_FIELDS.profile_image,
        ALL_USER_FIELDS.full_name,
        ALL_USER_FIELDS.email_address,
        ALL_USER_FIELDS.password,
        ALL_USER_FIELDS.phone_number,
        ALL_USER_FIELDS.gender
      ]
    },
    {
      title: 'Account Settings',
      description: 'Account configuration',
      order: 2,
      fields: [
        { ...ALL_USER_FIELDS.user_type, defaultValue: 'customer' },
        ALL_USER_FIELDS.auth_type,
        ALL_USER_FIELDS.account_status,
        ALL_USER_FIELDS.verification_status,
        ALL_USER_FIELDS.is_online
      ]
    },
    {
      title: 'Birth Details',
      description: 'Personal information for astrological consultations',
      order: 3,
      fields: [
        ALL_USER_FIELDS.date_of_birth,
        ALL_USER_FIELDS.birth_time,
        ALL_USER_FIELDS.birth_place
      ]
    },
    {
      title: 'Contact Information',
      description: 'Address and location details',
      order: 4,
      fields: [
        ALL_USER_FIELDS.address,
        ALL_USER_FIELDS.city,
        ALL_USER_FIELDS.state,
        ALL_USER_FIELDS.country,
        ALL_USER_FIELDS.zip
      ]
    }
  ],

  astrologer: [
    {
      title: 'Basic Information',
      description: 'Essential account details',
      order: 1,
      fields: [
        ALL_USER_FIELDS.profile_image,
        ALL_USER_FIELDS.full_name,
        ALL_USER_FIELDS.email_address,
        ALL_USER_FIELDS.password,
        ALL_USER_FIELDS.phone_number,
        ALL_USER_FIELDS.gender
      ]
    },
    {
      title: 'Account Settings',
      description: 'Account configuration and verification',
      order: 2,
      fields: [
        { ...ALL_USER_FIELDS.user_type, defaultValue: 'astrologer' },
        ALL_USER_FIELDS.auth_type,
        ALL_USER_FIELDS.account_status,
        ALL_USER_FIELDS.verification_status,
        ALL_USER_FIELDS.verification_status_message,
        ALL_USER_FIELDS.is_online
      ]
    },
    {
      title: 'Birth Details',
      description: 'Personal astrological information',
      order: 3,
      fields: [
        { ...ALL_USER_FIELDS.date_of_birth, required: true },
        { ...ALL_USER_FIELDS.birth_time, required: true },
        { ...ALL_USER_FIELDS.birth_place, required: true }
      ]
    },
    {
      title: 'Professional Information',
      description: 'Experience and qualifications',
      order: 4,
      fields: [
        ALL_USER_FIELDS.experience_years,
        ALL_USER_FIELDS.bio,
        { ...ALL_USER_FIELDS.qualifications, required: true },
        { ...ALL_USER_FIELDS.skills, required: true },
        ALL_USER_FIELDS.languages
      ]
    },
    {
      title: 'Service Rates',
      description: 'Consultation pricing (₹ per minute)',
      order: 5,
      fields: [
        { ...ALL_USER_FIELDS.call_rate, required: true },
        { ...ALL_USER_FIELDS.chat_rate, required: true },
        { ...ALL_USER_FIELDS.video_rate, required: true }
      ]
    },
    {
      title: 'Contact Information',
      description: 'Address and location details',
      order: 6,
      fields: [
        { ...ALL_USER_FIELDS.address, required: true },
        { ...ALL_USER_FIELDS.city, required: true },
        { ...ALL_USER_FIELDS.state, required: true },
        ALL_USER_FIELDS.country,
        { ...ALL_USER_FIELDS.zip, required: true }
      ]
    }
  ]
};

// Helper function to get field groups for a specific user type
export function getFieldGroupsForUserType(userType: string): FieldGroup[] {
  return USER_TYPE_FIELD_GROUPS[userType] || USER_TYPE_FIELD_GROUPS.customer;
}

// Helper function to get all required fields for a user type
export function getRequiredFieldsForUserType(userType: string): string[] {
  const groups = getFieldGroupsForUserType(userType);
  const requiredFields: string[] = [];
  
  groups.forEach(group => {
    group.fields.forEach(field => {
      if (field.required) {
        requiredFields.push(field.name);
      }
    });
  });
  
  return requiredFields;
}

// Helper function to get default values for a user type
export function getDefaultValuesForUserType(userType: string): Record<string, any> {
  const groups = getFieldGroupsForUserType(userType);
  const defaults: Record<string, any> = {};
  
  groups.forEach(group => {
    group.fields.forEach(field => {
      if (field.defaultValue !== undefined) {
        defaults[field.name] = field.defaultValue;
      }
    });
  });
  
  return defaults;
}