"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { format, subDays, differenceInDays } from "date-fns";
import Model, { IExerciseData } from 'react-body-highlighter';
import { MuscleGroup } from "@/types/fitness";
import FormAnalyzer from "./form-analyzer";

interface MuscleFrequencyTrackerProps {
  refreshTrigger?: number;
}

interface WorkoutEntry {
  id: string;
  date: string;
  muscle_groups: MuscleGroup[] | null;
}

// Map our muscle groups to react-body-highlighter muscle names
const muscleGroupMapping: Record<MuscleGroup, string[]> = {
  'chest': ['chest'],
  'back': ['trapezius', 'upper-back', 'lower-back'],
  'arms': ['biceps', 'triceps', 'forearm', 'front-deltoids', 'back-deltoids'],
  'legs': ['quadriceps', 'hamstring', 'gluteal', 'calves', 'adductor', 'abductors']
};

export default function MuscleFrequencyTracker({ refreshTrigger }: MuscleFrequencyTrackerProps) {
  const { user } = useAuth();
  const [exerciseData, setExerciseData] = useState<IExerciseData[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMuscleFrequency = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Get workouts from the last 7 days
      const sevenDaysAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd');
      const today = format(new Date(), 'yyyy-MM-dd');
      
      const { data: workouts, error } = await supabase
        .from('workout_entries')
        .select('id, date, muscle_groups')
        .eq('user_id', user.id)
        .gte('date', sevenDaysAgo)
        .lte('date', today)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error loading workout history:', error);
        return;
      }

      // Process workouts to create exercise data for body highlighter
      const processedData: IExerciseData[] = [];
      const muscleLastWorked: Record<string, number> = {};

      workouts?.forEach((workout: WorkoutEntry) => {
        if (workout.muscle_groups && workout.muscle_groups.length > 0) {
          const daysAgo = differenceInDays(new Date(), new Date(workout.date));
          
          workout.muscle_groups.forEach((muscleGroup: MuscleGroup) => {
            const mappedMuscles = muscleGroupMapping[muscleGroup] || [];
            
            mappedMuscles.forEach(muscle => {
              // Only update if this is the most recent workout for this muscle
              if (!muscleLastWorked[muscle] || daysAgo < muscleLastWorked[muscle]) {
                muscleLastWorked[muscle] = daysAgo;
              }
            });
          });
        }
      });

      // Create exercise data based on muscle frequency
      Object.entries(muscleLastWorked).forEach(([muscle, daysAgo]) => {
        // Determine frequency based on how recently the muscle was worked
        let frequency = 1;
        if (daysAgo === 0) frequency = 4; // Today - darkest red
        else if (daysAgo === 1) frequency = 3; // Yesterday - dark red
        else if (daysAgo === 2) frequency = 2; // 2 days ago - medium red
        else if (daysAgo === 3) frequency = 1; // 3 days ago - light red
        // 4+ days ago will be green (default)
        
        if (daysAgo <= 3) {
                     processedData.push({
             name: `Last worked ${daysAgo === 0 ? 'today' : `${daysAgo} day${daysAgo > 1 ? 's' : ''} ago`}`,
             muscles: [muscle as any], // Type assertion for muscle names
             frequency
           });
        }
      });

      setExerciseData(processedData);
    } catch (error) {
      console.error('Error processing muscle frequency:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMuscleFrequency();
  }, [user, refreshTrigger]);



  // Color scheme: Green for recovered muscles, Red shades for recently worked
  const highlightedColors = [
    '#10B981', // Green - 3 days ago (recovered)
    '#F59E0B', // Amber - 2 days ago 
    '#EF4444', // Red - yesterday
    '#DC2626', // Dark red - today
  ];

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 border border-gray-100">
        <div className="animate-pulse">
          <div className="h-5 bg-gray-200 rounded mb-3 w-32"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Muscle Recovery Visualization */}
      <div className="bg-white rounded-lg shadow-md p-4 border border-gray-100">
        <div className="flex justify-center gap-2">
          {/* Anterior View */}
          <Model
            data={exerciseData}
            style={{ width: '100%', maxWidth: '120px' }}
            highlightedColors={highlightedColors}
            bodyColor="#E5E7EB"
            type="anterior"
          />
          
          {/* Posterior View */}
          <Model
            data={exerciseData}
            style={{ width: '100%', maxWidth: '120px' }}
            highlightedColors={highlightedColors}
            bodyColor="#E5E7EB"
            type="posterior"
          />
        </div>
      </div>

      {/* Form Analyzer */}
      <FormAnalyzer />
    </div>
  );
} 