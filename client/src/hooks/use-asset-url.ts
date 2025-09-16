import { useQuery } from '@tanstack/react-query';

/**
 * Simple, direct asset URL hook - no complex indirections
 * Replaces all client-side URL building logic with a simple API call
 */
export function useAssetUrl(path: string | null, ttlSec: number = 3600) {
  return useQuery({
    queryKey: ['/api/assets/url', path, ttlSec],
    queryFn: async () => {
      if (!path) return null;
      
      const params = new URLSearchParams({ path });
      if (ttlSec !== 3600) {
        params.append('ttlSec', ttlSec.toString());
      }
      
      const response = await fetch(`/api/assets/url?${params}`);
      if (!response.ok) {
        throw new Error(`Failed to get asset URL: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.url;
    },
    enabled: !!path,
    staleTime: ttlSec * 1000 * 0.8, // Refresh 20% before expiry
    cacheTime: ttlSec * 1000,
  });
}

/**
 * Simple hook for slide images
 * If slidePath is already a full storage path, use it directly
 * Otherwise, prefix with slides/ for legacy compatibility
 */
export function useSlideImageUrl(slidePath: string | null) {
  if (!slidePath) return useAssetUrl(null);
  
  // If it's already a full storage path, use it directly
  if (slidePath.startsWith('/replit-objstore-') || 
      slidePath.startsWith('/public/') || 
      slidePath.startsWith('/.private/')) {
    return useAssetUrl(slidePath);
  }
  
  // Legacy relative paths get slides/ prefix
  return useAssetUrl(`slides/${slidePath}`);
}

/**
 * Simple hook for document files
 */
export function useDocumentUrl(documentPath: string | null) {
  return useAssetUrl(documentPath ? `documents/${documentPath}` : null);
}