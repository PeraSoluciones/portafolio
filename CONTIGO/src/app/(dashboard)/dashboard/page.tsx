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
        return 'bg-blue-100 text-blue-800';
      case 'HYPERACTIVE':
        return 'bg-red-100 text-red-800';
      case 'COMBINED':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Cargando información del usuario...</p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Bienvenida */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            ¡Bienvenido, {user.full_name}!
          </h1>
          <p className="text-gray-600 mt-1">
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
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
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
                <p className="font-medium text-gray-900">{selectedChild?.name}</p>
                <p className="text-sm text-gray-500">{selectedChild?.age} años</p>
                <Badge className={`mt-1 ${getADHDTypeColor(selectedChild?.adhd_type || '')}`}>
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
        <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <Users className="h-12 w-12 text-amber-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No tienes hijos registrados
              </h3>
              <p className="text-gray-600 mb-4">
                Comienza agregando tu primer hijo para empezar a gestionar sus rutinas
              </p>
              <Link href="/children/new">
                <Button className="bg-amber-600 hover:bg-amber-700">
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
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-100">Rutinas Hoy</CardTitle>
              <Calendar className="h-4 w-4 text-blue-100" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedRoutines.length}/{todayRoutines.length}</div>
              <p className="text-xs text-blue-100">
                Completadas hoy
              </p>
              <div className="mt-2 w-full bg-blue-400 rounded-full h-2">
                <div 
                  className="bg-white h-2 rounded-full" 
                  style={{ width: `${todayRoutines.length > 0 ? (completedRoutines.length / todayRoutines.length) * 100 : 0}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-100">Hábitos</CardTitle>
              <Target className="h-4 w-4 text-green-100" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{habits.length}</div>
              <p className="text-xs text-green-100">
                Activos esta semana
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-100">Recompensas</CardTitle>
              <Trophy className="h-4 w-4 text-purple-100" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{rewards.length}</div>
              <p className="text-xs text-purple-100">
                Disponibles
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-amber-100">Comportamientos</CardTitle>
              <Star className="h-4 w-4 text-amber-100" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{behaviors.length}</div>
              <p className="text-xs text-amber-100">
                Registrados
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Acciones rápidas */}
      {selectedChild && (
        <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-indigo-900">
              <Zap className="h-5 w-5" />
              Acciones rápidas
            </CardTitle>
            <CardDescription className="text-indigo-700">
              Gestiona rápidamente las actividades de {selectedChild.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href="/routines/new">
                <Button variant="outline" className="w-full justify-start border-blue-200 text-blue-700 hover:bg-blue-50">
                  <Calendar className="h-4 w-4 mr-2" />
                  Nueva Rutina
                </Button>
              </Link>
              <Link href="/habits/new">
                <Button variant="outline" className="w-full justify-start border-green-200 text-green-700 hover:bg-green-50">
                  <Target className="h-4 w-4 mr-2" />
                  Nuevo Hábito
                </Button>
              </Link>
              <Link href="/behaviors/new">
                <Button variant="outline" className="w-full justify-start border-amber-200 text-amber-700 hover:bg-amber-50">
                  <Star className="h-4 w-4 mr-2" />
                  Registro Comportamiento
                </Button>
              </Link>
              <Link href="/rewards/new">
                <Button variant="outline" className="w-full justify-start border-purple-200 text-purple-700 hover:bg-purple-50">
                  <Trophy className="h-4 w-4 mr-2" />
                  Nueva Recompensa
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rutinas de hoy */}
      {selectedChild && todayRoutines.length > 0 && (
        <Card className="bg-gradient-to-r from-cyan-50 to-blue-50 border-cyan-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-cyan-900">
              <Clock className="h-5 w-5" />
              Rutinas de hoy
            </CardTitle>
            <CardDescription className="text-cyan-700">
              Progreso de las rutinas diarias de {selectedChild.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todayRoutines.map((routine) => (
                <div key={routine.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-cyan-100">
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded-full border-2 ${completedRoutines.includes(routine.id) ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                      {completedRoutines.includes(routine.id) && (
                        <CheckCircle className="h-3 w-3 text-white" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{routine.title}</p>
                      <p className="text-sm text-gray-500">{routine.time}</p>
                    </div>
                  </div>
                  <Badge variant={completedRoutines.includes(routine.id) ? "default" : "outline"} className={completedRoutines.includes(routine.id) ? "bg-green-100 text-green-800" : ""}>
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
        <Card className="bg-gradient-to-r from-pink-50 to-purple-50 border-pink-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-pink-900">
              <Heart className="h-5 w-5" />
              Recompensas disponibles
            </CardTitle>
            <CardDescription className="text-pink-700">
              Motivación para {selectedChild.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rewards.slice(0, 3).map((reward) => (
                <div key={reward.id} className="p-4 bg-white rounded-lg border border-pink-100">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{reward.title}</h4>
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm font-medium">{reward.points_required}</span>
                    </div>
                  </div>
                  {reward.description && (
                    <p className="text-sm text-gray-600">{reward.description}</p>
                  )}
                </div>
              ))}
            </div>
            {rewards.length > 3 && (
              <div className="mt-4 text-center">
                <Link href="/rewards">
                  <Button variant="outline" className="border-pink-200 text-pink-700 hover:bg-pink-50">
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