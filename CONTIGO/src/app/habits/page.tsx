'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAppStore } from '@/store/app-store';
import { Habit, HabitRecord, Child } from '@/types';
import { Plus, Target, TrendingUp, Edit, Trash2, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function HabitsPage() {
  const { user, children, selectedChild, setSelectedChild } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitRecords, setHabitRecords] = useState<HabitRecord[]>([]);
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
      fetchHabits();
      fetchHabitRecords();
    }
  }, [selectedChild]);

  const fetchHabits = async () => {
    if (!selectedChild) return;

    const supabase = createClient();
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('child_id', selectedChild.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching habits:', error);
    } else {
      setHabits(data || []);
    }

    setLoading(false);
  };

  const fetchHabitRecords = async () => {
    if (!selectedChild) return;

    const supabase = createClient();
    const { data, error } = await supabase
      .from('habit_records')
      .select('*')
      .in('habit_id', habits.map(h => h.id));

    if (error) {
      console.error('Error fetching habit records:', error);
    } else {
      setHabitRecords(data || []);
    }
  };

  const handleDelete = async (habitId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este hábito?')) {
      return;
    }

    const supabase = createClient();
    const { error } = await supabase
      .from('habits')
      .delete()
      .eq('id', habitId);

    if (error) {
      console.error('Error deleting habit:', error);
    } else {
      setHabits(habits.filter(habit => habit.id !== habitId));
    }
  };

  const getHabitProgress = (habit: Habit) => {
    const today = new Date().toISOString().split('T')[0];
    const todayRecord = habitRecords.find(record => 
      record.habit_id === habit.id && record.date === today
    );
    
    if (!todayRecord) return 0;
    
    return Math.min((todayRecord.value / habit.target_frequency) * 100, 100);
  };

  const getTodayValue = (habit: Habit) => {
    const today = new Date().toISOString().split('T')[0];
    const todayRecord = habitRecords.find(record => 
      record.habit_id === habit.id && record.date === today
    );
    
    return todayRecord?.value || 0;
  };

  const getCategoryLabel = (category: string) => {
    const labels: { [key: string]: string } = {
      'SLEEP': 'Sueño',
      'NUTRITION': 'Nutrición',
      'EXERCISE': 'Ejercicio',
      'HYGIENE': 'Higiene',
      'SOCIAL': 'Social',
    };
    return labels[category] || category;
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'SLEEP': 'bg-blue-100 text-blue-800',
      'NUTRITION': 'bg-green-100 text-green-800',
      'EXERCISE': 'bg-orange-100 text-orange-800',
      'HYGIENE': 'bg-purple-100 text-purple-800',
      'SOCIAL': 'bg-pink-100 text-pink-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
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
              <nav className="ml-10 flex space-x-8">
                <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                  Dashboard
                </Link>
                <Link href="/children" className="text-gray-600 hover:text-gray-900">
                  Hijos
                </Link>
                <Link href="/routines" className="text-gray-600 hover:text-gray-900">
                  Rutinas
                </Link>
                <Link href="/habits" className="text-blue-600 font-medium">
                  Hábitos
                </Link>
              </nav>
            </div>
            <Link href="/habits/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo hábito
              </Button>
            </Link>
          </div>
        </div>
      </header>

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
            Hábitos de {selectedChild?.name}
          </h2>
          <p className="text-gray-600 mt-2">
            Seguimiento de hábitos saludables y desarrollo de rutinas positivas
          </p>
        </div>

        {habits.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto h-24 w-24 rounded-full bg-gray-100 flex items-center justify-center mb-6">
              <Target className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">No hay hábitos</h3>
            <p className="text-gray-600 mb-8">
              Crea tu primer hábito para empezar a seguir las rutinas saludables.
            </p>
            <Link href="/habits/new">
              <Button size="lg">
                <Plus className="h-5 w-5 mr-2" />
                Crear primer hábito
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {habits.map((habit) => {
              const progress = getHabitProgress(habit);
              const todayValue = getTodayValue(habit);
              
              return (
                <Card key={habit.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Target className="h-5 w-5 text-green-600" />
                        <span className="text-lg font-semibold">{habit.title}</span>
                      </div>
                      <div className="flex space-x-2">
                        <Link href={`/habits/${habit.id}/edit`}>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(habit.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {habit.description && (
                      <CardDescription>{habit.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Badge className={getCategoryColor(habit.category)}>
                          {getCategoryLabel(habit.category)}
                        </Badge>
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium">
                            {todayValue}/{habit.target_frequency} {habit.unit}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progreso hoy</span>
                          <span>{Math.round(progress)}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center space-x-2">
                          {progress >= 100 ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                          )}
                          <span className="text-sm text-gray-600">
                            {progress >= 100 ? '¡Objetivo alcanzado!' : 'En progreso'}
                          </span>
                        </div>
                        <Button variant="outline" size="sm">
                          Registrar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}