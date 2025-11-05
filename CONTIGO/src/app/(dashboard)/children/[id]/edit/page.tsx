'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
import { ArrowLeft, User, Save } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { AvatarUpload } from '@/components/ui/avatar-upload';
import { uploadAvatar, deleteAvatar } from '@/lib/supabase/storage';
import { useToast } from '@/hooks/use-toast';
import { childSchema } from '@/lib/validations/children';

const adhdTypes = [
  {
    value: 'INATTENTIVE',
    label: 'Inatento',
    description: 'Dificultad para prestar atención',
  },
  {
    value: 'HYPERACTIVE',
    label: 'Hiperactivo',
    description: 'Exceso de actividad e impulsividad',
  },
  {
    value: 'COMBINED',
    label: 'Combinado',
    description: 'Combinación de inatento e hiperactivo',
  },
];

export default function EditChildPage() {
  const { user, setSelectedChild } = useAppStore();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    birth_date: '',
    adhd_type: '',
    avatar_url: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(
    null
  );
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingChild, setLoadingChild] = useState(true);
  const [childLoaded, setChildLoaded] = useState(false);
  const router = useRouter();
  const params = useParams();

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
      border: 'border-t-success',
      text: 'text-success',
      button: 'bg-success hover:bg-success/90',
    },
  };

  const currentStyle =
    typeColors[formData.adhd_type as keyof typeof typeColors] ||
    typeColors.default;

  const fetchChild = useCallback(async () => {
    if (!params.id || childLoaded) return;

    setLoadingChild(true);
    const supabase = createBrowserClient();

    const { data, error } = await supabase
      .from('children')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) {
      toast({
        title: 'Error',
        description: 'No se encontró el hijo solicitado.',
        variant: 'destructive',
      });
      setLoadingChild(false);
      return;
    }

    if (data) {
      setFormData({
        name: data.name,
        birth_date: data.birth_date,
        adhd_type: data.adhd_type,
        avatar_url: data.avatar_url || '',
      });
      // Establecer preview inicial si hay avatar
      if (data.avatar_url) {
        setAvatarPreviewUrl(data.avatar_url);
      }

      setChildLoaded(true);
    }

    setLoadingChild(false);
  }, [params.id, childLoaded]);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    // Si existe el id del hijo y no se ha seleccionado un avatar
    if (params.id && !childLoaded) {
      fetchChild();
    }
  }, [user, params.id, childLoaded, fetchChild, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    if (!user) {
      toast({
        title: 'Error',
        description: 'Debes iniciar sesión para editar.',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    if (!params.id) {
      toast({
        title: 'Error',
        description: 'No se especificó el hijo a editar.',
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
      let avatarUrl = formData.avatar_url;

      if (selectedAvatarFile) {
        const newAvatarUrl = await uploadAvatar(selectedAvatarFile, user.id);
        if (formData.avatar_url && formData.avatar_url !== newAvatarUrl) {
          try {
            await deleteAvatar(formData.avatar_url);
          } catch (error) {
            console.error('Error al eliminar avatar anterior:', error);
          }
        }
        avatarUrl = newAvatarUrl;
        if (blobUrlRef.current) {
          URL.revokeObjectURL(blobUrlRef.current);
          blobUrlRef.current = null;
        }
      } else if (avatarPreviewUrl === null && formData.avatar_url) {
        try {
          await deleteAvatar(formData.avatar_url);
        } catch (error) {
          console.error('Error al eliminar avatar:', error);
        }
        avatarUrl = '';
      }

      const { data: updateData, error: updateError } = await supabase
        .from('children')
        .update({
          name: formData.name,
          birth_date: formData.birth_date,
          adhd_type: formData.adhd_type,
          avatar_url: avatarUrl || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.id)
        .select()
        .single();

      if (updateError) {
        toast({
          title: 'Error al actualizar',
          description: updateError.message,
          variant: 'destructive',
        });
        return;
      }

      if (updateData) {
        setSelectedChild(updateData);
        toast({
          title: '¡Éxito!',
          description: 'El perfil ha sido actualizado.',
          variant: 'success',
        });
        router.push('/children');
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

  const handleAvatarSelect = (file: File | null, blobUrl: string | null) => {
    // Limpiar blob anterior solo si hay uno diferente
    if (blobUrlRef.current && blobUrlRef.current !== blobUrl) {
      URL.revokeObjectURL(blobUrlRef.current);
    }

    setSelectedAvatarFile(file);
    blobUrlRef.current = blobUrl;
    setAvatarPreviewUrl(blobUrl);
  };

  const handleCancel = () => {
    // Limpiar blob URL si existe y hay cambios sin guardar
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    router.push('/children');
  };

  const handleAvatarRemove = () => {
    // Limpiar blob si existe
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }

    setSelectedAvatarFile(null);
    setAvatarPreviewUrl(null);
    setFormData((prev) => ({ ...prev, avatar_url: '' }));
  };

  if (!user) {
    router.push('/login');
    return null;
  }

  if (loadingChild) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600'></div>
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
        <h2 className='text-3xl font-bold text-gray-900'>Editar hijo</h2>
        <p className='text-gray-600 mt-2'>Modifica la información de tu hijo</p>
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
            Modifica los datos de tu hijo para personalizar su experiencia
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

            <div className='space-y-2'>
              <Label htmlFor='name'>Nombre completo</Label>
              <Input
                id='name'
                type='text'
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder='Ej: Juan Pérez'
              />
              {errors.name && (
                <p className='text-sm text-red-500'>{errors.name}</p>
              )}
            </div>

            <div className='grid grid-cols-2 gap-4'>
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
                  {adhdTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div>
                        <div className='font-medium'>{type.label}</div>
                        <div className='text-xs text-gray-500'>
                          {type.description}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
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
              <Link href='/children' passHref>
                <Button variant='outline' type='button' onClick={handleCancel}>
                  Cancelar
                </Button>
              </Link>
              <Button
                type='submit'
                disabled={isLoading}
                className={cn(currentStyle.button)}
              >
                <Save className='h-4 w-4 mr-2' />
                {isLoading ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
