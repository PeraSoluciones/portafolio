'use client';

import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { X, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AvatarUploadProps {
  previewUrl: string | null;
  onFileSelect: (file: File | null, blobUrl: string | null) => void;
  onRemove: () => void;
  className?: string;
  name?: string;
}

export function AvatarUpload({
  previewUrl,
  onFileSelect,
  onRemove,
  className,
  name = '',
}: AvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    // Validar que sea una imagen
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido');
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen no debe ser mayor a 5MB');
      return;
    }

    // Crear preview local
    // NO revocar blobs anteriores aquí - dejar que el componente padre lo maneje
    const blobUrl = URL.createObjectURL(file);
    onFileSelect(file, blobUrl);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={cn('space-y-4', className)}>
      <Label>Avatar del hijo</Label>

      <div className='flex flex-row items-center gap-4'>
        <div className='relative flex-shrink-0'>
          <div className='relative flex h-20 w-20 shrink-0 overflow-hidden rounded-full bg-gray-100 ring-2 ring-gray-200'>
            {previewUrl ? (
              <img
                src={previewUrl}
                alt='Avatar'
                className='aspect-square h-full w-full object-cover'
                key={previewUrl}
              />
            ) : (
              <div className='flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300 text-xl font-medium text-gray-600'>
                {name ? getInitials(name) : 'HN'}
              </div>
            )}
          </div>

          {previewUrl && (
            <Button
              type='button'
              variant='destructive'
              size='icon'
              className='absolute -top-2 -right-2 h-6 w-6 rounded-full shadow-lg'
              onClick={onRemove}
            >
              <X className='h-3 w-3' />
            </Button>
          )}
        </div>

        <div className='flex-1 space-y-2 min-w-0'>
          <input
            ref={fileInputRef}
            type='file'
            accept='image/*'
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />

          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={triggerFileInput}
            className='w-full sm:w-auto whitespace-nowrap'
          >
            <Upload className='h-4 w-4 mr-2' />
            <span className='text-sm'>
              {previewUrl ? 'Cambiar' : 'Seleccionar'}
            </span>
          </Button>

          <p className='text-xs text-gray-500'>JPG, PNG o GIF • Máx. 5MB</p>
        </div>
      </div>
    </div>
  );
}
