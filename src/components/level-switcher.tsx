'use client'

import { useState } from 'react'
import { ChevronDownIcon } from 'lucide-react'

type FitnessLevel = 'beginner' | 'intermediate' | 'pro'

interface LevelSwitcherProps {
  currentLevel: FitnessLevel
  onLevelChange: (level: FitnessLevel) => void
}

export default function LevelSwitcher({ currentLevel, onLevelChange }: LevelSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false)

  const levels = [
    { value: 'beginner', label: 'Beginner', color: 'bg-green-500' },
    { value: 'intermediate', label: 'Intermediate', color: 'bg-blue-500' },
    { value: 'pro', label: 'Pro', color: 'bg-red-500' },
  ] as const

  const currentLevelInfo = levels.find(level => level.value === currentLevel)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      >
        <div className={`w-3 h-3 rounded-full ${currentLevelInfo?.color}`} />
        <span className="text-sm font-medium text-gray-700">
          {currentLevelInfo?.label}
        </span>
        <ChevronDownIcon className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
            <div className="py-1">
              {levels.map((level) => (
                <button
                  key={level.value}
                  onClick={() => {
                    onLevelChange(level.value)
                    setIsOpen(false)
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-left text-sm hover:bg-gray-50 ${
                    currentLevel === level.value ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700'
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full ${level.color}`} />
                  <span>{level.label}</span>
                  {currentLevel === level.value && (
                    <span className="ml-auto text-indigo-500">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
} 