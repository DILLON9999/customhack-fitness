'use client'

export default function ProDashboard() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Pro Dashboard</h1>
        <p className="text-gray-600">Elite-level training and performance optimization for serious athletes.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Elite Training */}
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-700">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Elite Training</h2>
          <p className="text-gray-600 mb-4">Advanced training methodologies</p>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>• Olympic lifting techniques</li>
            <li>• Sport-specific training</li>
            <li>• Plyometric progressions</li>
            <li>• Advanced periodization</li>
          </ul>
        </div>

        {/* Performance Analytics */}
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-700">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Performance Analytics</h2>
          <p className="text-gray-600 mb-4">Data-driven performance insights</p>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>• Force plate analysis</li>
            <li>• VO2 max testing</li>
            <li>• Lactate threshold</li>
            <li>• Power output metrics</li>
          </ul>
        </div>

        {/* Recovery Science */}
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-700">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Recovery Science</h2>
          <p className="text-gray-600 mb-4">Advanced recovery protocols</p>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>• HRV monitoring</li>
            <li>• Sleep optimization</li>
            <li>• Cryotherapy protocols</li>
            <li>• Stress management</li>
          </ul>
        </div>

        {/* Nutrition Science */}
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-700">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Nutrition Science</h2>
          <p className="text-gray-600 mb-4">Precision nutrition for peak performance</p>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>• Metabolic testing</li>
            <li>• Nutrient timing</li>
            <li>• Ergogenic aids</li>
            <li>• Body composition optimization</li>
          </ul>
        </div>

        {/* Competition Prep */}
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-700">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Competition Prep</h2>
          <p className="text-gray-600 mb-4">Peak for competition day</p>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>• Tapering strategies</li>
            <li>• Mental preparation</li>
            <li>• Game plan development</li>
            <li>• Peak performance timing</li>
          </ul>
        </div>

        {/* Coaching Tools */}
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-indigo-700">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Coaching Tools</h2>
          <p className="text-gray-600 mb-4">Professional coaching resources</p>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>• Athlete management</li>
            <li>• Program design tools</li>
            <li>• Performance tracking</li>
            <li>• Communication systems</li>
          </ul>
        </div>

        {/* Biomechanics */}
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-pink-700">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Biomechanics</h2>
          <p className="text-gray-600 mb-4">Movement optimization and analysis</p>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>• Motion capture analysis</li>
            <li>• Technique refinement</li>
            <li>• Injury risk assessment</li>
            <li>• Movement efficiency</li>
          </ul>
        </div>

        {/* Research & Development */}
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Research & Development</h2>
          <p className="text-gray-600 mb-4">Cutting-edge fitness science</p>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>• Latest research findings</li>
            <li>• Experimental protocols</li>
            <li>• Technology integration</li>
            <li>• Innovation in training</li>
          </ul>
        </div>

        {/* Mental Performance */}
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-teal-700">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Mental Performance</h2>
          <p className="text-gray-600 mb-4">Psychological training for elite athletes</p>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>• Visualization techniques</li>
            <li>• Pressure management</li>
            <li>• Focus training</li>
            <li>• Confidence building</li>
          </ul>
        </div>
      </div>
    </div>
  )
} 