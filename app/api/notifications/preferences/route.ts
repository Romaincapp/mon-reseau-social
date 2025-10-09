import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: preferences, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error) {
    // Si pas de préférences trouvées, créer les préférences par défaut
    if (error.code === 'PGRST116') {
      const { data: newPreferences, error: insertError } = await supabase
        .from('notification_preferences')
        .insert({ user_id: user.id })
        .select()
        .single()

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }

      return NextResponse.json(newPreferences)
    }

    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(preferences)
}

export async function PATCH(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const updates = await request.json()

  // Valider que les clés sont valides
  const validKeys = [
    'notify_on_follow',
    'notify_on_like',
    'notify_on_comment',
    'notify_on_repost',
    'notify_on_mention',
  ]

  const filteredUpdates = Object.keys(updates)
    .filter(key => validKeys.includes(key))
    .reduce((obj, key) => {
      obj[key] = updates[key]
      return obj
    }, {} as Record<string, boolean>)

  if (Object.keys(filteredUpdates).length === 0) {
    return NextResponse.json({ error: 'No valid updates provided' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('notification_preferences')
    .update(filteredUpdates)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
