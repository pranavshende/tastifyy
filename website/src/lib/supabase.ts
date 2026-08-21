/**
 * Supabase Storage helper for the frontend.
 * 
 * The backend already converts paths to public URLs before sending them.
 * This helper is a safety net for any path that slips through, and
 * provides a consistent way to handle null/undefined image values.
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const BUCKET = 'restaurant-assets';

/**
 * Convert a stored path or existing URL to a full public Supabase Storage URL.
 * Returns undefined if the path is null/empty (triggering placeholder display).
 */
export function getStorageUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  // Already a full URL (backend has already resolved it)
  if (path.startsWith('http')) return path;
  // Resolve a raw storage path
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
}
