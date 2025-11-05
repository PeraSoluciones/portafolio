import type { Metadata } from 'next';
import { Sidebar } from '@/components/layout/Sidebar';
import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'CONTIGO - Dashboard',
  description: 'Gestiona las rutinas, hábitos y comportamientos de tus hijos',
};

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createServerClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/login');
  }
  
  const { data: { session } } = await supabase.auth.getSession();

  return (
    <div className='flex h-screen'>
      <Sidebar />
      <main className='flex-1 md:ml-64 w-full overflow-y-auto bg-gray-50 pt-20 md:pt-8'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          {children}
        </div>
      </main>
    </div>
  );
}