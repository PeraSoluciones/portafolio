-- Inspect habit_records table definition
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_name = 'habit_records';

-- Find triggers on habit_records
SELECT 
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM 
    information_schema.triggers
WHERE 
    event_object_table = 'habit_records';

-- We need to see the function definition called by the trigger.
-- Usually triggers call a function. Let's find the function name first.
SELECT 
    tgname AS trigger_name,
    proname AS function_name,
    pg_get_functiondef(pg_proc.oid) AS function_definition
FROM 
    pg_trigger
JOIN 
    pg_proc ON pg_trigger.tgfoid = pg_proc.oid
WHERE 
    tgrelid = 'habit_records'::regclass;
