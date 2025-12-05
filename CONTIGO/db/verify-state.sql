-- Verificar estado actual de la base de datos

-- 1. Contar habit_records totales
SELECT COUNT(*) as total_habit_records FROM habit_records;

-- 2. Ver habit_records de hoy (debería estar vacío si se eliminaron todos)
SELECT 
    hr.*,
    h.title as habit_title
FROM habit_records hr
JOIN habits h ON h.id = hr.habit_id
WHERE hr.date = CURRENT_DATE;

-- 3. Ver rutinas activas del niño
SELECT 
    r.id,
    r.title,
    r.child_id,
    COUNT(rh.id) as total_habits
FROM routines r
LEFT JOIN routine_habits rh ON rh.routine_id = r.id
WHERE r.child_id = '29bb4826-b032-4d77-9e90-6f3f7da21b6f'
  AND r.is_active = true
GROUP BY r.id, r.title, r.child_id;

-- 4. Ver hábitos en routine_habits
SELECT 
    rh.id as routine_habit_id,
    rh.routine_id,
    r.title as routine_title,
    h.id as habit_id,
    h.title as habit_title,
    rh.points_value
FROM routine_habits rh
JOIN routines r ON r.id = rh.routine_id
JOIN habits h ON h.id = rh.habit_id
WHERE r.child_id = '29bb4826-b032-4d77-9e90-6f3f7da21b6f'
  AND r.is_active = true
ORDER BY r.title, h.title;
