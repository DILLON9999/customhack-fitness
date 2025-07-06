"use client";

import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { 
  Apple, 
  Clock, 
  Target, 
  Trash2, 
  Camera, 
  Upload, 
  Loader2, 
  Utensils, 
  Info,
  AlertCircle
} from "lucide-react";
import { MealAnalysis, NutritionEntry } from "@/types/fitness";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { motion, AnimatePresence } from "motion/react";
import { analyzeMealPhoto } from "@/lib/gemini";

interface MealTrackerProps {
  refreshTrigger?: number;
  onMealAdded: (analysis: MealAnalysis) => void;
}

interface MealEntry extends NutritionEntry {
  meal_analysis?: MealAnalysis;
}

export default function MealTracker({ refreshTrigger, onMealAdded }: MealTrackerProps) {
  const { user } = useAuth();
  const [todaysMeals, setTodaysMeals] = useState<MealEntry[]>([]);
  const [totalCalories, setTotalCalories] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Photo analyzer state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAnalyzerTips, setShowAnalyzerTips] = useState(false);
  const [showTrackerTips, setShowTrackerTips] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const today = format(new Date(), 'yyyy-MM-dd');

  const loadTodaysMeals = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Load today's nutrition entries
      const { data: meals, error } = await supabase
        .from('nutrition_entries')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading meals:', error);
        return;
      }

      const mealsWithAnalysis = meals?.map(meal => {
        // Try to parse meal analysis from notes if it exists
        let meal_analysis: MealAnalysis | undefined;
        try {
          if (meal.notes && meal.notes.startsWith('{')) {
            meal_analysis = JSON.parse(meal.notes);
          }
        } catch (e) {
          // Notes aren't JSON, that's fine
        }
        
        return {
          ...meal,
          meal_analysis
        };
      }) || [];

      setTodaysMeals(mealsWithAnalysis);
      
      // Calculate total calories
      const total = mealsWithAnalysis.reduce((sum, meal) => sum + meal.calories, 0);
      setTotalCalories(total);
      
    } catch (error) {
      console.error('Error loading today\'s meals:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTodaysMeals();
  }, [user, refreshTrigger]);

  const handleDeleteMeal = async (mealId: string) => {
    try {
      const { error } = await supabase
        .from('nutrition_entries')
        .delete()
        .eq('id', mealId);

      if (error) {
        console.error('Error deleting meal:', error);
        alert('Failed to delete meal');
        return;
      }

      // Refresh the list
      loadTodaysMeals();
    } catch (error) {
      console.error('Error deleting meal:', error);
      alert('Failed to delete meal');
    }
  };

  const getCalorieGoalStatus = () => {
    const goal = 2000; // Could be made configurable
    const percentage = (totalCalories / goal) * 100;
    
    if (percentage < 50) return { color: 'text-red-600', message: 'Below target' };
    if (percentage < 80) return { color: 'text-yellow-600', message: 'Getting there' };
    if (percentage <= 110) return { color: 'text-green-600', message: 'On track!' };
    return { color: 'text-orange-600', message: 'Above target' };
  };

  // Photo analyzer methods
  const handleFileSelect = async (file: File) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image too large. Please select an image under 10MB');
      return;
    }

    setError(null);
    
    // Create preview
    const imageUrl = URL.createObjectURL(file);
    setPreviewImage(imageUrl);

    // Analyze the image
    try {
      setIsAnalyzing(true);
      const analysis = await analyzeMealPhoto(file);
      onMealAdded(analysis);
      // Clear preview after successful analysis
      setPreviewImage(null);
    } catch (error) {
      console.error('Analysis error:', error);
      setError(error instanceof Error ? error.message : 'Failed to analyze meal');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-orange-100">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const goalStatus = getCalorieGoalStatus();

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-orange-100 space-y-6">
      {/* AI Meal Analyzer Section */}
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Utensils className="w-6 h-6 text-orange-600" />
            <h3 className="text-xl font-bold text-gray-900">AI Meal Analyzer</h3>
          </div>
          <button
            onClick={() => setShowAnalyzerTips(!showAnalyzerTips)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <Info className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Analyzer Tips Popup */}
        <AnimatePresence>
          {showAnalyzerTips && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute top-16 right-4 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-10 w-72"
            >
              <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-yellow-800">
                    <strong>Note:</strong> This is an AI estimation to help build tracking habits. 
                    Results may not be 100% accurate but are better than not tracking at all!
                  </div>
                </div>
              </div>
              <div className="text-xs text-gray-600">
                <p className="font-medium mb-2">📸 Tips for better analysis:</p>
                <ul className="space-y-1 ml-2">
                  <li>• Take photos from above for best view</li>
                  <li>• Ensure good lighting</li>
                  <li>• Include the whole plate/meal</li>
                  <li>• Avoid blurry or dark photos</li>
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            isAnalyzing 
              ? 'border-orange-300 bg-orange-50' 
              : 'border-gray-300 hover:border-orange-400 hover:bg-orange-50 cursor-pointer'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={!isAnalyzing ? triggerFileInput : undefined}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInputChange}
            className="hidden"
            disabled={isAnalyzing}
          />

          {isAnalyzing ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
              <p className="text-sm text-orange-700 font-medium">Analyzing your meal...</p>
              <p className="text-xs text-orange-600">This may take a few seconds</p>
            </div>
          ) : previewImage ? (
            <div className="space-y-3">
              <img 
                src={previewImage} 
                alt="Meal preview" 
                className="max-h-32 mx-auto rounded-lg object-cover"
              />
              <p className="text-sm text-gray-600">Click to analyze another meal</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-center gap-4">
                <Camera className="w-8 h-8 text-gray-400" />
                <Upload className="w-8 h-8 text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Click to upload or drag & drop
                </p>
                <p className="text-xs text-gray-500">
                  JPG, PNG, or other image formats
                </p>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
      </div>

      {/* Today's Meals Section */}
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Apple className="w-6 h-6 text-orange-600" />
            <h3 className="text-xl font-bold text-gray-900">Today's Meals</h3>
          </div>
          <button
            onClick={() => setShowTrackerTips(!showTrackerTips)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <Info className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Tracker Tips Popup */}
        <AnimatePresence>
          {showTrackerTips && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute top-16 right-4 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-10 w-64"
            >
              <p className="text-xs text-gray-700">
                <strong>💡 Tip:</strong> Regular meal tracking helps build healthy habits. 
                Even rough estimates are better than no tracking at all!
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Calorie Summary */}
        <div className="mb-6 p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg border border-orange-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Total Calories</span>
            <Target className="w-4 h-4 text-orange-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-orange-600">{totalCalories}</span>
            <span className="text-sm text-gray-600">/ 2000</span>
          </div>
          <div className={`text-sm font-medium ${goalStatus.color} mt-1`}>
            {goalStatus.message}
          </div>
          
          {/* Progress Bar */}
          <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-orange-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min((totalCalories / 2000) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Meals List */}
        <div className="space-y-3">
          <AnimatePresence>
            {todaysMeals.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Apple className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">No meals logged today</p>
                <p className="text-xs">Use the AI analyzer to get started!</p>
              </div>
            ) : (
              todaysMeals.map((meal) => (
                <motion.div
                  key={meal.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {format(new Date(meal.created_at), 'h:mm a')}
                        </span>
                        {meal.meal_analysis?.meal_type && (
                          <span className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded-full">
                            {meal.meal_analysis.meal_type}
                          </span>
                        )}
                      </div>
                      <div className="text-lg font-semibold text-gray-900 mb-1">
                        {meal.calories} calories
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleDeleteMeal(meal.id)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Food Items */}
                  {meal.meal_analysis?.food_items && (
                    <div className="space-y-2">
                      {meal.meal_analysis.food_items.map((item, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <span className="text-gray-700">{item.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{item.estimated_calories} cal</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Analysis Notes */}
                  {meal.meal_analysis?.analysis_notes && (
                    <div className="mt-2 text-xs text-gray-600 italic">
                      {meal.meal_analysis.analysis_notes}
                    </div>
                  )}

                  {/* Manual Entry */}
                  {!meal.meal_analysis && meal.notes && (
                    <div className="mt-2 text-sm text-gray-600">
                      {meal.notes}
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
} 