'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/store/app-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Calendar,
  Target,
  Star,
  Trophy,
  Plus,
  Users,
  BookOpen,
  TrendingUp,
  Clock,
  CheckCircle,
  Activity,
  Award,
  Heart,
  Zap
} from 'lucide-react';
import Link from 'next/link';
import { Routine, Habit, Behavior, Reward, Child } from '@/types/database';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const router = useRouter();
  const { user, children, selectedChild } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [behaviors, setBehaviors] = useState<Behavior[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [todayRoutines, setTodayRoutines] = useState<Routine[]>([]);
  const [completedRoutines, setCompletedRoutines] = useState<string[]>([]);

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
      const { setSelectedChild } = useAppStore.getState();
      setSelectedChild(children[0]);
      return;
    }
  }, [user, children.length, selectedChild?.id, router]); // Dependencias más específicas

  const fetchChildrenDirectly = async () => {
    if (!user) return;
    
    try {
      const response = await fetch('/api/children/user', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error:', errorData);
        throw new Error(errorData.error || 'Failed to fetch children');
      }

      const { children } = await response.json();

      if (children && children.length > 0) {
        const { setChildren } = useAppStore.getState();
        setChildren(children);
        
        // Si hay hijos y no hay uno seleccionado, seleccionar el primero
        if (!selectedChild) {
          const { setSelectedChild } = useAppStore.getState();
          setSelectedChild(children[0]);
        }
      }
    } catch (error) {
      console.error('Exception fetching children via API:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedChild) {
      fetchData();
    }
  }, [selectedChild]);

  const fetchData = async () => {
    if (!selectedChild) return;

    try {
      const supabase = createClient();
      
      // Obtener rutinas
      const { data: routinesData, error: routinesError } = await supabase
        .from('routines')
        .select('*')
        .eq('child_id', selectedChild.id)
        .eq('is_active', true);
      
      // Obtener hábitos
      const { data: habitsData, error: habitsError } = await supabase
        .from('habits')
        .select('*')
        .eq('child_id', selectedChild.id);
      
      // Obtener comportamientos
      const { data: behaviorsData, error: behaviorsError } = await supabase
        .from('behaviors')
        .select('*')
        .eq('child_id', selectedChild.id);
      
      // Obtener recompensas
      const { data: rewardsData, error: rewardsError } = await supabase
        .from('rewards')
        .select('*')
        .eq('child_id', selectedChild.id)
        .eq('is_active', true);

      setRoutines(routinesData || []);
      setHabits(habitsData || []);
      setBehaviors(behaviorsData || []);
      setRewards(rewardsData || []);
      
      // Filtrar rutinas de hoy
      const today = new Date().getDay();
      const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
      const todayName = dayNames[today];
      
      const todayRoutinesData = (routinesData || []).filter(routine =>
        routine.days.includes(todayName)
      );
      
      setTodayRoutines(todayRoutinesData);
      
      // Simular rutinas completadas (en una implementación real, esto vendría de la base de datos)
      setCompletedRoutines(todayRoutinesData.slice(0, Math.ceil(todayRoutinesData.length * 0.6)).map(r => r.id));
      
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Cargando información del usuario...</p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Bienvenida */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            ¡Bienvenido, {user.full_name}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestiona las rutinas y actividades de {selectedChild?.name || 'tus hijos'}
          </p>
        </div>
        <Avatar className="h-12 w-12">
          <AvatarImage src={user.avatar_url} />
          <AvatarFallback className="text-lg font-medium">
            {user.full_name?.charAt(0)}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Selector de hijos */}
      {children.length > 0 && (
        <Card className="border-t-4 border-t-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Users className="h-5 w-5" />
              Hijo seleccionado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={selectedChild?.avatar_url} />
                <AvatarFallback className="text-sm font-medium">
                  {selectedChild?.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-foreground">{selectedChild?.name}</p>
                <p className="text-sm text-muted-foreground">{selectedChild?.age} años</p>
                <Badge variant="outline" className={cn("mt-1", getADHDTypeColor(selectedChild?.adhd_type || ''))}>
                  {getADHDTypeLabel(selectedChild?.adhd_type || '')}
                </Badge>
              </div>
              <div className="ml-auto">
                <Link href="/children">
                  <Button variant="outline" size="sm">
                    Gestionar hijos
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No hay hijos */}
      {children.length === 0 && (
        <Card className="border-t-4 border-t-accent">
          <CardContent className="pt-6">
            <div className="text-center">
              <Users className="h-12 w-12 text-accent mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No tienes hijos registrados
              </h3>
              <p className="text-muted-foreground mb-4">
                Comienza agregando tu primer hijo para empezar a gestionar sus rutinas
              </p>
              <Link href="/children/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar primer hijo
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estadísticas */}
      {selectedChild && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Tarjeta de Rutinas */}
          <Card className="border-t-4 border-t-primary hover:shadow-lg transition-shadow duration-300 flex flex-col">
            <CardHeader>
              <div className="flex items-center space-x-3 mb-2">
                <div className="text-primary">
                  <Calendar className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg font-bold text-foreground">Rutinas Hoy</CardTitle>
              </div>
              <CardDescription className="text-sm text-muted-foreground">
                Progreso diario de actividades
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col">
              <div className="mb-4">
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-primary">{completedRoutines.length}</span>
                  <span className="text-xl text-muted-foreground ml-1">/{todayRoutines.length}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Completadas hoy</p>
              </div>
              <div className="w-full bg-primary/20 rounded-full h-2 mb-4">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${todayRoutines.length > 0 ? (completedRoutines.length / todayRoutines.length) * 100 : 0}%` }}
                ></div>
              </div>
              <div className="mt-auto flex items-center justify-between">
                <Link href="/routines" className="flex-1 mr-2">
                  <Button variant="outline" size="sm" className="w-full">
                    Ver todas
                  </Button>
                </Link>
                <Link href="/routines/new">
                  <Button size="sm" className="px-3">
                    <Plus className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
          
          {/* Tarjeta de Hábitos */}
          <Card className="border-t-4 border-t-chart-5 hover:shadow-lg transition-shadow duration-300 flex flex-col">
            <CardHeader>
              <div className="flex items-center space-x-3 mb-2">
                <div className="text-chart-5">
                  <Target className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg font-bold text-foreground">Hábitos</CardTitle>
              </div>
              <CardDescription className="text-sm text-muted-foreground">
                Seguimiento de hábitos semanales
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col">
              <div className="mb-4">
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-chart-5">{habits.length}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Activos esta semana</p>
              </div>
              <div className="flex items-center space-x-2 mb-4">
                {[...Array(7)].map((_, i) => (
                  <div
                    key={i}
                    className={`h-2 flex-1 rounded-full ${i < Math.min(habits.length, 7) ? 'bg-chart-5' : 'bg-muted'}`}
                  ></div>
                ))}
              </div>
              <div className="mt-auto flex items-center justify-between">
                <Link href="/habits" className="flex-1 mr-2">
                  <Button variant="outline" size="sm" className="w-full">
                    Ver todos
                  </Button>
                </Link>
                <Link href="/habits/new">
                  <Button size="sm" className="px-3">
                    <Plus className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
          
          {/* Tarjeta de Recompensas */}
          <Card className="border-t-4 border-t-secondary hover:shadow-lg transition-shadow duration-300 flex flex-col">
            <CardHeader>
              <div className="flex items-center space-x-3 mb-2">
                <div className="text-secondary">
                  <Trophy className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg font-bold text-foreground">Recompensas</CardTitle>
              </div>
              <CardDescription className="text-sm text-muted-foreground">
                Motivación y logros
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col">
              <div className="mb-4">
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-secondary">{rewards.length}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Disponibles para canjear</p>
              </div>
              <div className="flex items-center space-x-1 mb-4">
                {[...Array(3)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${i < Math.min(rewards.length, 3) ? 'text-secondary fill-secondary' : 'text-muted'}`}
                  />
                ))}
                {rewards.length > 3 && (
                  <span className="text-xs text-muted-foreground ml-1">+{rewards.length - 3}</span>
                )}
              </div>
              <div className="mt-auto flex items-center justify-between">
                <Link href="/rewards" className="flex-1 mr-2">
                  <Button variant="outline" size="sm" className="w-full">
                    Ver todas
                  </Button>
                </Link>
                <Link href="/rewards/new">
                  <Button size="sm" className="px-3">
                    <Plus className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
          
          {/* Tarjeta de Comportamientos */}
          <Card className="border-t-4 border-t-accent hover:shadow-lg transition-shadow duration-300 flex flex-col">
            <CardHeader>
              <div className="flex items-center space-x-3 mb-2">
                <div className="text-accent">
                  <Star className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg font-bold text-foreground">Comportamientos</CardTitle>
              </div>
              <CardDescription className="text-sm text-muted-foreground">
                Registro de comportamientos
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col">
              <div className="mb-4">
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-accent">{behaviors.length}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Registrados esta semana</p>
              </div>
              <div className="flex space-x-1 mb-4">
                <div className="h-8 flex-1 bg-accent/20 rounded flex items-center justify-center">
                  <span className="text-xs font-medium text-accent">Positivos</span>
                </div>
                <div className="h-8 flex-1 bg-muted rounded flex items-center justify-center">
                  <span className="text-xs font-medium text-muted-foreground">Mejora</span>
                </div>
              </div>
              <div className="mt-auto flex items-center justify-between">
                <Link href="/behaviors" className="flex-1 mr-2">
                  <Button variant="outline" size="sm" className="w-full">
                    Ver todos
                  </Button>
                </Link>
                <Link href="/behaviors/new">
                  <Button size="sm" className="px-3">
                    <Plus className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Rutinas de hoy */}
      {selectedChild && todayRoutines.length > 0 && (
        <Card className="border-t-4 border-t-chart-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Clock className="h-5 w-5" />
              Rutinas de hoy
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Progreso de las rutinas diarias de {selectedChild.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todayRoutines.map((routine) => (
                <div key={routine.id} className="flex items-center justify-between p-3 bg-card rounded-lg border">
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded-full border-2 ${completedRoutines.includes(routine.id) ? 'bg-success border-success' : 'border-muted-foreground'}`}>
                      {completedRoutines.includes(routine.id) && (
                        <CheckCircle className="h-3 w-3 text-success-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{routine.title}</p>
                      <p className="text-sm text-muted-foreground">{routine.time}</p>
                    </div>
                  </div>
                  <Badge variant={completedRoutines.includes(routine.id) ? "default" : "outline"} className={completedRoutines.includes(routine.id) ? "bg-success text-success-foreground" : ""}>
                    {completedRoutines.includes(routine.id) ? "Completada" : "Pendiente"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recompensas disponibles */}
      {selectedChild && rewards.length > 0 && (
        <Card className="border-t-4 border-t-chart-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Heart className="h-5 w-5" />
              Recompensas disponibles
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Motivación para {selectedChild.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rewards.slice(0, 3).map((reward) => (
                <div key={reward.id} className="p-4 bg-card rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-foreground">{reward.title}</h4>
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-accent" />
                      <span className="text-sm font-medium">{reward.points_required}</span>
                    </div>
                  </div>
                  {reward.description && (
                    <p className="text-sm text-muted-foreground">{reward.description}</p>
                  )}
                </div>
              ))}
            </div>
            {rewards.length > 3 && (
              <div className="mt-4 text-center">
                <Link href="/rewards">
                  <Button variant="outline">
                    Ver todas las recompensas
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}