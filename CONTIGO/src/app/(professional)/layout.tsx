import type { Metadata } from 'next';
import { ProfessionalSidebar } from '@/components/layout/ProfessionalSidebar';
import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'CONTIGO - Profesional',
  description: 'Portal para profesionales de la salud',
};

export default async function ProfessionalLayout({
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

  // Ideally we should check if the user is a professional (e.g. has a profile or role)
  // For now, any logged in user can access if they know the URL, but they won't see any data unless they have access.

  return (
    <div className='flex h-screen'>
      <ProfessionalSidebar />
      <main className='flex-1 md:ml-64 w-full overflow-y-auto bg-gray-50 pt-20 md:pt-8'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>{children}</div>
      </main>
    </div>
  );
}
