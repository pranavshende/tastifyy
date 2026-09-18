/**
 * Uploads a file buffer to a Supabase Storage bucket.
 *
 * @param buffer - The file buffer to upload.
 * @param bucket - The name of the Supabase storage bucket (e.g., 'documents').
 * @param path - The path inside the bucket (e.g., 'restaurants/123/fssai.pdf').
 * @param mimeType - The mime type of the file (e.g., 'application/pdf').
 * @returns The public URL of the uploaded file.
 */
export declare const uploadFile: (buffer: Buffer, bucket: string, path: string, mimeType: string) => Promise<string>;
//# sourceMappingURL=storage.d.ts.map