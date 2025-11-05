'use client';

import { useEffect } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { Session } from '@supabase/supabase-js';
import { useAppStore } from '@/store/app-store';

interface AuthProviderProps {
  session: Session | null;
  children: React.ReactNode;
}

export function AuthProvider({ session, children }: AuthProviderProps) {
  const { setUser, setChildren, clearStore } = useAppStore();

  // Función para cargar los hijos del usuario
  const fetchChildren = async (userId: string) => {
    try {
      const response = await fetch('/api/children', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error:', errorData);
        return;
      }

      const { children } = await response.json();

      if (children && children.length > 0) {
        setChildren(children);
      }
    } catch (error) {
      console.error('Exception fetching children via API:', error);
    }
  };

  // Sincronización inicial de la sesión del servidor
  // Ahora también carga los hijos si hay una sesión inicial
  useEffect(() => {
    if (session?.user) {
      // Extraer metadatos de manera más robusta para Google OAuth
      const fullName = session.user.user_metadata?.full_name ||
                      session.user.user_metadata?.name ||
                      `${session.user.user_metadata?.given_name || ''} ${session.user.user_metadata?.family_name || ''}`.trim() ||
                      ''
      
      const avatarUrl = session.user.user_metadata?.avatar_url ||
                       session.user.user_metadata?.picture ||
                       ''
      
      const userData = {
        id: session.user.id,
        email: session.user.email!,
        full_name: fullName,
        avatar_url: avatarUrl,
        created_at: session.user.created_at,
        updated_at: session.user.updated_at || session.user.created_at,
      };
      setUser(userData);
      // Cargar los hijos desde la sesión inicial del servidor
      fetchChildren(session.user.id);
    }
  }, [session, setUser]);

  // Escuchar cambios en el estado de autenticación en el cliente
  useEffect(() => {
    const { data: { subscription } } = createBrowserClient().auth.onAuthStateChange(
      async (event, session) => {
        // El evento SIGNED_IN es ahora la fuente de verdad para cargar los hijos.
        if (event === 'SIGNED_IN' && session?.user) {
          // Extraer metadatos de manera más robusta para Google OAuth
          const fullName = session.user.user_metadata?.full_name ||
                          session.user.user_metadata?.name ||
                          `${session.user.user_metadata?.given_name || ''} ${session.user.user_metadata?.family_name || ''}`.trim() ||
                          ''
          
          const avatarUrl = session.user.user_metadata?.avatar_url ||
                           session.user.user_metadata?.picture ||
                           ''
          
          const userData = {
            id: session.user.id,
            email: session.user.email!,
            full_name: fullName,
            avatar_url: avatarUrl,
            created_at: session.user.created_at,
            updated_at: session.user.updated_at || session.user.created_at,
          };
          setUser(userData);
          await fetchChildren(session.user.id);
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          // Opcional: refrescar datos si el token cambia, pero el usuario ya está logueado.
          await fetchChildren(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          clearStore();
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser, setChildren, clearStore]);

  return <>{children}</>;
}