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
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAppStore } from '@/store/app-store';
import { ArrowLeft, Clock, Award } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const daysOfWeek = [
  { id: 'LUN', label: 'Lunes' },
  { id: 'MAR', label: 'Martes' },
  { id: 'MIÉ', label: 'Miércoles' },
  { id: 'JUE', label: 'Jueves' },
  { id: 'VIE', label: 'Viernes' },
  { id: 'SÁB', label: 'Sábado' },
  { id: 'DOM', label: 'Domingo' },
];

export default function NewRoutinePage() {
  const { user, children, selectedChild, setSelectedChild } = useAppStore();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    time: '',
    days: [] as string[],
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedExample, setSelectedExample] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!user) {
      setError('Debes iniciar sesión para crear una rutina');
      setIsLoading(false);
      return;
    }

    if (!selectedChild) {
      setError('Debes seleccionar un hijo');
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

      const { data, error: insertError } = await supabase
        .from('routines')
        .insert([
          {
            child_id: selectedChild.id,
            title: formData.title,
            description: formData.description,
            time: formData.time,
            days: formData.days,
            is_active: true,
          },
        ])
        .select()
        .single();

      if (insertError) {
        setError(insertError.message);
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

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleExampleClick = (example: string) => {
    handleInputChange('title', example);
    setSelectedExample(example);
    setTimeout(() => setSelectedExample(null), 300);
  };

  const handleDayChange = (day: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      days: checked ? [...prev.days, day] : prev.days.filter((d) => d !== day),
    }));
  };

  const generateTimeSlots = () => {
    const slots: string[] = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const time = `${hour.toString().padStart(2, '0')}:${minute
          .toString()
          .padStart(2, '0')}`;
        slots.push(time);
      }
    }
    return slots;
  };

  const routineExamples = [
    'Organizar la ropa y mochila la noche anterior',
    'Rutina de tareas (con pausas activas)',
    'Preparación para dormir (baño, lectura)',
    'Desayuno en familia sin distracciones',
    'Tiempo de juego estructurado',
  ];

  if (!user) {
    router.push('/login');
    return null;
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
        <h2 className='text-3xl font-bold text-gray-900'>Nueva rutina</h2>
        <p className='text-gray-600 mt-2'>
          Crea una rutina para establecer estructura y organización
        </p>
      </div>

      <Card className='border-t-4 border-t-secondary'>
        <CardHeader>
          <CardTitle className='flex items-center space-x-2'>
            <Clock className='h-5 w-5 text-secondary' />
            <span>Información de la rutina</span>
          </CardTitle>
          <CardDescription>
            Define los detalles de la rutina diaria
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
                placeholder='Ej: Desayuno, Tarea escolar, Hora de dormir'
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
              <Select
                value={formData.time}
                onValueChange={(value) => handleInputChange('time', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Selecciona la hora' />
                </SelectTrigger>
                <SelectContent>
                  {generateTimeSlots().map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-3'>
              <Label>Días de la semana</Label>
              <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
                {daysOfWeek.map((day) => (
                  <div key={day.id} className='flex items-center space-x-2'>
                    <Checkbox
                      id={day.id}
                      checked={formData.days.includes(day.id)}
                      onCheckedChange={(checked) =>
                        handleDayChange(day.id, checked as boolean)
                      }
                    />
                    <Label htmlFor={day.id} className='text-sm'>
                      {day.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className='p-4 bg-secondary/10 rounded-lg border border-secondary/20'>
              <div className='flex items-center space-x-2 mb-3'>
                <div className='p-1 bg-secondary/20 rounded-full'>
                  <Award className='h-4 w-4 text-secondary' />
                </div>
                <h4 className='font-medium text-gray-900'>
                  Ejemplos de rutinas para TDAH:
                </h4>
              </div>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-2'>
                {routineExamples.map((example, index) => (
                  <div
                    key={index}
                    className={`p-2 rounded-md text-sm cursor-pointer transition-all hover:shadow-sm ${
                      selectedExample === example
                        ? 'bg-secondary/30 border-secondary/50 scale-95'
                        : 'bg-white border border-secondary/20 hover:bg-secondary/10'
                    }`}
                    onClick={() => handleExampleClick(example)}
                  >
                    <div className='flex items-center space-x-2'>
                      <span className='text-secondary'>⏰</span>
                      <span className='text-gray-700'>{example}</span>
                    </div>
                  </div>
                ))}
              </div>
              <p className='text-xs text-gray-500 mt-3 italic'>
                💡 Haz clic en cualquier ejemplo para usarlo como título
              </p>
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
              <Button
                type='submit'
                disabled={isLoading}
                className='bg-secondary hover:bg-secondary/90'
              >
                {isLoading ? 'Creando...' : 'Crear rutina'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
