import { supabase } from './supabase.js';

/**
 * Uploads a file buffer to a Supabase Storage bucket.
 * 
 * @param buffer - The file buffer to upload.
 * @param bucket - The name of the Supabase storage bucket (e.g., 'documents').
 * @param path - The path inside the bucket (e.g., 'restaurants/123/fssai.pdf').
 * @param mimeType - The mime type of the file (e.g., 'application/pdf').
 * @returns The public URL of the uploaded file.
 */
export const uploadFile = async (buffer: Buffer, bucket: string, path: string, mimeType: string): Promise<string> => {
  const { data, error } = await supabase
    .storage
    .from(bucket)
    .upload(path, buffer, {
      contentType: mimeType,
      upsert: true
    });

  if (error) {
    console.error('Supabase upload error:', error);
    throw new Error(`Failed to upload file to Supabase: ${error.message}`);
  }

  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
  
  return publicUrl;
};
