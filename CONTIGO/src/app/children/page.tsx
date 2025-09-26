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
import { Child } from '@/types';
import { Plus, Edit, Trash2, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function ChildrenPage() {
  const { user, children, setChildren } = useAppStore();
  const [loading, setLoading] = useState(true);
  const router = useRouter();

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
      console.error('Error fetching children:', error);
    } else {
      setChildren(data || []);
    }

    setLoading(false);
  };

  const handleDelete = async (childId: string) => {
    if (
      !confirm(
        '¿Estás seguro de que quieres eliminar a este hijo? Esta acción no se puede deshacer.'
      )
    ) {
      return;
    }

    const supabase = createClient();
    const { error } = await supabase
      .from('children')
      .delete()
      .eq('id', childId);

    if (error) {
      console.error('Error deleting child:', error);
    } else {
      setChildren(children.filter((child) => child.id !== childId));
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

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }

    return age;
  };

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <div className='mb-8'>
          <h2 className='text-3xl font-bold text-gray-900'>Mis hijos</h2>
          <p className='text-gray-600 mt-2'>
            Gestiona los perfiles de tus hijos y su información personal
          </p>
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
            <Link href='/children/new'>
              <Button size='lg'>
                <Plus className='h-5 w-5 mr-2' />
                Agregar primer hijo
              </Button>
            </Link>
          </div>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {children.map((child) => (
              <Card
                key={child.id}
                className='hover:shadow-lg transition-shadow'
              >
                <CardHeader>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center space-x-3'>
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
                    </div>
                    <div className='flex space-x-2'>
                      <Link href={`/children/${child.id}/edit`}>
                        <Button variant='outline' size='sm'>
                          <Edit className='h-4 w-4' />
                        </Button>
                      </Link>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => handleDelete(child.id)}
                        className='text-red-600 hover:text-red-700'
                      >
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
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
                    <div className='pt-4'>
                      <Link href={`/dashboard?child=${child.id}`}>
                        <Button variant='outline' className='w-full'>
                          Ver dashboard
                        </Button>
                      </Link>
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
