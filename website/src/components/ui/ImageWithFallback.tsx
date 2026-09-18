import { useState, type ImgHTMLAttributes } from 'react';
import { Image as ImageIcon } from 'lucide-react';

interface ImageWithFallbackProps extends ImgHTMLAttributes<HTMLImageElement> {
  fallbackType?: 'food' | 'restaurant' | 'avatar';
  containerClassName?: string;
}

export default function ImageWithFallback({
  src,
  alt,
  className = '',
  fallbackType = 'food',
  containerClassName = '',
  ...props
}: ImageWithFallbackProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // If no source is provided at all, immediately show fallback
  if (!src || hasError) {
    return (
      <div 
        className={`bg-orange-50 flex flex-col items-center justify-center text-brand-primary/40 ${className} ${containerClassName}`}
        aria-label={alt || 'Image unavailable'}
      >
        <ImageIcon className="w-1/3 h-1/3 max-w-[48px] max-h-[48px]" />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${containerClassName} ${className}`}>
      {/* Skeleton overlay while loading */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-100 animate-pulse" />
      )}
      
      <img
        src={src}
        alt={alt || ''}
        className={`w-full h-full object-cover transition-opacity duration-300 ${!isLoaded ? 'opacity-0' : 'opacity-100'}`}
        onLoad={() => setIsLoaded(true)}
        onError={() => {
          setHasError(true);
          setIsLoaded(true);
        }}
        {...props}
      />
    </div>
  );
}
