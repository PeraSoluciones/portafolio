'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useAppStore } from '@/store/app-store';
import { Routine, Child } from '@/types';
import { Plus, Clock, Calendar, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function RoutinesPage() {
  const { user, children, selectedChild, setSelectedChild } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const router = useRouter();

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
    if (selectedChild) {
      fetchRoutines();
    }
  }, [selectedChild]);

  const fetchRoutines = async () => {
    if (!selectedChild) return;

    const supabase = createClient();
    const { data, error } = await supabase
      .from('routines')
      .select('*')
      .eq('child_id', selectedChild.id)
      .order('time', { ascending: true });

    if (error) {
      console.error('Error fetching routines:', error);
    } else {
      setRoutines(data || []);
    }

    setLoading(false);
  };

  const toggleRoutineStatus = async (routineId: string, isActive: boolean) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('routines')
      .update({ is_active: isActive })
      .eq('id', routineId);

    if (error) {
      console.error('Error updating routine:', error);
    } else {
      setRoutines(routines.map(routine =>
        routine.id === routineId ? { ...routine, is_active: isActive } : routine
      ));
    }
  };

  const handleDelete = async (routineId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta rutina?')) {
      return;
    }

    const supabase = createClient();
    const { error } = await supabase
      .from('routines')
      .delete()
      .eq('id', routineId);

    if (error) {
      console.error('Error deleting routine:', error);
    } else {
      setRoutines(routines.filter(routine => routine.id !== routineId));
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    return `${hours}:${minutes}`;
  };

  const getDayLabel = (day: string) => {
    const dayLabels: { [key: string]: string } = {
      'LUN': 'Lun',
      'MAR': 'Mar',
      'MIÉ': 'Mié',
      'JUE': 'Jue',
      'VIE': 'Vie',
      'SÁB': 'Sáb',
      'DOM': 'Dom',
    };
    return dayLabels[day] || day;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Selector de hijo */}
        {children.length > 1 && (
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
                      <div>
                        <h3 className="font-medium text-gray-900">{child.name}</h3>
                        <p className="text-sm text-gray-500">{child.age} años</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            Rutinas de {selectedChild?.name}
          </h2>
          <p className="text-gray-600 mt-2">
            Gestiona las rutinas diarias para mantener estructura y organización
          </p>
        </div>

        {routines.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto h-24 w-24 rounded-full bg-gray-100 flex items-center justify-center mb-6">
              <Calendar className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">No hay rutinas</h3>
            <p className="text-gray-600 mb-8">
              Crea tu primera rutina para establecer horarios y actividades diarias.
            </p>
            <Link href="/routines/new">
              <Button size="lg">
                <Plus className="h-5 w-5 mr-2" />
                Crear primera rutina
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {routines.map((routine) => (
              <Card key={routine.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-5 w-5 text-blue-600" />
                      <span className="text-lg font-semibold">{formatTime(routine.time)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={routine.is_active}
                        onCheckedChange={(checked) => toggleRoutineStatus(routine.id, checked)}
                      />
                      <div className="flex space-x-2">
                        <Link href={`/routines/${routine.id}/edit`}>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(routine.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <CardTitle className="text-xl">{routine.title}</CardTitle>
                  {routine.description && (
                    <CardDescription>{routine.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Días de la semana</p>
                      <div className="flex flex-wrap gap-2">
                        {routine.days.map((day) => (
                          <Badge key={day} variant="outline">
                            {getDayLabel(day)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="pt-2">
                      <Badge variant={routine.is_active ? 'default' : 'secondary'}>
                        {routine.is_active ? 'Activa' : 'Inactiva'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}