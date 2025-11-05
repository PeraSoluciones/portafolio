'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppStore } from '@/store/app-store';
import { RoutineHabitsList } from '@/components/routine-habits-list';
import { AddHabitModal } from '@/components/add-habit-modal';
import { getAssignedHabits, getAvailableHabits, assignHabitToRoutine } from '@/lib/routine-habits-service';
import { RoutineHabitAssignment, HabitWithSelection } from '@/types/routine-habits';
import { Habit } from '@/types/database';
import { CheckCircle, Plus, Loader2, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createBrowserClient } from '@/lib/supabase/client';

export default function RoutineHabitsTestPage() {
  const { user, selectedChild } = useAppStore();
  const { toast } = useToast();
  const [routines, setRoutines] = useState<any[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [assignedHabits, setAssignedHabits] = useState<RoutineHabitAssignment[]>([]);
  const [selectedRoutine, setSelectedRoutine] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAddHabitModal, setShowAddHabitModal] = useState(false);

  // Cargar rutinas y hábitos al montar el componente
  useEffect(() => {
    if (selectedChild) {
      loadRoutines();
      loadHabits();
    }
  }, [selectedChild]);

  const loadRoutines = async () => {
    if (!selectedChild) return;
    
    setIsLoading(true);
    try {
      const supabase = createBrowserClient();
      const { data, error } = await supabase
        .from('routines')
        .select('*')
        .eq('child_id', selectedChild.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setRoutines(data || []);
      
      // Seleccionar la primera rutina por defecto
      if (data && data.length > 0) {
        setSelectedRoutine(data[0].id);
      }
    } catch (error) {
      console.error('Error loading routines:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las rutinas',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadHabits = async () => {
    if (!selectedChild) return;
    
    try {
      const habits = await getAvailableHabits(selectedChild.id);
      setHabits(habits);
    } catch (error) {
      console.error('Error loading habits:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los hábitos disponibles',
        variant: 'destructive',
      });
    }
  };

  const loadAssignedHabits = async (routineId: string) => {
    if (!routineId) return;
    
    setIsLoading(true);
    try {
      const assigned = await getAssignedHabits(routineId);
      setAssignedHabits(assigned);
    } catch (error) {
      console.error('Error loading assigned habits:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los hábitos asignados',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar hábitos asignados cuando cambia la rutina seleccionada
  useEffect(() => {
    if (selectedRoutine) {
      loadAssignedHabits(selectedRoutine);
    }
  }, [selectedRoutine]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      loadRoutines(),
      selectedRoutine ? loadAssignedHabits(selectedRoutine) : Promise.resolve()
    ]);
    setIsRefreshing(false);
  };

  const handleTestAssignment = async () => {
    if (!selectedRoutine || habits.length === 0) {
      toast({
        title: 'Error',
        description: 'Selecciona una rutina y asegúrate de que haya hábitos disponibles',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Asignar el primer hábito disponible a la rutina seleccionada
      const habitToAssign = habits.find(h => 
        !assignedHabits.some(ah => ah.habit_id === h.id)
      );

      if (habitToAssign) {
        await assignHabitToRoutine(selectedRoutine, habitToAssign.id);
        toast({
          title: 'Prueba exitosa',
          description: `El hábito "${habitToAssign.title}" se asignó correctamente a la rutina`,
          variant: 'success',
        });
        await loadAssignedHabits(selectedRoutine);
      } else {
        toast({
          title: 'Información',
          description: 'Todos los hábitos ya están asignados a esta rutina',
          variant: 'default',
        });
      }
    } catch (error) {
      console.error('Error testing assignment:', error);
      toast({
        title: 'Error en la prueba',
        description: 'No se pudo realizar la asignación de prueba',
        variant: 'destructive',
      });
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    return `${hours}:${minutes}`;
  };

  if (!user) {
    return <div>Redirigiendo al login...</div>;
  }

  if (!selectedChild) {
    return <div>Selecciona un hijo para continuar...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Prueba del Sistema de Hábitos en Rutinas
        </h1>
        <p className="text-gray-600">
          Esta página permite probar la funcionalidad de asignación de hábitos a rutinas
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="routines">Rutinas</TabsTrigger>
          <TabsTrigger value="habits">Hábitos</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Estado del Sistema</CardTitle>
              <CardDescription>
                Resumen del estado actual de la implementación
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{routines.length}</div>
                  <div className="text-sm text-gray-500">Rutinas</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{habits.length}</div>
                  <div className="text-sm text-gray-500">Hábitos disponibles</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{assignedHabits.length}</div>
                  <div className="text-sm text-gray-500">Hábitos asignados</div>
                </div>
              </div>
              
              <div className="flex space-x-4">
                <Button 
                  onClick={handleTestAssignment}
                  disabled={!selectedRoutine || habits.length === 0}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Probar Asignación
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                >
                  {isRefreshing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Actualizar
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="routines" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {routines.map((routine) => (
              <Card 
                key={routine.id} 
                className={`cursor-pointer transition-all ${
                  selectedRoutine === routine.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'hover:border-gray-300'
                }`}
                onClick={() => setSelectedRoutine(routine.id)}
              >
                <CardHeader>
                  <CardTitle className="text-lg">{routine.title}</CardTitle>
                  {routine.description && (
                    <CardDescription>{routine.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">{formatTime(routine.time)}</span>
                      <Badge variant={routine.is_active ? 'default' : 'secondary'}>
                        {routine.is_active ? 'Activa' : 'Inactiva'}
                      </Badge>
                    </div>
                    <div className="flex space-x-1">
                      {routine.days?.map((day: string) => (
                        <Badge key={day} variant="outline" className="text-xs">
                          {day}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {selectedRoutine && (
            <div className="mt-6">
              <RoutineHabitsList
                routineId={selectedRoutine}
                assignedHabits={assignedHabits}
                onRefresh={() => loadAssignedHabits(selectedRoutine)}
                onAddHabit={() => setShowAddHabitModal(true)}
                isLoading={isLoading}
              />
              
              <AddHabitModal
                routineId={selectedRoutine}
                childId={selectedChild.id}
                availableHabits={habits.filter(h => 
                  !assignedHabits.some(ah => ah.habit_id === h.id)
                )}
                onClose={() => setShowAddHabitModal(false)}
                onSuccess={() => {
                  setShowAddHabitModal(false);
                  loadAssignedHabits(selectedRoutine);
                }}
                trigger={undefined}
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="habits" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {habits.map((habit) => {
              const isAssigned = assignedHabits.some(ah => ah.habit_id === habit.id);
              return (
                <Card 
                  key={habit.id} 
                  className={`transition-all ${
                    isAssigned ? 'border-green-500 bg-green-50' : ''
                  }`}
                >
                  <CardHeader>
                    <CardTitle className="text-lg">{habit.title}</CardTitle>
                    {habit.description && (
                      <CardDescription>{habit.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge>{habit.category}</Badge>
                        {isAssigned && (
                          <Badge variant="outline" className="text-green-600 border-green-200">
                            Asignado
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        Meta: {habit.target_frequency} {habit.unit}
                      </div>
                      {habit.points_value > 0 && (
                        <div className="text-sm text-gray-500">
                          Puntos: {habit.points_value}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}