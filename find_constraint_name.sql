-- First, let's find the exact constraint name
SELECT constraint_name 
FROM information_schema.table_constraints 
WHERE table_name = 'nutrition_entries' 
AND constraint_type = 'UNIQUE';
