'use client';

import { useEffect, useRef, useId } from 'react';
import 'air-datepicker/air-datepicker.css';

// Type for AirDatepicker instance
interface AirDatepickerInstance {
  destroy: () => void;
  selectDate: (date: Date, options?: { silent?: boolean }) => void;
  clear: () => void;
  show: () => void;
  hide: () => void;
}

// Type for input element with datepicker property
interface DatePickerInput extends HTMLInputElement {
  airdatepicker?: unknown;
}

interface AirDatePickerProps {
  className?: string;
  placeholder?: string;
  value?: string;
  onChange?: (date: string) => void;
  maxDate?: Date;
  minDate?: Date;
  disabled?: boolean;
}

const AirDatePickerComponent: React.FC<AirDatePickerProps> = ({
  className = 'form-control',
  placeholder = 'Select date',
  value = '',
  onChange,
  maxDate,
  minDate,
  disabled = false
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<AirDatepickerInstance | null>(null);
  const uniqueId = useId();

  useEffect(() => {
    let isComponentMounted = true;
    
    const initPicker = async () => {
      if (!inputRef.current || !isComponentMounted) return;

      try {
        // Dynamic import to avoid SSR issues
        const { default: AirDatepicker } = await import('air-datepicker');
        const localeEn = await import('air-datepicker/locale/en');
        
        if (!isComponentMounted) return;

        // Add custom CSS for z-index and fix potential conflicts
        const style = document.createElement('style');
        style.textContent = `
          .air-datepicker {
            z-index: 9999 !important;
            position: fixed !important;
          }
          .air-datepicker-cell.-selected- {
            background: #007bff !important;
          }
          .air-datepicker-cell.-current- {
            color: #007bff !important;
          }
          .air-datepicker-nav {
            background: #f8f9fa !important;
          }
          .air-datepicker-buttons {
            border-top: 1px solid #e9ecef;
            padding: 10px;
          }
          /* Fix input field cursor */
          input[readonly] {
            cursor: pointer !important;
            background-color: #ffffff !important;
          }
        `;
        if (!document.head.querySelector('style[data-air-datepicker]')) {
          style.setAttribute('data-air-datepicker', 'true');
          document.head.appendChild(style);
        }

        // Destroy existing instance properly
        if (pickerRef.current && typeof pickerRef.current.destroy === 'function') {
          try {
            pickerRef.current.destroy();
          } catch (e) {
            console.warn('Error destroying previous picker instance:', e);
          }
          pickerRef.current = null;
        }

        // Clear any existing datepickers on this input
        if (inputRef.current) {
          // Remove any existing datepicker data
          delete (inputRef.current as DatePickerInput).airdatepicker;
        }

        // Initialize Air Datepicker with proper options
        pickerRef.current = new AirDatepicker(inputRef.current, {
          locale: localeEn.default,
          dateFormat: 'yyyy-MM-dd',
          autoClose: true,
          maxDate: maxDate,
          minDate: minDate,
          navTitles: {
            days: 'MMMM <i>yyyy</i>',
            months: 'yyyy'
          },
          buttons: ['today', 'clear'],
          position: 'bottom left',
          container: document.body, // Append to body to avoid z-index issues
          onSelect: ({ formattedDate }: { date: Date | Date[], formattedDate: string | string[] }) => {
            if (onChange && isComponentMounted) {
              if (typeof formattedDate === 'string') {
                onChange(formattedDate);
              } else if (Array.isArray(formattedDate) && formattedDate.length > 0) {
                onChange(formattedDate[0]);
              }
            }
          },
          onHide: () => {
            // Ensure component can be reopened
            if (inputRef.current) {
              inputRef.current.blur();
            }
          }
        });

        // Set initial value (only if we have a valid value)
        if (value && value !== '' && value !== 'null' && value !== 'undefined' && isComponentMounted) {
          try {
            console.log('Setting initial date value:', value);
            const date = new Date(value);
            console.log('Parsed date:', date, 'Valid:', !isNaN(date.getTime()));
            if (!isNaN(date.getTime())) {
              pickerRef.current.selectDate(date, { silent: true });
              console.log('Date set successfully');
            } else {
              console.warn('Invalid parsed date for value:', value);
            }
          } catch (error) {
            console.warn('Error setting initial date value:', value, error);
          }
        } else {
          console.log('No initial date value to set, value is:', value);
        }

        console.log('Air Datepicker initialized successfully for:', placeholder, 'ID:', uniqueId, 'Initial value:', value);

      } catch (error) {
        console.error('Error initializing Air Datepicker:', error);
      }
    };

    // Add delay to ensure component is mounted
    const timer = setTimeout(initPicker, 100);

    return () => {
      isComponentMounted = false;
      clearTimeout(timer);
      if (pickerRef.current && typeof pickerRef.current.destroy === 'function') {
        try {
          pickerRef.current.destroy();
        } catch (e) {
          console.warn('Error destroying picker on cleanup:', e);
        }
        pickerRef.current = null;
      }
    };
  }, [onChange, placeholder, uniqueId, maxDate, minDate, value]);

  // Update value when prop changes (separate from initialization)
  useEffect(() => {
    if (pickerRef.current && value !== undefined) {
      try {
        if (value === '') {
          pickerRef.current.clear();
        } else {
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            pickerRef.current.selectDate(date, { silent: true });
          }
        }
      } catch (error) {
        console.warn('Invalid date value during update:', value, error);
      }
    }
  }, [value]);

  const handleClick = () => {
    if (!disabled) {
      console.log('AirDatePicker clicked, picker ref exists:', !!pickerRef.current);
      
      // Check if picker exists and try to show it
      if (pickerRef.current) {
        try {
          // Air Datepicker should have a show method
          if (pickerRef.current && typeof pickerRef.current.show === 'function') {
            pickerRef.current.show();
          } else {
            console.log('No show method found, focusing input instead');
            inputRef.current?.focus();
          }
        } catch (error) {
          console.warn('Error showing datepicker:', error);
          inputRef.current?.focus();
        }
      } else {
        console.log('Picker not initialized yet, focusing input');
        inputRef.current?.focus();
      }
    }
  };

  return (
    <input
      ref={inputRef}
      type="text"
      id={uniqueId}
      className={className}
      placeholder={placeholder}
      readOnly
      disabled={disabled}
      onClick={handleClick}
      style={{ 
        cursor: disabled ? 'not-allowed' : 'pointer',
        backgroundColor: disabled ? '#e9ecef' : 'white'
      }}
    />
  );
};

export default AirDatePickerComponent;