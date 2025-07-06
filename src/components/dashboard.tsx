'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import BeginnerDashboard from './dashboards/beginner-dashboard'
import IntermediateDashboard from './dashboards/intermediate-dashboard'
import ProDashboard from './dashboards/pro-dashboard'
import LevelSwitcher from './level-switcher'
import { LogOutIcon } from 'lucide-react'

type FitnessLevel = 'beginner' | 'intermediate' | 'pro'

interface UserProfile {
  id: string
  email: string
  fitness_level: FitnessLevel
  created_at: string
  updated_at: string
}

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [currentLevel, setCurrentLevel] = useState<FitnessLevel>('beginner')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchOrCreateProfile()
    }
  }, [user])

  const fetchOrCreateProfile = async () => {
    if (!user) return

    try {
      // First, try to fetch existing profile
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error && error.code === 'PGRST116') {
        // Profile doesn't exist, create it from user metadata
        const fitnessLevel = (user.user_metadata?.fitness_level as FitnessLevel) || 'beginner'
        
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert([
            {
              id: user.id,
              email: user.email!,
              fitness_level: fitnessLevel,
            },
          ])
          .select()
          .single()

        if (createError) {
          console.error('Error creating profile:', createError)
        } else {
          setProfile(newProfile)
          setCurrentLevel(fitnessLevel)
        }
      } else if (error) {
        console.error('Error fetching profile:', error)
      } else {
        setProfile(data)
        setCurrentLevel(data.fitness_level)
      }
    } catch (error) {
      console.error('Error with profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLevelChange = async (newLevel: FitnessLevel) => {
    if (!user || !profile) return

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ fitness_level: newLevel, updated_at: new Date().toISOString() })
        .eq('id', user.id)

      if (error) {
        console.error('Error updating fitness level:', error)
      } else {
        setCurrentLevel(newLevel)
        setProfile({ ...profile, fitness_level: newLevel })
      }
    } catch (error) {
      console.error('Error updating fitness level:', error)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const renderDashboard = () => {
    switch (currentLevel) {
      case 'beginner':
        return <BeginnerDashboard />
      case 'intermediate':
        return <IntermediateDashboard />
      case 'pro':
        return <ProDashboard />
      default:
        return <BeginnerDashboard />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">FitTrack</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                Welcome, <span className="font-medium">{user?.email}</span>
              </div>
              
              <LevelSwitcher 
                currentLevel={currentLevel} 
                onLevelChange={handleLevelChange}
              />
              
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                <LogOutIcon className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <main>
        {renderDashboard()}
      </main>
    </div>
  )
} 