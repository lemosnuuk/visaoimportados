import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // This is required to refresh the session token
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protect admin routes
  if (
    request.nextUrl.pathname.startsWith('/admin') &&
    !request.nextUrl.pathname.startsWith('/admin/login')
  ) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/login'
      return NextResponse.redirect(url)
    }

    // VERIFICAÇÃO DE AUTORIZAÇÃO (Administrador)
    // Lê a tabela public.admin_users. Como a RLS só permite ler o próprio ID,
    // se o registro for encontrado, o usuário atual é admin.
    const { data: adminUser, error } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', user.id)
      .single()
    
    if (error || !adminUser) {
      // Se não for admin, desloga o usuário (opcional) e manda pra tela de login
      // ou manda para uma tela de acesso negado. Aqui mandamos para o login.
      await supabase.auth.signOut()
      const url = request.nextUrl.clone()
      url.pathname = '/admin/login'
      if (error) {
        url.searchParams.set('auth_error', error.message || error.code || 'unknown_db_error')
      } else {
        url.searchParams.set('auth_error', 'not_found_in_admin_users')
      }
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
