'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAppStore } from '@/store/app-store';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Star, Award } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { z } from 'zod';
import { behaviorSchema } from '@/lib/validations/behavior';

export default function NewBehaviorPage() {
  const { user, children, selectedChild, setSelectedChild } = useAppStore();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: '',
    points: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedExample, setSelectedExample] = useState<string | null>(null);
  const router = useRouter();

  const typeColors = {
    POSITIVE: {
      border: 'border-t-green-500',
      text: 'text-green-600',
      button: 'bg-green-600 hover:bg-green-700',
    },
    NEGATIVE: {
      border: 'border-t-red-500',
      text: 'text-red-600',
      button: 'bg-red-600 hover:bg-red-700',
    },
    default: {
      border: 'border-t-accent',
      text: 'text-accent',
      button: 'bg-accent hover:bg-accent/90',
    },
  };

  const currentStyle =
    typeColors[formData.type as keyof typeof typeColors] || typeColors.default;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!user) {
      toast({
        title: 'Error de autenticación',
        description: 'Debes iniciar sesión para crear un comportamiento',
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

    // Validar los datos con el esquema de Zod
    const validationResult = behaviorSchema.safeParse({
      title: formData.title,
      description: formData.description,
      type: formData.type,
      points: formData.points,
    });

    if (!validationResult.success) {
      const errorMessage =
        validationResult.error.issues[0]?.message || 'Error de validación';
      toast({
        title: 'Error de validación',
        description: errorMessage,
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    try {
      const supabase = createClient();

      const { data, error: insertError } = await supabase
        .from('behaviors')
        .insert([
          {
            child_id: selectedChild.id,
            title: validationResult.data.title,
            description: validationResult.data.description,
            type: validationResult.data.type,
            points: validationResult.data.points,
          },
        ])
        .select()
        .single();

      if (insertError) {
        toast({
          title: 'Error al crear comportamiento',
          description: insertError.message,
          variant: 'destructive',
        });
        return;
      }

      // Mostrar toast de éxito
      toast({
        title: 'Comportamiento Creado',
        description: 'El nuevo comportamiento ha sido guardado.',
        variant: 'success',
      });

      // Redirigir a la página de comportamientos
      router.push('/behaviors');
    } catch (err) {
      toast({
        title: 'Error inesperado',
        description: 'Ocurrió un error inesperado al crear el comportamiento',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleExampleClick = (example: string) => {
    handleInputChange('title', example);
    setSelectedExample(example);
    setTimeout(() => setSelectedExample(null), 300);
  };

  const behaviorExamples = {
    POSITIVE: [
      'Recoger su material cuando termina una actividad',
      'Realizar sus tareas en clase',
      'Seguir instrucciones',
      'Compartir juguetes',
      'Ser amable con otros',
      'Ayudar en casa',
    ],
    NEGATIVE: [
      'Interrumpir o inmiscuirse en conversaciones o juegos',
      'No seguir instrucciones',
      'Muestra explosiones emocionales',
      'Agresividad física y verbal',
      'Comportamiento disruptivo',
      'Pérdida de autocontrol',
    ],
  };

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <>
      <div className='mb-8'>
        <Link
          href='/behaviors'
          className='inline-flex items-center text-gray-600 hover:text-gray-900 mb-4'
        >
          <ArrowLeft className='h-4 w-4 mr-2' />
          Volver a comportamientos
        </Link>
        <h2 className='text-3xl font-bold text-gray-900'>
          Nuevo comportamiento
        </h2>
        <p className='text-gray-600 mt-2'>
          Define comportamientos para registrar y asignar puntos
        </p>
      </div>

      <Card
        className={`transition-all duration-300 border-t-4 ${currentStyle.border}`}
      >
        <CardHeader>
          <CardTitle className='flex items-center space-x-2'>
            <Star className={`h-5 w-5 ${currentStyle.text}`} />
            <span>Información del comportamiento</span>
          </CardTitle>
          <CardDescription>
            Define los detalles del comportamiento y su sistema de puntos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className='space-y-6'>
            <div className='space-y-2'>
              <Label htmlFor='title'>Título del comportamiento</Label>
              <Input
                id='title'
                type='text'
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                required
                placeholder='Ej: Completar tareas escolares, Compartir juguetes'
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
                placeholder='Describe en qué consiste el comportamiento...'
                rows={3}
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='type'>Tipo de comportamiento</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => handleInputChange('type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Selecciona el tipo' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='POSITIVE'>
                    <div className='flex items-start space-x-3'>
                      <span className='text-lg text-green-600'>➕</span>
                      <div className='flex flex-col'>
                        <span className='font-medium'>Positivo</span>
                        <span className='text-xs text-muted-foreground'>
                          Refuerza conductas deseables
                        </span>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value='NEGATIVE'>
                    <div className='flex items-start space-x-3'>
                      <span className='text-lg text-red-600'>➖</span>
                      <div className='flex flex-col'>
                        <span className='font-medium'>Negativo</span>
                        <span className='text-xs text-muted-foreground'>
                          Registra conductas a mejorar
                        </span>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='points'>Puntos</Label>
              <Input
                id='points'
                type='number'
                value={formData.points}
                onChange={(e) => handleInputChange('points', e.target.value)}
                required
                placeholder='10'
              />
              <p className='text-sm text-gray-500'>
                Usa números positivos para comportamientos positivos y negativos
                para los negativos
              </p>
            </div>

            {formData.type && (
              <div
                className={`p-4 rounded-lg border ${
                  formData.type === 'POSITIVE'
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className='flex items-center space-x-2 mb-3'>
                  {formData.type === 'POSITIVE' ? (
                    <div className='p-1 bg-green-100 rounded-full'>
                      <Award className='h-4 w-4 text-green-600' />
                    </div>
                  ) : (
                    <div className='p-1 bg-red-100 rounded-full'>
                      <Star className='h-4 w-4 text-red-600' />
                    </div>
                  )}
                  <h4 className='font-medium text-gray-900'>
                    Ideas inspiradoras para comportamientos{' '}
                    {formData.type === 'POSITIVE' ? 'positivos' : 'a mejorar'}:
                  </h4>
                </div>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-2'>
                  {behaviorExamples[
                    formData.type as keyof typeof behaviorExamples
                  ].map((example, index) => (
                    <div
                      key={index}
                      className={`p-2 rounded-md text-sm cursor-pointer transition-all hover:shadow-sm ${
                        selectedExample === example
                          ? formData.type === 'POSITIVE'
                            ? 'bg-green-200 border-green-400 scale-95'
                            : 'bg-red-200 border-red-400 scale-95'
                          : formData.type === 'POSITIVE'
                          ? 'bg-white border border-green-200 hover:bg-green-100'
                          : 'bg-white border border-red-200 hover:bg-red-100'
                      }`}
                      onClick={() => handleExampleClick(example)}
                    >
                      <div className='flex items-center space-x-2'>
                        {formData.type === 'POSITIVE' ? (
                          <span className='text-green-500'>✓</span>
                        ) : (
                          <span className='text-red-500'>!</span>
                        )}
                        <span className='text-gray-700'>{example}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <p className='text-xs text-gray-500 mt-3 italic'>
                  💡 Haz clic en cualquier ejemplo para usarlo como título
                </p>
              </div>
            )}

            <div className='flex justify-end space-x-4 border-t pt-6 mt-6'>
              <Link href='/behaviors'>
                <Button variant='outline'>Cancelar</Button>
              </Link>
              <Button
                type='submit'
                disabled={isLoading}
                className={cn(currentStyle.button)}
              >
                {isLoading ? 'Creando...' : 'Crear comportamiento'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
