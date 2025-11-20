'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
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
  BadgeAlert,
} from 'lucide-react';
import Link from 'next/link';
import BehaviorRecordModal from '@/components/behavior-record-modal';
import { useToast } from '@/hooks/use-toast';
import { AlertModal } from '@/components/ui/alert-modal';

export default function BehaviorsPage() {
  const { user, children, selectedChild, setSelectedChild } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [behaviors, setBehaviors] = useState<Behavior[]>([]);
  const [behaviorRecords, setBehaviorRecords] = useState<BehaviorRecord[]>([]);
  const [selectedBehavior, setSelectedBehavior] = useState<Behavior | null>(
    null
  );
  const [selectedRecord, setSelectedRecord] = useState<BehaviorRecord | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();
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

    const supabase = createBrowserClient();
    const { data, error } = await supabase
      .from('behaviors')
      .select('*')
      .eq('child_id', selectedChild.id)
      .order('created_at', { ascending: true });

    if (error) {
      toast({
        title: 'Error al cargar comportamientos',
        description: 'No se pudieron cargar los comportamientos',
        variant: 'destructive',
      });
    } else {
      setBehaviors(data || []);
    }

    setLoading(false);
  };

  const fetchBehaviorRecords = async () => {
    if (!selectedChild) return;

    const supabase = createBrowserClient();
    const { data, error } = await supabase
      .from('behavior_records')
      .select('*')
      .in(
        'behavior_id',
        behaviors.map((b) => b.id)
      );

    if (error) {
      toast({
        title: 'Error al cargar registros de comportamientos',
        description: 'No se pudieron cargar los registros de comportamientos',
        variant: 'destructive',
      });
    } else {
      setBehaviorRecords(data || []);
    }
  };

  const handleOpenRecordModal = (behavior: Behavior) => {
    setSelectedBehavior(behavior);
    setSelectedRecord(null); // Limpiar el registro seleccionado para crear uno nuevo
    setIsModalOpen(true);
  };

  const handleEditRecordModal = (
    record: BehaviorRecord,
    behavior: Behavior
  ) => {
    setSelectedBehavior(behavior);
    setSelectedRecord(record); // Establecer el registro a editar
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedBehavior(null);
    setSelectedRecord(null);
  };

  const handleRecordSuccess = () => {
    // Refrescar los registros de comportamientos
    fetchBehaviorRecords();
  };

  const handleDeleteRecord = async (recordId: string) => {
    const supabase = createBrowserClient();
    const { error } = await supabase
      .from('behavior_records')
      .delete()
      .eq('id', recordId);

    if (error) {
      toast({
        title: 'Error al eliminar el registro',
        description: 'Por favor, intenta nuevamente.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Registro eliminado',
        description: 'El registro ha sido eliminado correctamente.',
        variant: 'success',
      });
      setBehaviorRecords(
        behaviorRecords.filter((record) => record.id !== recordId)
      );
    }
  };

  const handleDelete = async (behaviorId: string) => {
    const supabase = createBrowserClient();
    const { error } = await supabase
      .from('behaviors')
      .delete()
      .eq('id', behaviorId);

    if (error) {
      toast({
        title: 'Error al eliminar el comportamiento',
        description: 'Por favor, intenta nuevamente.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Comportamiento eliminado',
        description: 'El comportamiento ha sido eliminado correctamente.',
        variant: 'success',
      });
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
        return total + records.length * behavior.points_value;
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
        <Card className='mb-8' data-testid="recent-records">
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
                    record.date ===
                    new Date().toLocaleDateString('en-CA', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      timeZone: 'America/Guayaquil',
                    });
                  const recordDate = new Date(record.date.split('-').join(','));

                  const formattedDate = recordDate.toLocaleDateString('es-EC', {
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
                      <div className='flex items-center space-x-3'>
                        <div
                          className={`text-right ${
                            behavior.type === 'POSITIVE'
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}
                          data-testid="behavior-points"
                        >
                          <div className='font-semibold'>
                            {behavior.type === 'POSITIVE' ? '+' : '-'}
                            {behavior.points_value} pts
                          </div>
                          <div className='text-xs opacity-75'>
                            {behavior.type === 'POSITIVE'
                              ? 'Positivo'
                              : 'Negativo'}
                          </div>
                        </div>
                        <Button
                          variant='ghost'
                          size='sm'
                          className='text-blue-600 hover:text-blue-700 hover:bg-blue-50'
                          onClick={() =>
                            handleEditRecordModal(record, behavior)
                          }
                        >
                          <Edit className='h-4 w-4' />
                        </Button>
                        <AlertModal
                          title='¿Estás seguro de que quieres eliminar este
                                registro?'
                          description='Esta acción no se puede deshacer. El registro se
                                eliminará permanentemente de la base de datos.'
                          actionText='Eliminar'
                          onClick={() => handleDeleteRecord(record.id)}
                          className='bg-red-600 hover:bg-red-700'
                        >
                          <Button
                            variant='ghost'
                            size='sm'
                            className='text-red-600 hover:text-red-700 hover:bg-red-50'
                          >
                            <Trash2 className='h-4 w-4' />
                          </Button>
                        </AlertModal>
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
                data-testid="behavior-card"
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
                      <AlertModal
                        title='¿Estas seguro de que quieres eliminar este comportamiento?'
                        description='Esta accion no se puede deshacer. El comportamiento se eliminara permanentemente de la base de datos.'
                        actionText='Eliminar'
                        onClick={() => handleDelete(behavior.id)}
                        className='bg-red-600 hover:bg-red-700'
                      >
                        <Button
                          variant='outline'
                          size='sm'
                          className='text-red-600 hover:text-red-700'
                        >
                          <Trash2 className='h-4 w-4' />
                        </Button>
                      </AlertModal>
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
                        {behavior.type === 'POSITIVE' ? (
                          <Award className='h-4 w-4 text-green-600' />
                        ) : (
                          <BadgeAlert className='h-4 w-4 text-red-600' />
                        )}
                        <span className='font-medium' data-testid="behavior-points">
                          {behavior.type === 'POSITIVE' ? '+' : '-'}
                          {behavior.points_value} pts
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

      {/* Modal para registrar/editar comportamientos */}
      <BehaviorRecordModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        behavior={selectedBehavior}
        behaviorRecord={selectedRecord}
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
