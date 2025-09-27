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
        updated_at: authUser.updated_at || '',
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-50">
      <div className="w-full h-full p-8 overflow-auto">
        {selectedChild ? (
          <>
            {/* Saludo personalizado al usuario */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground">
                ¡Hola, {user?.full_name || user?.email?.split('@')[0] || 'Usuario'}!
              </h1>
              <p className="text-muted-foreground mt-2">
                Bienvenido/a a tu dashboard. Aquí puedes gestionar las rutinas, hábitos y comportamientos de {selectedChild.name}.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Rutinas */}
            <Card className="transition-all duration-200 hover:shadow-lg border-t-4 border-t-secondary">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-foreground">
                  <Calendar className="h-5 w-5 text-secondary" />
                  <span>Rutinas</span>
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Rutinas activas para {selectedChild.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {routines.length > 0 ? (
                  <div className="space-y-4">
                    {routines.slice(0, 2).map((routine) => (
                      <div key={routine.id} className="flex items-center justify-between pb-3 border-b border-border/50">
                        <div>
                          <p className="font-medium text-foreground">{routine.title}</p>
                          <p className="text-sm text-muted-foreground">{routine.time}</p>
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
                      <Button variant="outline" className="w-full mt-2">
                        Ver todas
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm mb-3">No hay rutinas</p>
                    <Link href="/routines/new">
                      <Button size="sm">Crear</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Hábitos */}
            <Card className="transition-all duration-200 hover:shadow-lg border-t-4 border-t-chart-5">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-foreground">
                  <Target className="h-5 w-5 text-chart-5" />
                  <span>Hábitos</span>
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Hábitos de {selectedChild.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {habits.length > 0 ? (
                  <div className="space-y-4">
                    {habits.slice(0, 2).map((habit) => (
                      <div key={habit.id} className="flex items-center justify-between pb-3 border-b border-border/50">
                        <div>
                          <p className="font-medium text-foreground">{habit.title}</p>
                          <p className="text-sm text-muted-foreground">{habit.target_frequency} {habit.unit}</p>
                        </div>
                        <Badge variant="secondary">{habit.category}</Badge>
                      </div>
                    ))}
                    <Link href="/habits">
                      <Button variant="outline" className="w-full mt-2">
                        Ver todos
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Target className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm mb-3">No hay hábitos</p>
                    <Link href="/habits/new">
                      <Button size="sm">Crear</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Comportamientos */}
            <Card className="transition-all duration-200 hover:shadow-lg border-t-4 border-t-accent">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-foreground">
                  <Star className="h-5 w-5 text-accent" />
                  <span>Comportamientos</span>
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Seguimiento de conductas
                </CardDescription>
              </CardHeader>
              <CardContent>
                {behaviors.length > 0 ? (
                  <div className="space-y-4">
                    {behaviors.slice(0, 2).map((behavior) => (
                      <div key={behavior.id} className="flex items-center justify-between pb-3 border-b border-border/50">
                        <div>
                          <p className="font-medium text-foreground">{behavior.title}</p>
                          <p className="text-sm text-muted-foreground">{behavior.points} pts</p>
                        </div>
                        <Badge variant={behavior.type === 'POSITIVE' ? 'default' : 'destructive'}>
                          {behavior.type === 'POSITIVE' ? '+' : ''}{behavior.points}
                        </Badge>
                      </div>
                    ))}
                    <Link href="/behaviors">
                      <Button variant="outline" className="w-full mt-2">
                        Ver todos
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Star className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm mb-3">No hay conductas</p>
                    <Link href="/behaviors/new">
                      <Button size="sm">Crear</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recursos Educativos */}
            <Card className="transition-all duration-200 hover:shadow-lg border-t-4 border-t-destructive">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-foreground">
                  <BookOpen className="h-5 w-5 text-destructive" />
                  <span>Recursos</span>
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Consejos y guías para padres
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                    <h4 className="font-medium text-primary text-sm">Rutinas Efectivas</h4>
                    <p className="text-muted-foreground text-xs mt-1">
                      Establece horarios consistentes para mejorar la organización
                    </p>
                  </div>
                  <div className="p-4 bg-secondary/5 rounded-lg border border-secondary/10">
                    <h4 className="font-medium text-secondary-foreground text-sm">Sueño y Descanso</h4>
                    <p className="text-muted-foreground text-xs mt-1">
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
          </>
        ) : (
          <div className="text-center py-16 max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-foreground mb-6">Bienvenido a CONTIGO</h2>
            <p className="text-muted-foreground mb-10 text-lg">
              Para empezar, agrega a tus hijos y comienza a crear rutinas y hábitos personalizados.
            </p>
            <Link href="/children/new">
              <Button size="lg" className="px-8">Agregar primer hijo</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
