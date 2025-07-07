"use client";

import { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, parseISO, isSameDay } from "date-fns";
import { ChevronLeft, ChevronRight, Dumbbell, Apple, Plus, Play, Pause, Square, Timer } from "lucide-react";
import { DayData, WorkoutEntry, NutritionEntry, FitnessGoal } from "@/types/fitness";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

interface FitnessCalendarProps {
  onDayClick: (date: string, dayData: DayData) => void;
  refreshTrigger?: number;
  onWorkoutComplete?: (durationMinutes: number) => Promise<void>;
  fitnessGoal?: FitnessGoal;
}

type CalendarMode = 'workout' | 'nutrition';

export default function FitnessCalendar({ onDayClick, refreshTrigger, onWorkoutComplete, fitnessGoal = 'lose_weight' }: FitnessCalendarProps) {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [monthData, setMonthData] = useState<Map<string, DayData>>(new Map());
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<CalendarMode>('workout');
  
  // Timer state
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [seconds, setSeconds] = useState(0);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && !isPaused) {
      interval = setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, isPaused]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    setIsRunning(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    setIsPaused(true);
  };

  const handleResume = () => {
    setIsPaused(false);
  };

  const handleStop = async () => {
    if (seconds > 0 && onWorkoutComplete) {
      const minutes = Math.ceil(seconds / 60);
      await onWorkoutComplete(minutes);
    }
    setIsRunning(false);
    setIsPaused(false);
    setSeconds(0);
  };

  const loadMonthData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const startDate = format(monthStart, 'yyyy-MM-dd');
      const endDate = format(monthEnd, 'yyyy-MM-dd');

      // Fetch workouts for the month
      const { data: workouts } = await supabase
        .from('workout_entries')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startDate)
        .lte('date', endDate);

      // Fetch nutrition for the month
      const { data: nutrition } = await supabase
        .from('nutrition_entries')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startDate)
        .lte('date', endDate);

      // Create a map of day data
      const dataMap = new Map<string, DayData>();
      
      days.forEach(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const workout = workouts?.find(w => w.date === dateStr);
        const nutritionEntry = nutrition?.find(n => n.date === dateStr);
        
        dataMap.set(dateStr, {
          date: dateStr,
          workout,
          nutrition: nutritionEntry,
          hasWorkout: !!workout,
          hasNutrition: !!nutritionEntry,
        });
      });

      setMonthData(dataMap);
    } catch (error) {
      console.error('Error loading month data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMonthData();
  }, [currentDate, user, refreshTrigger]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const handleDayClick = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const dayData = monthData.get(dateStr) || {
      date: dateStr,
      hasWorkout: false,
      hasNutrition: false,
    };
    onDayClick(dateStr, dayData);
  };

  const getDayClasses = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const dayData = monthData.get(dateStr);
    const isCurrentMonth = isSameMonth(day, currentDate);
    const isTodayDate = isToday(day);
    const isPastDate = day < new Date(new Date().setHours(0, 0, 0, 0));
    
    let classes = "relative h-16 w-full p-1 cursor-pointer transition-all duration-200 hover:scale-105 rounded-lg border-2 ";
    
    if (!isCurrentMonth) {
      classes += "text-gray-300 bg-gray-50 border-gray-100 ";
    } else if (isTodayDate) {
      classes += "bg-blue-100 border-blue-300 text-blue-900 font-bold ";
    } else if (mode === 'workout') {
      if (dayData?.hasWorkout) {
        // Workout completed - green
        classes += "bg-green-100 border-green-400 text-green-900 ";
      } else if (isPastDate) {
        // Past date with no workout - red (missed day)
        classes += "bg-red-50 border-red-200 text-red-700 ";
      } else {
        // Future date or today without workout
        classes += "bg-white border-gray-200 hover:border-gray-300 ";
      }
    } else {
      // Nutrition mode
      if (dayData?.hasNutrition && !isTodayDate) {
        const nutritionStatus = getNutritionStatus(dayData);
        if (nutritionStatus === 'over_goal') {
          classes += fitnessGoal === 'lose_weight' 
            ? "bg-red-100 border-red-300 text-red-900 "
            : "bg-green-100 border-green-300 text-green-900 ";
        } else if (nutritionStatus === 'under_goal') {
          classes += fitnessGoal === 'lose_weight' 
            ? "bg-green-100 border-green-300 text-green-900 "
            : "bg-red-100 border-red-300 text-red-900 ";
        } else {
          classes += "bg-white border-gray-200 hover:border-gray-300 ";
        }
      } else {
        classes += "bg-white border-gray-200 hover:border-gray-300 ";
      }
    }
    
    return classes;
  };

  const getNutritionValue = (dayData: DayData | undefined) => {
    if (!dayData?.nutrition) return 0;
    
    if (fitnessGoal === 'gain_muscle') {
      // Return protein value
      if (dayData.nutrition.protein) return dayData.nutrition.protein;
      
      // Try to get protein from meal analysis
      try {
        const notes = dayData.nutrition.notes;
        if (typeof notes === 'string') {
          const parsed = JSON.parse(notes);
          return parsed.total_protein || 0;
        }
      } catch {
        // Fall back to 0 if no protein data
      }
      return 0;
    } else {
      // Return calories value
      try {
        const notes = dayData.nutrition.notes;
        if (typeof notes === 'string') {
          const parsed = JSON.parse(notes);
          return parsed.total_calories || dayData.nutrition.calories || 0;
        }
        return dayData.nutrition.calories || 0;
      } catch {
        return dayData.nutrition.calories || 0;
      }
    }
  };

  const getNutritionStatus = (dayData: DayData | undefined) => {
    if (!dayData?.nutrition) return 'none';
    
    const value = getNutritionValue(dayData);
    if (value === 0) return 'none';
    
    if (fitnessGoal === 'gain_muscle') {
      const proteinGoal = 120; // grams
      if (value >= proteinGoal) return 'over_goal';
      return 'under_goal';
    } else {
      const calorieGoal = 1800; // calories for weight loss
      if (value > calorieGoal) return 'over_goal';
      return 'under_goal';
    }
  };

  const getNutritionGoal = () => {
    return fitnessGoal === 'gain_muscle' ? '120g' : '1800';
  };

  const getNutritionLabel = () => {
    return fitnessGoal === 'gain_muscle' ? 'Protein' : 'Calories';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-100">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-100">
      {/* Header with Timer */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigateMonth('prev')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-900">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          
          {/* Compact Timer */}
          <div className="flex items-center gap-2 bg-green-50 px-3 py-1 rounded-lg border border-green-200">
            <Timer className="w-4 h-4 text-green-600" />
            <span className="text-sm font-mono font-medium text-green-700">
              {formatTime(seconds)}
            </span>
            <div className="flex gap-1">
              {!isRunning ? (
                <button
                  onClick={handleStart}
                  className="p-1 hover:bg-green-100 rounded transition-colors"
                >
                  <Play className="w-3 h-3 text-green-600" />
                </button>
              ) : isPaused ? (
                <button
                  onClick={handleResume}
                  className="p-1 hover:bg-green-100 rounded transition-colors"
                >
                  <Play className="w-3 h-3 text-green-600" />
                </button>
              ) : (
                <button
                  onClick={handlePause}
                  className="p-1 hover:bg-green-100 rounded transition-colors"
                >
                  <Pause className="w-3 h-3 text-green-600" />
                </button>
              )}
              {isRunning && (
                <button
                  onClick={handleStop}
                  className="p-1 hover:bg-red-100 rounded transition-colors"
                >
                  <Square className="w-3 h-3 text-red-600" />
                </button>
              )}
            </div>
          </div>
        </div>
        
        <button
          onClick={() => navigateMonth('next')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Mode Toggle */}
      <div className="flex items-center justify-center mb-6">
        <div className="bg-gray-100 rounded-lg p-1 flex">
          <button
            onClick={() => setMode('workout')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
              mode === 'workout' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Dumbbell className="w-4 h-4" />
            Workout
          </button>
          <button
            onClick={() => setMode('nutrition')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
              mode === 'nutrition' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Apple className="w-4 h-4" />
            {getNutritionLabel()}
          </button>
        </div>
      </div>

      {/* Days of week */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {days.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const dayData = monthData.get(dateStr);
          const isPastDate = day < new Date(new Date().setHours(0, 0, 0, 0));
          const isCurrentMonth = isSameMonth(day, currentDate);
          
          return (
            <div
              key={dateStr}
              className={getDayClasses(day)}
              onClick={() => handleDayClick(day)}
            >
              <div className="flex flex-col items-center justify-center h-full">
                <div className="text-sm font-medium mb-1">
                  {format(day, 'd')}
                </div>
                
                <div className="flex items-center justify-center">
                  {mode === 'workout' ? (
                    // Workout mode - show green/red dots
                    <>
                      {dayData?.hasWorkout ? (
                        <div className="w-3 h-3 bg-green-500 rounded-full" title="Workout completed" />
                      ) : isPastDate && isCurrentMonth ? (
                        <div className="w-3 h-3 bg-red-400 rounded-full" title="Missed workout" />
                      ) : isCurrentMonth ? (
                        <div className="w-2 h-2 bg-gray-300 rounded-full opacity-50" />
                      ) : null}
                    </>
                  ) : (
                    // Nutrition mode - show value centered
                    <>
                      {dayData?.hasNutrition && isCurrentMonth ? (
                        <div className="text-center">
                          <div className="text-xs font-bold leading-tight">
                            {getNutritionValue(dayData)}
                          </div>
                          <div className="text-xs text-gray-600 leading-tight">
                            /{getNutritionGoal()}
                          </div>
                        </div>
                      ) : isCurrentMonth ? (
                        <div className="w-2 h-2 bg-gray-300 rounded-full opacity-50" />
                      ) : null}
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-600">
        {mode === 'workout' ? (
          <>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Workout Done</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-400 rounded-full"></div>
              <span>Missed Day</span>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>{fitnessGoal === 'gain_muscle' ? 'Hit Goal' : 'Under Goal'}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-red-400 rounded-full"></div>
              <span>{fitnessGoal === 'gain_muscle' ? 'Need More' : 'Over Goal'}</span>
            </div>
          </>
        )}
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
          <span>Today</span>
        </div>
      </div>
    </div>
  );
} 