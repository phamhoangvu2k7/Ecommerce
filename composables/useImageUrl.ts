/**
 * Resolves a thumbnail path to a full URL that can be served by the blob route.
 * Handles paths stored as:
 *   - "products/xxx.webp" → "/blobs/products/xxx.webp"
 *   - "/blobs/products/xxx.webp" → "/blobs/products/xxx.webp" (already correct)
 *   - "https://..." → "https://..." (external URL, returned as-is)
 */
export function resolveImageUrl(path: string | undefined | null, fallback?: string): string {
  const defaultFallback = 'https://images.unsplash.com/photo-1523206489230-c012c64b2b48?w=500'

  if (!path) {
    return fallback || defaultFallback
  }

  // External URLs — return as-is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }

  // Already has /blobs/ prefix
  if (path.startsWith('/blobs/')) {
    return path
  }
  if (path.startsWith('blobs/')) {
    return `/${path}`
  }

  // Raw R2 path like "products/xxx.webp" — add /blobs/ prefix
  const cleanPath = path.startsWith('/') ? path.substring(1) : path
  return `/blobs/${cleanPath}`
}
