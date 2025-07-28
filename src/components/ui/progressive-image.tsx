import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface ProgressiveImageProps {
  src: string;
  alt: string;
  placeholder?: string;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
  priority?: boolean;
  sizes?: string;
  quality?: number;
}

export const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
  src,
  alt,
  placeholder,
  className,
  onLoad,
  onError,
  priority = false,
  sizes,
  quality = 75,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(placeholder || '');
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Generate WebP and optimized URLs
  const getOptimizedUrl = (url: string, format?: 'webp' | 'jpg') => {
    if (!url || url.startsWith('data:')) return url;
    
    // Check if it's a Supabase storage URL
    if (url.includes('supabase')) {
      const baseUrl = url.split('?')[0];
      const params = new URLSearchParams();
      
      if (format) params.set('format', format);
      if (quality !== 75) params.set('quality', quality.toString());
      if (sizes) params.set('resize', sizes);
      
      return `${baseUrl}?${params.toString()}`;
    }
    
    return url;
  };

  const preloadImage = (imageUrl: string) => {
    return new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => reject();
      img.src = imageUrl;
    });
  };

  const loadHighResImage = async () => {
    try {
      setIsLoading(true);
      setIsError(false);

      // Try WebP first, fallback to original format
      const webpUrl = getOptimizedUrl(src, 'webp');
      const originalUrl = getOptimizedUrl(src);

      let finalUrl = originalUrl;
      
      // Check WebP support and try WebP first
      if (supportsWebP()) {
        try {
          await preloadImage(webpUrl);
          finalUrl = webpUrl;
        } catch {
          // Fallback to original format
          await preloadImage(originalUrl);
        }
      } else {
        await preloadImage(originalUrl);
      }

      setCurrentSrc(finalUrl);
      setIsLoading(false);
      onLoad?.();
    } catch (error) {
      console.error('Failed to load image:', error);
      setIsError(true);
      setIsLoading(false);
      onError?.();
    }
  };

  // Check WebP support
  const supportsWebP = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').startsWith('data:image/webp');
  };

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority) {
      // Load immediately for priority images
      loadHighResImage();
      return;
    }

    // Set up intersection observer for lazy loading
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            loadHighResImage();
            observerRef.current?.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before entering viewport
        threshold: 0.1,
      }
    );

    if (imgRef.current) {
      observerRef.current.observe(imgRef.current);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [src, priority]);

  // Cleanup observer on unmount
  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  if (isError) {
    return (
      <div 
        className={cn(
          'flex items-center justify-center bg-muted text-muted-foreground',
          className
        )}
        role="img"
        aria-label={alt}
      >
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Placeholder/Low-res image */}
      {placeholder && isLoading && (
        <img
          src={placeholder}
          alt=""
          className={cn(
            'absolute inset-0 w-full h-full object-cover transition-opacity duration-300',
            'filter blur-sm scale-110', // Slight blur and scale to hide edges
            currentSrc && !isLoading ? 'opacity-0' : 'opacity-100'
          )}
          aria-hidden="true"
        />
      )}

      {/* High-res image */}
      <img
        ref={imgRef}
        src={currentSrc || src}
        alt={alt}
        className={cn(
          'w-full h-full object-cover transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100'
        )}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
      />

      {/* Loading spinner */}
      {isLoading && !placeholder && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};