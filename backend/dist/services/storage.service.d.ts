export declare const SUPABASE_URL: string;
export declare function getPublicUrl(storagePath: string | null | undefined): string | null;
export declare function validateFile(buffer: Buffer, mimetype: string, size: number): {
    valid: boolean;
    error?: string;
};
/**
 * Upload a file to Supabase Storage.
 * Returns the storage path (relative) that should be saved in the database.
 */
export declare function uploadFile(entityId: string, folder: string, filename: string, buffer: Buffer, mimetype: string): Promise<{
    path: string;
    publicUrl: string;
}>;
/**
 * Delete a file from Supabase Storage by its stored path.
 * Silently succeeds if the file doesn't exist.
 */
export declare function deleteFile(storagePath: string | null | undefined): Promise<void>;
/**
 * Generate a unique filename for storage to avoid collisions.
 */
export declare function generateFilename(originalname: string, suffix?: string): string;
//# sourceMappingURL=storage.service.d.ts.map