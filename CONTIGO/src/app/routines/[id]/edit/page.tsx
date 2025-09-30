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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { useAppStore } from '@/store/app-store';
import { ArrowLeft, Clock, Save } from 'lucide-react';
import Link from 'next/link';
import { Routine } from '@/types';

const daysOfWeek = [
  { value: 'LUN', label: 'Lunes' },
  { value: 'MAR', label: 'Martes' },
  { value: 'MIÉ', label: 'Miércoles' },
  { value: 'JUE', label: 'Jueves' },
  { value: 'VIE', label: 'Viernes' },
  { value: 'SÁB', label: 'Sábado' },
  { value: 'DOM', label: 'Domingo' },
];

export default function EditRoutinePage() {
  const { user, children, selectedChild, setSelectedChild } = useAppStore();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    time: '',
    days: [] as string[],
    is_active: true,
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingRoutine, setLoadingRoutine] = useState(true);
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
      fetchRoutine();
    }
  }, [params.id, selectedChild]);

  const fetchRoutine = async () => {
    if (!params.id || !selectedChild) return;

    setLoadingRoutine(true);
    const supabase = createClient();

    const { data, error } = await supabase
      .from('routines')
      .select('*')
      .eq('id', params.id)
      .eq('child_id', selectedChild.id)
      .single();

    if (error) {
      console.error('Error fetching routine:', error);
      setError('No se encontró la rutina solicitada');
      setLoadingRoutine(false);
      return;
    }

    if (data) {
      setFormData({
        title: data.title,
        description: data.description || '',
        time: data.time,
        days: data.days || [],
        is_active: data.is_active,
      });
    }

    setLoadingRoutine(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!user) {
      setError('Debes iniciar sesión para editar una rutina');
      setIsLoading(false);
      return;
    }

    if (!selectedChild) {
      setError('Debes seleccionar un hijo');
      setIsLoading(false);
      return;
    }

    if (!params.id) {
      setError('No se especificó la rutina a editar');
      setIsLoading(false);
      return;
    }

    if (formData.days.length === 0) {
      setError('Debes seleccionar al menos un día de la semana');
      setIsLoading(false);
      return;
    }

    try {
      const supabase = createClient();

      const { error: updateError } = await supabase
        .from('routines')
        .update({
          title: formData.title,
          description: formData.description || null,
          time: formData.time,
          days: formData.days,
          is_active: formData.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.id)
        .eq('child_id', selectedChild.id);

      if (updateError) {
        setError(updateError.message);
        return;
      }

      // Redirigir a la página de rutinas
      router.push('/routines');
    } catch (err) {
      setError('Ocurrió un error inesperado');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (
    field: string,
    value: string | boolean | string[]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDayChange = (day: string, checked: boolean) => {
    if (checked) {
      setFormData((prev) => ({
        ...prev,
        days: [...prev.days, day],
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        days: prev.days.filter((d) => d !== day),
      }));
    }
  };

  const routineExamples = [
    'Despertarse y vestirse',
    'Desayuno familiar',
    'Hacer tareas escolares',
    'Hora de lectura',
    'Baño y preparación para dormir',
    'Tiempo de juego libre',
    'Práctica de deportes',
    'Momento de relajación',
  ];

  if (!user) {
    router.push('/login');
    return null;
  }

  if (loadingRoutine) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  if (error && !formData.title) {
    return (
      <div className='h-full bg-gray-50'>
        <div className='max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
          <Card>
            <CardContent className='p-6'>
              <div className='text-center'>
                <h2 className='text-2xl font-bold text-red-600 mb-4'>Error</h2>
                <p className='text-gray-600 mb-6'>{error}</p>
                <Link href='/routines'>
                  <Button>Volver a rutinas</Button>
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
          href='/routines'
          className='inline-flex items-center text-gray-600 hover:text-gray-900 mb-4'
        >
          <ArrowLeft className='h-4 w-4 mr-2' />
          Volver a rutinas
        </Link>
        <h2 className='text-3xl font-bold text-gray-900'>Editar rutina</h2>
        <p className='text-gray-600 mt-2'>
          Modifica los detalles de la rutina diaria
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className='flex items-center space-x-2'>
            <Clock className='h-5 w-5' />
            <span>Información de la rutina</span>
          </CardTitle>
          <CardDescription>
            Modifica los detalles de la rutina diaria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className='space-y-6'>
            <div className='space-y-2'>
              <Label htmlFor='title'>Título de la rutina</Label>
              <Input
                id='title'
                type='text'
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                required
                placeholder='Ej: Rutina matutina, Hora de dormir'
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
                placeholder='Describe en qué consiste la rutina...'
                rows={3}
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='time'>Hora</Label>
              <Input
                id='time'
                type='time'
                value={formData.time}
                onChange={(e) => handleInputChange('time', e.target.value)}
                required
              />
            </div>

            <div className='space-y-3'>
              <Label>Días de la semana</Label>
              <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
                {daysOfWeek.map((day) => (
                  <div key={day.value} className='flex items-center space-x-2'>
                    <Checkbox
                      id={day.value}
                      checked={formData.days.includes(day.value)}
                      onCheckedChange={(checked) =>
                        handleDayChange(day.value, checked as boolean)
                      }
                    />
                    <Label htmlFor={day.value} className='text-sm'>
                      {day.label}
                    </Label>
                  </div>
                ))}
              </div>
              {formData.days.length === 0 && (
                <p className='text-sm text-red-600'>
                  Debes seleccionar al menos un día
                </p>
              )}
            </div>

            <div className='flex items-center space-x-2'>
              <Checkbox
                id='is_active'
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  handleInputChange('is_active', checked as boolean)
                }
              />
              <Label htmlFor='is_active'>Rutina activa</Label>
            </div>

            <div className='p-4 bg-gray-50 rounded-lg'>
              <h4 className='font-medium text-gray-900 mb-2'>
                Ejemplos de rutinas:
              </h4>
              <ul className='text-sm text-gray-600 space-y-1'>
                {routineExamples.map((example, index) => (
                  <li key={index} className='flex items-center space-x-2'>
                    <span className='text-blue-500'>•</span>
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
              <Link href='/routines'>
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
