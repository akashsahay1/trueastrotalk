import React, { useEffect, useRef, useState } from 'react';

interface GooglePlacesAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

const GooglePlacesAutocomplete: React.FC<GooglePlacesAutocompleteProps> = ({
  value,
  onChange,
  placeholder = "Enter your birth place",
  className = "",
  required = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isReady, setIsReady] = useState(false);
  const autocompleteRef = useRef<any>(null);

  useEffect(() => {
    // Check if Google is already loaded
    if (window.google && window.google.maps && window.google.maps.places) {
      setIsReady(true);
      return;
    }

    // Check if script already exists
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');

    if (existingScript) {
      // Script exists, poll until loaded
      const checkInterval = setInterval(() => {
        if (window.google && window.google.maps && window.google.maps.places) {
          setIsReady(true);
          clearInterval(checkInterval);
        }
      }, 100);

      setTimeout(() => clearInterval(checkInterval), 10000);
      return;
    }

    // Load Google Maps script
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY') {
      console.warn('Google Maps API key not configured');
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      // Poll for places library to be ready
      const checkInterval = setInterval(() => {
        if (window.google && window.google.maps && window.google.maps.places) {
          setIsReady(true);
          clearInterval(checkInterval);
        }
      }, 100);

      setTimeout(() => clearInterval(checkInterval), 10000);
    };

    script.onerror = () => {
      console.error('Failed to load Google Maps script. Check API key and restrictions.');
    };

    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!isReady || !inputRef.current) return;

    // Wait a bit more to ensure places library is fully loaded
    const timer = setTimeout(() => {
      try {
        if (!window.google?.maps?.places?.Autocomplete) {
          console.error('Google Places Autocomplete not available');
          return;
        }

        const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current!, {
          types: ['(cities)'],
          fields: ['formatted_address', 'name', 'address_components']
        });

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (place.formatted_address) {
            onChange(place.formatted_address);
          } else if (place.name) {
            onChange(place.name);
          }
        });

        autocompleteRef.current = autocomplete;
      } catch (error) {
        console.error('Error initializing autocomplete:', error);
      }
    }, 500);

    return () => {
      clearTimeout(timer);
      if (autocompleteRef.current) {
        window.google?.maps?.event?.clearInstanceListeners(inputRef.current);
      }
    };
  }, [isReady, onChange]);

  return (
    <div ref={containerRef}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={className}
        required={required}
        autoComplete="off"
      />
    </div>
  );
};

// Extend Window interface for TypeScript
declare global {
  interface Window {
    google: any;
    initGooglePlaces?: () => void;
  }
}

export default GooglePlacesAutocomplete;
