
-- Fix the existing stuck agent
UPDATE agents
SET status = 'ACTIVE', is_active = true
WHERE id = '18058db4-cad2-4a7f-ba56-8aa3c3ff045e';
