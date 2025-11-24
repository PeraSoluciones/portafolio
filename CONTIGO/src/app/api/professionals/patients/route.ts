import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Link pending invitations to this user
    if (user.email) {
      const { error: updateError } = await supabase
        .from('professional_patient_access')
        .update({ professional_id: user.id })
        .eq('professional_email', user.email)
        .is('professional_id', null);

      if (updateError) {
        console.error('Error linking invitations:', updateError);
        // Continue anyway, maybe they were already linked
      }
    }

    // 2. Fetch assigned patients
    const { data: accessRecords, error: fetchError } = await supabase
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
      .neq('status', 'revoked'); // Don't show revoked access

    if (fetchError) {
      console.error('Error fetching patients:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch patients' },
        { status: 500 }
      );
    }

    return NextResponse.json({ patients: accessRecords });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
