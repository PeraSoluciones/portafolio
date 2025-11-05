'use client';

import { useState, useEffect } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDescription } from '@/components/ui/alert';
import { useAppStore } from '@/store/app-store';
import { useToast } from '@/hooks/use-toast';
import { createRoutineSchema } from '@/lib/validations/routine';
import { RoutineHabitsList } from '@/components/routine-habits-list';
import { AddHabitModal } from '@/components/add-habit-modal';
import { getAssignedHabits, getAvailableHabits } from '@/lib/routine-habits-service';
import { RoutineHabitAssignment, HabitWithSelection } from '@/types/routine-habits';
import { ArrowLeft, Clock, Award, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { z } from 'zod';

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
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    time: '',
    days: [] as string[],
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [selectedExample, setSelectedExample] = useState<string | null>(null);
  
  // Estados para la gestión de hábitos
  const [assignedHabits, setAssignedHabits] = useState<RoutineHabitAssignment[]>([]);
  const [availableHabits, setAvailableHabits] = useState<HabitWithSelection[]>([]);
  const [isHabitsLoading, setIsHabitsLoading] = useState(false);
  const [showAddHabitModal, setShowAddHabitModal] = useState(false);
  const [newRoutineId, setNewRoutineId] = useState<string | null>(null);
  
  const router = useRouter();

  // Cargar hábitos disponibles cuando se selecciona un niño
  useEffect(() => {
    if (selectedChild) {
      loadAvailableHabits();
    }
  }, [selectedChild]);

  const loadAvailableHabits = async () => {
    if (!selectedChild) return;
    
    setIsHabitsLoading(true);
    try {
      const habits = await getAvailableHabits(selectedChild.id);
      const habitsWithSelection: HabitWithSelection[] = habits.map(habit => ({
        ...habit,
        selected: false,
        assigned: false,
      }));
      setAvailableHabits(habitsWithSelection);
    } catch (error) {
      console.error('Error loading available habits:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los hábitos disponibles',
        variant: 'destructive',
      });
    } finally {
      setIsHabitsLoading(false);
    }
  };

  const loadAssignedHabits = async (routineId: string) => {
    setIsHabitsLoading(true);
    try {
      const habits = await getAssignedHabits(routineId);
      setAssignedHabits(habits);
    } catch (error) {
      console.error('Error loading assigned habits:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los hábitos asignados',
        variant: 'destructive',
      });
    } finally {
      setIsHabitsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFieldErrors({});

    if (!user) {
      toast({
        title: 'Error de autenticación',
        description: 'Debes iniciar sesión para crear una rutina',
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

    // Validar los datos con Zod
    try {
      const validatedData = createRoutineSchema.parse(formData);

      try {
        const supabase = createBrowserClient();

        const { data, error: insertError } = await supabase
          .from('routines')
          .insert([
            {
              child_id: selectedChild.id,
              title: validatedData.title,
              description: validatedData.description,
              time: validatedData.time,
              days: validatedData.days,
              is_active: true,
            },
          ])
          .select()
          .single();

        if (insertError) {
          toast({
            title: 'Error al crear la rutina',
            description: insertError.message,
            variant: 'destructive',
          });
          return;
        }

        // Mostrar mensaje de éxito
        toast({
          title: 'Rutina creada',
          description: 'La rutina se ha creado correctamente',
          variant: 'success',
        });

        // Guardar el ID de la nueva rutina para poder asignar hábitos
        setNewRoutineId(data.id);
        
        // Redirigir a la página de rutinas
        router.push('/routines');
      } catch (err) {
        toast({
          title: 'Error del servidor',
          description: 'Ocurrió un error inesperado al crear la rutina',
          variant: 'destructive',
        });
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        // Manejar errores de validación de Zod
        const errors: Record<string, string> = {};
        err.issues.forEach((issue) => {
          if (issue.path.length > 0) {
            errors[issue.path[0].toString()] = issue.message;
          }
        });
        setFieldErrors(errors);

        // Mostrar un toast con el primer error de validación
        const firstError = err.issues[0];
        toast({
          title: 'Error de validación',
          description: firstError.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error inesperado',
          description: 'Ocurrió un error al procesar el formulario',
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Limpiar el error de este campo cuando el usuario empieza a escribir
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
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

    // Limpiar el error del campo days cuando el usuario selecciona/deselecciona un día
    if (fieldErrors.days) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.days;
        return newErrors;
      });
    }
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
                className={fieldErrors.title ? 'border-red-500' : ''}
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
                <SelectTrigger
                  className={fieldErrors.time ? 'border-red-500' : ''}
                >
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
              {fieldErrors.time && (
                <p className='text-sm text-red-500'>{fieldErrors.time}</p>
              )}
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
              {fieldErrors.days && (
                <p className='text-sm text-red-500'>{fieldErrors.days}</p>
              )}
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

            {Object.keys(fieldErrors).length > 0 && (
              <div className='p-3 bg-red-50 border border-red-200 rounded-md'>
                <p className='text-sm text-red-600'>
                  Por favor, corrige los errores en el formulario
                </p>
              </div>
            )}

            {/* Sección de Hábitos Asignados */}
            <div className='space-y-4'>
              <RoutineHabitsList
                routineId={newRoutineId || ''}
                assignedHabits={assignedHabits}
                onRefresh={() => {
                  if (newRoutineId) {
                    loadAssignedHabits(newRoutineId);
                  }
                }}
                onAddHabit={() => setShowAddHabitModal(true)}
                isLoading={isHabitsLoading}
              />
              
              {newRoutineId && (
                <AddHabitModal
                  routineId={newRoutineId}
                  childId={selectedChild?.id || ''}
                  availableHabits={availableHabits.filter(h =>
                    !assignedHabits.some(ah => ah.habit_id === h.id)
                  )}
                  onClose={() => setShowAddHabitModal(false)}
                  onSuccess={() => {
                    setShowAddHabitModal(false);
                    if (newRoutineId) {
                      loadAssignedHabits(newRoutineId);
                    }
                  }}
                  trigger={undefined}
                />
              )}
            </div>

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
