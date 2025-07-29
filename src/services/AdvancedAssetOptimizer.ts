import { CDNAssetService } from './CDNAssetService';
import { PerformanceCache } from './PerformanceCache';

interface ImageFormats {
  avif?: string;
  webp?: string;
  jpeg?: string;
  png?: string;
}

interface ResponsiveImageSet {
  src: string;
  srcSet: string;
  sizes: string;
  formats: ImageFormats;
  loading: 'lazy' | 'eager';
  placeholder?: string;
}

interface OptimizationOptions {
  quality?: number;
  format?: 'auto' | 'avif' | 'webp' | 'jpeg' | 'png';
  responsive?: boolean;
  lazy?: boolean;
  placeholder?: 'blur' | 'color' | 'none';
  tenant?: string;
}

export class AdvancedAssetOptimizer {
  private static instance: AdvancedAssetOptimizer;
  private cache: PerformanceCache;
  private cdnService: CDNAssetService;
  private intersectionObserver: IntersectionObserver | null = null;
  private preloadQueue: Set<string> = new Set();
  
  private constructor() {
    this.cache = PerformanceCache.getInstance();
    this.cdnService = CDNAssetService.getInstance();
    this.initializeIntersectionObserver();
  }

  static getInstance(): AdvancedAssetOptimizer {
    if (!this.instance) {
      this.instance = new AdvancedAssetOptimizer();
    }
    return this.instance;
  }

  /**
   * Generate optimized image with modern formats and responsive sizes
   */
  generateOptimizedImage(
    src: string,
    alt: string,
    options: OptimizationOptions = {}
  ): ResponsiveImageSet {
    const {
      quality = 85,
      format = 'auto',
      responsive = true,
      lazy = true,
      placeholder = 'blur',
      tenant
    } = options;

    // Generate different format URLs
    const formats: ImageFormats = {};
    
    if (format === 'auto' || format === 'avif') {
      formats.avif = this.generateFormatUrl(src, { format: 'avif', quality });
    }
    
    if (format === 'auto' || format === 'webp') {
      formats.webp = this.generateFormatUrl(src, { format: 'webp', quality });
    }
    
    if (format === 'auto' || format === 'jpeg') {
      formats.jpeg = this.generateFormatUrl(src, { format: 'jpeg', quality });
    }

    // Generate responsive sizes if enabled
    const srcSet = responsive ? this.generateResponsiveSrcSet(src, formats) : src;
    const sizes = responsive ? this.generateSizesAttribute() : '100vw';

    // Generate placeholder
    const placeholderSrc = this.generatePlaceholder(src, placeholder);

    return {
      src: formats.webp || formats.jpeg || src,
      srcSet,
      sizes,
      formats,
      loading: lazy ? 'lazy' : 'eager',
      placeholder: placeholderSrc
    };
  }

  /**
   * Lazy load images with intersection observer
   */
  lazyLoadImage(element: HTMLImageElement, responsiveSet: ResponsiveImageSet): void {
    if (!this.intersectionObserver) {
      this.loadImageImmediately(element, responsiveSet);
      return;
    }

    // Set placeholder initially
    if (responsiveSet.placeholder) {
      element.src = responsiveSet.placeholder;
    }

    // Store the real image data on the element
    element.dataset.src = responsiveSet.src;
    element.dataset.srcset = responsiveSet.srcSet;
    element.dataset.sizes = responsiveSet.sizes;

    // Add to observer
    this.intersectionObserver.observe(element);
  }

  /**
   * Preload critical images
   */
  preloadCriticalImages(imageUrls: string[], tenant?: string): void {
    imageUrls.forEach(url => {
      if (!this.preloadQueue.has(url)) {
        this.preloadQueue.add(url);
        this.preloadImageWithFormats(url, tenant);
      }
    });
  }

