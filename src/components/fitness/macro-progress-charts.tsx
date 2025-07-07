"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";

interface MacroData {
  protein: number;
  carbs: number;
  fat: number;
}

interface MacroProgressChartsProps {
  refreshTrigger?: number;
}

export default function MacroProgressCharts({ refreshTrigger }: MacroProgressChartsProps) {
  const { user } = useAuth();
  const [macroData, setMacroData] = useState<MacroData>({ protein: 0, carbs: 0, fat: 0 });
  const [loading, setLoading] = useState(true);

  // Typical daily macro goals (adjustable defaults)
  const goals = {
    protein: 120, // grams
    carbs: 200,   // grams
    fat: 70       // grams
  };

  const loadTodaysMacros = async (skipLoading = false) => {
    if (!user) return;

    try {
      if (!skipLoading) {
        setLoading(true);
      }
      const today = format(new Date(), 'yyyy-MM-dd');
      
      // Load today's nutrition entries
      const { data: meals, error } = await supabase
        .from('nutrition_entries')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today);

      if (error) {
        console.error('Error loading meals for macros:', error);
        return;
      }

      // Calculate total macros
      let totalProtein = 0;
      let totalCarbs = 0;
      let totalFat = 0;

      meals?.forEach(meal => {
        // Use direct columns if available
        if (meal.protein) totalProtein += meal.protein;
        if (meal.carbs) totalCarbs += meal.carbs;
        if (meal.fat) totalFat += meal.fat;

        // Also try to get from meal analysis in notes
        try {
          if (meal.notes && meal.notes.startsWith('{')) {
            const analysis = JSON.parse(meal.notes);
            if (!meal.protein && analysis.total_protein) totalProtein += analysis.total_protein;
            if (!meal.carbs && analysis.total_carbs) totalCarbs += analysis.total_carbs;
            if (!meal.fat && analysis.total_fat) totalFat += analysis.total_fat;
          }
        } catch (e) {
          // Ignore parsing errors
        }
      });

      setMacroData({
        protein: totalProtein,
        carbs: totalCarbs,
        fat: totalFat
      });
      
    } catch (error) {
      console.error('Error loading today\'s macros:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (refreshTrigger === 0) {
      // Initial load - show loading state
      loadTodaysMacros();
    } else {
      // Refresh - skip loading state for smoother UX
      loadTodaysMacros(true);
    }
  }, [user, refreshTrigger]);

  const createRadialChart = (value: number, goal: number, color: string, label: string) => {
    const percentage = Math.min((value / goal) * 100, 100);
    const circumference = 2 * Math.PI * 40; // radius is 40
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className="flex flex-col items-center">
        <div className="relative w-24 h-24 mb-2">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              className="text-gray-200"
            />
            {/* Progress circle */}
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke={color}
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-bold text-gray-900">{Math.round(value)}</span>
            <span className="text-xs text-gray-500">/ {goal}g</span>
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm font-medium text-gray-900">{label}</div>
          <div className="text-xs text-gray-500">{Math.round(percentage)}%</div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-blue-100">
        <div className="animate-pulse">
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex flex-col items-center">
                <div className="w-24 h-24 bg-gray-200 rounded-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-blue-100">
      <div className="grid grid-cols-3 gap-4">
        {createRadialChart(macroData.protein, goals.protein, "#10B981", "Protein")}
        {createRadialChart(macroData.carbs, goals.carbs, "#3B82F6", "Carbs")}
        {createRadialChart(macroData.fat, goals.fat, "#F59E0B", "Fat")}
      </div>
    </div>
  );
} 