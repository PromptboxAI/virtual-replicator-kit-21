-- Delete sample agents that match real Virtuals Protocol agents
DELETE FROM agents WHERE name IN ('Zerebro', 'Athena', 'aixbt') OR symbol IN ('ZERO', 'ATH', 'AIXBT');