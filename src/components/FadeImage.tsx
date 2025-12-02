'use client';
import { useState, useCallback } from 'react';
import Image, { ImageProps } from 'next/image';

interface FadeImageProps extends Omit<ImageProps, 'onLoad'> {
  fallbackSrc?: string;
  wrapperClassName?: string;
  placeholderColor?: string;
}

export default function FadeImage({
  src,
  alt,
  fallbackSrc = '/uploads/1764611922746-1__4_.jpeg',
  wrapperClassName = '',
  placeholderColor = 'bg-gray-200',
  className = '',
  ...props
}: FadeImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const handleLoad = useCallback(() => {
    setLoaded(true);
  }, []);

  const handleError = useCallback(() => {
    setError(true);
    setLoaded(true);
  }, []);

  const imageSrc = error ? fallbackSrc : src;

  return (
    <div className={`relative overflow-hidden ${wrapperClassName}`}>
      {/* Placeholder skeleton */}
      <div 
        className={`absolute inset-0 ${placeholderColor} transition-opacity duration-500 ${loaded ? 'opacity-0' : 'opacity-100'}`}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
      </div>
      
      <Image
        src={imageSrc}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        className={`transition-opacity duration-500 ease-out ${loaded ? 'opacity-100' : 'opacity-0'} ${className}`}
        {...props}
      />
    </div>
  );
}

// Версия для обычных img тегов (без Next.js Image)
interface FadeImgProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  wrapperClassName?: string;
  placeholderColor?: string;
}

export function FadeImg({
  src,
  alt = '',
  fallbackSrc = '/uploads/1764611922746-1__4_.jpeg',
  wrapperClassName = '',
  placeholderColor = 'bg-gray-200',
  className = '',
  ...props
}: FadeImgProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const handleLoad = useCallback(() => {
    setLoaded(true);
  }, []);

  const handleError = useCallback(() => {
    setError(true);
    setLoaded(true);
  }, []);

  const imageSrc = error ? fallbackSrc : src;

  return (
    <div className={`relative overflow-hidden ${wrapperClassName}`}>
      <div 
        className={`absolute inset-0 ${placeholderColor} transition-opacity duration-500 ${loaded ? 'opacity-0' : 'opacity-100'}`}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
      </div>
      
      <img
        src={imageSrc}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        className={`transition-opacity duration-500 ease-out ${loaded ? 'opacity-100' : 'opacity-0'} ${className}`}
        {...props}
      />
    </div>
  );
}
