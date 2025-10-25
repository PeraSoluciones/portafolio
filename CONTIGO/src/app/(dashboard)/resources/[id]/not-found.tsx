import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ResourceNotFound() {
  return (
    <div className='container mx-auto py-8 px-4'>
      <div className='max-w-2xl mx-auto'>
        <Link href='/resources'>
          <Button variant='ghost' className='mb-4'>
            <ArrowLeft className='mr-2 h-4 w-4' />
            Volver a recursos
          </Button>
        </Link>

        <Card className='text-center'>
          <CardHeader>
            <div className='mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4'>
              <BookOpen className='h-8 w-8 text-muted-foreground' />
            </div>
            <CardTitle className='text-2xl'>Recurso no encontrado</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <p className='text-muted-foreground'>
              Lo sentimos, el recurso que estás buscando no existe o ha sido eliminado.
            </p>
            <p className='text-muted-foreground'>
              Por favor, verifica el enlace o regresa a la página de recursos para explorar otros contenidos.
            </p>
            <Link href='/resources'>
              <Button className='mt-4'>
                Explorar recursos
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}