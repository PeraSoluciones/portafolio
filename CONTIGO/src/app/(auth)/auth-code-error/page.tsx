'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function AuthCodeErrorPage() {
  return (
    <div className='min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100 p-4'>
      <Card className='w-full max-w-md shadow-lg'>
        <CardHeader className='text-center space-y-2'>
          <div className='flex justify-center mb-4'>
            <AlertTriangle className='h-12 w-12 text-red-500' />
          </div>
          <CardTitle className='text-2xl font-bold text-gray-900'>
            Error de autenticación
          </CardTitle>
          <CardDescription className='text-gray-600'>
            Ha ocurrido un error durante el proceso de autenticación
          </CardDescription>
        </CardHeader>

        <CardContent className='space-y-4'>
          <div className='bg-red-50 p-4 rounded-lg'>
            <p className='text-sm text-red-800'>
              No hemos podido completar el proceso de autenticación. Esto puede
              deberse a:
            </p>
            <ul className='mt-2 text-sm text-red-700 list-disc list-inside'>
              <li>El enlace ha expirado</li>
              <li>Ya fue utilizado previamente</li>
              <li>Un problema con la configuración de OAuth</li>
            </ul>
          </div>

          <div className='space-y-2'>
            <p className='text-sm text-gray-600'>
              Por favor, inténtalo de nuevo:
            </p>
            <div className='flex flex-col space-y-2'>
              <Link href='/login'>
                <Button className='w-full'>Ir a iniciar sesión</Button>
              </Link>
              <Link href='/register'>
                <Button variant='outline' className='w-full'>
                  Crear una nueva cuenta
                </Button>
              </Link>
            </div>
          </div>

          <p className='text-xs text-gray-500 text-center'>
            Si el problema persiste, contacta con soporte técnico.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