  /**
   * Generate responsive image component data
   */
  generateResponsiveImageData(src: string, options: OptimizationOptions = {}) {
    const responsiveSet = this.generateOptimizedImage(src, '', options);
    
    return {
      // Modern browsers - AVIF first
      avifSources: responsiveSet.formats.avif ? [{
        srcSet: this.generateResponsiveSrcSet(src, { avif: responsiveSet.formats.avif }),
        type: 'image/avif',
        sizes: responsiveSet.sizes
      }] : [],
      
      // WebP fallback
      webpSources: responsiveSet.formats.webp ? [{
        srcSet: this.generateResponsiveSrcSet(src, { webp: responsiveSet.formats.webp }),
        type: 'image/webp',
        sizes: responsiveSet.sizes
      }] : [],
      
      // JPEG/PNG fallback
      fallbackSrc: responsiveSet.formats.jpeg || responsiveSet.formats.png || src,
      fallbackSrcSet: responsiveSet.srcSet,
      sizes: responsiveSet.sizes,
      loading: responsiveSet.loading,
      placeholder: responsiveSet.placeholder
    };
  }

  /**
   * Optimize images on upload
   */
  async optimizeImageOnUpload(
    file: File,
    tenant: string,
    options: OptimizationOptions = {}
  ): Promise<{
    original: string;
    optimized: ImageFormats;
    responsive: { [size: string]: ImageFormats };
  }> {
    try {
      // Upload original with CDN service
      const manifest = await this.cdnService.uploadTenantAsset({
        tenantId: tenant,
        file,
        optimize: true,
        formats: ['webp', 'jpg'],
        sizes: [
          { width: 320, suffix: 'mobile' },
          { width: 768, suffix: 'tablet' },
          { width: 1024, suffix: 'desktop' },
          { width: 1920, suffix: 'large' }
        ]
      });

      // Generate AVIF versions
      const avifVersions = await this.generateAVIFVersions(manifest.original, tenant);

      return {
        original: manifest.original,
        optimized: {
          avif: avifVersions.original,
          webp: manifest.optimized.webp?.original,
          jpeg: manifest.optimized.jpg?.original
        },
        responsive: {
          mobile: {
            avif: avifVersions.mobile,
            webp: manifest.optimized.webp?.['320xauto'],
            jpeg: manifest.optimized.jpg?.['320xauto']
          },
          tablet: {
            avif: avifVersions.tablet,
            webp: manifest.optimized.webp?.['768xauto'],
            jpeg: manifest.optimized.jpg?.['768xauto']
          },
          desktop: {
            avif: avifVersions.desktop,
            webp: manifest.optimized.webp?.['1024xauto'],
            jpeg: manifest.optimized.jpg?.['1024xauto']
          },
          large: {
            avif: avifVersions.large,
            webp: manifest.optimized.webp?.['1920xauto'],
            jpeg: manifest.optimized.jpg?.['1920xauto']
          }
        }
      };
    } catch (error) {
      console.error('Image optimization failed:', error);
      throw error;
    }
  }

  /**
   * Cache optimized images in browser storage
   */
  async cacheOptimizedImage(src: string, tenant?: string): Promise<void> {
    try {
      const cacheKey = `optimized-image-${src}`;
      const cached = await this.cache.get('assets', cacheKey, tenant);
      
      if (!cached) {
        const optimizedData = this.generateOptimizedImage(src, '', { tenant });
        await this.cache.set('assets', cacheKey, optimizedData, tenant);
      }
    } catch (error) {
      console.warn('Image caching failed:', error);
    }
  }

