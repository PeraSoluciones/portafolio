'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAppStore } from '@/store/app-store';
import { ArrowLeft, User, Save } from 'lucide-react';
import Link from 'next/link';
import { Child } from '@/types';

const adhdTypes = [
  {
    value: 'INATTENTIVE',
    label: 'Inatento',
    description: 'Dificultad para prestar atención',
  },
  {
    value: 'HYPERACTIVE',
    label: 'Hiperactivo',
    description: 'Exceso de actividad e impulsividad',
  },
  {
    value: 'COMBINED',
    label: 'Combinado',
    description: 'Combinación de inatento e hiperactivo',
  },
];

export default function EditChildPage() {
  const { user } = useAppStore();
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    birth_date: '',
    adhd_type: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingChild, setLoadingChild] = useState(true);
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (params.id) {
      fetchChild();
    }
  }, [user, params.id, router]);

  const fetchChild = async () => {
    if (!params.id) return;

    setLoadingChild(true);
    const supabase = createClient();

    const { data, error } = await supabase
      .from('children')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) {
      console.error('Error fetching child:', error);
      setError('No se encontró el hijo solicitado');
      setLoadingChild(false);
      return;
    }

    if (data) {
      setFormData({
        name: data.name,
        age: data.age.toString(),
        birth_date: data.birth_date,
        adhd_type: data.adhd_type,
      });
    }

    setLoadingChild(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!user) {
      setError('Debes iniciar sesión para editar un hijo');
      setIsLoading(false);
      return;
    }

    if (!params.id) {
      setError('No se especificó el hijo a editar');
      setIsLoading(false);
      return;
    }

    try {
      const supabase = createClient();

      const { error: updateError } = await supabase
        .from('children')
        .update({
          name: formData.name,
          age: parseInt(formData.age),
          birth_date: formData.birth_date,
          adhd_type: formData.adhd_type,
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.id);

      if (updateError) {
        setError(updateError.message);
        return;
      }

      // Redirigir a la página de hijos
      router.push('/children');
    } catch (err) {
      setError('Ocurrió un error inesperado');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (!user) {
    router.push('/login');
    return null;
  }

  if (loadingChild) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  if (error && !formData.name) {
    return (
      <div className='min-h-screen bg-gray-50'>
        <div className='max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
          <Card>
            <CardContent className='p-6'>
              <div className='text-center'>
                <h2 className='text-2xl font-bold text-red-600 mb-4'>Error</h2>
                <p className='text-gray-600 mb-6'>{error}</p>
                <Link href='/children'>
                  <Button>Volver a hijos</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Header */}
      <header className='bg-white shadow-sm border-b'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex items-center h-16'>
            <div className='flex items-center'>
              <h1 className='text-2xl font-bold text-gray-900'>CONTIGO</h1>
              <nav className='ml-10 flex space-x-8'>
                <Link
                  href='/dashboard'
                  className='text-gray-600 hover:text-gray-900'
                >
                  Dashboard
                </Link>
                <Link href='/children' className='text-blue-600 font-medium'>
                  Hijos
                </Link>
                <Link
                  href='/routines'
                  className='text-gray-600 hover:text-gray-900'
                >
                  Rutinas
                </Link>
                <Link
                  href='/habits'
                  className='text-gray-600 hover:text-gray-900'
                >
                  Hábitos
                </Link>
                <Link
                  href='/behaviors'
                  className='text-gray-600 hover:text-gray-900'
                >
                  Comportamientos
                </Link>
                <Link
                  href='/rewards'
                  className='text-gray-600 hover:text-gray-900'
                >
                  Recompensas
                </Link>
              </nav>
            </div>
          </div>
        </div>
      </header>

      <div className='max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <div className='mb-8'>
          <Link
            href='/children'
            className='inline-flex items-center text-gray-600 hover:text-gray-900 mb-4'
          >
            <ArrowLeft className='h-4 w-4 mr-2' />
            Volver a hijos
          </Link>
          <h2 className='text-3xl font-bold text-gray-900'>Editar hijo</h2>
          <p className='text-gray-600 mt-2'>
            Modifica la información de tu hijo
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className='flex items-center space-x-2'>
              <User className='h-5 w-5' />
              <span>Información del hijo</span>
            </CardTitle>
            <CardDescription>
              Modifica los datos de tu hijo para personalizar su experiencia
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className='space-y-6'>
              <div className='space-y-2'>
                <Label htmlFor='name'>Nombre completo</Label>
                <Input
                  id='name'
                  type='text'
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                  placeholder='Ej: Juan Pérez'
                />
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='age'>Edad</Label>
                  <Input
                    id='age'
                    type='number'
                    value={formData.age}
                    onChange={(e) => handleInputChange('age', e.target.value)}
                    required
                    min='1'
                    max='17'
                    placeholder='8'
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='birth_date'>Fecha de nacimiento</Label>
                  <Input
                    id='birth_date'
                    type='date'
                    value={formData.birth_date}
                    onChange={(e) =>
                      handleInputChange('birth_date', e.target.value)
                    }
                    required
                  />
                </div>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='adhd_type'>Tipo de TDAH</Label>
                <Select
                  value={formData.adhd_type}
                  onValueChange={(value) =>
                    handleInputChange('adhd_type', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Selecciona el tipo de TDAH' />
                  </SelectTrigger>
                  <SelectContent>
                    {adhdTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div>
                          <div className='font-medium'>{type.label}</div>
                          <div className='text-xs text-gray-500'>
                            {type.description}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className='p-4 bg-blue-50 rounded-lg'>
                <h4 className='font-medium text-blue-900 mb-2'>
                  Información sobre tipos de TDAH:
                </h4>
                <div className='text-sm text-blue-800 space-y-2'>
                  <div>
                    <strong>Inatento:</strong> Dificultad para mantener la
                    atención, sigue instrucciones, organización.
                  </div>
                  <div>
                    <strong>Hiperactivo:</strong> Exceso de movimiento,
                    dificultad para estar quieto, impulsividad.
                  </div>
                  <div>
                    <strong>Combinado:</strong> Presenta características de
                    ambos tipos.
                  </div>
                </div>
              </div>

              {error && (
                <Alert variant='destructive'>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className='flex justify-end space-x-4'>
                <Link href='/children'>
                  <Button variant='outline'>Cancelar</Button>
                </Link>
                <Button type='submit' disabled={isLoading}>
                  <Save className='h-4 w-4 mr-2' />
                  {isLoading ? 'Guardando...' : 'Guardar cambios'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
