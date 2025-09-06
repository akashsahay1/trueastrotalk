'use client';

import React from 'react';
import Image from 'next/image';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
type AvatarVariant = 'circle' | 'rounded' | 'square';

interface AvatarProps {
  src?: string;
  alt?: string;
  name: string;
  size?: AvatarSize | number;
  variant?: AvatarVariant;
  className?: string;
  showBorder?: boolean;
  status?: 'online' | 'offline' | 'away' | 'busy';
  fallbackBg?: string;
  fallbackTextColor?: string;
}

const sizeMap: Record<AvatarSize, number> = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 48,
  xl: 64,
  xxl: 96
};

const variantClasses: Record<AvatarVariant, string> = {
  circle: 'rounded-circle',
  rounded: 'rounded',
  square: ''
};

export function Avatar({
  src,
  alt,
  name,
  size = 'md',
  variant = 'circle',
  className = '',
  showBorder = false,
  status,
  fallbackBg = 'bg-primary',
  fallbackTextColor = 'text-white'
}: AvatarProps) {
  const sizeValue = typeof size === 'number' ? size : sizeMap[size];
  const variantClass = variantClasses[variant];
  const borderClass = showBorder ? 'border border-2 border-white' : '';
  
  const getInitials = (name: string) => {
    if (!name) return '?';
    
    const parts = name.trim().split(' ');
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }
    
    return parts[0].charAt(0).toUpperCase() + parts[parts.length - 1].charAt(0).toUpperCase();
  };

  const containerClasses = [
    'position-relative',
    'overflow-hidden',
    'd-inline-flex',
    'align-items-center',
    'justify-content-center',
    variantClass,
    borderClass,
    className
  ].filter(Boolean).join(' ');

  const containerStyle = {
    width: sizeValue,
    height: sizeValue,
    minWidth: sizeValue,
    minHeight: sizeValue
  };

  return (
    <div className={containerClasses} style={containerStyle}>
      {src ? (
        <Image
          src={src}
          alt={alt || name}
          width={sizeValue}
          height={sizeValue}
          className={`${variantClass} w-100 h-100`}
          style={{ 
            objectFit: 'cover',
            width: sizeValue,
            height: sizeValue
          }}
          onError={(e) => {
            // Hide the image on error, fallback to initials
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      ) : (
        <div 
          className={`${fallbackBg} ${fallbackTextColor} d-flex align-items-center justify-content-center w-100 h-100 font-weight-bold`}
          style={{ 
            fontSize: sizeValue * 0.4,
            lineHeight: 1
          }}
        >
          {getInitials(name)}
        </div>
      )}

      {/* Status indicator */}
      {status && (
        <div
          className={`position-absolute border border-2 border-white rounded-circle ${getStatusColor(status)}`}
          style={{
            width: sizeValue * 0.3,
            height: sizeValue * 0.3,
            bottom: 0,
            right: 0
          }}
        />
      )}
    </div>
  );
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'online': return 'bg-success';
    case 'offline': return 'bg-secondary';
    case 'away': return 'bg-warning';
    case 'busy': return 'bg-danger';
    default: return 'bg-secondary';
  }
}

// Specialized Avatar Components
export function UserAvatar({ 
  user, 
  size = 'md',
  showStatus = false,
  ...props 
}: { 
  user: { 
    full_name?: string; 
    name?: string;
    profile_image?: string;
    avatar?: string;
    is_online?: boolean;
  };
  size?: AvatarSize | number;
  showStatus?: boolean;
} & Omit<AvatarProps, 'src' | 'name'>) {
  const name = user.full_name || user.name || 'Unknown';
  const src = user.profile_image || user.avatar;
  const status = showStatus ? (user.is_online ? 'online' : 'offline') : undefined;

  return (
    <Avatar
      src={src}
      name={name}
      size={size}
      status={status}
      {...props}
    />
  );
}

export function AvatarGroup({ 
  users, 
  max = 3, 
  size = 'sm',
  className = '' 
}: { 
  users: Array<{ full_name?: string; name?: string; profile_image?: string; avatar?: string }>;
  max?: number;
  size?: AvatarSize;
  className?: string;
}) {
  const displayUsers = users.slice(0, max);
  const remainingCount = users.length - max;

  return (
    <div className={`d-flex ${className}`}>
      {displayUsers.map((user, index) => (
        <div
          key={index}
          className="mr-n2"
          style={{ zIndex: max - index }}
        >
          <UserAvatar
            user={user}
            size={size}
            showBorder={true}
          />
        </div>
      ))}
      {remainingCount > 0 && (
        <div
          className="mr-n2"
          style={{ zIndex: 0 }}
        >
          <Avatar
            name={`+${remainingCount}`}
            size={size}
            fallbackBg="bg-light"
            fallbackTextColor="text-muted"
            showBorder={true}
          />
        </div>
      )}
    </div>
  );
}