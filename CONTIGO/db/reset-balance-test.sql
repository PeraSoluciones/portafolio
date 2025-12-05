-- =====================================================
-- RESET: LIMPIAR TRANSACCIONES DE PRUEBA Y RESETEAR BALANCE
-- =====================================================
-- Este script limpia las transacciones de prueba de hoy y resetea el balance

-- IMPORTANTE: Reemplaza el child_id con el correcto
-- Child ID actual: 29bb4826-b032-4d77-9e90-6f3f7da21b6f

-- 1. Ver estado actual
SELECT 
  c.name,
  c.points_balance as balance_actual,
  COUNT(pt.id) as transacciones_hoy,
  COALESCE(SUM(pt.points), 0) as puntos_hoy
FROM children c
LEFT JOIN points_transactions pt ON pt.child_id = c.id 
  AND DATE(pt.created_at) = CURRENT_DATE
WHERE c.id = '29bb4826-b032-4d77-9e90-6f3f7da21b6f'
GROUP BY c.id, c.name, c.points_balance;

-- 2. Ver todas las transacciones de hoy (antes de borrar)
SELECT 
  pt.created_at,
  pt.transaction_type,
  pt.points,
  pt.balance_after,
  pt.description
FROM points_transactions pt
WHERE pt.child_id = '29bb4826-b032-4d77-9e90-6f3f7da21b6f'
  AND DATE(pt.created_at) = CURRENT_DATE
ORDER BY pt.created_at;

-- 3. Eliminar registros de hábitos de hoy
DELETE FROM habit_records
WHERE habit_id IN (
  SELECT h.id FROM habits h 
  WHERE h.child_id = '29bb4826-b032-4d77-9e90-6f3f7da21b6f'
)
AND date = CURRENT_DATE;

-- 4. Eliminar transacciones de puntos de hoy
DELETE FROM points_transactions
WHERE child_id = '29bb4826-b032-4d77-9e90-6f3f7da21b6f'
  AND DATE(created_at) = CURRENT_DATE;

-- 5. Resetear balance a 0 (o al valor que prefieras)
UPDATE children
SET points_balance = 0
WHERE id = '29bb4826-b032-4d77-9e90-6f3f7da21b6f';

-- 6. Verificar que se limpió correctamente
SELECT 
  c.name,
  c.points_balance as balance_final,
  COUNT(pt.id) as transacciones_restantes_hoy
FROM children c
LEFT JOIN points_transactions pt ON pt.child_id = c.id 
  AND DATE(pt.created_at) = CURRENT_DATE
WHERE c.id = '29bb4826-b032-4d77-9e90-6f3f7da21b6f'
GROUP BY c.id, c.name, c.points_balance;

-- 7. Ver registros de hábitos restantes de hoy (debería ser 0)
SELECT COUNT(*) as habit_records_hoy
FROM habit_records hr
JOIN habits h ON h.id = hr.habit_id
WHERE h.child_id = '29bb4826-b032-4d77-9e90-6f3f7da21b6f'
  AND hr.date = CURRENT_DATE;

RAISE NOTICE '✅ Transacciones de prueba eliminadas';
RAISE NOTICE '✅ Balance reseteado a 0';
RAISE NOTICE 'Ahora puedes hacer una nueva prueba limpia para verificar el trigger DELETE';
