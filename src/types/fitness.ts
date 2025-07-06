export interface WorkoutEntry {
  id: string
  user_id: string
  date: string // YYYY-MM-DD format
  duration_minutes: number
  workout_type?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface NutritionEntry {
  id: string
  user_id: string
  date: string // YYYY-MM-DD format
  calories: number
  notes?: string
  created_at: string
  updated_at: string
}

export interface MealAnalysis {
  food_items: Array<{
    name: string
    estimated_calories: number
    confidence: 'low' | 'medium' | 'high'
  }>
  total_calories: number
  meal_type?: string
  analysis_notes?: string
}

export interface MealPhoto {
  id: string
  user_id: string
  date: string
  image_url: string
  analysis: MealAnalysis
  created_at: string
}

export interface StreakData {
  id: string
  user_id: string
  current_streak: number
  longest_streak: number
  last_workout_date: string | null
  total_workouts: number
  created_at: string
  updated_at: string
}

export interface Award {
  id: string
  title: string
  description: string
  icon: string
  requirement: number
  type: 'streak' | 'total_workouts' | 'duration'
}

export interface UserAward {
  id: string
  user_id: string
  award_id: string
  earned_at: string
  award: Award
}

export interface DayData {
  date: string
  workout?: WorkoutEntry
  nutrition?: NutritionEntry
  hasWorkout: boolean
  hasNutrition: boolean
}

export interface WorkoutTimerState {
  isRunning: boolean
  startTime: number | null
  elapsedTime: number
  totalTime: number
}

export type FitnessLevel = 'beginner' | 'intermediate' | 'pro' 