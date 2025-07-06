'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import { AuroraText } from '@/components/magicui/aurora-text'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (user) {
    return null // Will redirect to dashboard
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <div className="mb-8">
          <h1 className="text-6xl font-bold mb-6">
            Welcome to{' '}
            <AuroraText colors={['#6600ff', '#69e300', '#80ffce']}>
              FitTrack
            </AuroraText>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Your personalized fitness journey starts here. Get tailored workouts, nutrition guidance, and progress tracking based on your fitness level.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Beginner</h3>
            <p className="text-gray-600 mb-4">Just starting your fitness journey? We'll guide you through the basics.</p>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Simple workout routines</li>
              <li>• Basic nutrition tips</li>
              <li>• Safety guidelines</li>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Intermediate</h3>
            <p className="text-gray-600 mb-4">Ready to take your fitness to the next level with structured training.</p>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Advanced workouts</li>
              <li>• Performance tracking</li>
              <li>• Nutrition optimization</li>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Pro</h3>
            <p className="text-gray-600 mb-4">Elite-level training and performance optimization for serious athletes.</p>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Elite training methods</li>
              <li>• Performance analytics</li>
              <li>• Competition preparation</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/signup"
            className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="bg-white text-indigo-600 px-8 py-3 rounded-lg font-semibold border border-indigo-600 hover:bg-indigo-50 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}
