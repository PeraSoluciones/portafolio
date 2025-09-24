'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAppStore } from '@/store/app-store';
import { Child, Routine, Habit, Behavior } from '@/types';
import { Calendar, Clock, Star, Target, Plus, LogOut, BookOpen } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, children, selectedChild, setUser, setChildren, setSelectedChild, clearStore } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [behaviors, setBehaviors] = useState<Behavior[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      const supabase = createClient();
      
      // Verificar sesión
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authUser) {
        router.push('/login');
        return;
      }

      // Actualizar usuario en el store
      setUser({
        id: authUser.id,
        email: authUser.email!,
        full_name: authUser.user_metadata?.full_name || '',
        avatar_url: authUser.user_metadata?.avatar_url,
        created_at: authUser.created_at,
        updated_at: authUser.updated_at,
      });

      // Obtener hijos
      const { data: childrenData, error: childrenError } = await supabase
        .from('children')
        .select('*')
        .eq('parent_id', authUser.id);

      if (childrenError) {
        console.error('Error fetching children:', childrenError);
      } else {
        setChildren(childrenData || []);
        if (childrenData && childrenData.length > 0 && !selectedChild) {
          setSelectedChild(childrenData[0]);
        }
      }

      setLoading(false);
    };

    fetchUserData();
  }, [router, setUser, setChildren, setSelectedChild, selectedChild]);

  useEffect(() => {
    if (selectedChild) {
      fetchChildData();
    }
  }, [selectedChild]);

  const fetchChildData = async () => {
    if (!selectedChild) return;

    const supabase = createClient();
    
    // Obtener rutinas
    const { data: routinesData } = await supabase
      .from('routines')
      .select('*')
      .eq('child_id', selectedChild.id)
      .eq('is_active', true);

    setRoutines(routinesData || []);

    // Obtener hábitos
    const { data: habitsData } = await supabase
      .from('habits')
      .select('*')
      .eq('child_id', selectedChild.id);

    setHabits(habitsData || []);

    // Obtener comportamientos
    const { data: behaviorsData } = await supabase
      .from('behaviors')
      .select('*')
      .eq('child_id', selectedChild.id);

    setBehaviors(behaviorsData || []);
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    clearStore();
    router.push('/login');
  };

  const getADHDTypeLabel = (type: string) => {
    switch (type) {
      case 'INATTENTIVE': return 'Inatento';
      case 'HYPERACTIVE': return 'Hiperactivo';
      case 'COMBINED': return 'Combinado';
      default: return type;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">CONTIGO</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.avatar_url} />
                  <AvatarFallback>{user?.full_name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-gray-700">{user?.full_name}</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Selector de hijos */}
        {children.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Selecciona un hijo</h2>
            <div className="flex flex-wrap gap-4">
              {children.map((child) => (
                <Card
                  key={child.id}
                  className={`cursor-pointer transition-all ${
                    selectedChild?.id === child.id ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-md'
                  }`}
                  onClick={() => setSelectedChild(child)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={child.avatar_url} />
                        <AvatarFallback>{child.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium text-gray-900">{child.name}</h3>
                        <p className="text-sm text-gray-500">{child.age} años</p>
                        <Badge variant="secondary" className="mt-1">
                          {getADHDTypeLabel(child.adhd_type)}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              <Link href="/children/new">
                <Card className="cursor-pointer hover:shadow-md border-dashed border-2 border-gray-300">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <Plus className="h-5 w-5 text-gray-500" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Agregar hijo</h3>
                        <p className="text-sm text-gray-500">Añadir un nuevo perfil</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        )}

        {selectedChild ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Rutinas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Rutinas</span>
                </CardTitle>
                <CardDescription>
                  Rutinas activas para {selectedChild.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {routines.length > 0 ? (
                  <div className="space-y-3">
                    {routines.slice(0, 2).map((routine) => (
                      <div key={routine.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{routine.title}</p>
                          <p className="text-sm text-gray-500">{routine.time}</p>
                        </div>
                        <div className="flex space-x-1">
                          {routine.days.slice(0, 2).map((day) => (
                            <Badge key={day} variant="outline" className="text-xs">
                              {day}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                    <Link href="/routines">
                      <Button variant="outline" className="w-full mt-4">
                        Ver todas
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm mb-2">No hay rutinas</p>
                    <Link href="/routines/new">
                      <Button size="sm">Crear</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Hábitos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5" />
                  <span>Hábitos</span>
                </CardTitle>
                <CardDescription>
                  Hábitos de {selectedChild.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {habits.length > 0 ? (
                  <div className="space-y-3">
                    {habits.slice(0, 2).map((habit) => (
                      <div key={habit.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{habit.title}</p>
                          <p className="text-sm text-gray-500">{habit.target_frequency} {habit.unit}</p>
                        </div>
                        <Badge variant="secondary">{habit.category}</Badge>
                      </div>
                    ))}
                    <Link href="/habits">
                      <Button variant="outline" className="w-full mt-4">
                        Ver todos
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Target className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm mb-2">No hay hábitos</p>
                    <Link href="/habits/new">
                      <Button size="sm">Crear</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Comportamientos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Star className="h-5 w-5" />
                  <span>Comportamientos</span>
                </CardTitle>
                <CardDescription>
                  Seguimiento de conductas
                </CardDescription>
              </CardHeader>
              <CardContent>
                {behaviors.length > 0 ? (
                  <div className="space-y-3">
                    {behaviors.slice(0, 2).map((behavior) => (
                      <div key={behavior.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{behavior.title}</p>
                          <p className="text-sm text-gray-500">{behavior.points} pts</p>
                        </div>
                        <Badge variant={behavior.type === 'POSITIVE' ? 'default' : 'destructive'}>
                          {behavior.type === 'POSITIVE' ? '+' : ''}{behavior.points}
                        </Badge>
                      </div>
                    ))}
                    <Link href="/behaviors">
                      <Button variant="outline" className="w-full mt-4">
                        Ver todos
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Star className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm mb-2">No hay conductas</p>
                    <Link href="/behaviors/new">
                      <Button size="sm">Crear</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recursos Educativos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BookOpen className="h-5 w-5" />
                  <span>Recursos</span>
                </CardTitle>
                <CardDescription>
                  Consejos y guías para padres
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900 text-sm">Rutinas Efectivas</h4>
                    <p className="text-blue-700 text-xs mt-1">
                      Establece horarios consistentes para mejorar la organización
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-green-900 text-sm">Sueño y Descanso</h4>
                    <p className="text-green-700 text-xs mt-1">
                      La importancia del descanso adecuado para niños con TDAH
                    </p>
                  </div>
                  <Link href="/resources">
                    <Button variant="outline" className="w-full">
                      Ver todos los recursos
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Bienvenido a CONTIGO</h2>
            <p className="text-gray-600 mb-8">
              Para empezar, agrega a tus hijos y comienza a crear rutinas y hábitos personalizados.
            </p>
            <Link href="/children/new">
              <Button size="lg">Agregar primer hijo</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}