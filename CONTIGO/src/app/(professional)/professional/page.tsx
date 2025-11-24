import { createServerClient } from '@/lib/supabase/server';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, Users } from 'lucide-react';
import { AcceptInvitationButton } from '@/components/professional/AcceptInvitationButton';

export default async function ProfessionalDashboard() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // 1. Link pending invitations
  if (user.email) {
    await supabase
      .from('professional_patient_access')
      .update({ professional_id: user.id })
      .eq('professional_email', user.email)
      .is('professional_id', null);
  }

  // 2. Fetch patients
  const { data: patients } = await supabase
    .from('professional_patient_access')
    .select(
      `
      id,
      status,
      permissions,
      child:children (
        id,
        name,
        adhd_type,
        avatar_url,
        points_balance,
        birth_date
      )
    `
    )
    .eq('professional_id', user.id)
    .neq('status', 'revoked');

  return (
    <div className='space-y-8'>
      <div>
        <h2 className='text-3xl font-bold tracking-tight'>Panel Profesional</h2>
        <p className='text-muted-foreground'>
          Gestiona y monitorea el progreso de tus pacientes.
        </p>
      </div>

      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Total Pacientes
            </CardTitle>
            <Users className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{patients?.length || 0}</div>
            <p className='text-xs text-muted-foreground'>
              Pacientes activos asignados
            </p>
          </CardContent>
        </Card>
        {/* Add more summary cards here if needed */}
      </div>

      <div>
        <h3 className='text-xl font-semibold mb-4'>Mis Pacientes</h3>
        <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
          {patients?.map((record: any) => (
            <Card key={record.id} className='hover:shadow-lg transition-shadow'>
              <CardHeader className='flex flex-row items-center gap-4'>
                <Avatar className='h-12 w-12'>
                  <AvatarImage src={record.child?.avatar_url} />
                  <AvatarFallback>
                    {record.child?.name?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle>
                    {record.child?.name || 'Paciente Desconocido'}
                  </CardTitle>
                  <CardDescription>
                    {record.child?.adhd_type || 'Tipo no especificado'}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className='space-y-2 mb-4'>
                  <div className='flex justify-between text-sm'>
                    <span className='text-muted-foreground'>Puntos:</span>
                    <span className='font-medium'>
                      {record.child?.points_balance || 0}
                    </span>
                  </div>
                  <div className='flex justify-between text-sm'>
                    <span className='text-muted-foreground'>Estado:</span>
                    <span
                      className={`font-medium capitalize ${
                        record.status === 'active'
                          ? 'text-green-600'
                          : 'text-yellow-600'
                      }`}
                    >
                      {record.status === 'pending' ? 'Pendiente' : 'Activo'}
                    </span>
                  </div>
                </div>

                {record.status === 'active' ? (
                  <Link href={`/professional/patients/${record.child?.id}`}>
                    <Button className='w-full'>
                      Ver Reporte Clínico
                      <ArrowRight className='ml-2 h-4 w-4' />
                    </Button>
                  </Link>
                ) : (
                  <AcceptInvitationButton accessId={record.id} />
                )}
              </CardContent>
            </Card>
          ))}

          {(!patients || patients.length === 0) && (
            <div className='col-span-full text-center py-12 bg-white rounded-lg border border-dashed'>
              <Users className='mx-auto h-12 w-12 text-gray-300' />
              <h3 className='mt-2 text-sm font-semibold text-gray-900'>
                No tienes pacientes asignados
              </h3>
              <p className='mt-1 text-sm text-gray-500'>
                Pide a los padres que te inviten usando tu correo electrónico:{' '}
                {user.email}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
