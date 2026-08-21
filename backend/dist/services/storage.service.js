import { supabase } from '../utils/supabase.js';
const BUCKET = 'restaurant-assets';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
export const SUPABASE_URL = process.env.SUPABASE_URL || '';
export function getPublicUrl(storagePath) {
    if (!storagePath)
        return null;
    // If it's already a full URL, return as-is
    if (storagePath.startsWith('http'))
        return storagePath;
    return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${storagePath}`;
}
export function validateFile(buffer, mimetype, size) {
    if (!ALLOWED_TYPES.includes(mimetype)) {
        return { valid: false, error: 'Invalid file type. Only JPG, PNG, and WEBP are allowed.' };
    }
    if (size > MAX_FILE_SIZE) {
        return { valid: false, error: 'File too large. Maximum size is 5MB.' };
    }
    return { valid: true };
}
/**
 * Upload a file to Supabase Storage.
 * Returns the storage path (relative) that should be saved in the database.
 */
export async function uploadFile(restaurantId, folder, filename, buffer, mimetype) {
    const storagePath = `${restaurantId}/${folder}/${filename}`;
    const { error } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, buffer, {
        contentType: mimetype,
        upsert: true, // Replace if exists
    });
    if (error) {
        throw new Error(`Storage upload failed: ${error.message}`);
    }
    const publicUrl = getPublicUrl(storagePath);
    return { path: storagePath, publicUrl };
}
/**
 * Delete a file from Supabase Storage by its stored path.
 * Silently succeeds if the file doesn't exist.
 */
export async function deleteFile(storagePath) {
    if (!storagePath)
        return;
    // If it's a full URL, extract the path portion
    let path = storagePath;
    if (storagePath.startsWith('http')) {
        const marker = `/public/${BUCKET}/`;
        const idx = storagePath.indexOf(marker);
        if (idx !== -1) {
            path = storagePath.substring(idx + marker.length);
        }
        else {
            return; // Cannot parse path, skip deletion
        }
    }
    const { error } = await supabase.storage.from(BUCKET).remove([path]);
    if (error) {
        // Log but don't throw — deletion failure shouldn't block the main operation
        console.error('Storage delete failed:', error.message);
    }
}
/**
 * Generate a unique filename for storage to avoid collisions.
 */
export function generateFilename(originalname, suffix) {
    const ext = originalname.split('.').pop()?.toLowerCase() || 'jpg';
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return suffix
        ? `${suffix}-${timestamp}-${random}.${ext}`
        : `${timestamp}-${random}.${ext}`;
}
//# sourceMappingURL=storage.service.js.map