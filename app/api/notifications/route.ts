import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    // Log pour debugging
    console.log('[API Notifications] Headers:', Object.fromEntries(request.headers))

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    console.log('[API Notifications] User from getUser:', user?.id, 'Error:', authError?.message)

    if (authError) {
      console.error('[API Notifications] Auth error:', authError)
      return NextResponse.json({ error: 'Authentication error', details: authError.message }, { status: 401 })
    }

    if (!user) {
      console.error('[API Notifications] No user found')
      return NextResponse.json({ error: 'Unauthorized - No user session' }, { status: 401 })
    }

    const { data: notifications, error } = await supabase
      .from('notifications')
      .select(`
        *,
        actor:profiles!notifications_actor_id_fkey(id, username, avatar_url, full_name),
        post:posts!notifications_post_id_fkey(id, audio_url, duration)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Error fetching notifications:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(notifications || [])
  } catch (error) {
    console.error('Unexpected error in notifications API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { notificationIds } = await request.json()

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .in('id', notificationIds)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
