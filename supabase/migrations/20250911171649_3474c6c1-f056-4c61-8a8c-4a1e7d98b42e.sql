-- Reactivate test agents only (keep production agents safely inactive)
UPDATE agents 
SET 
    is_active = true,
    status = 'AVAILABLE',
    updated_at = now()
WHERE 
    test_mode = true;

-- Verify the update
-- This should show test agents are now active
SELECT 
    count(*) as active_test_agents,
    test_mode
FROM agents 
WHERE is_active = true AND test_mode = true
GROUP BY test_mode;