  // Private methods
  private initializeIntersectionObserver(): void {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      return;
    }

    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            this.loadIntersectedImage(img);
            this.intersectionObserver?.unobserve(img);
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before the image comes into view
        threshold: 0.1
      }
    );
  }

  private loadIntersectedImage(img: HTMLImageElement): void {
    const src = img.dataset.src;
    const srcSet = img.dataset.srcset;
    const sizes = img.dataset.sizes;

    if (src) {
      img.src = src;
    }
    if (srcSet) {
      img.srcset = srcSet;
    }
    if (sizes) {
      img.sizes = sizes;
    }

    // Remove data attributes
    delete img.dataset.src;
    delete img.dataset.srcset;
    delete img.dataset.sizes;

    // Add loaded class for animations
    img.classList.add('image-loaded');
  }

  private loadImageImmediately(img: HTMLImageElement, responsiveSet: ResponsiveImageSet): void {
    img.src = responsiveSet.src;
    img.srcset = responsiveSet.srcSet;
    img.sizes = responsiveSet.sizes;
    img.loading = responsiveSet.loading;
  }

  private generateFormatUrl(
    src: string,
    options: { format: string; quality: number }
  ): string {
    // Use CDN service to get optimized URL
    return this.cdnService.getOptimizedAssetUrl(src, {
      format: options.format as any,
      quality: options.quality
    });
  }

  private generateResponsiveSrcSet(src: string, formats: ImageFormats): string {
    const breakpoints = [320, 768, 1024, 1920];
    const srcSetEntries: string[] = [];

    breakpoints.forEach(width => {
      Object.values(formats).forEach(formatUrl => {
        if (formatUrl) {
          const responsiveUrl = this.generateFormatUrl(formatUrl, {
            format: 'webp',
            quality: 85
          });
          srcSetEntries.push(`${responsiveUrl} ${width}w`);
        }
      });
    });

    return srcSetEntries.join(', ');
  }

  private generateSizesAttribute(): string {
    return '(max-width: 320px) 100vw, (max-width: 768px) 100vw, (max-width: 1024px) 100vw, 100vw';
  }

  private generatePlaceholder(src: string, type: string): string {
    switch (type) {
      case 'blur':
        // Generate a tiny blurred version
        return this.generateFormatUrl(src, { format: 'jpeg', quality: 10 });
      case 'color':
        // Generate a solid color based on the image
        return this.generateAverageColorPlaceholder(src);
      default:
        return '';
    }
  }

  private generateAverageColorPlaceholder(src: string): string {
    // Simple color placeholder - in production, would extract dominant color
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIHZpZXdCb3g9IjAgMCAxMCAxMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjRjNGNEY2Ii8+Cjwvc3ZnPgo=';
  }

  private async preloadImageWithFormats(url: string, tenant?: string): Promise<void> {
    try {
      // Preload AVIF version first
      const avifUrl = this.generateFormatUrl(url, { format: 'avif', quality: 85 });
      await this.preloadSingleImage(avifUrl).catch(() => {
        // Fallback to WebP
        const webpUrl = this.generateFormatUrl(url, { format: 'webp', quality: 85 });
        return this.preloadSingleImage(webpUrl).catch(() => {
          // Final fallback to original
          return this.preloadSingleImage(url);
        });
      });

      console.log(`✅ Preloaded image: ${url}`);
    } catch (error) {
      console.warn(`⚠️ Failed to preload image: ${url}`, error);
    }
  }

  private preloadSingleImage(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = url;
      link.onload = () => resolve();
      link.onerror = () => reject(new Error(`Failed to preload: ${url}`));
      document.head.appendChild(link);
    });
  }

  private async generateAVIFVersions(originalUrl: string, tenant: string): Promise<{
    original: string;
    mobile: string;
    tablet: string;
    desktop: string;
    large: string;
  }> {
    // In production, this would call an image processing service
    // For now, simulate by modifying URLs
    const baseUrl = originalUrl.split('?')[0];
    
    return {
      original: `${baseUrl}?format=avif&quality=85`,
      mobile: `${baseUrl}?format=avif&quality=85&width=320`,
      tablet: `${baseUrl}?format=avif&quality=85&width=768`,
      desktop: `${baseUrl}?format=avif&quality=85&width=1024`,
      large: `${baseUrl}?format=avif&quality=85&width=1920`
    };
  }

  /**
   * Cleanup and memory management
   */
  cleanup(): void {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
    this.preloadQueue.clear();
  }
}