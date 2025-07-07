-- Add protein column to nutrition_entries table
ALTER TABLE nutrition_entries ADD COLUMN protein INTEGER CHECK (protein >= 0);
