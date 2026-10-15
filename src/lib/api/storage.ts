import { supabase } from '../supabase';

interface UploadOptions {
  contentType?: string;
}

/**
 * Envoie un fichier dans un espace de stockage public et renvoie son adresse publique.
 * Lève l'erreur de Supabase si l'envoi échoue.
 */
export async function uploadPublicFile(bucket: string, path: string, file: Blob | File, options: UploadOptions = {}): Promise<string> {
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: true,
    ...(options.contentType ? { contentType: options.contentType } : {}),
  });
  if (error) throw error;
  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
  return publicUrl;
}
