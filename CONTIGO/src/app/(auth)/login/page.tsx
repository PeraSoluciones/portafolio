'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useAppStore } from '@/store/app-store';
import { loginSchema, type LoginFormData } from '@/lib/validations/auth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import Link from 'next/link';
import { Loader2, LogIn } from 'lucide-react';

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const router = useRouter();
  const { setUser, setLoading } = useAppStore();

  // Configuración del formulario con react-hook-form y zod
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Manejo del envío del formulario de email/contraseña
  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        // Manejo específico de errores comunes
        if (error.message === 'Invalid login credentials') {
          setError('Credenciales inválidas. Verifica tu email y contraseña.');
        } else if (error.message.includes('Email not confirmed')) {
          setError('Por favor, confirma tu email antes de iniciar sesión.');
        } else {
          setError(error.message);
        }
        return;
      }

      if (authData.user) {
        setUser({
          id: authData.user.id,
          email: authData.user.email!,
          full_name: authData.user.user_metadata?.full_name || '',
          avatar_url: authData.user.user_metadata?.avatar_url,
          created_at: authData.user.created_at,
          updated_at: authData.user.updated_at || authData.user.created_at,
        });
        router.push('/dashboard');
      }
    } catch (err) {
      setError('Ocurrió un error inesperado. Por favor, inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  // Manejo del login con Google OAuth
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/callback`;
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
        },
      });

      if (error) {
        setError('Error al iniciar sesión con Google. Por favor, inténtalo de nuevo.');
      }
    } catch (err) {
      setError('Ocurrió un error inesperado al conectar con Google.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Columna Izquierda: Visual */}
      <div className="lg:w-1/2 flex flex-col justify-center items-center p-8 lg:p-12 bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
        <div className="max-w-md text-center space-y-6">
          <h1 className="text-4xl lg:text-6xl font-bold tracking-tight">
            CONTIGO
          </h1>
          <p className="text-lg lg:text-xl opacity-90">
            La mejor herramienta para gestionar las rutinas de tus hijos, fomentando hábitos positivos y un crecimiento feliz.
          </p>
          <div className="w-full h-64 lg:h-96 rounded-lg overflow-hidden shadow-2xl">
            {/* Placeholder de imagen */}
            <img
              src="https://res.cloudinary.com/dibmjjktr/image/upload/v1759726309/1759725204_dxy02u.png"
              alt="Madre e hijo juntos"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* Columna Derecha: Formulario */}
      <div className="lg:w-1/2 flex items-center justify-center p-8 lg:p-12 bg-gray-50">
        <Card className="w-full max-w-md shadow-xl border-t-4 border-t-indigo-500">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="flex items-center justify-center space-x-2 text-2xl font-bold text-gray-900">
              <LogIn className="h-6 w-6 text-indigo-600" />
              <span>Bienvenido de nuevo</span>
            </CardTitle>
            <CardDescription className="text-gray-600">
              Inicia sesión para continuar apoyando a tus hijos
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Botón de login con Google */}
            <Button
              variant="outline"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading}
              className="w-full"
            >
              {isGoogleLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Conectando con Google...
                </>
              ) : (
                <>
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Iniciar sesión con Google
                </>
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-gray-50 px-2 text-muted-foreground">O continúa con</span>
              </div>
            </div>

            {/* Formulario de email/contraseña */}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="tu@email.com"
                          type="email"
                          disabled={isLoading}
                          className="transition-all duration-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contraseña</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="••••••••"
                          type="password"
                          disabled={isLoading}
                          className="transition-all duration-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 transition-colors duration-200"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Iniciando sesión...
                    </>
                  ) : (
                    'Iniciar sesión'
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>

          <CardFooter className="flex justify-center">
            <p className="text-sm text-gray-600">
              ¿No tienes cuenta?{' '}
              <Link href="/register" className="text-indigo-600 hover:underline font-medium transition-colors duration-200">
                Regístrate
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}