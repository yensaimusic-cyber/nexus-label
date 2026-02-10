
import { supabase } from './supabase';

/**
 * Uploads a file to a specific Supabase bucket and returns the public URL.
 * Handles unique filename generation to avoid collisions.
 */
export const uploadFile = async (
  file: File, 
  bucket: 'avatars' | 'covers' | 'audio',
  folder: string = ''
): Promise<string> => {
  try {
    const fileExt = file.name.split('.').pop();
    // Create a unique filename with timestamp and random string
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, { 
        upsert: true,
        contentType: file.type
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error(`Upload error in bucket ${bucket}:`, error);
    throw error;
  }
};

/**
 * Extracts the file path from a public Supabase Storage URL.
 */
export const getPathFromPublicUrl = (url: string, bucket: string): string => {
  const parts = url.split(`${bucket}/`);
  return parts.length > 1 ? parts[1] : '';
};

/**
 * Deletes a file from a Supabase bucket using its public URL.
 */
export const deleteFileByUrl = async (
  url: string,
  bucket: 'avatars' | 'covers' | 'audio'
): Promise<void> => {
  try {
    const filePath = getPathFromPublicUrl(url, bucket);
    if (!filePath) return;

    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) throw error;
  } catch (error) {
    console.error(`Delete error in bucket ${bucket}:`, error);
  }
};
