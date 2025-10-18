import { createClient } from './client';

export async function uploadAvatar(file: File, userId: string): Promise<string> {
  const supabase = createClient();
  
  // Generar un nombre de archivo único
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}-${crypto.randomUUID()}.${fileExt}`;
  const filePath = `${fileName}`;
  
  // Subir el archivo al bucket de avatares
  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });
  
  if (error) {
    throw new Error(`Error al subir el avatar: ${error.message}`);
  }
  
  // Obtener la URL pública del archivo
  const { data: publicUrlData } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);
  
  return publicUrlData.publicUrl;
}

export async function deleteAvatar(avatarUrl: string): Promise<void> {
  const supabase = createClient();
  
  // Extraer el nombre del archivo de la URL
  const urlParts = avatarUrl.split('/');
  const fileName = urlParts[urlParts.length - 1];
  
  // Eliminar el archivo del bucket
  const { error } = await supabase.storage
    .from('avatars')
    .remove([fileName]);
  
  if (error) {
    console.error('Error al eliminar el avatar:', error);
    // No lanzamos error aquí para no bloquear el flujo principal
  }
}