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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAppStore } from '@/store/app-store';
import { Plus, Edit, Trash2, Calendar } from 'lucide-react';
import Link from 'next/link';
import { deleteAvatar } from '@/lib/supabase/storage';
import { calculateAge } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { AlertModal } from '@/components/ui/alert-modal';

export default function ChildrenPage() {
  const { user, children, setChildren, setSelectedChild } = useAppStore();
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    fetchChildren();
  }, [user, router]);

  const fetchChildren = async () => {
    if (!user) return;

    const supabase = createClient();
    const { data, error } = await supabase
      .from('children')
      .select('*')
      .eq('parent_id', user.id)
      .order('created_at', { ascending: true });

    if (error) {
      toast({
        title: 'Error al cargar hijos',
        description: `No se pudieron cargar los hijos ${error.message}`,
        variant: 'destructive',
      });
    } else {
      setChildren(data || []);
    }

    setLoading(false);
  };

  const handleDelete = async (childId: string) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('children')
      .delete()
      .eq('id', childId)
      .select();

    if (error) {
      toast({
        title: 'Error al eliminar hijo',
        description: `No se pudo eliminar el hijo ${error.message}`,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Hijo eliminado',
        description: 'El hijo ha sido eliminado correctamente.',
        variant: 'success',
      });
      setChildren(children.filter((child) => child.id !== childId));
      setSelectedChild(children[0] || null);
      deleteAvatar(data[0].avatar_url);
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

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  return (
    <>
      <div className='mb-8'>
        <div className='flex justify-between items-center'>
          <div>
            <h2 className='text-3xl font-bold text-gray-900'>Mis hijos</h2>
            <p className='text-gray-600 mt-2'>
              Gestiona los perfiles de tus hijos y su información personal
            </p>
          </div>
          {children.length > 0 && (
            <Link href='/children/new' className='hidden md:inline-flex'>
              <Button>
                <Plus className='h-5 w-5 mr-2' />
                Agregar hijo
              </Button>
            </Link>
          )}
        </div>
      </div>

      {children.length === 0 ? (
        <div className='text-center py-12'>
          <div className='mx-auto h-24 w-24 rounded-full bg-gray-100 flex items-center justify-center mb-6'>
            <Calendar className='h-12 w-12 text-gray-400' />
          </div>
          <h3 className='text-2xl font-bold text-gray-900 mb-4'>
            No hay hijos registrados
          </h3>
          <p className='text-gray-600 mb-8'>
            Agrega a tu primer hijo para empezar a crear rutinas y hábitos
            personalizados.
          </p>
          <Link href='/children/new' className='hidden md:inline-flex'>
            <Button size='lg'>
              <Plus className='h-5 w-5 mr-2' />
              Agregar primer hijo
            </Button>
          </Link>
        </div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-24'>
          {children.map((child) => (
            <Card
              key={child.id}
              className='h-full transition-all duration-200 group-hover:shadow-lg group-hover:border-primary cursor-pointer'
            >
              <CardHeader>
                <div className='flex items-center justify-between'>
                  <Link
                    href={`/dashboard/?child=${child.id}`}
                    className='flex items-center space-x-3'
                  >
                    <Avatar className='h-12 w-12'>
                      <AvatarImage src={child.avatar_url} />
                      <AvatarFallback className='text-lg'>
                        {child.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className='text-lg'>{child.name}</CardTitle>
                      <CardDescription>
                        {calculateAge(child.birth_date)} años
                      </CardDescription>
                    </div>
                  </Link>
                  <div className='flex space-x-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      className='opacity-50 group-hover:opacity-100 transition-opacity'
                      aria-label={`Editar perfil de ${child.name}`}
                      onClick={() => {
                        router.push(`/children/${child.id}/edit`);
                      }}
                    >
                      <Edit className='h-4 w-4' />
                    </Button>
                    <AlertModal
                      title='Eliminar hijo'
                      description={`¿Estás seguro de eliminar el hijo ${child.name}?. Todos los registros de ${child.name} se perderán.`}
                      actionText='Eliminar'
                      onClick={() => handleDelete(child.id)}
                      className='bg-red-600 hover:bg-red-700'
                    >
                      <Button
                        variant='outline'
                        size='sm'
                        className='text-red-600 hover:text-red-700 opacity-50 group-hover:opacity-100 transition-opacity'
                        aria-label={`Eliminar perfil de ${child.name}`}
                      >
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    </AlertModal>
                  </div>
                </div>
              </CardHeader>
              <Link href={`/dashboard/?child=${child.id}`}>
                <CardContent>
                  <div className='space-y-3'>
                    <div>
                      <p className='text-sm text-gray-500'>Tipo de TDAH</p>
                      <Badge variant='secondary'>
                        {getADHDTypeLabel(child.adhd_type)}
                      </Badge>
                    </div>
                    <div>
                      <p className='text-sm text-gray-500'>
                        Fecha de nacimiento
                      </p>
                      <p className='font-medium'>
                        {new Date(child.birth_date).toLocaleDateString(
                          'es-ES',
                          {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            timeZone: 'UTC',
                          }
                        )}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>
      )}
      {/* Botón Flotante para Móvil */}
      <div className='md:hidden'>
        <Link href='/children/new'>
          <Button
            size='icon'
            className='fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-40'
          >
            <Plus className='h-6 w-6' />
            <span className='sr-only'>Agregar hijo</span>
          </Button>
        </Link>
      </div>
    </>
  );
}
