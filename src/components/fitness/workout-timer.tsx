"use client";

import { useState, useEffect, useCallback } from "react";
import { Play, Pause, Square } from "lucide-react";
import { ShimmerButton } from "@/components/magicui/shimmer-button";
import { PulsatingButton } from "@/components/magicui/pulsating-button";
import { WorkoutTimerState } from "@/types/fitness";

interface WorkoutTimerProps {
  onWorkoutComplete: (durationMinutes: number) => void;
}

export default function WorkoutTimer({ onWorkoutComplete }: WorkoutTimerProps) {
  const [timerState, setTimerState] = useState<WorkoutTimerState>({
    isRunning: false,
    startTime: null,
    elapsedTime: 0,
    totalTime: 0,
  });

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const startTimer = useCallback(() => {
    setTimerState(prev => ({
      ...prev,
      isRunning: true,
      startTime: Date.now() - prev.elapsedTime * 1000,
    }));
  }, []);

  const pauseTimer = useCallback(() => {
    setTimerState(prev => ({
      ...prev,
      isRunning: false,
      startTime: null,
    }));
  }, []);

  const stopTimer = useCallback(() => {
    const durationMinutes = Math.ceil(timerState.totalTime / 60);
    if (durationMinutes > 0) {
      onWorkoutComplete(durationMinutes);
    }
    
    setTimerState({
      isRunning: false,
      startTime: null,
      elapsedTime: 0,
      totalTime: 0,
    });
  }, [timerState.totalTime, onWorkoutComplete]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (timerState.isRunning && timerState.startTime) {
      interval = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - timerState.startTime!) / 1000);
        
        setTimerState(prev => ({
          ...prev,
          elapsedTime: elapsed,
          totalTime: Math.max(prev.totalTime, elapsed),
        }));
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerState.isRunning, timerState.startTime]);

  const displayTime = timerState.isRunning ? timerState.elapsedTime : timerState.totalTime;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-green-100">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Workout Timer</h3>
        <div className="text-6xl font-mono font-bold text-green-600 mb-4">
          {formatTime(displayTime)}
        </div>
        
        {timerState.isRunning && (
          <div className="flex items-center justify-center gap-2 text-green-600">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Workout in progress...</span>
          </div>
        )}
      </div>

      <div className="flex gap-3 justify-center">
        {!timerState.isRunning ? (
          <ShimmerButton
            onClick={startTimer}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            background="rgb(34, 197, 94)"
            shimmerColor="#ffffff"
          >
            <Play className="w-5 h-5" />
            {timerState.totalTime > 0 ? "Resume" : "Start Workout"}
          </ShimmerButton>
        ) : (
          <PulsatingButton
            onClick={pauseTimer}
            className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600"
            pulseColor="#FCD34D"
          >
            <Pause className="w-5 h-5" />
            Pause
          </PulsatingButton>
        )}
        
        {timerState.totalTime > 0 && (
          <ShimmerButton
            onClick={stopTimer}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700"
            background="rgb(220, 38, 38)"
            shimmerColor="#ffffff"
          >
            <Square className="w-4 h-4" />
            Finish Workout
          </ShimmerButton>
        )}
      </div>

      {timerState.totalTime > 0 && (
        <div className="mt-4 p-3 bg-green-50 rounded-lg text-center">
          <p className="text-sm text-green-700">
            Total workout time: <span className="font-semibold">{formatTime(timerState.totalTime)}</span>
          </p>
        </div>
      )}
    </div>
  );
} 