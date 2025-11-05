import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/components/providers/auth-provider';
import { createServerClient } from '@/lib/supabase/server';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'CONTIGO - Aplicación para Padres de Niños con TDAH',
  description:
    'Aplicación web moderna diseñada específicamente para padres de niños con TDAH, enfocada en la parte psicosocial y conductual. Gestiona perfiles, rutinas, hábitos, comportamientos y recompensas.',
  keywords: [
    'TDAH',
    'Niños con TDAH',
    'Padres',
    'Rutinas',
    'Hábitos',
    'Comportamiento',
    'Recompensas',
    'Next.js',
    'TypeScript',
    'Tailwind CSS',
    'shadcn/ui',
    'Supabase',
    'React',
  ],
  authors: [{ name: 'CONTIGO Team' }],
  openGraph: {
    title: 'CONTIGO - Aplicación para Padres de Niños con TDAH',
    description: 'Aplicación web moderna para padres de niños con TDAH con gestión de rutinas, hábitos y comportamientos',
    siteName: 'CONTIGO',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CONTIGO - Aplicación para Padres de Niños con TDAH',
    description: 'Aplicación web moderna para padres de niños con TDAH con gestión de rutinas, hábitos y comportamientos',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createServerClient();
  
  const { data: { session } } = await supabase.auth.getSession();

  return (
    <html lang='es' suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased text-foreground`}
        suppressHydrationWarning={true}
      >
        <AuthProvider session={session}>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
