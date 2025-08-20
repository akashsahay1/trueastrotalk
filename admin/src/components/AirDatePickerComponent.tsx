'use client';

import { useEffect, useRef, useId } from 'react';
import 'air-datepicker/air-datepicker.css';

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
  const pickerRef = useRef<{ selectDate: (date: Date, options?: { silent?: boolean }) => void; clear: () => void; destroy: () => void } | null>(null);
  const uniqueId = useId();

  useEffect(() => {
    // Add delay to ensure component is mounted, with random delay to avoid conflicts
    const delay = 100 + Math.random() * 100; // 100-200ms random delay
    const timer = setTimeout(() => {
      initPicker();
    }, delay);

    const initPicker = async () => {
      if (!inputRef.current) return;

      try {
        // Dynamic import to avoid SSR issues
        const { default: AirDatepicker } = await import('air-datepicker');
        const localeEn = await import('air-datepicker/locale/en');
        

        // Add custom CSS for z-index
        const style = document.createElement('style');
        style.textContent = `
          .air-datepicker {
            z-index: 9999 !important;
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
        `;
        if (!document.head.querySelector('style[data-air-datepicker]')) {
          style.setAttribute('data-air-datepicker', 'true');
          document.head.appendChild(style);
        }

        // Destroy existing instance
        if (pickerRef.current) {
          pickerRef.current.destroy();
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
            if (onChange) {
              if (typeof formattedDate === 'string') {
                onChange(formattedDate);
              } else if (Array.isArray(formattedDate) && formattedDate.length > 0) {
                onChange(formattedDate[0]);
              }
            }
          }
        });

        // Set initial value
        if (value && value !== '') {
          try {
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
              pickerRef.current.selectDate(date);
            }
          } catch {
            console.warn('Invalid date value:', value);
          }
        }

        console.log('Air Datepicker initialized successfully for:', placeholder, 'ID:', uniqueId);

      } catch (error) {
        console.error('Error initializing Air Datepicker:', error);
      }
    };

    return () => {
      clearTimeout(timer);
      if (pickerRef.current && typeof pickerRef.current.destroy === 'function') {
        pickerRef.current.destroy();
      }
    };
  }, [onChange, placeholder, uniqueId, value, maxDate, minDate]);

  // Update value when prop changes
  useEffect(() => {
    if (pickerRef.current && value !== undefined) {
      if (value === '') {
        pickerRef.current.clear();
      } else {
        try {
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            pickerRef.current.selectDate(date, { silent: true });
          }
        } catch {
          console.warn('Invalid date value:', value);
        }
      }
    }
  }, [value]);

  return (
    <input
      ref={inputRef}
      type="text"
      id={uniqueId}
      className={className}
      placeholder={placeholder}
      readOnly
      disabled={disabled}
      style={{ 
        cursor: disabled ? 'not-allowed' : 'pointer',
        backgroundColor: disabled ? '#e9ecef' : 'white'
      }}
    />
  );
};

export default AirDatePickerComponent;