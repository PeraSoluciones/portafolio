import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Sidebar } from '@/components/layout/Sidebar';

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='es' suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased text-foreground overflow-hidden`}
        suppressHydrationWarning={true}
      >
        <div className='flex h-screen'>
          <Sidebar />
          <main className='flex-1 md:ml-64 w-full overflow-y-auto bg-gray-50 pt-20 md:pt-8'>
            <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
              {children}
            </div>
          </main>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
