import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: 'CONTIGO - Iniciar Sesión',
  description: 'Inicia sesión en CONTIGO para gestionar las rutinas de tus hijos',
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="h-screen overflow-y-auto">
      {children}
      <Toaster />
    </div>
  );
}