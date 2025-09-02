'use client';

import React from 'react';
import Link from 'next/link';

type ButtonVariant = 
  | 'primary' 
  | 'secondary' 
  | 'success' 
  | 'danger' 
  | 'warning' 
  | 'info' 
  | 'light' 
  | 'dark'
  | 'outline-primary'
  | 'outline-secondary'
  | 'outline-success'
  | 'outline-danger'
  | 'outline-warning'
  | 'outline-info'
  | 'outline-light'
  | 'outline-dark';

type ButtonSize = 'sm' | 'md' | 'lg';

interface BaseButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: string;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  loadingText?: string;
  block?: boolean;
  className?: string;
  children: React.ReactNode;
  disabled?: boolean;
  title?: string;
}

interface ButtonProps extends BaseButtonProps {
  type?: 'button' | 'submit' | 'reset';
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  form?: string;
}

interface LinkButtonProps extends BaseButtonProps {
  href: string;
  target?: string;
  rel?: string;
}

// Regular Button Component
export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  loadingText = 'Loading...',
  block = false,
  className = '',
  children,
  disabled = false,
  type = 'button',
  onClick,
  form,
  title,
  ...props
}: ButtonProps) {
  const baseClasses = 'btn';
  const variantClass = `btn-${variant}`;
  const sizeClass = size !== 'md' ? `btn-${size}` : '';
  const blockClass = block ? 'btn-block' : '';
  const disabledClass = (disabled || loading) ? 'disabled' : '';

  const classes = [
    baseClasses,
    variantClass,
    sizeClass,
    blockClass,
    disabledClass,
    className
  ].filter(Boolean).join(' ');

  const renderIcon = (position: 'left' | 'right') => {
    if (loading && position === 'left') {
      return <i className="fas fa-spinner fa-spin mr-2"></i>;
    }
    
    if (icon && iconPosition === position && !loading) {
      const iconClass = position === 'left' ? 'mr-2' : 'ml-2';
      return <i className={`${icon} ${iconClass}`}></i>;
    }
    
    return null;
  };

  const content = loading ? loadingText : children;

  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled || loading}
      form={form}
      title={title}
      {...props}
    >
      {renderIcon('left')}
      {content}
      {renderIcon('right')}
    </button>
  );
}

// Link Button Component
export function LinkButton({
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  loadingText = 'Loading...',
  block = false,
  className = '',
  children,
  disabled = false,
  href,
  target,
  rel,
  ...props
}: LinkButtonProps) {
  const baseClasses = 'btn';
  const variantClass = `btn-${variant}`;
  const sizeClass = size !== 'md' ? `btn-${size}` : '';
  const blockClass = block ? 'btn-block' : '';
  const disabledClass = (disabled || loading) ? 'disabled' : '';

  const classes = [
    baseClasses,
    variantClass,
    sizeClass,
    blockClass,
    disabledClass,
    className
  ].filter(Boolean).join(' ');

  const renderIcon = (position: 'left' | 'right') => {
    if (loading && position === 'left') {
      return <i className="fas fa-spinner fa-spin mr-2"></i>;
    }
    
    if (icon && iconPosition === position && !loading) {
      const iconClass = position === 'left' ? 'mr-2' : 'ml-2';
      return <i className={`${icon} ${iconClass}`}></i>;
    }
    
    return null;
  };

  const content = loading ? loadingText : children;

  if (disabled || loading) {
    return (
      <span className={classes} {...props}>
        {renderIcon('left')}
        {content}
        {renderIcon('right')}
      </span>
    );
  }

  return (
    <Link 
      href={href} 
      className={classes}
      target={target}
      rel={rel}
      {...props}
    >
      {renderIcon('left')}
      {content}
      {renderIcon('right')}
    </Link>
  );
}

// Specialized Button Components
export function PrimaryButton(props: Omit<ButtonProps, 'variant'>) {
  return <Button variant="primary" {...props} />;
}

export function SecondaryButton(props: Omit<ButtonProps, 'variant'>) {
  return <Button variant="secondary" {...props} />;
}

export function DangerButton(props: Omit<ButtonProps, 'variant'>) {
  return <Button variant="danger" {...props} />;
}

export function SuccessButton(props: Omit<ButtonProps, 'variant'>) {
  return <Button variant="success" {...props} />;
}

export function OutlineButton(props: Omit<ButtonProps, 'variant'>) {
  return <Button variant="outline-secondary" {...props} />;
}

// Icon-only Button Component
export function IconButton({
  icon,
  variant = 'outline-secondary',
  size = 'sm',
  className = '',
  title,
  ...props
}: Omit<ButtonProps, 'children' | 'icon'> & { 
  icon: string; 
  title?: string; 
}) {
  return (
    <Button
      variant={variant}
      size={size}
      className={`px-2 ${className}`}
      title={title}
      {...props}
    >
      <i className={icon}></i>
    </Button>
  );
}

// Action Button Group Component
interface ActionButtonGroupProps {
  actions: Array<{
    icon: string;
    label: string;
    variant?: ButtonVariant;
    onClick: () => void;
    condition?: boolean;
  }>;
  size?: ButtonSize;
}

export function ActionButtonGroup({ 
  actions, 
  size = 'sm' 
}: ActionButtonGroupProps) {
  const visibleActions = actions.filter(action => action.condition !== false);
  
  if (visibleActions.length === 0) return null;

  return (
    <div className="btn-group" role="group">
      {visibleActions.map((action, index) => (
        <IconButton
          key={index}
          icon={action.icon}
          variant={action.variant || 'outline-secondary'}
          size={size}
          title={action.label}
          onClick={action.onClick}
        />
      ))}
    </div>
  );
}