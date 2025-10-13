import { createClient, createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  // --- OBTENER LA URL DEL SITIO DESDE LAS VARIABLES DE ENTORNO ---
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) {
    throw new Error('NEXT_PUBLIC_SITE_URL is not set in .env.local');
  }
  // ---------------------------------------------------------

  if (code) {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.session && data.user) {
      const supabaseAdmin = createAdminClient();

      // Verificar si el usuario existe en nuestra base de datos
      const { data: existingUser, error: userError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      // Si el usuario no existe en nuestra base de datos, crearlo
      if (userError && userError.code === 'PGRST116') {
        // Extraer metadatos de Google
        const fullName =
          data.user.user_metadata?.full_name ||
          data.user.user_metadata?.name ||
          `${data.user.user_metadata?.given_name || ''} ${
            data.user.user_metadata?.family_name || ''
          }`.trim() ||
          '';

        const avatarUrl =
          data.user.user_metadata?.avatar_url ||
          data.user.user_metadata?.picture ||
          '';

        const { error: insertError } = await supabase.from('users').insert({
          id: data.user.id,
          email: data.user.email,
          full_name: fullName,
          avatar_url: avatarUrl,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        if (insertError) {
          console.error('Error creating user:', insertError);
        }
      } else if (existingUser) {
        // Actualizar metadatos del usuario si han cambiado
        const fullName =
          data.user.user_metadata?.full_name ||
          data.user.user_metadata?.name ||
          `${data.user.user_metadata?.given_name || ''} ${
            data.user.user_metadata?.family_name || ''
          }`.trim() ||
          '';

        const avatarUrl =
          data.user.user_metadata?.avatar_url ||
          data.user.user_metadata?.picture ||
          '';

        const needsUpdate =
          existingUser.full_name !== fullName ||
          existingUser.avatar_url !== avatarUrl;

        if (needsUpdate) {
          try {
            const { error: updateError } = await supabase
              .from('users')
              .update({
                full_name: fullName,
                avatar_url: avatarUrl,
                updated_at: new Date().toISOString(),
              })
              .eq('id', data.user.id);

            if (updateError) {
              console.error('Error updating user:', updateError);
            }
          } catch (error) {
            console.error('Exception updating user:', error);
          }
        }
      }

      return NextResponse.redirect(`${siteUrl}${next}`);
    } else {
      // Si hay un error en el intercambio de código, redirigir a página de error
      console.error('Error exchanging code for session:', error);
      return NextResponse.redirect(`${siteUrl}/auth-code-error`);
    }
  }

  // Si no hay código, redirigir a página de error
  return NextResponse.redirect(`${siteUrl}/auth-code-error`);
}
