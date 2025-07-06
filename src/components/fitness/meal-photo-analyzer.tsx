"use client";

import { useState, useRef } from "react";
import { Camera, Upload, Loader2, Utensils, AlertCircle } from "lucide-react";
import { ShimmerButton } from "@/components/magicui/shimmer-button";
import { analyzeMealPhoto } from "@/lib/gemini";
import { MealAnalysis } from "@/types/fitness";

interface MealPhotoAnalyzerProps {
  onAnalysisComplete: (analysis: MealAnalysis, imageUrl: string) => void;
}

export default function MealPhotoAnalyzer({ onAnalysisComplete }: MealPhotoAnalyzerProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      onAnalysisComplete(analysis, imageUrl);
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

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-orange-100">
      <div className="text-center mb-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Utensils className="w-6 h-6 text-orange-600" />
          <h3 className="text-xl font-bold text-gray-900">AI Meal Analyzer</h3>
        </div>
        <p className="text-sm text-gray-600">
          Take a photo of your meal for calorie estimation
        </p>
      </div>

      {/* Disclaimer */}
      <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-yellow-800">
            <strong>Note:</strong> This is an AI estimation to help build tracking habits. 
            Results may not be 100% accurate but are better than not tracking at all!
          </div>
        </div>
      </div>

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

      {/* Quick Tips */}
      <div className="mt-4 text-xs text-gray-600">
        <p className="font-medium mb-1">📸 Tips for better analysis:</p>
        <ul className="space-y-1 ml-2">
          <li>• Take photos from above for best view</li>
          <li>• Ensure good lighting</li>
          <li>• Include the whole plate/meal</li>
          <li>• Avoid blurry or dark photos</li>
        </ul>
      </div>
    </div>
  );
} 