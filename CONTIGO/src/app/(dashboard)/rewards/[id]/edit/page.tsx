'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
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
import { Textarea } from '@/components/ui/textarea';
import { useAppStore } from '@/store/app-store';
import { ArrowLeft, Gift, Save } from 'lucide-react';
import Link from 'next/link';
import { rewardSchema, type RewardFormValues } from '@/lib/validations/rewards';
import { useToast } from '@/src/hooks/use-toast';

export default function EditRewardPage() {
  const { user, children, selectedChild, setSelectedChild } = useAppStore();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    points_required: '',
  });
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof RewardFormValues, string>>
  >({});
  const [isLoading, setIsLoading] = useState(false);
  const [loadingReward, setLoadingReward] = useState(true);
  const { toast } = useToast();

  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (children.length === 0) {
      router.push('/children/new');
      return;
    }

    if (!selectedChild && children.length > 0) {
      setSelectedChild(children[0]);
    }
  }, [user, children, selectedChild, setSelectedChild, router]);

  useEffect(() => {
    if (params.id && selectedChild) {
      fetchReward();
    }
  }, [params.id, selectedChild]);

  const fetchReward = async () => {
    if (!params.id || !selectedChild) return;

    setLoadingReward(true);
    const supabase = createClient();

    const { data, error } = await supabase
      .from('rewards')
      .select('*')
      .eq('id', params.id)
      .eq('child_id', selectedChild.id)
      .single();

    if (error) {
      toast({
        title: 'Error',
        description: 'No se encontró la recompensa solicitada',
        variant: 'destructive',
      });
      setLoadingReward(false);
      return;
    }

    if (data) {
      setFormData({
        title: data.title,
        description: data.description || '',
        points_required: data.points_required.toString(),
      });
    }

    setLoadingReward(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFieldErrors({});

    if (!user) {
      toast({
        title: 'Error de autenticación',
        description: 'Debes iniciar sesión para editar una recompensa',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    if (!selectedChild) {
      toast({
        title: 'Error de selección',
        description: 'Debes seleccionar un hijo',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    if (!params.id) {
      toast({
        title: 'Error',
        description: 'No se especificó la recompensa a editar',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    const validationResult = rewardSchema.safeParse(formData);

    if (!validationResult.success) {
      const errors: Partial<Record<keyof RewardFormValues, string>> = {};
      validationResult.error.issues.forEach((issue) => {
        errors[issue.path[0] as keyof RewardFormValues] = issue.message;
      });
      setFieldErrors(errors);

      toast({
        title: 'Error de validación',
        description: 'Por favor, corrige los errores de validación',
        variant: 'destructive',
      });

      setIsLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const validatedData = validationResult.data;

      const { error: updateError } = await supabase
        .from('rewards')
        .update({
          title: validatedData.title,
          description: validatedData.description || null,
          points_required: validatedData.points_required,
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.id)
        .eq('child_id', selectedChild.id);

      if (updateError) {
        toast({
          title: 'Error',
          description: updateError.message,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Recompensa actualizada',
        description: 'La recompensa ha sido actualizada correctamente',
        variant: 'success',
      });

      // Redirigir a la página de recompensas
      router.push('/rewards');
    } catch (err) {
      toast({
        title: 'Error',
        description:
          'Ocurrio un error inesperado. Por favor, intenta nuevamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const rewardExamples = [
    'Tiempo extra de videojuegos',
    'Salida al parque',
    'Cena favorita',
    'Película familiar',
    'Juguete nuevo',
    'Hora de cuentos extra',
    'Invitar a un amigo',
    'Día de manualidades',
  ];

  if (!user) {
    router.push('/login');
    return null;
  }

  if (loadingReward) {
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
          href='/rewards'
          className='inline-flex items-center text-gray-600 hover:text-gray-900 mb-4'
        >
          <ArrowLeft className='h-4 w-4 mr-2' />
          Volver a recompensas
        </Link>
        <h2 className='text-3xl font-bold text-gray-900'>Editar recompensa</h2>
        <p className='text-gray-600 mt-2'>
          Modifica los detalles de la recompensa y su costo en puntos
        </p>
      </div>

      <Card className='border-t-4 border-t-green-500'>
        <CardHeader>
          <CardTitle className='flex items-center space-x-2'>
            <Gift className='h-5 w-5 text-green-600' />
            <span>Información de la recompensa</span>
          </CardTitle>
          <CardDescription>
            Modifica los detalles de la recompensa y su costo en puntos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className='space-y-6'>
            <div className='space-y-2'>
              <Label htmlFor='title'>Título de la recompensa</Label>
              <Input
                id='title'
                type='text'
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                required
                placeholder='Ej: Tiempo extra de videojuegos, Salida al parque'
              />
              {fieldErrors.title && (
                <p className='text-sm text-red-500'>{fieldErrors.title}</p>
              )}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='description'>Descripción (opcional)</Label>
              <Textarea
                id='description'
                value={formData.description}
                onChange={(e) =>
                  handleInputChange('description', e.target.value)
                }
                placeholder='Describe en qué consiste la recompensa...'
                rows={3}
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='points_required'>Puntos requeridos</Label>
              <Input
                id='points_required'
                type='number'
                value={formData.points_required}
                onChange={(e) =>
                  handleInputChange('points_required', e.target.value)
                }
                required
                min='1'
                placeholder='50'
              />
              {fieldErrors.points_required && (
                <p className='text-sm text-red-500'>
                  {fieldErrors.points_required}
                </p>
              )}

              <p className='text-sm text-gray-500'>
                Cantidad de puntos que el niño necesita acumular para canjear
                esta recompensa
              </p>
            </div>

            <div className='p-4 bg-gray-50 rounded-lg'>
              <h4 className='font-medium text-gray-900 mb-2'>
                Ejemplos de recompensas:
              </h4>
              <ul className='text-sm text-gray-600 space-y-1'>
                {rewardExamples.map((example, index) => (
                  <li key={index} className='flex items-center space-x-2'>
                    <span className='text-purple-500'>•</span>
                    <span>{example}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className='flex justify-end space-x-4 border-t pt-6 mt-6'>
              <Link href='/rewards'>
                <Button variant='outline'>Cancelar</Button>
              </Link>
              <Button
                type='submit'
                disabled={isLoading}
                className='bg-green-600 hover:bg-green-700/90'
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
