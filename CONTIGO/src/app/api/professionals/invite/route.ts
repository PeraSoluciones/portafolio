import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();
    const { childId, professionalEmail } = await request.json();

    if (!childId || !professionalEmail) {
      return NextResponse.json(
        { error: 'Missing required fields: childId, professionalEmail' },
        { status: 400 }
      );
    }

    // 1. Verify the user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Verify the user is the parent of the child
    const { data: child, error: childError } = await supabase
      .from('children')
      .select('id, parent_id')
      .eq('id', childId)
      .single();

    if (childError || !child) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 });
    }

    if (child.parent_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized: You are not the parent of this child' },
        { status: 403 }
      );
    }

    // 3. Check if the professional user exists (optional optimization)
    // We can't easily query auth.users from the client due to security.
    // But we can try to find a profile if we have a public profiles table, or just insert with email.
    // For now, we will just insert the invitation with the email.
    // If we had an edge function with service role, we could lookup auth.users.

    // We'll check if there's already a profile in 'professional_profiles' (if we assume they created one)
    // But 'professional_profiles' is linked to auth.users.

    // Let's try to find a user ID from professional_profiles if it exists
    // Note: This assumes professionals have created a profile.
    // If not, we just store the email.

    // Actually, we can't query professional_profiles by email unless we expose it.
    // Let's just insert into professional_patient_access.
    // If the professional_id is unknown, we leave it NULL and rely on professional_email.

    // However, we need to know if there is ALREADY an access record.
    const { data: existingAccess } = await supabase
      .from('professional_patient_access')
      .select('id')
      .eq('child_id', childId)
      .eq('professional_email', professionalEmail)
      .single();

    if (existingAccess) {
      return NextResponse.json(
        { error: 'Invitation already sent to this email' },
        { status: 409 }
      );
    }

    // 4. Create the access record
    console.log('Attempting to insert access record for:', {
      childId,
      professionalEmail,
      invitedBy: user.email,
    });

    const { data: accessRecord, error: insertError } = await supabase
      .from('professional_patient_access')
      .insert({
        child_id: childId,
        professional_email: professionalEmail,
        invited_by_email: user.email,
        status: 'pending',
        permissions: ['view_reports', 'manage_routines'], // Default permissions
      })
      .select()
      .single();

    if (insertError) {
      console.error(
        'Error inviting professional (Supabase Insert):',
        insertError
      );
      return NextResponse.json(
        { error: 'Failed to send invitation', details: insertError },
        { status: 500 }
      );
    }

    revalidatePath('/team');
    return NextResponse.json({ success: true, invitation: accessRecord });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
