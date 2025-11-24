'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, Clock, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export interface ProfessionalAccess {
  id: string;
  professional_email: string | null;
  status: 'pending' | 'active' | 'revoked' | string;
  child:
    | {
        name: string;
        avatar_url: string | null;
      }
    | any;
  professional?:
    | {
        full_name: string;
        avatar_url?: string | null;
      }
    | any;
}

interface ProfessionalListProps {
  accessList: ProfessionalAccess[];
}

export function ProfessionalList({ accessList }: ProfessionalListProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  async function handleRevoke(id: string) {
    if (!confirm('¿Estás seguro de que quieres revocar el acceso?')) return;

    setIsLoading(id);
    try {
      const response = await fetch(`/api/professionals/access/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'revoked' }),
      });

      if (!response.ok) throw new Error('Error al revocar acceso');

      toast.success('Acceso revocado');
      router.refresh();
    } catch (error) {
      toast.error('No se pudo revocar el acceso');
    } finally {
      setIsLoading(null);
    }
  }

  if (accessList.length === 0) {
    return (
      <div className='text-center py-8 text-muted-foreground'>
        No hay profesionales en tu equipo aún.
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {accessList.map((access) => (
        <Card key={access.id}>
          <CardContent className='p-4 flex items-center justify-between'>
            <div className='flex items-center gap-4'>
              <Avatar>
                <AvatarImage src={access.professional?.avatar_url} />
                <AvatarFallback>
                  {(access.professional?.full_name || access.professional_email)
                    .charAt(0)
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className='font-medium'>
                  {access.professional?.full_name || access.professional_email}
                </p>
                <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                  <span>Para: {access.child.name}</span>
                  {access.status === 'pending' && (
                    <Badge variant='secondary' className='text-xs'>
                      <Clock className='w-3 h-3 mr-1' /> Pendiente
                    </Badge>
                  )}
                  {access.status === 'active' && (
                    <Badge variant='default' className='bg-green-500 text-xs'>
                      <CheckCircle className='w-3 h-3 mr-1' /> Activo
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <Button
              variant='ghost'
              size='icon'
              className='text-destructive hover:text-destructive/90 hover:bg-destructive/10'
              onClick={() => handleRevoke(access.id)}
              disabled={isLoading === access.id}
            >
              <Trash2 className='h-4 w-4' />
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
