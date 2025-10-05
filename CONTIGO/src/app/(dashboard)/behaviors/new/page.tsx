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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAppStore } from '@/store/app-store';
import { ArrowLeft, Star, Award } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function NewBehaviorPage() {
  const { user, children, selectedChild, setSelectedChild } = useAppStore();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: '',
    points: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
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
    setError(null);

    if (!user) {
      setError('Debes iniciar sesión para crear un comportamiento');
      setIsLoading(false);
      return;
    }

    if (!selectedChild) {
      setError('Debes seleccionar un hijo');
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
            title: formData.title,
            description: formData.description,
            type: formData.type,
            points: parseInt(formData.points),
          },
        ])
        .select()
        .single();

      if (insertError) {
        setError(insertError.message);
        return;
      }

      // Redirigir a la página de comportamientos
      router.push('/behaviors');
    } catch (err) {
      setError('Ocurrió un error inesperado');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const behaviorExamples = {
    POSITIVE: [
      'Completar tareas escolares',
      'Compartir juguetes',
      'Seguir instrucciones',
      'Ayudar en casa',
      'Ser amable con otros',
    ],
    NEGATIVE: [
      'Interrumpir conversaciones',
      'No seguir instrucciones',
      'Comportamiento disruptivo',
      'Pérdida de autocontrol',
      'Agresividad verbal',
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
              <div className='p-4 bg-gray-50 rounded-lg'>
                <h4 className='font-medium text-gray-900 mb-2'>
                  Ejemplos de comportamientos{' '}
                  {formData.type === 'POSITIVE' ? 'positivos' : 'negativos'}:
                </h4>
                <ul className='text-sm text-gray-600 space-y-1'>
                  {behaviorExamples[
                    formData.type as keyof typeof behaviorExamples
                  ].map((example, index) => (
                    <li key={index} className='flex items-center space-x-2'>
                      <span className='text-blue-500'>•</span>
                      <span>{example}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {error && (
              <Alert variant='destructive'>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
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
