'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import { useAppStore } from '@/store/app-store';

export default function VerifySessionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser, setChildren } = useAppStore();
  const [isVerifying, setIsVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifySession = async () => {
      try {
        const supabase = createBrowserClient();

        // Obtener la sesión actual
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          // Manejar específicamente el error AuthSessionMissingError
          if (sessionError.message?.includes('Auth session missing')) {
            router.push('/login');
            return;
          }

          setError('Error al verificar la sesión');
          return;
        }

        if (!session?.user) {
          router.push('/login');
          return;
        }

        // Establecer los datos del usuario
        const userData = {
          id: session.user.id,
          email: session.user.email!,
          full_name: session.user.user_metadata?.full_name || '',
          avatar_url: session.user.user_metadata?.avatar_url,
          created_at: session.user.created_at,
          updated_at: session.user.updated_at || session.user.created_at,
        };

        setUser(userData);

        // Cargar los hijos del usuario
        const { data: children, error: childrenError } = await supabase
          .from('children')
          .select('*')
          .eq('parent_id', session.user.id)
          .order('created_at', { ascending: true });

        if (!childrenError) {
          setChildren(children || []);
        }

        // Redirigir al dashboard o a la página especificada
        const redirectTo = searchParams.get('redirect') || '/dashboard';
        router.push(redirectTo);
      } catch (err) {
        setError('Ocurrió un error inesperado');
      } finally {
        setIsVerifying(false);
      }
    };

    verifySession();
  }, [router, searchParams, setUser, setChildren]);

  if (error) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100 p-4'>
        <div className='text-center'>
          <div className='mb-4'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto'></div>
          </div>
          <h1 className='text-xl font-semibold text-gray-900 mb-2'>
            Error de verificación
          </h1>
          <p className='text-gray-600 mb-4'>{error}</p>
          <button
            onClick={() => router.push('/login')}
            className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700'
          >
            Volver al login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100 p-4'>
      <div className='text-center'>
        <div className='mb-4'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto'></div>
        </div>
        <h1 className='text-xl font-semibold text-gray-900 mb-2'>
          {isVerifying ? 'Verificando sesión...' : 'Redirigiendo...'}
        </h1>
        <p className='text-gray-600'>
          {isVerifying
            ? 'Estamos verificando tu sesión y cargando tus datos.'
            : 'Serás redirigido en unos momentos.'}
        </p>
      </div>
    </div>
  );
}
