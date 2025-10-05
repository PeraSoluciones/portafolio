'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient();
        const { data: { user }, error } = await supabase.auth.getUser();
        
        // Manejar el error AuthSessionMissingError
        if (error && error.message?.includes('Auth session missing')) {
          console.log('[DEBUG] Home - Auth session missing, redirecting to login');
          router.push('/login');
          return;
        }
        
        if (user) {
          router.push('/dashboard');
        } else {
          router.push('/login');
        }
      } catch (error) {
        console.error('[DEBUG] Home - Error checking auth:', error);
        router.push('/login');
      }
    };

    checkAuth();
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8 p-4">
      <div className="relative w-24 h-24 md:w-32 md:h-32">
        <img
          src="/logo.svg"
          alt="CONTIGO Logo"
          className="w-full h-full object-contain"
        />
      </div>
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );
}