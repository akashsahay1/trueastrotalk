'use client';

import { useEffect, useRef } from 'react';
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

  useEffect(() => {
    if (!inputRef.current || typeof window === 'undefined') return;

    const initPicker = async () => {
      try {
        const AirDatepicker = await import('air-datepicker');
        const localeEn = await import('air-datepicker/locale/en');
        
        // Simple initialization - let the library handle everything
        new AirDatepicker.default(inputRef.current!, {
          locale: localeEn.default,
          dateFormat: 'yyyy-MM-dd',
          autoClose: true,
          maxDate: maxDate,
          minDate: minDate,
          buttons: ['today', 'clear'],
          onSelect: ({ formattedDate }) => {
            if (onChange) {
              const dateStr = Array.isArray(formattedDate) ? formattedDate[0] : formattedDate;
              onChange(dateStr || '');
            }
          }
        });

        // Set initial value if provided
        if (value && inputRef.current) {
          inputRef.current.value = value;
        }

      } catch (error) {
        console.error('Error initializing air-datepicker:', error);
      }
    };

    initPicker();
  }, [maxDate, minDate, onChange, value]);

  // Update input value when prop changes
  useEffect(() => {
    if (inputRef.current && value !== inputRef.current.value) {
      inputRef.current.value = value || '';
    }
  }, [value]);

  return (
    <input
      ref={inputRef}
      type="text"
      className={className}
      placeholder={placeholder}
      disabled={disabled}
      readOnly
      style={{ 
        cursor: disabled ? 'not-allowed' : 'pointer',
        backgroundColor: disabled ? '#e9ecef' : 'white'
      }}
    />
  );
};

export default AirDatePickerComponent;