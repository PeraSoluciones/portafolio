import { createServerClient } from '@/lib/supabase/server';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { InviteProfessionalForm } from '@/components/team/InviteProfessionalForm';
import {
  ProfessionalList,
  ProfessionalAccess,
} from '@/components/team/ProfessionalList';
import { redirect } from 'next/navigation';

export default async function TeamPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return redirect('/login');

  // 1. Fetch Children
  const { data: children } = await supabase
    .from('children')
    .select('id, name')
    .eq('parent_id', user.id);

  if (!children || children.length === 0) {
    return (
      <div className='p-8 text-center'>
        <h2 className='text-xl font-semibold'>Primero añade a tus hijos</h2>
        <p className='text-muted-foreground'>
          Necesitas registrar hijos antes de invitar profesionales.
        </p>
      </div>
    );
  }

  // 2. Fetch Access List
  // We need to join with children to verify parent_id, or rely on RLS.
  // RLS: "Parents can view access records for their children"
  // So simple select should work.
  const childrenIds = children.map((c) => c.id);

  const { data: accessList } = await supabase
    .from('professional_patient_access')
    .select(
      `
      id,
      status,
      professional_email,
      child:children (
        name,
        avatar_url
      )
    `
    )
    .in('child_id', childrenIds)
    .neq('status', 'revoked');

  return (
    <div className='space-y-8'>
      <div>
        <h2 className='text-3xl font-bold tracking-tight'>Equipo de Cuidado</h2>
        <p className='text-muted-foreground'>
          Invita a profesionales (psicólogos, terapeutas, maestros) para que
          colaboren en el seguimiento.
        </p>
      </div>

      <div className='grid gap-8 md:grid-cols-2'>
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Invitar Profesional</CardTitle>
              <CardDescription>
                Envía una invitación por correo electrónico.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InviteProfessionalForm childrenList={children} />
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Profesionales con Acceso</CardTitle>
              <CardDescription>
                Gestiona quién puede ver los datos de tus hijos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProfessionalList
                accessList={
                  (accessList as unknown as ProfessionalAccess[]) || []
                }
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
