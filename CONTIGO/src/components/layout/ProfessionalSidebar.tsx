'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Users, Settings, LogOut, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';

const navigation = [
  { name: 'Dashboard', href: '/professional', icon: LayoutDashboard },
  // { name: 'Pacientes', href: '/professional/patients', icon: Users }, // Dashboard lists patients for now
  // { name: 'Configuración', href: '/professional/settings', icon: Settings },
];

export function ProfessionalSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const supabase = createBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  const handleSignOut = async () => {
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  const SidebarContent = () => (
    <div className='flex flex-col h-full bg-white border-r border-slate-200 text-sidebar-foreground'>
      <div className='p-6 mb-4 border-b border-slate-200'>
        <h1 className='text-2xl font-bold text-primary tracking-wider'>
          CONTIGO
          <span className='block text-xs font-normal text-muted-foreground'>
            Profesional
          </span>
        </h1>
      </div>
      <nav className='flex-1 px-4 space-y-2'>
        {navigation.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
              onClick={() => setOpen(false)}
            >
              <item.icon className='h-5 w-5' />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Sección del usuario en la parte inferior */}
      <div className='p-4 border-t border-sidebar-border'>
        <div className='flex items-center space-x-3 mb-3'>
          <Avatar className='h-8 w-8'>
            <AvatarImage src={user?.user_metadata?.avatar_url} />
            <AvatarFallback>
              {user?.email?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className='flex-1 min-w-0'>
            <p className='text-sm font-medium text-sidebar-foreground truncate'>
              {user?.user_metadata?.full_name || 'Profesional'}
            </p>
            <p className='text-xs text-sidebar-foreground/70 truncate'>
              {user?.email}
            </p>
          </div>
        </div>
        <Button
          variant='outline'
          size='sm'
          onClick={handleSignOut}
          className='w-full place-content-center text-sidebar-foreground border-sidebar-border hover:bg-destructive/10 hover:text-destructive'
        >
          <LogOut className='h-4 w-4 mr-2' />
          Cerrar sesión
        </Button>
        <div className='mt-3 text-xs text-sidebar-foreground/50'>
          © 2025 CONTIGO
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Sidebar para escritorio */}
      <div className='hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 md:z-40'>
        <SidebarContent />
      </div>

      {/* Sidebar móvil */}
      <div className='md:hidden'>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant='ghost'
              size='icon'
              className='fixed top-4 left-4 z-50'
            >
              <Menu className='h-5 w-5' />
              <span className='sr-only'>Abrir menú</span>
            </Button>
          </SheetTrigger>
          <SheetContent side='left' className='p-0 w-64'>
            <SheetHeader className='sr-only'>
              <SheetTitle>Menú Profesional</SheetTitle>
              <SheetDescription>Navegación para profesionales</SheetDescription>
            </SheetHeader>
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
