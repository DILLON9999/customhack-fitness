'use client'

import { useState } from "react";
import { format } from "date-fns";
import WorkoutTimer from "@/components/fitness/workout-timer";
import FitnessCalendar from "@/components/fitness/fitness-calendar";
import StreakDisplay from "@/components/fitness/streak-display";
import DayEntryModal from "@/components/fitness/day-entry-modal";
import MealTracker from "@/components/fitness/meal-tracker";
import { DayData, MealAnalysis } from "@/types/fitness";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

export default function BeginnerDashboard() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedDayData, setSelectedDayData] = useState<DayData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleDayClick = (date: string, dayData: DayData) => {
    setSelectedDate(date);
    setSelectedDayData(dayData);
    setIsModalOpen(true);
  };

  const handleModalSave = () => {
    setIsModalOpen(false);
    setRefreshTrigger(prev => prev + 1);
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
      <div className="flex-1 p-6 max-w-7xl mx-auto space-y-6 pb-64">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Build Your Fitness Habits
          </h1>
          <p className="text-lg text-gray-600">
            Consistency is key! Track your workouts, maintain your streak, and build lasting habits.
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column - Streak Display */}
          <div>
            <StreakDisplay refreshTrigger={refreshTrigger} />
          </div>

          {/* Center Column - Calendar (spans 2 columns) */}
          <div className="lg:col-span-2">
            <FitnessCalendar 
              onDayClick={handleDayClick}
              refreshTrigger={refreshTrigger}
              onWorkoutComplete={handleWorkoutComplete}
            />
          </div>

          {/* Right Column - Meal Tracker */}
          <div>
            <MealTracker 
              refreshTrigger={refreshTrigger}
              onMealAdded={handleMealAnalysisComplete}
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

      {/* Fixed Footer Tips */}
      <footer className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-blue-50 to-green-50 border-t border-blue-200 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">💡 Beginner Tips</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-800">Getting Started:</h3>
              <ul className="space-y-1 text-gray-700">
                <li>• Start with 15-20 minute workouts</li>
                <li>• Focus on consistency over intensity</li>
                <li>• Listen to your body and rest when needed</li>
                <li>• Track your progress daily</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-800">Building Habits:</h3>
              <ul className="space-y-1 text-gray-700">
                <li>• Set a regular workout time</li>
                <li>• Start small and gradually increase</li>
                <li>• Celebrate small victories</li>
                <li>• Don't break the chain!</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-800">Nutrition Tracking:</h3>
              <ul className="space-y-1 text-gray-700">
                <li>• Use AI photo analysis for easy tracking</li>
                <li>• Estimates are better than no tracking</li>
                <li>• Focus on building the habit first</li>
                <li>• Take photos from above for best results</li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 