-- Remove unique constraint to allow multiple meals per day
ALTER TABLE nutrition_entries DROP CONSTRAINT nutrition_entries_user_id_date_key;
