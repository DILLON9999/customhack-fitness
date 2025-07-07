"use client";

import { useState, useEffect } from "react";
import { X, Dumbbell, Apple, Save, Trash2 } from "lucide-react";
import { DayData, WorkoutEntry, NutritionEntry, MuscleGroup } from "@/types/fitness";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { ShimmerButton } from "@/components/magicui/shimmer-button";
import { format } from "date-fns";

interface DayEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  dayData: DayData;
  onSave: () => void;
}

export default function DayEntryModal({ isOpen, onClose, date, dayData, onSave }: DayEntryModalProps) {
  const { user } = useAuth();
  const [workoutDuration, setWorkoutDuration] = useState("");
  const [workoutType, setWorkoutType] = useState("");
  const [muscleGroups, setMuscleGroups] = useState<MuscleGroup[]>([]);
  const [workoutNotes, setWorkoutNotes] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [nutritionNotes, setNutritionNotes] = useState("");
  const [loading, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && dayData) {
      // Pre-fill form with existing data
      setWorkoutDuration(dayData.workout?.duration_minutes?.toString() || "");
      setWorkoutType(dayData.workout?.workout_type || "");
      setMuscleGroups(dayData.workout?.muscle_groups || []);
      setWorkoutNotes(dayData.workout?.notes || "");
      setCalories(dayData.nutrition?.calories?.toString() || "");
      setProtein(dayData.nutrition?.protein?.toString() || "");
      setCarbs(dayData.nutrition?.carbs?.toString() || "");
      setFat(dayData.nutrition?.fat?.toString() || "");
      setNutritionNotes(dayData.nutrition?.notes || "");
    }
  }, [isOpen, dayData]);

  const handleSaveWorkout = async () => {
    if (!user || !workoutDuration) return;

    try {
      setSaving(true);
      
      const workoutData = {
        user_id: user.id,
        date,
        duration_minutes: parseInt(workoutDuration),
        workout_type: workoutType || null,
        muscle_groups: muscleGroups.length > 0 ? muscleGroups : null,
        notes: workoutNotes || null,
      };

      console.log('Saving workout data:', workoutData);

      let result;
      if (dayData.workout) {
        // Update existing workout
        result = await supabase
          .from('workout_entries')
          .update(workoutData)
          .eq('id', dayData.workout.id)
          .select();
      } else {
        // Create new workout
        result = await supabase
          .from('workout_entries')
          .insert(workoutData)
          .select();
      }

      console.log('Workout save result:', result);

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
        }
      } catch (awardErr) {
        console.error('Award function error:', awardErr);
      }

      onSave();
    } catch (error) {
      console.error('Error saving workout:', error);
      alert(`Error saving workout: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNutrition = async () => {
    if (!user || !calories) return;

    try {
      setSaving(true);
      
      const nutritionData = {
        user_id: user.id,
        date,
        calories: parseInt(calories),
        protein: protein ? parseInt(protein) : null,
        carbs: carbs ? parseInt(carbs) : null,
        fat: fat ? parseInt(fat) : null,
        notes: nutritionNotes || null,
      };

      console.log('Saving nutrition data:', nutritionData);

      let result;
      if (dayData.nutrition) {
        // Update existing nutrition
        result = await supabase
          .from('nutrition_entries')
          .update(nutritionData)
          .eq('id', dayData.nutrition.id)
          .select();
      } else {
        // Create new nutrition
        result = await supabase
          .from('nutrition_entries')
          .insert(nutritionData)
          .select();
      }

      console.log('Nutrition save result:', result);

      if (result.error) {
        console.error('Supabase error:', result.error);
        alert(`Error saving nutrition: ${result.error.message}`);
        return;
      }

      onSave();
    } catch (error) {
      console.error('Error saving nutrition:', error);
      alert(`Error saving nutrition: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteWorkout = async () => {
    if (!dayData.workout) return;

    try {
      setSaving(true);
      await supabase
        .from('workout_entries')
        .delete()
        .eq('id', dayData.workout.id);
      
      setWorkoutDuration("");
      setWorkoutType("");
      setMuscleGroups([]);
      setWorkoutNotes("");
      onSave();
    } catch (error) {
      console.error('Error deleting workout:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNutrition = async () => {
    if (!dayData.nutrition) return;

    try {
      setSaving(true);
      await supabase
        .from('nutrition_entries')
        .delete()
        .eq('id', dayData.nutrition.id);
      
      setCalories("");
      setProtein("");
      setCarbs("");
      setFat("");
      setNutritionNotes("");
      onSave();
    } catch (error) {
      console.error('Error deleting nutrition:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const formattedDate = format(new Date(date), 'EEEE, MMMM d, yyyy');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Log Activity</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="text-center text-sm text-gray-600 mb-4">
            {formattedDate}
          </div>

          {/* Workout Section */}
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center gap-2 mb-4">
              <Dumbbell className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-green-900">Workout</h3>
              {dayData.workout && (
                <button
                  onClick={handleDeleteWorkout}
                  disabled={loading}
                  className="ml-auto p-1 text-red-500 hover:bg-red-100 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (minutes) *
                </label>
                <input
                  type="number"
                  value={workoutDuration}
                  onChange={(e) => setWorkoutDuration(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="30"
                  min="1"
                  max="300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Workout Type
                </label>
                <select
                  value={workoutType}
                  onChange={(e) => setWorkoutType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select type...</option>
                  <option value="cardio">Cardio</option>
                  <option value="strength">Strength Training</option>
                  <option value="yoga">Yoga</option>
                  <option value="walking">Walking</option>
                  <option value="running">Running</option>
                  <option value="cycling">Cycling</option>
                  <option value="swimming">Swimming</option>
                  <option value="sports">Sports</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Muscle Groups Trained
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['chest', 'back', 'arms', 'legs'] as MuscleGroup[]).map((group) => (
                    <button
                      key={group}
                      type="button"
                      onClick={() => {
                        setMuscleGroups(prev => 
                          prev.includes(group) 
                            ? prev.filter(g => g !== group)
                            : [...prev, group]
                        );
                      }}
                      className={`p-2 rounded-lg border-2 transition-all capitalize ${
                        muscleGroups.includes(group)
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {group}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={workoutNotes}
                  onChange={(e) => setWorkoutNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows={2}
                  placeholder="How did it go?"
                />
              </div>

              <ShimmerButton
                onClick={handleSaveWorkout}
                disabled={loading || !workoutDuration}
                className="w-full bg-green-600 hover:bg-green-700"
                background="rgb(34, 197, 94)"
              >
                <Save className="w-4 h-4 mr-2" />
                {dayData.workout ? "Update Workout" : "Save Workout"}
              </ShimmerButton>
            </div>
          </div>

          {/* Nutrition Section */}
          <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
            <div className="flex items-center gap-2 mb-4">
              <Apple className="w-5 h-5 text-orange-600" />
              <h3 className="font-semibold text-orange-900">Nutrition</h3>
              {dayData.nutrition && (
                <button
                  onClick={handleDeleteNutrition}
                  disabled={loading}
                  className="ml-auto p-1 text-red-500 hover:bg-red-100 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Calories *
                </label>
                <input
                  type="number"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="2000"
                  min="500"
                  max="5000"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Protein (g)
                  </label>
                  <input
                    type="number"
                    value={protein}
                    onChange={(e) => setProtein(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="120"
                    min="0"
                    max="300"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Carbs (g)
                  </label>
                  <input
                    type="number"
                    value={carbs}
                    onChange={(e) => setCarbs(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="200"
                    min="0"
                    max="500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fat (g)
                  </label>
                  <input
                    type="number"
                    value={fat}
                    onChange={(e) => setFat(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="70"
                    min="0"
                    max="200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={nutritionNotes}
                  onChange={(e) => setNutritionNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  rows={2}
                  placeholder="What did you eat?"
                />
              </div>

              <ShimmerButton
                onClick={handleSaveNutrition}
                disabled={loading || !calories}
                className="w-full bg-orange-600 hover:bg-orange-700"
                background="rgb(234, 88, 12)"
              >
                <Save className="w-4 h-4 mr-2" />
                {dayData.nutrition ? "Update Nutrition" : "Save Nutrition"}
              </ShimmerButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 