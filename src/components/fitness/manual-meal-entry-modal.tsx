"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { X, Plus, Trash2 } from "lucide-react";
import { MealAnalysis } from "@/types/fitness";

interface ManualMealEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (analysis: MealAnalysis) => void;
}

interface FoodItem {
  name: string;
  estimated_calories: number;
  confidence: 'low' | 'medium' | 'high';
}

export default function ManualMealEntryModal({ isOpen, onClose, onSave }: ManualMealEntryModalProps) {
  const [mealTitle, setMealTitle] = useState("");
  const [totalCalories, setTotalCalories] = useState("");
  const [totalProtein, setTotalProtein] = useState("");
  const [totalCarbs, setTotalCarbs] = useState("");
  const [totalFat, setTotalFat] = useState("");
  const [mealType, setMealType] = useState("");
  const [analysisNotes, setAnalysisNotes] = useState("");
  const [foodItems, setFoodItems] = useState<FoodItem[]>([
    { name: "", estimated_calories: 0, confidence: 'medium' }
  ]);

  const handleAddFoodItem = () => {
    setFoodItems([...foodItems, { name: "", estimated_calories: 0, confidence: 'medium' }]);
  };

  const handleRemoveFoodItem = (index: number) => {
    if (foodItems.length > 1) {
      setFoodItems(foodItems.filter((_, i) => i !== index));
    }
  };

  const handleFoodItemChange = (index: number, field: keyof FoodItem, value: string | number) => {
    const updated = foodItems.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    );
    setFoodItems(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!mealTitle.trim() || !totalCalories) {
      alert("Please fill in meal title and total calories");
      return;
    }

    // Filter out empty food items
    const validFoodItems = foodItems.filter(item => item.name.trim() && item.estimated_calories > 0);

    const analysis: MealAnalysis = {
      meal_title: mealTitle.trim(),
      food_items: validFoodItems,
      total_calories: parseInt(totalCalories),
      total_protein: totalProtein ? parseInt(totalProtein) : 0,
      total_carbs: totalCarbs ? parseInt(totalCarbs) : 0,
      total_fat: totalFat ? parseInt(totalFat) : 0,
      meal_type: mealType || undefined,
      analysis_notes: analysisNotes.trim() || undefined
    };

    onSave(analysis);
    handleReset();
    onClose();
  };

  const handleReset = () => {
    setMealTitle("");
    setTotalCalories("");
    setTotalProtein("");
    setTotalCarbs("");
    setTotalFat("");
    setMealType("");
    setAnalysisNotes("");
    setFoodItems([{ name: "", estimated_calories: 0, confidence: 'medium' }]);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Add Manual Meal Entry</h2>
            <button
              onClick={handleClose}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Meal Title *
              </label>
              <input
                type="text"
                value={mealTitle}
                onChange={(e) => setMealTitle(e.target.value)}
                placeholder="e.g., Chicken Caesar Salad"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Meal Type
              </label>
              <select
                value={mealType}
                onChange={(e) => setMealType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="">Select type</option>
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Snack</option>
              </select>
            </div>
          </div>

          {/* Nutrition Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Calories *
              </label>
              <input
                type="number"
                value={totalCalories}
                onChange={(e) => setTotalCalories(e.target.value)}
                placeholder="500"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Protein (g)
                </label>
                <input
                  type="number"
                  value={totalProtein}
                  onChange={(e) => setTotalProtein(e.target.value)}
                  placeholder="25"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Carbs (g)
                </label>
                <input
                  type="number"
                  value={totalCarbs}
                  onChange={(e) => setTotalCarbs(e.target.value)}
                  placeholder="50"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fat (g)
                </label>
                <input
                  type="number"
                  value={totalFat}
                  onChange={(e) => setTotalFat(e.target.value)}
                  placeholder="15"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Food Items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Food Items (Optional)
              </label>
              <button
                type="button"
                onClick={handleAddFoodItem}
                className="flex items-center gap-1 px-2 py-1 text-sm text-orange-600 hover:text-orange-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>
            </div>

            <div className="space-y-3">
              {foodItems.map((item, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
                  <div className="md:col-span-6">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => handleFoodItemChange(index, 'name', e.target.value)}
                      placeholder="Food item name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <input
                      type="number"
                      value={item.estimated_calories || ''}
                      onChange={(e) => handleFoodItemChange(index, 'estimated_calories', parseInt(e.target.value) || 0)}
                      placeholder="Calories"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <select
                      value={item.confidence}
                      onChange={(e) => handleFoodItemChange(index, 'confidence', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div className="md:col-span-1">
                    <button
                      type="button"
                      onClick={() => handleRemoveFoodItem(index)}
                      disabled={foodItems.length === 1}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={analysisNotes}
              onChange={(e) => setAnalysisNotes(e.target.value)}
              placeholder="Any additional notes about this meal..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-md hover:bg-orange-700 transition-colors"
            >
              Save Meal
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
} 