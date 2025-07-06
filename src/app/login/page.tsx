import LoginForm from '@/components/auth/login'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to FitTrack
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Your personalized fitness journey awaits
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
} 