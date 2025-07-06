-- Create workout_entries table
CREATE TABLE workout_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  workout_type TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date) -- One workout entry per day per user
);

-- Create nutrition_entries table
CREATE TABLE nutrition_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  calories INTEGER NOT NULL CHECK (calories > 0),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date) -- One nutrition entry per day per user
);

-- Create streak_data table
CREATE TABLE streak_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_workout_date DATE,
  total_workouts INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create awards table (predefined awards)
CREATE TABLE awards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  requirement INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('streak', 'total_workouts', 'duration')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_awards table (earned awards)
CREATE TABLE user_awards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  award_id UUID REFERENCES awards(id) ON DELETE CASCADE NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, award_id) -- Prevent duplicate awards
);

-- Enable Row Level Security
ALTER TABLE workout_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE streak_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_awards ENABLE ROW LEVEL SECURITY;

-- Create policies for workout_entries
CREATE POLICY "Users can view own workout entries" ON workout_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workout entries" ON workout_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workout entries" ON workout_entries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workout entries" ON workout_entries
  FOR DELETE USING (auth.uid() = user_id);

-- Create policies for nutrition_entries
CREATE POLICY "Users can view own nutrition entries" ON nutrition_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own nutrition entries" ON nutrition_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own nutrition entries" ON nutrition_entries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own nutrition entries" ON nutrition_entries
  FOR DELETE USING (auth.uid() = user_id);

-- Create policies for streak_data
CREATE POLICY "Users can view own streak data" ON streak_data
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own streak data" ON streak_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own streak data" ON streak_data
  FOR UPDATE USING (auth.uid() = user_id);

-- Create policies for user_awards
CREATE POLICY "Users can view own awards" ON user_awards
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own awards" ON user_awards
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Awards table is readable by all authenticated users
CREATE POLICY "All users can view awards" ON awards
  FOR SELECT TO authenticated USING (true);

-- Create function to update streak data when workout is added
CREATE OR REPLACE FUNCTION update_streak_data()
RETURNS TRIGGER AS $$
DECLARE
  user_streak_data streak_data%ROWTYPE;
  days_since_last_workout INTEGER;
  new_streak INTEGER;
BEGIN
  -- Get current streak data for user
  SELECT * INTO user_streak_data 
  FROM streak_data 
  WHERE user_id = NEW.user_id;
  
  -- If no streak data exists, create it
  IF NOT FOUND THEN
    INSERT INTO streak_data (user_id, current_streak, longest_streak, last_workout_date, total_workouts)
    VALUES (NEW.user_id, 1, 1, NEW.date, 1);
    RETURN NEW;
  END IF;
  
  -- Calculate days since last workout
  IF user_streak_data.last_workout_date IS NULL THEN
    days_since_last_workout := 0;
  ELSE
    days_since_last_workout := NEW.date - user_streak_data.last_workout_date;
  END IF;
  
  -- Update streak logic: Only 1-2 day gaps allowed
  IF days_since_last_workout <= 1 THEN
    -- Consecutive day or same day update
    new_streak := user_streak_data.current_streak + 1;
  ELSIF days_since_last_workout <= 3 THEN
    -- Allow 1-2 day gap (rest days)
    new_streak := user_streak_data.current_streak + 1;
  ELSE
    -- Reset streak if gap is 3+ days
    new_streak := 1;
  END IF;
  
  -- Update streak data
  UPDATE streak_data
  SET 
    current_streak = new_streak,
    longest_streak = GREATEST(longest_streak, new_streak),
    last_workout_date = NEW.date,
    total_workouts = total_workouts + 1,
    updated_at = NOW()
  WHERE user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for streak updates
CREATE TRIGGER update_streak_trigger
  AFTER INSERT ON workout_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_streak_data();

-- Insert predefined awards
INSERT INTO awards (title, description, icon, requirement, type) VALUES
('First Step', 'Complete your first workout!', '🎯', 1, 'total_workouts'),
('Getting Started', 'Complete 5 workouts', '🏃‍♂️', 5, 'total_workouts'),
('Consistency', 'Complete 10 workouts', '💪', 10, 'total_workouts'),
('Dedication', 'Complete 25 workouts', '🔥', 25, 'total_workouts'),
('Fitness Enthusiast', 'Complete 50 workouts', '⭐', 50, 'total_workouts'),
('Fitness Warrior', 'Complete 100 workouts', '👑', 100, 'total_workouts'),
('Streak Starter', 'Maintain a 3-day streak', '⚡', 3, 'streak'),
('Week Warrior', 'Maintain a 7-day streak', '🔥', 7, 'streak'),
('Two Week Champion', 'Maintain a 14-day streak', '🏆', 14, 'streak'),
('Monthly Master', 'Maintain a 30-day streak', '🎖️', 30, 'streak'),
('Endurance Beginner', 'Total 60 minutes of workouts', '⏱️', 60, 'duration'),
('Endurance Builder', 'Total 300 minutes of workouts', '🎯', 300, 'duration'),
('Endurance Pro', 'Total 600 minutes of workouts', '💎', 600, 'duration');

-- Create function to check and award achievements
CREATE OR REPLACE FUNCTION check_and_award_achievements(p_user_id UUID)
RETURNS TABLE(new_award_title TEXT, new_award_description TEXT, new_award_icon TEXT) AS $$
DECLARE
  user_streak_data streak_data%ROWTYPE;
  total_duration INTEGER;
  award_record awards%ROWTYPE;
BEGIN
  -- Get user's current streak data
  SELECT * INTO user_streak_data FROM streak_data WHERE user_id = p_user_id;
  
  -- Get total workout duration
  SELECT COALESCE(SUM(duration_minutes), 0) INTO total_duration 
  FROM workout_entries WHERE user_id = p_user_id;
  
  -- Check for new awards
  FOR award_record IN 
    SELECT a.* FROM awards a
    WHERE a.id NOT IN (SELECT award_id FROM user_awards WHERE user_id = p_user_id)
  LOOP
    -- Check if user qualifies for this award
    IF (award_record.type = 'total_workouts' AND user_streak_data.total_workouts >= award_record.requirement) OR
       (award_record.type = 'streak' AND user_streak_data.current_streak >= award_record.requirement) OR
       (award_record.type = 'duration' AND total_duration >= award_record.requirement) THEN
      
      -- Award the achievement
      INSERT INTO user_awards (user_id, award_id) VALUES (p_user_id, award_record.id);
      
      -- Return the new award info
      new_award_title := award_record.title;
      new_award_description := award_record.description;
      new_award_icon := award_record.icon;
      RETURN NEXT;
    END IF;
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql; 