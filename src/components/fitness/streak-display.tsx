"use client";

import { useState, useEffect } from "react";
import { Trophy, Flame, Star, Award, Info } from "lucide-react";
import { StreakData, UserAward } from "@/types/fitness";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { motion, AnimatePresence } from "motion/react";
import Confetti from "@/components/magicui/confetti";

interface StreakDisplayProps {
  refreshTrigger?: number;
  onNewAward?: (award: UserAward) => void;
}

export default function StreakDisplay({ refreshTrigger, onNewAward }: StreakDisplayProps) {
  const { user } = useAuth();
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [recentAwards, setRecentAwards] = useState<UserAward[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadStreakData = async () => {
    if (!user) return;
    
    try {
      // Load streak data
      const { data: streak } = await supabase
        .from('streak_data')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (streak) {
        setStreakData(streak);
      }

      // Load recent awards (last 3)
      const { data: awards } = await supabase
        .from('user_awards')
        .select(`
          *,
          award:awards(*)
        `)
        .eq('user_id', user.id)
        .order('earned_at', { ascending: false })
        .limit(3);

      if (awards) {
        setRecentAwards(awards as UserAward[]);
      }
    } catch (error) {
      console.error('Error loading streak data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStreakData();
  }, [user, refreshTrigger]);

  const getStreakMessage = () => {
    if (!streakData) return "Start your fitness journey!";
    
    const { current_streak } = streakData;
    
    if (current_streak === 0) {
      return "Ready to start a new streak? 💪";
    } else if (current_streak === 1) {
      return "Great start! Keep the momentum going! 🚀";
    } else if (current_streak < 7) {
      return `Awesome! ${current_streak} days strong! 🔥`;
    } else if (current_streak < 14) {
      return `You're on fire! ${current_streak} days! 🌟`;
    } else if (current_streak < 30) {
      return `Incredible dedication! ${current_streak} days! 🏆`;
    } else {
      return `LEGENDARY! ${current_streak} days! You're unstoppable! 👑`;
    }
  };

  const getStreakColor = () => {
    if (!streakData) return "text-gray-500";
    
    const { current_streak } = streakData;
    
    if (current_streak === 0) return "text-gray-500";
    if (current_streak < 7) return "text-green-500";
    if (current_streak < 14) return "text-blue-500";
    if (current_streak < 30) return "text-purple-500";
    return "text-yellow-500";
  };

  const getMotivationalQuote = () => {
    const quotes = [
      "Every workout is a step towards a stronger you!",
      "Consistency beats perfection every time!",
      "Your body can do it. It's your mind you need to convince!",
      "The hardest part is showing up!",
      "Progress, not perfection!",
      "Strong habits create strong people!",
      "You're building more than muscle - you're building character!",
      "Rest days are part of the journey too!",
    ];
    
    return quotes[Math.floor(Math.random() * quotes.length)];
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg shadow-md p-4 border border-green-100">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-3"></div>
          <div className="h-12 bg-gray-200 rounded mb-3"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      {showConfetti && <Confetti onComplete={() => setShowConfetti(false)} />}
      
      <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg shadow-md p-4 border border-green-100 relative">
        {/* Info Icon */}
        <button
          onClick={() => setShowRules(!showRules)}
          className="absolute top-3 right-3 p-1.5 hover:bg-white/50 rounded-full transition-colors"
        >
          <Info className="w-4 h-4 text-gray-600" />
        </button>

        {/* Rules Popup */}
        <AnimatePresence>
          {showRules && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute top-12 right-3 bg-white rounded-lg shadow-xl border border-gray-200 p-3 z-10 w-52"
            >
              <h5 className="font-medium text-gray-900 mb-1.5 text-sm">Streak Rules:</h5>
              <ul className="text-xs text-gray-700 space-y-0.5">
                <li>• Work out daily to maintain your streak</li>
                <li>• Rest days are allowed every 2-3 days</li>
                <li>• 1-2 day gaps won't break your streak</li>
                <li>• 3+ day gaps will reset your streak</li>
              </ul>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Streak Display */}
        <div className="text-center mb-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Flame className={`w-6 h-6 ${getStreakColor()}`} />
            <h3 className="text-lg font-bold text-gray-900">Current Streak</h3>
            <Flame className={`w-6 h-6 ${getStreakColor()}`} />
          </div>
          
          <motion.div
            key={streakData?.current_streak}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`text-4xl font-bold mb-1.5 ${getStreakColor()}`}
          >
            {streakData?.current_streak || 0}
          </motion.div>
          
          <p className="text-sm font-medium text-gray-700 mb-1.5">
            {getStreakMessage()}
          </p>
          
          <p className="text-xs text-gray-600 italic">
            "{getMotivationalQuote()}"
          </p>
        </div>

        {/* Best Streak */}
        <div className="bg-white rounded-lg p-3 text-center border border-gray-200 mb-4">
          <Trophy className="w-5 h-5 text-yellow-500 mx-auto mb-1.5" />
          <div className="text-lg font-bold text-gray-900">
            {streakData?.longest_streak || 0}
          </div>
          <div className="text-xs text-gray-600">Best Streak</div>
        </div>

        {/* Recent Awards */}
        {recentAwards.length > 0 && (
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="flex items-center gap-1.5 mb-2">
              <Award className="w-4 h-4 text-purple-500" />
              <h4 className="font-semibold text-gray-900 text-sm">Recent Achievements</h4>
            </div>
            
            <div className="max-h-24 overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              {recentAwards.map((userAward) => (
                <motion.div
                  key={userAward.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2 p-1.5 bg-gradient-to-r from-purple-50 to-pink-50 rounded-md"
                >
                  <span className="text-lg">{userAward.award.icon}</span>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 text-xs">{userAward.award.title}</div>
                    <div className="text-xs text-gray-600">{userAward.award.description}</div>
                  </div>
                  <Star className="w-3 h-3 text-yellow-500" />
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
} 