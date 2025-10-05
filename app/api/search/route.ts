import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')

  if (!query || query.trim().length < 2) {
    return NextResponse.json(
      { error: 'Query must be at least 2 characters' },
      { status: 400 }
    )
  }

  try {
    // Get current user to exclude from results and check follow status
    const { data: { user } } = await supabase.auth.getUser()

    // Search users by username or full_name
    let searchQuery = supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, bio, followers_count, following_count')
      .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
      .limit(20)

    // Exclude current user from results only if logged in
    if (user?.id) {
      searchQuery = searchQuery.neq('id', user.id)
    }

    const { data: users, error } = await searchQuery

    if (error) {
      console.error('Search error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // If user is logged in, check follow status for each result
    if (user) {
      const usersWithFollowStatus = await Promise.all(
        users.map(async (profile) => {
          const { data: followData } = await supabase
            .from('follows')
            .select('id')
            .eq('follower_id', user.id)
            .eq('following_id', profile.id)
            .maybeSingle()

          return {
            ...profile,
            isFollowing: !!followData
          }
        })
      )

      return NextResponse.json({ users: usersWithFollowStatus })
    }

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
