"use client";

import React, { useState } from "react";
import Image from "next/image";

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
}

const LazyImage: React.FC<LazyImageProps> = ({ 
  src, 
  alt, 
  className = "", 
  width = 400, 
  height = 300 
}) => {
  console.log("LazyImage component rendering with src:", src);
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    console.log("Image loaded:", src);
    setIsLoaded(true);
  };

  const handleError = () => {
    console.log("Image error:", src);
    setHasError(true);
  };

  if (hasError) {
    return (
      <div className={`bg-gray-200 flex items-center justify-center ${className}`} style={{ width, height }}>
        <span className="text-gray-500 text-sm">Image not found</span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        onLoad={handleLoad}
        onError={handleError}
        className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
        loading="lazy"
      />
    </div>
  );
};

export default LazyImage;