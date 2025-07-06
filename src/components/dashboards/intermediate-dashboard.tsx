'use client'

export default function IntermediateDashboard() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Intermediate Dashboard</h1>
        <p className="text-gray-600">Ready to take your fitness to the next level? Let's build on your foundation.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Advanced Workouts */}
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-orange-500">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Advanced Workouts</h2>
          <p className="text-gray-600 mb-4">Challenging routines to push your limits</p>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>• HIIT training programs</li>
            <li>• Strength training splits</li>
            <li>• Compound movements</li>
            <li>• Progressive overload</li>
          </ul>
        </div>

        {/* Performance Metrics */}
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-600">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Performance Metrics</h2>
          <p className="text-gray-600 mb-4">Track detailed fitness measurements</p>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>• Body composition analysis</li>
            <li>• Strength benchmarks</li>
            <li>• Cardiovascular fitness</li>
            <li>• Flexibility assessments</li>
          </ul>
        </div>

        {/* Nutrition Optimization */}
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-600">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Nutrition Optimization</h2>
          <p className="text-gray-600 mb-4">Fine-tune your diet for performance</p>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>• Macro tracking</li>
            <li>• Pre/post workout nutrition</li>
            <li>• Supplement guidance</li>
            <li>• Meal timing strategies</li>
          </ul>
        </div>

        {/* Training Periodization */}
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-600">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Training Periodization</h2>
          <p className="text-gray-600 mb-4">Structured approach to long-term progress</p>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>• Mesocycle planning</li>
            <li>• Deload weeks</li>
            <li>• Peak performance phases</li>
            <li>• Recovery optimization</li>
          </ul>
        </div>

        {/* Injury Prevention */}
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-600">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Injury Prevention</h2>
          <p className="text-gray-600 mb-4">Stay healthy and training consistently</p>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>• Mobility work</li>
            <li>• Prehab exercises</li>
            <li>• Load management</li>
            <li>• Recovery protocols</li>
          </ul>
        </div>

        {/* Goal Setting */}
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-indigo-600">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Advanced Goal Setting</h2>
          <p className="text-gray-600 mb-4">Set and achieve specific fitness targets</p>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>• SMART goal framework</li>
            <li>• Competition preparation</li>
            <li>• Skill development</li>
            <li>• Performance benchmarks</li>
          </ul>
        </div>
      </div>
    </div>
  )
} 