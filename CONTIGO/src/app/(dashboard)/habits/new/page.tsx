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
import { Habit } from '@/types';
import { ArrowLeft, Target } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const habitCategories = [
  {
    value: 'SLEEP',
    label: 'Sueño',
    examples: 'Horas de sueño, calidad del descanso',
  },
  {
    value: 'NUTRITION',
    label: 'Nutrición',
    examples: 'Comidas saludables, consumo de agua',
  },
  {
    value: 'EXERCISE',
    label: 'Ejercicio',
    examples: 'Minutos de actividad física, deportes',
  },
  {
    value: 'HYGIENE',
    label: 'Higiene',
    examples: 'Cepillado de dientes, baño diario',
  },
  {
    value: 'SOCIAL',
    label: 'Social',
    examples: 'Interacciones positivas, compartir',
  },
];

export default function NewHabitPage() {
  const { user, children, selectedChild, setSelectedChild } = useAppStore();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    target_frequency: '',
    unit: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const typeColors = {
    SLEEP: {
      border: 'border-t-blue-500',
      text: 'text-blue-600',
      button: 'bg-blue-600 hover:bg-blue-700',
    },
    NUTRITION: {
      border: 'border-t-green-500',
      text: 'text-green-600',
      button: 'bg-green-600 hover:bg-green-700',
    },
    EXERCISE: {
      border: 'border-t-orange-500',
      text: 'text-orange-600',
      button: 'bg-orange-600 hover:bg-orange-700',
    },
    HYGIENE: {
      border: 'border-t-purple-500',
      text: 'text-purple-600',
      button: 'bg-purple-600 hover:bg-purple-700',
    },
    SOCIAL: {
      border: 'border-t-pink-500',
      text: 'text-pink-600',
      button: 'bg-pink-600 hover:bg-pink-700',
    },
    default: {
      border: 'border-t-secondary',
      text: 'text-secondary',
      button: 'bg-secondary hover:bg-secondary/90',
    },
  };

  const currentStyle =
    typeColors[formData.category as keyof typeof typeColors] ||
    typeColors.default;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!user) {
      setError('Debes iniciar sesión para crear un hábito');
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
        .from('habits')
        .insert([
          {
            child_id: selectedChild.id,
            title: formData.title,
            description: formData.description,
            category: formData.category,
            target_frequency: parseInt(formData.target_frequency),
            unit: formData.unit,
          },
        ])
        .select()
        .single();

      if (insertError) {
        setError(insertError.message);
        return;
      }

      // Redirigir a la página de hábitos
      router.push('/habits');
    } catch (err) {
      setError('Ocurrió un error inesperado');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const getUnitSuggestions = (category: string) => {
    const suggestions: { [key: string]: string[] } = {
      SLEEP: ['horas', 'minutos', 'veces'],
      NUTRITION: ['porciones', 'vasos', 'veces', 'gramos'],
      EXERCISE: ['minutos', 'horas', 'veces', 'kilómetros'],
      HYGIENE: ['veces', 'minutos'],
      SOCIAL: ['veces', 'minutos', 'interacciones'],
    };
    return suggestions[category] || [];
  };

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <>
      <div className='mb-8'>
        <Link
          href='/habits'
          className='inline-flex items-center text-gray-600 hover:text-gray-900 mb-4'
        >
          <ArrowLeft className='h-4 w-4 mr-2' />
          Volver a hábitos
        </Link>
        <h2 className='text-3xl font-bold text-gray-900'>Nuevo hábito</h2>
        <p className='text-gray-600 mt-2'>
          Crea un hábito para fomentar rutinas saludables y positivas
        </p>
      </div>

      <Card
        className={`transition-all duration-300 border-t-4 ${currentStyle.border}`}
      >
        <CardHeader>
          <CardTitle className='flex items-center space-x-2'>
            <Target className={`h-5 w-5 ${currentStyle.text}`} />
            <span>Información del hábito</span>
          </CardTitle>
          <CardDescription>
            Define los detalles del hábito que quieres seguir
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className='space-y-6'>
            <div className='space-y-2'>
              <Label htmlFor='title'>Título del hábito</Label>
              <Input
                id='title'
                type='text'
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                required
                placeholder='Ej: Dormir 8 horas, Comer frutas, Hacer ejercicio'
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
                placeholder='Describe en qué consiste el hábito y por qué es importante...'
                rows={3}
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='category'>Categoría</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleInputChange('category', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Selecciona una categoría' />
                </SelectTrigger>
                <SelectContent>
                  {habitCategories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      <div>
                        <div className='font-medium'>{category.label}</div>
                        <div className='text-xs text-gray-500'>
                          {category.examples}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div className='space-y-2'>
                <Label htmlFor='target_frequency'>Frecuencia objetivo</Label>
                <Input
                  id='target_frequency'
                  type='number'
                  value={formData.target_frequency}
                  onChange={(e) =>
                    handleInputChange('target_frequency', e.target.value)
                  }
                  required
                  min='1'
                  placeholder='8'
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='unit'>Unidad de medida</Label>
                <Input
                  id='unit'
                  type='text'
                  value={formData.unit}
                  onChange={(e) => handleInputChange('unit', e.target.value)}
                  required
                  placeholder='horas, veces, porciones'
                />
                {formData.category && (
                  <div className='text-xs text-gray-500 mt-1'>
                    Sugerencias:{' '}
                    {getUnitSuggestions(formData.category).join(', ')}
                  </div>
                )}
              </div>
            </div>

            {error && (
              <Alert variant='destructive'>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className='flex justify-end space-x-4 border-t pt-6 mt-6'>
              <Link href='/habits'>
                <Button variant='outline'>Cancelar</Button>
              </Link>
              <Button
                type='submit'
                disabled={isLoading}
                className={cn(currentStyle.button)}
              >
                {isLoading ? 'Creando...' : 'Crear hábito'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
