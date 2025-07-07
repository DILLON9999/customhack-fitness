"use client";

import { useState, useRef } from "react";
import { Video, Upload, Loader2, CheckCircle, XCircle, Eye, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { analyzeWorkoutForm, FormAnalysis } from "@/lib/gemini";

export default function FormAnalyzer() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<FormAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewVideo, setPreviewVideo] = useState<string | null>(null);
  const [videoThumbnail, setVideoThumbnail] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createVideoThumbnail = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      video.onloadedmetadata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        video.currentTime = 1; // Seek to 1 second for thumbnail
      };
      
      video.onseeked = () => {
        if (ctx) {
          ctx.drawImage(video, 0, 0);
          const thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.8);
          resolve(thumbnailDataUrl);
        } else {
          reject(new Error('Canvas context not available'));
        }
      };
      
      video.onerror = () => reject(new Error('Failed to load video'));
      video.src = URL.createObjectURL(file);
    });
  };

  const handleFileSelect = async (file: File) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      setError('Please select a video file');
      return;
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      setError('Video too large. Please select a video under 50MB');
      return;
    }

    setError(null);
    setAnalysis(null);
    setShowResults(false);
    
    // Create preview and thumbnail
    const videoUrl = URL.createObjectURL(file);
    setPreviewVideo(videoUrl);

    try {
      // Create thumbnail
      const thumbnail = await createVideoThumbnail(file);
      setVideoThumbnail(thumbnail);
    } catch (thumbnailError) {
      console.warn('Failed to create thumbnail:', thumbnailError);
    }

    // Analyze the video
    try {
      setIsAnalyzing(true);
      const formAnalysis = await analyzeWorkoutForm(file);
      setAnalysis(formAnalysis);
      
      // Clean up preview after analysis
      setTimeout(() => {
        URL.revokeObjectURL(videoUrl);
        setPreviewVideo(null);
      }, 1000);
    } catch (error) {
      console.error('Form analysis error:', error);
      setError(error instanceof Error ? error.message : 'Failed to analyze form');
      URL.revokeObjectURL(videoUrl);
      setPreviewVideo(null);
      setVideoThumbnail(null);
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
    if (!analysis) {
      fileInputRef.current?.click();
    }
  };

  const handleResultsClick = () => {
    if (analysis) {
      setShowResults(true);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    if (!analysis) {
      const file = event.dataTransfer.files[0];
      if (file) {
        handleFileSelect(file);
      }
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 border border-blue-100">
      <div className="space-y-4">
        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-md p-4 text-center transition-colors ${
            analysis 
              ? 'border-green-300 bg-green-50 cursor-pointer hover:bg-green-100' 
              : isAnalyzing 
                ? 'border-blue-300 bg-blue-50' 
                : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50 cursor-pointer'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={analysis ? handleResultsClick : triggerFileInput}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileInputChange}
            className="hidden"
            disabled={isAnalyzing || !!analysis}
          />

          {analysis ? (
            <div className="space-y-3">
              {videoThumbnail && (
                <div className="flex justify-center">
                  <img 
                    src={videoThumbnail} 
                    alt="Video thumbnail"
                    className="max-h-20 rounded-md shadow-sm"
                  />
                </div>
              )}
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <p className="text-xs font-medium text-green-700">Analysis Complete!</p>
              </div>
              <div className="flex items-center justify-center gap-1">
                <Eye className="w-3 h-3 text-green-600" />
                <p className="text-xs text-green-600">Click to view results</p>
              </div>
            </div>
          ) : isAnalyzing ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
              <p className="text-xs text-blue-700 font-medium">Analyzing form...</p>
              <p className="text-xs text-blue-600">This may take 30-60 seconds</p>
            </div>
          ) : previewVideo ? (
            <div className="space-y-2">
              <video 
                src={previewVideo} 
                className="max-h-24 mx-auto rounded-md"
                controls={false}
                muted
              />
              <p className="text-xs text-gray-600">Video uploaded</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-center gap-3">
                <Video className="w-6 h-6 text-gray-400" />
                <Upload className="w-6 h-6 text-gray-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-700">
                  Upload Form Video
                </p>
                <p className="text-xs text-gray-500">
                  MP4, MOV, or other video formats (max 50MB)
                </p>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="p-2 bg-red-50 border border-red-200 rounded-md">
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}
      </div>

      {/* Results Side Panel */}
      <AnimatePresence>
        {showResults && analysis && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={() => setShowResults(false)}
            />
            
            {/* Side Panel */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 h-full w-96 bg-white shadow-2xl z-50 overflow-y-auto"
            >
              <div className="p-6 space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between border-b pb-4">
                  <h3 className="font-semibold text-gray-900 text-lg">Form Analysis Results</h3>
                  <button
                    onClick={() => setShowResults(false)}
                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                {/* Exercise and Rep Count */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 text-base mb-2">
                    {analysis.exercise_name}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {analysis.rep_count} reps completed
                  </p>
                </div>

                {/* Strengths */}
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <h5 className="font-medium text-green-900 text-sm">Strengths</h5>
                  </div>
                  <ul className="space-y-2">
                    {analysis.strengths.map((strength, index) => (
                      <li key={index} className="text-sm text-green-800">
                        <span>• </span>{strength}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Areas for Improvement */}
                <div className="bg-orange-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <XCircle className="w-4 h-4 text-orange-600" />
                    <h5 className="font-medium text-orange-900 text-sm">Areas for Improvement</h5>
                  </div>
                  <ul className="space-y-2">
                    {analysis.weaknesses.map((weakness, index) => (
                      <li key={index} className="text-sm text-orange-800">
                        <span>• </span>{weakness}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* New Analysis Button */}
                <button
                  onClick={() => {
                    setAnalysis(null);
                    setVideoThumbnail(null);
                    setShowResults(false);
                  }}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Analyze New Video
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
} 