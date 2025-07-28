import { supabase } from '@/integrations/supabase/client';

interface AssetUploadOptions {
  tenantId: string;
  file: File;
  path?: string;
  optimize?: boolean;
  formats?: Array<'webp' | 'jpg' | 'png'>;
  sizes?: Array<{ width: number; height?: number; suffix: string }>;
}

interface AssetManifest {
  original: string;
  optimized: {
    [format: string]: {
      [size: string]: string;
    };
  };
  uploadedAt: number;
  tenantId: string;
}

/**
 * CDN Asset Service for managing tenant-specific media assets
 * Handles upload, optimization, and retrieval of images and other assets
 */
export class CDNAssetService {
  private static instance: CDNAssetService;
  private readonly BUCKET_NAME = 'tenant-assets';
  private manifestCache = new Map<string, AssetManifest>();

  static getInstance(): CDNAssetService {
    if (!this.instance) {
      this.instance = new CDNAssetService();
    }
    return this.instance;
  }

  /**
   * Upload and optimize tenant asset with multiple formats and sizes
   */
  async uploadTenantAsset(options: AssetUploadOptions): Promise<AssetManifest> {
    const { tenantId, file, path, optimize = true, formats = ['webp', 'jpg'], sizes = [] } = options;
    
    console.log(`📤 Uploading tenant asset for ${tenantId}:`, file.name);
    
    try {
      // Generate unique file path
      const timestamp = Date.now();
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const baseName = file.name.replace(/\.[^/.]+$/, '');
      const fileName = path || `${tenantId}/${baseName}_${timestamp}.${fileExt}`;
      
      // Upload original file
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(fileName, file, {
          cacheControl: '31536000', // 1 year cache
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get public URL for original
      const { data: { publicUrl: originalUrl } } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(fileName);

      const manifest: AssetManifest = {
        original: originalUrl,
        optimized: {},
        uploadedAt: timestamp,
        tenantId
      };

      // Generate optimized versions if requested
      if (optimize && this.isOptimizableImage(file.type)) {
        await this.generateOptimizedVersions(file, fileName, tenantId, formats, sizes, manifest);
      }

      // Cache manifest
      this.manifestCache.set(fileName, manifest);
      
      // Store manifest in storage for persistence
      await this.storeAssetManifest(fileName, manifest);

      console.log(`✅ Asset uploaded successfully: ${fileName}`);
      return manifest;
    } catch (error) {
      console.error('❌ Asset upload failed:', error);
      throw error;
    }
  }

  /**
   * Get optimized asset URL with fallback
   */
  getOptimizedAssetUrl(
    originalUrl: string, 
    options: {
      format?: 'webp' | 'jpg' | 'png';
      width?: number;
      height?: number;
      quality?: number;
    } = {}
  ): string {
    const { format = 'webp', width, height, quality = 85 } = options;
    
    // Return original if not a tenant asset
    if (!originalUrl.includes(`storage/v1/object/public/${this.BUCKET_NAME}/`)) {
      return originalUrl;
    }

    // Try to get optimized version from manifest
    const fileName = this.extractFileNameFromUrl(originalUrl);
    const manifest = this.manifestCache.get(fileName);
    
    if (manifest?.optimized[format]) {
      const sizeKey = width ? `${width}x${height || 'auto'}` : 'original';
      const optimizedUrl = manifest.optimized[format][sizeKey];
      if (optimizedUrl) {
        return optimizedUrl;
      }
    }

    // Fallback to URL parameters for on-the-fly optimization
    return this.buildOptimizedUrl(originalUrl, { format, width, height, quality });
  }

  /**
   * Preload tenant assets with progressive loading
   */
  async preloadTenantAssets(tenantId: string, assetUrls: string[]): Promise<void> {
    console.log(`🚀 Preloading ${assetUrls.length} assets for tenant: ${tenantId}`);
    
    const preloadPromises = assetUrls.map(async (url, index) => {
      try {
        // Stagger requests to avoid overwhelming the CDN
        await new Promise(resolve => setTimeout(resolve, index * 50));
        
        // Preload WebP version first, fallback to original
        const webpUrl = this.getOptimizedAssetUrl(url, { format: 'webp' });
        
        await this.preloadImage(webpUrl).catch(() => {
          // Fallback to original if WebP fails
          return this.preloadImage(url);
        });
        
        console.log(`✅ Preloaded: ${url}`);
      } catch (error) {
        console.warn(`⚠️ Failed to preload: ${url}`, error);
      }
    });

    await Promise.allSettled(preloadPromises);
    console.log(`📦 Completed preloading for tenant: ${tenantId}`);
  }

  /**
   * Get asset manifest for a tenant
   */
  async getTenantAssetManifest(tenantId: string): Promise<AssetManifest[]> {
    try {
      const { data: files, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .list(tenantId, { limit: 100 });

      if (error) throw error;

      const manifests: AssetManifest[] = [];
      
      for (const file of files || []) {
        const fileName = `${tenantId}/${file.name}`;
        let manifest = this.manifestCache.get(fileName);
        
        if (!manifest) {
          manifest = await this.loadAssetManifest(fileName);
        }
        
        if (manifest) {
          manifests.push(manifest);
        }
      }

      return manifests;
    } catch (error) {
      console.error('Failed to get tenant asset manifest:', error);
      return [];
    }
  }

  /**
   * Clean up assets for a tenant
   */
  async cleanupTenantAssets(tenantId: string): Promise<void> {
    try {
      const { data: files, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .list(tenantId);

      if (error) throw error;

      const filePaths = files?.map(file => `${tenantId}/${file.name}`) || [];
      
      if (filePaths.length > 0) {
        const { error: deleteError } = await supabase.storage
          .from(this.BUCKET_NAME)
          .remove(filePaths);

        if (deleteError) throw deleteError;
        
        // Clear from cache
        filePaths.forEach(path => this.manifestCache.delete(path));
        
        console.log(`🗑️ Cleaned up ${filePaths.length} assets for tenant: ${tenantId}`);
      }
    } catch (error) {
      console.error('Failed to cleanup tenant assets:', error);
      throw error;
    }
  }

  // Private helper methods
  private isOptimizableImage(mimeType: string): boolean {
    return ['image/jpeg', 'image/png', 'image/webp'].includes(mimeType);
  }

  private async generateOptimizedVersions(
    file: File,
    fileName: string,
    tenantId: string,
    formats: string[],
    sizes: Array<{ width: number; height?: number; suffix: string }>,
    manifest: AssetManifest
  ): Promise<void> {
    // In a real implementation, this would use an image processing service
    // For now, we'll simulate by creating URL parameters for different formats
    
    for (const format of formats) {
      manifest.optimized[format] = {};
      
      // Original size in different format
      const formatUrl = this.buildOptimizedUrl(manifest.original, { format });
      manifest.optimized[format]['original'] = formatUrl;
      
      // Different sizes
      for (const size of sizes) {
        const sizeKey = `${size.width}x${size.height || 'auto'}`;
        const sizedUrl = this.buildOptimizedUrl(manifest.original, {
          format: format as any,
          width: size.width,
          height: size.height
        });
        manifest.optimized[format][sizeKey] = sizedUrl;
      }
    }
  }

  private buildOptimizedUrl(
    baseUrl: string,
    options: {
      format?: string;
      width?: number;
      height?: number;
      quality?: number;
    }
  ): string {
    const url = new URL(baseUrl);
    const params = new URLSearchParams();
    
    if (options.format) params.set('format', options.format);
    if (options.width) params.set('width', options.width.toString());
    if (options.height) params.set('height', options.height.toString());
    if (options.quality) params.set('quality', options.quality.toString());
    
    // Add cache control
    params.set('cache', '31536000');
    
    return `${url.origin}${url.pathname}?${params.toString()}`;
  }

  private async preloadImage(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
      img.src = url;
    });
  }

  private extractFileNameFromUrl(url: string): string {
    const match = url.match(/\/([^/?]+)(?:\?|$)/);
    return match ? match[1] : '';
  }

  private async storeAssetManifest(fileName: string, manifest: AssetManifest): Promise<void> {
    try {
      const manifestData = JSON.stringify(manifest);
      await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(`${fileName}.manifest.json`, new Blob([manifestData], { type: 'application/json' }), {
          cacheControl: '31536000',
          upsert: true
        });
    } catch (error) {
      console.warn('Failed to store asset manifest:', error);
    }
  }

  private async loadAssetManifest(fileName: string): Promise<AssetManifest | null> {
    try {
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .download(`${fileName}.manifest.json`);

      if (error) return null;

      const text = await data.text();
      const manifest = JSON.parse(text) as AssetManifest;
      
      // Cache it
      this.manifestCache.set(fileName, manifest);
      
      return manifest;
    } catch (error) {
      return null;
    }
  }
}