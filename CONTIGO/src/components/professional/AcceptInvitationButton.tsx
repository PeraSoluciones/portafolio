'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface AcceptInvitationButtonProps {
  accessId: string;
}

export function AcceptInvitationButton({
  accessId,
}: AcceptInvitationButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleAccept = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/professionals/access/${accessId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'active' }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al aceptar la invitación');
      }

      toast.success('Invitación aceptada correctamente');
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleAccept}
      disabled={isLoading}
      className='w-full bg-green-600 hover:bg-green-700 text-white'
    >
      {isLoading ? (
        <>
          <Loader2 className='mr-2 h-4 w-4 animate-spin' />
          Aceptando...
        </>
      ) : (
        <>
          <CheckCircle2 className='mr-2 h-4 w-4' />
          Aceptar Invitación
        </>
      )}
    </Button>
  );
}
