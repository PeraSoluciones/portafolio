'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAppStore } from '@/store/app-store';
import { ArrowLeft, User } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { AvatarUpload } from '@/components/ui/avatar-upload';
import { uploadAvatar } from '@/lib/supabase/storage';
import { useToast } from '@/hooks/use-toast';
import { childSchema } from '@/lib/validations/children';
import { z } from 'zod';

export default function NewChildPage() {
  const { user, addChild } = useAppStore();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    birth_date: '',
    adhd_type: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(
    null
  );
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const typeColors = {
    INATTENTIVE: {
      border: 'border-t-blue-500',
      text: 'text-blue-600',
      button: 'bg-blue-600 hover:bg-blue-700',
    },
    HYPERACTIVE: {
      border: 'border-t-orange-500',
      text: 'text-orange-600',
      button: 'bg-orange-600 hover:bg-orange-700',
    },
    COMBINED: {
      border: 'border-t-purple-500',
      text: 'text-purple-600',
      button: 'bg-purple-600 hover:bg-purple-700',
    },
    default: {
      border: 'border-t-green-500',
      text: 'text-green-600',
      button: 'bg-green-600 hover:bg-green-700/90',
    },
  };

  const currentStyle =
    typeColors[formData.adhd_type as keyof typeof typeColors] ||
    typeColors.default;

  const handleAvatarSelect = (file: File | null, blobUrl: string | null) => {
    // NO liberar el blob anterior aquí - esperar hasta guardar
    // Esto previene problemas en móviles donde el componente se re-renderiza
    setSelectedAvatarFile(file);
    blobUrlRef.current = blobUrl;
    setAvatarPreviewUrl(blobUrl);
  };

  const handleAvatarRemove = () => {
    // Limpiar blob si existe
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }

    setSelectedAvatarFile(null);
    setAvatarPreviewUrl(null);
  };

  const handleCancel = () => {
    // Limpiar blob URL si existe y hay cambios sin guardar
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    router.push('/children');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    if (!user) {
      toast({
        title: 'Error',
        description: 'Debes iniciar sesión para agregar un hijo.',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    const result = childSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        if (err.path) {
          fieldErrors[err.path.join('.')] = err.message;
        }
      });
      setErrors(fieldErrors);
      toast({
        title: 'Errores de validación',
        description: 'Por favor, corrige los campos marcados.',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    try {
      const supabase = createBrowserClient();
      let avatarUrl = '';

      if (selectedAvatarFile) {
        avatarUrl = await uploadAvatar(selectedAvatarFile, user.id);
        if (blobUrlRef.current) {
          URL.revokeObjectURL(blobUrlRef.current);
          blobUrlRef.current = null;
        }
      }

      const { data, error: insertError } = await supabase
        .from('children')
        .insert([
          {
            parent_id: user.id,
            name: formData.name,
            birth_date: formData.birth_date,
            adhd_type: formData.adhd_type,
            avatar_url: avatarUrl || null,
          },
        ])
        .select()
        .single();

      if (insertError) {
        toast({
          title: 'Error al crear el perfil',
          description: insertError.message,
          variant: 'destructive',
        });
        return;
      }

      if (data) {
        addChild(data);
        toast({
          title: '¡Éxito!',
          description: 'El perfil de tu hijo ha sido creado.',
          variant: 'success',
        });
        router.push('/dashboard');
      }
    } catch (err) {
      toast({
        title: 'Error inesperado',
        description:
          'Ocurrió un error inesperado. Por favor, inténtalo de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (!user) {
    return (
      <div className='flex items-center justify-center h-full'>
        <p className='text-gray-600'>
          Debes iniciar sesión para agregar un hijo.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className='mb-8'>
        <Link
          href='/children'
          className='inline-flex items-center text-gray-600 hover:text-gray-900 mb-4'
        >
          <ArrowLeft className='h-4 w-4 mr-2' />
          Volver a hijos
        </Link>
        <h2 className='text-3xl font-bold text-gray-900'>Agregar nuevo hijo</h2>
        <p className='text-gray-600 mt-2'>
          Ingresa la información de tu hijo para crear su perfil
        </p>
      </div>

      <Card
        className={`transition-all duration-300 border-t-4 ${currentStyle.border}`}
      >
        <CardHeader>
          <CardTitle className='flex items-center space-x-2'>
            <User className={`h-5 w-5 ${currentStyle.text}`} />
            <span>Información del hijo</span>
          </CardTitle>
          <CardDescription>
            Los datos ayudarán a personalizar las recomendaciones y rutinas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className='space-y-6'>
            <AvatarUpload
              previewUrl={avatarPreviewUrl}
              onFileSelect={handleAvatarSelect}
              onRemove={handleAvatarRemove}
              name={formData.name}
            />

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div className='space-y-2'>
                <Label htmlFor='name'>Nombre completo</Label>
                <Input
                  id='name'
                  type='text'
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder='Nombre del hijo'
                />
                {errors.name && (
                  <p className='text-sm text-red-500'>{errors.name}</p>
                )}
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='birth_date'>Fecha de nacimiento</Label>
              <Input
                id='birth_date'
                type='date'
                value={formData.birth_date}
                onChange={(e) =>
                  handleInputChange('birth_date', e.target.value)
                }
              />
              {errors.birth_date && (
                <p className='text-sm text-red-500'>{errors.birth_date}</p>
              )}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='adhd_type'>Tipo de TDAH</Label>
              <Select
                value={formData.adhd_type}
                onValueChange={(value) => handleInputChange('adhd_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Selecciona el tipo de TDAH' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='INATTENTIVE'>Inatento</SelectItem>
                  <SelectItem value='HYPERACTIVE'>Hiperactivo</SelectItem>
                  <SelectItem value='COMBINED'>Combinado</SelectItem>
                </SelectContent>
              </Select>

              {errors.adhd_type && (
                <p className='text-sm text-red-500'>{errors.adhd_type}</p>
              )}
              <div className='p-4 bg-blue-50 rounded-lg'>
                <h4 className='font-medium text-blue-900 mb-2'>
                  Información sobre tipos de TDAH:
                </h4>
                <div className='text-sm text-blue-800 space-y-2'>
                  <div>
                    <strong>Inatento:</strong> Dificultad para mantener la
                    atención, sigue instrucciones, organización.
                  </div>
                  <div>
                    <strong>Hiperactivo:</strong> Exceso de movimiento,
                    dificultad para estar quieto, impulsividad.
                  </div>
                  <div>
                    <strong>Combinado:</strong> Presenta características de
                    ambos tipos.
                  </div>
                </div>
              </div>
            </div>

            <div className='flex justify-end space-x-4 border-t pt-6 mt-6'>
              <Link href='/children'>
                <Button variant='outline' type='button' onClick={handleCancel}>
                  Cancelar
                </Button>
              </Link>
              <Button
                type='submit'
                disabled={isLoading}
                className={cn(currentStyle.button)}
              >
                {isLoading ? 'Agregando...' : 'Agregar hijo'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
