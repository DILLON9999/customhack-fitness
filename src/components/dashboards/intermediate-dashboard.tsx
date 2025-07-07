'use client'

import { useState } from "react";
import { format } from "date-fns";
import FitnessCalendar from "@/components/fitness/fitness-calendar";
import DayEntryModal from "@/components/fitness/day-entry-modal";
import MealTracker from "@/components/fitness/meal-tracker";
import MacroProgressCharts from "@/components/fitness/macro-progress-charts";
import { DayData, MealAnalysis, FitnessGoal } from "@/types/fitness";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { Target, Zap } from "lucide-react";

export default function IntermediateDashboard() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedDayData, setSelectedDayData] = useState<DayData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [mealRefreshTrigger, setMealRefreshTrigger] = useState(0);
  const [fitnessGoal, setFitnessGoal] = useState<FitnessGoal>('lose_weight');

  const handleDayClick = (date: string, dayData: DayData) => {
    setSelectedDate(date);
    setSelectedDayData(dayData);
    setIsModalOpen(true);
  };

  const handleModalSave = () => {
    setIsModalOpen(false);
    // Refresh both calendar and meal components since modal can save both workouts and nutrition
    setRefreshTrigger(prev => prev + 1);
    setMealRefreshTrigger(prev => prev + 1);
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

      // Refresh the calendar
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
        carbs: analysis.total_carbs,
        fat: analysis.total_fat,
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
      
      // Refresh only meal-related components
      setMealRefreshTrigger(prev => prev + 1);
      
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
        <div className="relative mb-6 py-4">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">
              Optimize Your Performance
            </h1>
          </div>
          
          {/* Goal Selection - Positioned to not affect title centering */}
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

        {/* Main Content Grid - Without Streak Display */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Center Column - Calendar (Wider without streak) */}
          <div className="lg:col-span-7">
            <FitnessCalendar 
              onDayClick={handleDayClick}
              refreshTrigger={refreshTrigger}
              onWorkoutComplete={handleWorkoutComplete}
              fitnessGoal={fitnessGoal}
            />
          </div>

          {/* Right Column - Meal Tracker and Macros */}
          <div className="lg:col-span-5 space-y-4">
            <MealTracker 
              refreshTrigger={mealRefreshTrigger}
              onMealAdded={handleMealAnalysisComplete}
              fitnessGoal={fitnessGoal}
            />
            <MacroProgressCharts 
              refreshTrigger={mealRefreshTrigger}
            />
          </div>
        </div>

        {/* Day Entry Modal */}
        {isModalOpen && selectedDayData && (
          <DayEntryModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            date={selectedDate}
            dayData={selectedDayData}
            onSave={handleModalSave}
          />
        )}
      </div>
    </div>
  );
} 