'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import { useAppStore } from '@/store/app-store';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PointsBadge } from '@/components/ui/points-badge';
import { useToast } from '@/hooks/use-toast';
import {
  Calendar,
  CheckCircle,
  Clock,
  Star,
  Loader2,
  Target,
  Sparkles,
  Award,
  Plus,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { Routine, Habit, Child } from '@/types/database';
import { RoutineHabitAssignment } from '@/types/routine-habits';
import { getAssignedHabits } from '@/lib/routine-habits-service';
import { cn, calculateAge } from '@/lib/utils';

// Tipo para el estado de un hábito en la vista de hoy
interface HabitState {
  habitId: string;
  isCompleted: boolean;
  pointsEarned?: number;
  recordId?: string;
}

export default function TodayPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, children, selectedChild, setSelectedChild, fetchChildrenWithPoints } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [routines, setRoutines] = useState<(Routine & { habits: HabitState[] })[]>([]);
  const [habitsState, setHabitsState] = useState<HabitState[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);
  const [pointsAnimation, setPointsAnimation] = useState<{ show: boolean; points: number; habitTitle: string }>({
    show: false,
    points: 0,
    habitTitle: '',
  });
  const [habitDetails, setHabitDetails] = useState<Record<string, Habit>>({});

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    // Si no hay hijos en el store, intentar cargarlos directamente
    if (children.length === 0) {
      fetchChildrenDirectly();
      return;
    }

    // Si hay hijos, asegurarse de que loading sea false
    setLoading(false);

    // Si no hay un hijo seleccionado, seleccionar el primero
    if (!selectedChild && children.length > 0) {
      setSelectedChild(children[0]);
      return;
    }
  }, [user, children.length, selectedChild?.id, router, setSelectedChild]);

  const fetchChildrenDirectly = async () => {
    if (!user) return;
    
    await fetchChildrenWithPoints();
    
    // Seleccionar el primer hijo si no hay uno seleccionado
    const { children, setSelectedChild, selectedChild } = useAppStore.getState();
    if (children.length > 0 && !selectedChild) {
      setSelectedChild(children[0]);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    if (selectedChild) {
      fetchData();
    }
  }, [selectedChild]);

  const fetchData = async () => {
    if (!selectedChild) return;

    setLoading(true);
    try {
      // Usar el nuevo endpoint optimizado
      const response = await fetch(`/api/today?child_id=${selectedChild.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch today data');
      }

      const { data } = await response.json();
      
      // Transformar los datos al formato que espera el componente
      const formattedRoutines = data.routines.map((routine: any) => ({
        id: routine.id,
        title: routine.title,
        description: routine.description,
        time: routine.time,
        days: routine.days,
        is_active: routine.isActive,
        created_at: routine.createdAt,
        updated_at: routine.updatedAt,
        habits: routine.habits.map((habit: any) => ({
          habitId: habit.id,
          isCompleted: habit.isCompleted,
          recordId: habit.recordId,
          pointsEarned: habit.pointsValue,
        }))
      }));

      const allHabitsState = data.routines.flatMap((routine: any) =>
        routine.habits.map((habit: any) => ({
          habitId: habit.id,
          isCompleted: habit.isCompleted,
          recordId: habit.recordId,
          pointsEarned: habit.pointsValue,
        }))
      );

      // Guardar detalles de hábitos para mostrar títulos
      const habitDetailsMap: Record<string, Habit> = {};
      data.routines.forEach((routine: any) => {
        routine.habits.forEach((habit: any) => {
          habitDetailsMap[habit.id] = {
            id: habit.id,
            child_id: selectedChild.id,
            title: habit.title,
            description: habit.description,
            category: habit.category,
            target_frequency: habit.targetFrequency,
            unit: habit.unit,
            points_value: habit.pointsValue,
            created_at: '',
            updated_at: '',
          };
        });
      });
      setHabitDetails(habitDetailsMap);

      setRoutines(formattedRoutines);
      setHabitsState(allHabitsState);
    } catch (error) {
      console.error('Error fetching today data:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar la información de hoy',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleHabit = async (habitId: string, isChecked: boolean) => {
    if (!selectedChild) return;

    setIsSubmitting(habitId);
    
    try {
      // Usar el nuevo endpoint optimizado
      const response = await fetch('/api/today/toggle-habit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          habit_id: habitId,
          is_completed: isChecked,
          child_id: selectedChild.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to toggle habit');
      }

      const { data } = await response.json();

      // Actualizar el estado local
      if (isChecked && data.action !== 'none') {
        // Marcar como completado
        const pointsEarned = data.pointsEarned || 0;
        
        setHabitsState(prev =>
          prev.map(h =>
            h.habitId === habitId
              ? { ...h, isCompleted: true, recordId: data.record.id, pointsEarned }
              : h
          )
        );

        // Actualizar las rutinas
        setRoutines(prev =>
          prev.map(routine => ({
            ...routine,
            habits: routine.habits.map(h =>
              h.habitId === habitId
                ? { ...h, isCompleted: true, recordId: data.record.id, pointsEarned }
                : h
            )
          }))
        );

        // Mostrar animación de puntos si ganó puntos
        if (pointsEarned > 0) {
          const habitTitle = data.habit.title || getHabitTitle(habitId);
          
          setPointsAnimation({
            show: true,
            points: pointsEarned,
            habitTitle,
          });

          setTimeout(() => {
            setPointsAnimation({ show: false, points: 0, habitTitle: '' });
          }, 3000);
        }

        // Actualizar el saldo del niño en el store
        await fetchChildrenWithPoints();

        toast({
          title: '¡Hábito completado!',
          description: `Has ganado ${pointsEarned} puntos`,
          variant: 'success',
        });
      } else if (!isChecked) {
        // Desmarcar como completado
        const pointsLost = data.pointsLost || 0;
        
        setHabitsState(prev =>
          prev.map(h =>
            h.habitId === habitId
              ? { ...h, isCompleted: false, recordId: undefined, pointsEarned: 0 }
              : h
          )
        );

        // Actualizar las rutinas
        setRoutines(prev =>
          prev.map(routine => ({
            ...routine,
            habits: routine.habits.map(h =>
              h.habitId === habitId
                ? { ...h, isCompleted: false, recordId: undefined, pointsEarned: 0 }
                : h
            )
          }))
        );

        // Actualizar el saldo del niño en el store
        await fetchChildrenWithPoints();

        const message = pointsLost > 0
          ? `Se ha eliminado el registro (-${pointsLost} puntos)`
          : 'Se ha eliminado el registro de hoy';

        toast({
          title: 'Hábito desmarcado',
          description: message,
          variant: 'default',
        });
      }
    } catch (error) {
      console.error('Error toggling habit:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el hábito',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(null);
    }
  };

  const getHabitTitle = (habitId: string): string => {
    // Buscar el título del hábito en los detalles guardados
    return habitDetails[habitId]?.title || 'Hábito';
  };

  const getADHDTypeLabel = (type: string) => {
    switch (type) {
      case 'INATTENTIVE':
        return 'Inatento';
      case 'HYPERACTIVE':
        return 'Hiperactivo';
      case 'COMBINED':
        return 'Combinado';
      default:
        return type;
    }
  };

  const getADHDTypeColor = (type: string) => {
    switch (type) {
      case 'INATTENTIVE':
        return 'text-chart-1';
      case 'HYPERACTIVE':
        return 'text-destructive';
      case 'COMBINED':
        return 'text-chart-2';
      default:
        return 'text-muted-foreground';
    }
  };

  const completedHabitsCount = habitsState.filter(h => h.isCompleted).length;
  const totalHabitsCount = habitsState.length;
  const progressPercentage = totalHabitsCount > 0 ? (completedHabitsCount / totalHabitsCount) * 100 : 0;
  const totalPointsEarnedToday = habitsState
    .filter(h => h.isCompleted)
    .reduce((total, h) => total + (h.pointsEarned || 0), 0);

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='text-center'>
          <p className='text-muted-foreground mb-4'>
            Cargando información del usuario...
          </p>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto'></div>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Animación de puntos */}
      {pointsAnimation.show && (
        <div className="fixed top-20 right-4 z-50 animate-pulse">
          <Card className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 shadow-lg">
            <CardContent className="p-4 flex items-center space-x-3">
              <Sparkles className="h-6 w-6" />
              <div>
                <p className="font-bold">¡Felicidades!</p>
                <p className="text-sm">
                  {pointsAnimation.points} puntos por "{pointsAnimation.habitTitle}"
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Encabezado */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-foreground flex items-center gap-2'>
            <Calendar className='h-8 w-8 text-primary' />
            Rutinas de Hoy
          </h1>
          <p className='text-muted-foreground mt-1'>
            {new Date().toLocaleDateString('es-ES', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        <Avatar className='h-12 w-12'>
          <AvatarImage src={user.avatar_url} />
          <AvatarFallback className='text-lg font-medium'>
            {user.full_name?.charAt(0)}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Selector de hijos */}
      {children.length > 0 && (
        <Card className='border-t-4 border-t-primary'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-foreground'>
              <Users className='h-5 w-5' />
              Hijo seleccionado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex items-center space-x-4'>
              <Avatar className='h-12 w-12'>
                <AvatarImage src={selectedChild?.avatar_url} />
                <AvatarFallback className='text-sm font-medium'>
                  {selectedChild?.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className='font-medium text-foreground'>
                  {selectedChild?.name}
                </p>
                <p className='text-sm text-muted-foreground'>
                  {calculateAge(selectedChild?.birth_date || '')} años
                </p>
                <div className='flex items-center gap-2 mt-2'>
                  <Badge
                    variant='outline'
                    className={cn(
                      getADHDTypeColor(selectedChild?.adhd_type || '')
                    )}
                  >
                    {getADHDTypeLabel(selectedChild?.adhd_type || '')}
                  </Badge>
                  <PointsBadge
                    points={selectedChild?.points_balance || 0}
                    size='sm'
                    variant='secondary'
                  />
                </div>
              </div>
              <div className='ml-auto'>
                <Link href='/children'>
                  <Button variant='outline' size='sm'>
                    Cambiar hijo
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No hay hijos */}
      {children.length === 0 && (
        <Card className='border-t-4 border-t-accent'>
          <CardContent className='pt-6'>
            <div className='text-center'>
              <Users className='h-12 w-12 text-accent mx-auto mb-4' />
              <h3 className='text-lg font-medium text-foreground mb-2'>
                No tienes hijos registrados
              </h3>
              <p className='text-muted-foreground mb-4'>
                Comienza agregando tu primer hijo para empezar a gestionar sus
                rutinas
              </p>
              <Link href='/children/new'>
                <Button>
                  <Plus className='h-4 w-4 mr-2' />
                  Agregar primer hijo
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estadísticas del día */}
      {selectedChild && totalHabitsCount > 0 && (
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          {/* Tarjeta de Progreso */}
          <Card className='border-t-4 border-t-primary'>
            <CardHeader>
              <div className='flex items-center space-x-3 mb-2'>
                <div className='text-primary'>
                  <Target className='h-6 w-6' />
                </div>
                <CardTitle className='text-lg font-bold text-foreground'>
                  Progreso del día
                </CardTitle>
              </div>
              <CardDescription className='text-sm text-muted-foreground'>
                Hábitos completados hoy
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='mb-4'>
                <div className='flex items-baseline'>
                  <span className='text-3xl font-bold text-primary'>
                    {completedHabitsCount}
                  </span>
                  <span className='text-xl text-muted-foreground ml-1'>
                    /{totalHabitsCount}
                  </span>
                </div>
                <p className='text-xs text-muted-foreground mt-1'>
                  Hábitos completados
                </p>
              </div>
              <div className='w-full bg-primary/20 rounded-full h-2 mb-4'>
                <div
                  className='bg-primary h-2 rounded-full transition-all duration-300'
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              <p className='text-sm text-muted-foreground'>
                {Math.round(progressPercentage)}% completado
              </p>
            </CardContent>
          </Card>

          {/* Tarjeta de Puntos Ganados */}
          <Card className='border-t-4 border-t-secondary'>
            <CardHeader>
              <div className='flex items-center space-x-3 mb-2'>
                <div className='text-secondary'>
                  <Award className='h-6 w-6' />
                </div>
                <CardTitle className='text-lg font-bold text-foreground'>
                  Puntos Ganados
                </CardTitle>
              </div>
              <CardDescription className='text-sm text-muted-foreground'>
                Total acumulado hoy
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='mb-4'>
                <div className='flex items-baseline'>
                  <span className='text-3xl font-bold text-secondary'>
                    {totalPointsEarnedToday}
                  </span>
                  <Star className='h-5 w-5 text-secondary ml-2' />
                </div>
                <p className='text-xs text-muted-foreground mt-1'>
                  Puntos obtenidos
                </p>
              </div>
              {totalPointsEarnedToday > 0 && (
                <div className='flex items-center space-x-1 text-sm text-secondary'>
                  <CheckCircle className='h-4 w-4' />
                  <span>¡Sigue así!</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tarjeta de Saldo Actual */}
          <Card className='border-t-4 border-t-chart-1'>
            <CardHeader>
              <div className='flex items-center space-x-3 mb-2'>
                <div className='text-chart-1'>
                  <Star className='h-6 w-6' />
                </div>
                <CardTitle className='text-lg font-bold text-foreground'>
                  Saldo Total
                </CardTitle>
              </div>
              <CardDescription className='text-sm text-muted-foreground'>
                Puntos disponibles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='mb-4'>
                <div className='flex items-baseline'>
                  <PointsBadge
                    points={selectedChild?.points_balance || 0}
                    size="lg"
                    variant="default"
                  />
                </div>
              </div>
              <Link href='/rewards'>
                <Button variant='outline' size='sm' className='w-full'>
                  Ver recompensas
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Rutinas de hoy */}
      {selectedChild && routines.length > 0 && (
        <div className='space-y-4'>
          <h2 className='text-2xl font-bold text-foreground flex items-center gap-2'>
            <Clock className='h-6 w-6 text-primary' />
            Rutinas del día
          </h2>
          {routines.map((routine) => (
            <Card key={routine.id} className='border-t-4 border-t-chart-2'>
              <CardHeader>
                <div className='flex items-center justify-between'>
                  <div>
                    <CardTitle className='text-xl text-foreground'>
                      {routine.title}
                    </CardTitle>
                    <CardDescription className='text-muted-foreground'>
                      {routine.time} - {routine.description}
                    </CardDescription>
                  </div>
                  <Badge variant='outline' className='text-chart-2 border-chart-2'>
                    {routine.habits.filter(h => h.isCompleted).length}/{routine.habits.length} completados
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className='space-y-3'>
                  {routine.habits.length === 0 ? (
                    <p className='text-muted-foreground text-center py-4'>
                      No hay hábitos asignados a esta rutina
                    </p>
                  ) : (
                    routine.habits.map((habit) => (
                      <div
                        key={habit.habitId}
                        className={cn(
                          'flex items-center justify-between p-3 rounded-lg border transition-all duration-200',
                          habit.isCompleted 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-gray-50 hover:bg-gray-100'
                        )}
                      >
                        <div className='flex items-center space-x-3 flex-1'>
                          <Checkbox
                            id={habit.habitId}
                            checked={habit.isCompleted}
                            onCheckedChange={(checked) => 
                              handleToggleHabit(habit.habitId, checked as boolean)
                            }
                            disabled={isSubmitting === habit.habitId}
                            className={cn(
                              'h-5 w-5',
                              habit.isCompleted && 'text-green-600 border-green-600'
                            )}
                          />
                          <div className='flex-1'>
                            <label
                              htmlFor={habit.habitId}
                              className={cn(
                                'font-medium cursor-pointer',
                                habit.isCompleted 
                                  ? 'text-green-700 line-through' 
                                  : 'text-foreground'
                              )}
                            >
                              {getHabitTitle(habit.habitId)}
                            </label>
                            {habit.pointsEarned && habit.pointsEarned > 0 && (
                              <div className='flex items-center space-x-1 mt-1'>
                                <Star className='h-4 w-4 text-yellow-500' />
                                <span className='text-sm text-yellow-600 font-medium'>
                                  {habit.pointsEarned} puntos
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className='flex items-center space-x-2'>
                          {habit.isCompleted ? (
                            <CheckCircle className='h-5 w-5 text-green-600' />
                          ) : (
                            isSubmitting === habit.habitId && (
                              <Loader2 className='h-5 w-5 animate-spin text-muted-foreground' />
                            )
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* No hay rutinas para hoy */}
      {selectedChild && routines.length === 0 && (
        <Card className='border-t-4 border-t-muted'>
          <CardContent className='pt-6'>
            <div className='text-center'>
              <Calendar className='h-12 w-12 text-muted mx-auto mb-4' />
              <h3 className='text-lg font-medium text-foreground mb-2'>
                No hay rutinas para hoy
              </h3>
              <p className='text-muted-foreground mb-4'>
                No se han configurado rutinas para este día de la semana
              </p>
              <Link href='/routines/new'>
                <Button>
                  <Plus className='h-4 w-4 mr-2' />
                  Crear nueva rutina
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}