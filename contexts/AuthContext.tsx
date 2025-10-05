'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface Profile {
  id: string
  email: string
  username?: string
  full_name?: string
  bio?: string
  avatar_url?: string
  created_at: string
  is_profile_complete: boolean
}

interface AuthContextType {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: any }>
  resetPassword: (email: string) => Promise<{ error: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setProfile(null)
        }

        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)

        // Si le profil n'existe pas (PGRST116), essayer de le créer
        if (error.code === 'PGRST116' || error.message?.includes('No rows')) {
          console.log('Profile not found, attempting to create one...')

          // Récupérer l'email de l'utilisateur
          const { data: { user } } = await supabase.auth.getUser()

          if (user?.email) {
            // Créer le profil manuellement
            const { data: newProfile, error: createError } = await supabase
              .from('profiles')
              .insert({
                id: userId,
                email: user.email,
                is_profile_complete: false
              } as any)
              .select()
              .single()

            if (createError) {
              console.error('Error creating profile:', createError)
              setProfile(null)
            } else if (newProfile) {
              console.log('Profile created successfully:', newProfile)
              setProfile(newProfile as Profile)
            }
            return
          }
        }

        setProfile(null)
        return
      }

      if (data) {
        setProfile(data as Profile)
      }
    } catch (error) {
      console.error('Unexpected error fetching profile:', error)
      setProfile(null)
    }
  }

  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/auth/login`,
          data: {
            email: email,
          }
        }
      })

      if (error) {
        console.error('SignUp error:', error)
        return { error }
      }

      console.log('SignUp success. User:', data.user)
      console.log('SignUp session:', data.session)

      // Important: si data.user existe mais data.session est null,
      // cela signifie que l'email de confirmation est requis
      if (data.user && !data.session) {
        console.log('Email confirmation required for:', data.user.email)
      }

      return { error: null }
    } catch (err) {
      console.error('Unexpected signup error:', err)
      return { error: err }
    }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error('No user found') }

    console.log('Updating profile with:', updates, 'for user:', user.id)

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating profile in Supabase:', error)
      return { error }
    }

    console.log('Profile updated successfully in Supabase:', data)

    // Update local state with the data returned from Supabase
    if (data) {
      setProfile(data as Profile)
    }

    return { error: null }
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    })

    return { error }
  }

  const value = {
    user,
    profile,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    resetPassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
