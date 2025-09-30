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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAppStore } from '@/store/app-store';
import { ArrowLeft, Gift, Save } from 'lucide-react';
import Link from 'next/link';
import { Reward } from '@/types';

export default function EditRewardPage() {
  const { user, children, selectedChild, setSelectedChild } = useAppStore();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    points_required: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingReward, setLoadingReward] = useState(true);
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
      console.error('Error fetching reward:', error);
      setError('No se encontró la recompensa solicitada');
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
    setError(null);

    if (!user) {
      setError('Debes iniciar sesión para editar una recompensa');
      setIsLoading(false);
      return;
    }

    if (!selectedChild) {
      setError('Debes seleccionar un hijo');
      setIsLoading(false);
      return;
    }

    if (!params.id) {
      setError('No se especificó la recompensa a editar');
      setIsLoading(false);
      return;
    }

    try {
      const supabase = createClient();

      const { error: updateError } = await supabase
        .from('rewards')
        .update({
          title: formData.title,
          description: formData.description || null,
          points_required: parseInt(formData.points_required),
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.id)
        .eq('child_id', selectedChild.id);

      if (updateError) {
        setError(updateError.message);
        return;
      }

      // Redirigir a la página de recompensas
      router.push('/rewards');
    } catch (err) {
      setError('Ocurrió un error inesperado');
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

  if (error && !formData.title) {
    return (
      <div className='min-h-screen bg-gray-50'>
        <div className='max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
          <Card>
            <CardContent className='p-6'>
              <div className='text-center'>
                <h2 className='text-2xl font-bold text-red-600 mb-4'>Error</h2>
                <p className='text-gray-600 mb-6'>{error}</p>
                <Link href='/rewards'>
                  <Button>Volver a recompensas</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
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

      <Card>
        <CardHeader>
          <CardTitle className='flex items-center space-x-2'>
            <Gift className='h-5 w-5' />
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

            {error && (
              <Alert variant='destructive'>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className='flex justify-end space-x-4'>
              <Link href='/rewards'>
                <Button variant='outline'>Cancelar</Button>
              </Link>
              <Button type='submit' disabled={isLoading}>
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
