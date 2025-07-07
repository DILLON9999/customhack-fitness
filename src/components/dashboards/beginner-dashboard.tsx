'use client'

import { useState } from "react";
import { format } from "date-fns";
import WorkoutTimer from "@/components/fitness/workout-timer";
import BeginnerFitnessCalendar from "@/components/fitness/beginner-fitness-calendar";
import StreakDisplay from "@/components/fitness/streak-display";
import BeginnerDayEntryModal from "@/components/fitness/beginner-day-entry-modal";
import MealTracker from "@/components/fitness/meal-tracker";
import { DayData, MealAnalysis, FitnessGoal } from "@/types/fitness";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { Target, Zap } from "lucide-react";
import Confetti from "@/components/magicui/confetti";

export default function BeginnerDashboard() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedDayData, setSelectedDayData] = useState<DayData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [fitnessGoal, setFitnessGoal] = useState<FitnessGoal>('lose_weight');
  const [showWorkoutConfetti, setShowWorkoutConfetti] = useState(false);
  const [showProteinConfetti, setShowProteinConfetti] = useState(false);
  const [lastProteinTotal, setLastProteinTotal] = useState(0);

  const handleDayClick = (date: string, dayData: DayData) => {
    setSelectedDate(date);
    setSelectedDayData(dayData);
    setIsModalOpen(true);
  };

  const handleModalSave = () => {
    setIsModalOpen(false);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleWorkoutSavedFromModal = () => {
    // Trigger confetti when a workout is saved via calendar modal
    setShowWorkoutConfetti(true);
  };

  const handleWorkoutComplete = async (durationMinutes: number) => {
    if (!user) return;

    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      
      console.log('Saving timer workout:', { user_id: user.id, date: today, duration: durationMinutes });
      
      // Check if workout already exists for today
      const { data: existingWorkout, error: fetchError } = await supabase
        .from('workout_entries')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching existing workout:', fetchError);
        alert(`Error checking existing workout: ${fetchError.message}`);
        return;
      }

      let result;
      if (existingWorkout) {
        // Update existing workout with additional time
        result = await supabase
          .from('workout_entries')
          .update({
            duration_minutes: existingWorkout.duration_minutes + durationMinutes,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingWorkout.id)
          .select();
      } else {
        // Create new workout entry
        result = await supabase
          .from('workout_entries')
          .insert({
            user_id: user.id,
            date: today,
            duration_minutes: durationMinutes,
            workout_type: 'general',
            notes: 'Completed via timer',
          })
          .select();
      }

      console.log('Timer workout save result:', result);

      if (result.error) {
        console.error('Supabase error:', result.error);
        alert(`Error saving workout: ${result.error.message}`);
        return;
      }

      // Check for new achievements
      try {
        const { data: newAwards, error: awardError } = await supabase
          .rpc('check_and_award_achievements', { p_user_id: user.id });
        
        if (awardError) {
          console.error('Award check error:', awardError);
        } else if (newAwards && newAwards.length > 0) {
          console.log('New awards earned:', newAwards);
          // You could show a toast notification here
        }
      } catch (awardErr) {
        console.error('Award function error:', awardErr);
      }

      // Trigger workout celebration confetti
      setShowWorkoutConfetti(true);
      
      // Refresh the calendar and streak display
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error saving workout:', error);
      alert(`Error saving workout: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleMealAnalysisComplete = async (analysis: MealAnalysis, imageUrl?: string) => {
    if (!user) return;

    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      
      // Save the meal analysis to the nutrition_entries table
      const nutritionData = {
        user_id: user.id,
        date: today,
        calories: analysis.total_calories,
        protein: analysis.total_protein,
        notes: JSON.stringify(analysis), // Store the full analysis in notes
      };

      console.log('Saving AI meal analysis:', nutritionData);

      const result = await supabase
        .from('nutrition_entries')
        .insert(nutritionData)
        .select();

      if (result.error) {
        console.error('Error saving meal analysis:', result.error);
        alert(`Error saving meal: ${result.error.message}`);
        return;
      }

      console.log('Meal analysis saved successfully:', result);
      
      // Check if protein goal was just hit (120g for muscle gain)
      if (fitnessGoal === 'gain_muscle') {
        // Calculate new protein total by fetching all meals for today
        const today = format(new Date(), 'yyyy-MM-dd');
        const { data: allMeals } = await supabase
          .from('nutrition_entries')
          .select('*')
          .eq('user_id', user.id)
          .eq('date', today);
        
        if (allMeals) {
          const newProteinTotal = allMeals.reduce((sum, meal) => {
            if (meal.protein) return sum + meal.protein;
            try {
              if (meal.notes && meal.notes.startsWith('{')) {
                const analysis = JSON.parse(meal.notes);
                return sum + (analysis.total_protein || 0);
              }
            } catch (e) {
              // Ignore parsing errors
            }
            return sum;
          }, 0);
          
          // Trigger confetti if we just crossed the 120g threshold
          if (lastProteinTotal < 120 && newProteinTotal >= 120) {
            setShowProteinConfetti(true);
          }
          
          setLastProteinTotal(newProteinTotal);
        }
      }
      
      // Refresh components
      setRefreshTrigger(prev => prev + 1);
      
      // Clean up the image URL to prevent memory leaks
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
      
    } catch (error) {
      console.error('Error saving meal analysis:', error);
      alert(`Error saving meal: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Main Content */}
      <div className="flex-1 p-4 max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="relative mb-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-1">
              Build Your Fitness Habits
            </h1>
            <p className="text-base text-gray-600">
              Consistency is key! Track your workouts, maintain your streak, and build lasting habits.
            </p>
          </div>
          
          {/* Goal Selection - Absolute Positioned Top Right */}
          <div className="absolute top-0 right-0">
            <div className="bg-white rounded-lg shadow-md p-3 border border-gray-100">
              <h3 className="text-xs font-medium text-gray-700 mb-2 text-center">Your Goal</h3>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setFitnessGoal('lose_weight')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    fitnessGoal === 'lose_weight'
                      ? 'bg-red-100 text-red-700 border border-red-300'
                      : 'bg-gray-100 text-gray-600 border border-transparent hover:bg-gray-200'
                  }`}
                >
                  <Target className="w-3 h-3 inline mr-1" />
                  Lose Weight
                </button>
                <button
                  onClick={() => setFitnessGoal('gain_muscle')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    fitnessGoal === 'gain_muscle'
                      ? 'bg-green-100 text-green-700 border border-green-300'
                      : 'bg-gray-100 text-gray-600 border border-transparent hover:bg-gray-200'
                  }`}
                >
                  <Zap className="w-3 h-3 inline mr-1" />
                  Gain Muscle
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Column - Streak Display */}
          <div className="lg:col-span-2">
            <StreakDisplay refreshTrigger={refreshTrigger} />
          </div>

          {/* Center Column - Calendar */}
          <div className="lg:col-span-5">
            <BeginnerFitnessCalendar 
              onDayClick={handleDayClick}
              refreshTrigger={refreshTrigger}
              onWorkoutComplete={handleWorkoutComplete}
              fitnessGoal={fitnessGoal}
            />
          </div>

          {/* Right Column - Meal Tracker (wider to accommodate side-by-side layout) */}
          <div className="lg:col-span-5">
            <MealTracker 
              refreshTrigger={refreshTrigger}
              onMealAdded={handleMealAnalysisComplete}
              fitnessGoal={fitnessGoal}
            />
          </div>
        </div>

        {/* Day Entry Modal */}
        {isModalOpen && selectedDayData && (
          <BeginnerDayEntryModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            date={selectedDate}
            dayData={selectedDayData}
            onSave={handleModalSave}
            onWorkoutSaved={handleWorkoutSavedFromModal}
          />
        )}

        {/* Confetti Celebrations */}
        {showWorkoutConfetti && (
          <Confetti onComplete={() => setShowWorkoutConfetti(false)} />
        )}
        {showProteinConfetti && (
          <Confetti onComplete={() => setShowProteinConfetti(false)} />
        )}
      </div>
    </div>
  );
} 