-- =====================================================
-- LIMPIEZA SEGURA: Eliminar registros antiguos sin routine_id
-- =====================================================

-- PASO 1: Ver transacciones de puntos relacionadas con estos registros
SELECT 
    pt.id,
    pt.child_id,
    pt.points,
    pt.description,
    pt.created_at,
    c.name as child_name
FROM points_transactions pt
JOIN children c ON c.id = pt.child_id
WHERE pt.source_type = 'HABIT'
  AND pt.source_id IN (
    SELECT habit_id 
    FROM habit_records 
    WHERE routine_id IS NULL
  )
ORDER BY pt.created_at DESC;

-- PASO 2: Eliminar registros sin routine_id
-- Esto disparará el trigger on_habit_record_deleted que revertirá los puntos
DELETE FROM habit_records WHERE routine_id IS NULL;

-- PASO 3: Verificar que se eliminaron
SELECT COUNT(*) as records_without_routine_id
FROM habit_records
WHERE routine_id IS NULL;

-- PASO 4: Verificar balance actualizado
SELECT 
    c.name,
    c.points_balance,
    COUNT(pt.id) as total_transactions,
    SUM(CASE WHEN pt.points > 0 THEN pt.points ELSE 0 END) as total_earned,
    SUM(CASE WHEN pt.points < 0 THEN pt.points ELSE 0 END) as total_spent
FROM children c
LEFT JOIN points_transactions pt ON pt.child_id = c.id
WHERE c.id = '29bb4826-b032-4d77-9e90-6f3f7da21b6f'
GROUP BY c.id, c.name, c.points_balance;
