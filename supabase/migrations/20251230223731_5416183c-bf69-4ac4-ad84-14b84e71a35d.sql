-- Update default P1 value for new agents to match 42K PROMPT graduation threshold
ALTER TABLE agents ALTER COLUMN created_p1 SET DEFAULT 0.00024;