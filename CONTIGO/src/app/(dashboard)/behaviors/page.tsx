'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/store/app-store';
import { Behavior, BehaviorRecord } from '@/types/index';
import {
  Plus,
  Star,
  TrendingUp,
  Edit,
  Trash2,
  Calendar,
  Award,
} from 'lucide-react';
import Link from 'next/link';
import BehaviorRecordModal from '@/components/behavior-record-modal';

export default function BehaviorsPage() {
  const { user, children, selectedChild, setSelectedChild } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [behaviors, setBehaviors] = useState<Behavior[]>([]);
  const [behaviorRecords, setBehaviorRecords] = useState<BehaviorRecord[]>([]);
  const [selectedBehavior, setSelectedBehavior] = useState<Behavior | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
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
      fetchBehaviors();
    }
  }, [selectedChild]);

  useEffect(() => {
    if (selectedChild && behaviors.length > 0) {
      fetchBehaviorRecords();
    }
  }, [selectedChild, behaviors]);

  const fetchBehaviors = async () => {
    if (!selectedChild) return;

    const supabase = createClient();
    const { data, error } = await supabase
      .from('behaviors')
      .select('*')
      .eq('child_id', selectedChild.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching behaviors:', error);
    } else {
      setBehaviors(data || []);
    }

    setLoading(false);
  };

  const fetchBehaviorRecords = async () => {
    if (!selectedChild) return;

    const supabase = createClient();
    const { data, error } = await supabase
      .from('behavior_records')
      .select('*')
      .in(
        'behavior_id',
        behaviors.map((b) => b.id)
      );

    if (error) {
      console.error('Error fetching behavior records:', error);
    } else {
      setBehaviorRecords(data || []);
    }
  };

  const handleOpenRecordModal = (behavior: Behavior) => {
    setSelectedBehavior(behavior);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedBehavior(null);
  };

  const handleRecordSuccess = () => {
    // Refrescar los registros de comportamientos
    fetchBehaviorRecords();
  };

  const handleDelete = async (behaviorId: string) => {
    if (
      !confirm('¿Estás seguro de que quieres eliminar este comportamiento?')
    ) {
      return;
    }

    const supabase = createClient();
    const { error } = await supabase
      .from('behaviors')
      .delete()
      .eq('id', behaviorId);

    if (error) {
      console.error('Error deleting behavior:', error);
    } else {
      setBehaviors(behaviors.filter((behavior) => behavior.id !== behaviorId));
    }
  };

  const getTodayRecords = (behaviorId: string) => {
    const today = new Date().toISOString().split('T')[0];
    return behaviorRecords.filter(
      (record) => record.behavior_id === behaviorId && record.date === today
    );
  };

  const getWeeklyRecords = (behaviorId: string) => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    return behaviorRecords.filter(
      (record) =>
        record.behavior_id === behaviorId && new Date(record.date) >= oneWeekAgo
    );
  };

  const getTotalPoints = (type: 'POSITIVE' | 'NEGATIVE') => {
    return behaviors
      .filter((b) => b.type === type)
      .reduce((total, behavior) => {
        const records = getWeeklyRecords(behavior.id);
        return total + records.length * behavior.points;
      }, 0);
  };

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  return (
    <>
      {/* Resumen de puntos */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Puntos Positivos
            </CardTitle>
            <TrendingUp className='h-4 w-4 text-green-600' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-green-600'>
              +{getTotalPoints('POSITIVE')}
            </div>
            <p className='text-xs text-muted-foreground'>Esta semana</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Puntos Negativos
            </CardTitle>
            <TrendingUp className='h-4 w-4 text-red-600' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-red-600'>
              -{getTotalPoints('NEGATIVE')}
            </div>
            <p className='text-xs text-muted-foreground'>Esta semana</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Balance Total</CardTitle>
            <Award className='h-4 w-4 text-blue-600' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-blue-600'>
              {getTotalPoints('POSITIVE') - getTotalPoints('NEGATIVE')}
            </div>
            <p className='text-xs text-muted-foreground'>Puntos disponibles</p>
          </CardContent>
        </Card>
      </div>

      {/* Registros recientes */}
      {behaviorRecords.length > 0 && (
        <Card className='mb-8'>
          <CardHeader>
            <CardTitle className='flex items-center space-x-2'>
              <Calendar className='h-5 w-5 text-blue-600' />
              <span>Registros Recientes</span>
            </CardTitle>
            <CardDescription>
              Últimos comportamientos registrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {behaviorRecords
                .sort(
                  (a, b) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime()
                )
                .slice(0, 10)
                .map((record) => {
                  const behavior = behaviors.find(
                    (b) => b.id === record.behavior_id
                  );
                  if (!behavior) return null;

                  const isToday =
                    record.date === new Date().toISOString().split('T')[0];
                  const recordDate = new Date(record.date);
                  const formattedDate = recordDate.toLocaleDateString('es-ES', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  });

                  return (
                    <div
                      key={record.id}
                      className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'
                    >
                      <div className='flex items-center space-x-3'>
                        <div
                          className={`p-2 rounded-full ${
                            behavior.type === 'POSITIVE'
                              ? 'bg-green-100'
                              : 'bg-red-100'
                          }`}
                        >
                          <Star
                            className={`h-4 w-4 ${
                              behavior.type === 'POSITIVE'
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}
                          />
                        </div>
                        <div>
                          <h4 className='font-medium text-gray-900'>
                            {behavior.title}
                          </h4>
                          <div className='flex items-center space-x-2 text-sm text-gray-500'>
                            <span>{formattedDate}</span>
                            {isToday && (
                              <Badge variant='secondary' className='text-xs'>
                                Hoy
                              </Badge>
                            )}
                          </div>
                          {record.notes && (
                            <p className='text-sm text-gray-600 mt-1'>
                              {record.notes}
                            </p>
                          )}
                        </div>
                      </div>
                      <div
                        className={`text-right ${
                          behavior.points > 0
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        <div className='font-semibold'>
                          {behavior.points > 0 ? '+' : ''}
                          {behavior.points} pts
                        </div>
                        <div className='text-xs opacity-75'>
                          {behavior.type === 'POSITIVE'
                            ? 'Positivo'
                            : 'Negativo'}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className='mb-8'>
        <div className='flex justify-between items-center'>
          <div>
            <h2 className='text-3xl font-bold text-gray-900'>
              Comportamientos de {selectedChild?.name}
            </h2>
            <p className='text-gray-600 mt-2'>
              Registro y seguimiento de comportamientos para reforzar conductas
              positivas
            </p>
          </div>
          <Link href='/behaviors/new' className='hidden md:inline-flex'>
            <Button>
              <Plus className='h-5 w-5 mr-2' />
              Nuevo Comportamiento
            </Button>
          </Link>
        </div>
      </div>

      {behaviors.length === 0 ? (
        <div className='text-center py-12'>
          <div className='mx-auto h-24 w-24 rounded-full bg-gray-100 flex items-center justify-center mb-6'>
            <Star className='h-12 w-12 text-gray-400' />
          </div>
          <h3 className='text-2xl font-bold text-gray-900 mb-4'>
            No hay comportamientos
          </h3>
          <p className='text-gray-600 mb-8'>
            Crea tu primer comportamiento para empezar a registrar conductas y
            asignar puntos.
          </p>
          <Link href='/behaviors/new'>
            <Button size='lg'>
              <Plus className='h-5 w-5 mr-2' />
              Crear primer comportamiento
            </Button>
          </Link>
        </div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-24'>
          {behaviors.map((behavior) => {
            const todayRecords = getTodayRecords(behavior.id);
            const weeklyRecords = getWeeklyRecords(behavior.id);

            return (
              <Card
                key={behavior.id}
                className='hover:shadow-lg transition-shadow'
              >
                <CardHeader>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center space-x-2'>
                      <Star className='h-5 w-5 text-blue-600' />
                      <span className='text-lg font-semibold'>
                        {behavior.title}
                      </span>
                    </div>
                    <div className='flex space-x-2'>
                      <Link href={`/behaviors/${behavior.id}/edit`}>
                        <Button variant='outline' size='sm'>
                          <Edit className='h-4 w-4' />
                        </Button>
                      </Link>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => handleDelete(behavior.id)}
                        className='text-red-600 hover:text-red-700'
                      >
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    </div>
                  </div>
                  {behavior.description && (
                    <CardDescription>{behavior.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className='space-y-4'>
                    <div className='flex items-center justify-between'>
                      <Badge
                        variant={
                          behavior.type === 'POSITIVE'
                            ? 'default'
                            : 'destructive'
                        }
                      >
                        {behavior.type === 'POSITIVE' ? 'Positivo' : 'Negativo'}
                      </Badge>
                      <div className='flex items-center space-x-2'>
                        <Award className='h-4 w-4 text-yellow-600' />
                        <span className='font-medium'>
                          {behavior.points > 0 ? '+' : ''}
                          {behavior.points} pts
                        </span>
                      </div>
                    </div>

                    <div className='grid grid-cols-2 gap-4 text-sm'>
                      <div className='text-center p-3 bg-gray-50 rounded-lg'>
                        <div className='text-lg font-semibold text-blue-600'>
                          {todayRecords.length}
                        </div>
                        <div className='text-gray-600'>Hoy</div>
                      </div>
                      <div className='text-center p-3 bg-gray-50 rounded-lg'>
                        <div className='text-lg font-semibold text-green-600'>
                          {weeklyRecords.length}
                        </div>
                        <div className='text-gray-600'>Esta semana</div>
                      </div>
                    </div>

                    <div className='pt-2'>
                      <Button
                        variant='outline'
                        className='w-full'
                        onClick={() => handleOpenRecordModal(behavior)}
                      >
                        <Calendar className='h-4 w-4 mr-2' />
                        Registrar hoy
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal para registrar comportamientos */}
      <BehaviorRecordModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        behavior={selectedBehavior}
        onSuccess={handleRecordSuccess}
      />
      {/* Botón Flotante para Móvil */}
      <div className='md:hidden'>
        <Link href='/behaviors/new'>
          <Button
            size='icon'
            className='fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-40'
          >
            <Plus className='h-6 w-6' />
            <span className='sr-only'>Crear nuevo comportamiento</span>
          </Button>
        </Link>
      </div>
    </>
  );
}
