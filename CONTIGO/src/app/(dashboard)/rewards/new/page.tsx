'use client';

import { useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/store/app-store';
import { ArrowLeft, Gift, Award } from 'lucide-react';
import Link from 'next/link';
import { rewardSchema, type RewardFormValues } from '@/lib/validations/rewards';
import { useToast } from '@/hooks/use-toast';

const rewardExamples = [
  {
    title: 'Tiempo extra de pantalla',
    points: 50,
    description: '30 minutos adicionales de tablet o videojuegos',
  },
  {
    title: 'Salida especial',
    points: 100,
    description: 'Ir al parque, cine o lugar favorito',
  },
  {
    title: 'Postre favorito',
    points: 30,
    description: 'Helado, pastel o dulce preferido',
  },
  {
    title: 'Juguete nuevo',
    points: 200,
    description: 'Un juguete pequeño de su elección',
  },
  {
    title: 'Tiempo con padres',
    points: 75,
    description: 'Actividad especial juntos: juegos, lectura, etc.',
  },
  {
    title: 'Amigo para dormir',
    points: 150,
    description: 'Invitar a un amigo a dormir',
  },
  {
    title: 'Elegir cena',
    points: 40,
    description: 'Seleccionar la comida familiar de una noche',
  },
  {
    title: 'Día sin tareas',
    points: 120,
    description: 'Libre de responsabilidades escolares por un día',
  },
];

export default function NewRewardPage() {
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
  const { toast } = useToast();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFieldErrors({});

    if (!user) {
      toast({
        title: 'Error de autenticación',
        description: 'Debes iniciar sesión para crear una recompensa',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    if (!selectedChild) {
      toast({
        title: 'Error de validación',
        description: 'Debes seleccionar un hijo',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    const validationResult = rewardSchema.safeParse({
      ...formData,
      child_id: selectedChild.id,
    });

    if (!validationResult.success) {
      const errors: Partial<Record<keyof RewardFormValues, string>> = {};

      validationResult.error.issues.forEach((issue) => {
        errors[issue.path[0] as keyof RewardFormValues] = issue.message;
      });

      setFieldErrors(errors);

      toast({
        title: 'Error de validación',
        description: 'Por favor, corrige los errores en el formulario',
        variant: 'destructive',
      });

      setIsLoading(false);
      return;
    }

    try {
      const supabase = createBrowserClient();
      const validatedData = validationResult.data;

      const { data, error: insertError } = await supabase
        .from('rewards')
        .insert([
          {
            child_id: selectedChild.id,
            title: validatedData.title,
            description: validatedData.description,
            points_required: validatedData.points_required,
            is_active: true,
          },
        ])
        .select()
        .single();

      if (insertError) {
        toast({
          title: 'Error al crear la recompensa',
          description: insertError.message,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Recompensa creada',
        description: `La recompensa "${validatedData.title}" se ha creado correctamente`,
        variant: 'success',
      });

      // Redirigir a la página de recompensas
      router.push('/rewards');
    } catch (err) {
      toast({
        title: 'Error al crear la recompensa',
        description:
          'Ocurrió un error inesperado. Por favor, intenta nuevamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleUseExample = (example: (typeof rewardExamples)[0]) => {
    setFormData({
      title: example.title,
      description: example.description,
      points_required: example.points.toString(),
    });
  };

  if (!user) {
    router.push('/login');
    return null;
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
        <h2 className='text-3xl font-bold text-gray-900'>Nueva recompensa</h2>
        <p className='text-gray-600 mt-2'>
          Crea recompensas motivadoras para incentivar comportamientos positivos
        </p>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        <div className='lg:col-span-2'>
          <Card className='border-t-4 border-t-success'>
            <CardHeader>
              <CardTitle className='flex items-center space-x-2'>
                <Gift className='h-5 w-5 text-success' />
                <span>Información de la recompensa</span>
              </CardTitle>
              <CardDescription>
                Define los detalles de la recompensa y su costo en puntos
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
                    placeholder='Ej: Tiempo extra de pantalla, Salida especial, Postre favorito'
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
                    Cantidad de puntos necesarios para canjear esta recompensa
                  </p>
                </div>

                <div className='flex justify-end space-x-4 border-t pt-6 mt-6'>
                  <Link href='/rewards'>
                    <Button variant='outline'>Cancelar</Button>
                  </Link>
                  <Button
                    type='submit'
                    disabled={isLoading}
                    className='bg-success hover:bg-success/90'
                  >
                    {isLoading ? 'Creando...' : 'Crear recompensa'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className='border-t-4 border-t-secondary'>
            <CardHeader>
              <CardTitle className='flex items-center space-x-2'>
                <Award className='h-5 w-5 text-secondary' />
                <span>Ejemplos</span>
              </CardTitle>
              <CardDescription>
                Ideas de recompensas que puedes usar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-3'>
                {rewardExamples.map((example, index) => (
                  <div
                    key={index}
                    className='p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors'
                    onClick={() => handleUseExample(example)}
                  >
                    <div className='flex items-center justify-between mb-1'>
                      <h4 className='font-medium text-sm'>{example.title}</h4>
                      <Badge variant='default' className='text-xs'>
                        {example.points} pts
                      </Badge>
                    </div>
                    <p className='text-xs text-gray-600'>
                      {example.description}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
