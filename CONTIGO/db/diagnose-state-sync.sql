-- =====================================================
-- DIAGNÓSTICO: PROBLEMAS DE SINCRONIZACIÓN DE ESTADO
-- =====================================================
-- INSTRUCCIONES:
-- 1. Reemplaza '29bb4826-b032-4d77-9e90-6f3f7da21b6f' con el ID real del niño
-- 2. Ejecuta cada sección por separado en Supabase SQL Editor
-- 3. Comparte los resultados de TODAS las queries
-- =====================================================

-- =====================================================
-- BUG 1: Balance no se actualiza en UI
-- =====================================================

-- 1.1 Ver balance actual en la tabla children
SELECT 
  id,
  name,
  points_balance as balance_en_bd,
  updated_at as ultima_actualizacion
FROM children
WHERE id = '29bb4826-b032-4d77-9e90-6f3f7da21b6f';

-- 1.2 Ver transacciones de hoy
SELECT 
  created_at,
  transaction_type,
  points,
  balance_after,
  description
FROM points_transactions
WHERE child_id = '29bb4826-b032-4d77-9e90-6f3f7da21b6f'
  AND DATE(created_at) = CURRENT_DATE
ORDER BY created_at DESC
LIMIT 10;

-- 1.3 Verificar que el balance calculado coincide con el almacenado
SELECT 
  c.name,
  c.points_balance as balance_almacenado,
  COALESCE(SUM(pt.points), 0) as balance_calculado,
  c.points_balance - COALESCE(SUM(pt.points), 0) as diferencia
FROM children c
LEFT JOIN points_transactions pt ON pt.child_id = c.id
WHERE c.id = '29bb4826-b032-4d77-9e90-6f3f7da21b6f'
GROUP BY c.id, c.name, c.points_balance;

-- =====================================================
-- BUG 2: Porcentaje de rutinas no se actualiza
-- =====================================================

-- 2.1 Ver rutinas de hoy
SELECT 
  r.id,
  r.title,
  r.time,
  r.days,
  r.completion_threshold
FROM routines r
WHERE r.child_id = '29bb4826-b032-4d77-9e90-6f3f7da21b6f'
  AND r.is_active = true
  AND UPPER(TO_CHAR(CURRENT_DATE, 'DAY')) = ANY(
    SELECT UPPER(TRIM(day)) FROM unnest(r.days) AS day
  );

-- 2.2 Ver registros en routine_completions para hoy
SELECT 
  rc.routine_id,
  r.title as routine_title,
  rc.completion_date,
  rc.completion_percentage,
  rc.is_completed,
  rc.points_earned,
  rc.created_at
FROM routine_completions rc
JOIN routines r ON r.id = rc.routine_id
WHERE rc.child_id = '29bb4826-b032-4d77-9e90-6f3f7da21b6f'
  AND rc.completion_date = CURRENT_DATE
ORDER BY rc.created_at DESC;

-- 2.3 Si NO hay registros, verificar que el trigger existe
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  tgenabled as enabled
FROM pg_trigger
WHERE tgname LIKE '%routine%completion%'
ORDER BY tgname;

-- =====================================================
-- BUG 3: Hábitos se desmarcan al navegar
-- =====================================================

-- 3.1 Ver habit_records de hoy
SELECT 
  hr.id,
  h.title as habit_title,
  hr.date,
  hr.value,
  hr.notes,
  hr.created_at,
  hr.updated_at
FROM habit_records hr
JOIN habits h ON h.id = hr.habit_id
WHERE h.child_id = '29bb4826-b032-4d77-9e90-6f3f7da21b6f'
  AND hr.date = CURRENT_DATE
ORDER BY hr.created_at DESC;

-- 3.2 Ver hábitos de las rutinas de hoy con su estado de completitud
SELECT 
  r.title as routine_title,
  h.title as habit_title,
  rh.id as routine_habit_id,
  h.id as habit_id,
  rh.points_value,
  CASE 
    WHEN hr.id IS NOT NULL THEN 'COMPLETADO'
    ELSE 'PENDIENTE'
  END as estado,
  hr.id as record_id,
  hr.created_at as completado_en
FROM routines r
JOIN routine_habits rh ON rh.routine_id = r.id
JOIN habits h ON h.id = rh.habit_id
LEFT JOIN habit_records hr ON hr.habit_id = h.id AND hr.date = CURRENT_DATE
WHERE r.child_id = '29bb4826-b032-4d77-9e90-6f3f7da21b6f'
  AND r.is_active = true
  AND UPPER(TO_CHAR(CURRENT_DATE, 'DAY')) = ANY(
    SELECT UPPER(TRIM(day)) FROM unnest(r.days) AS day
  )
ORDER BY r.title, h.title;

-- =====================================================
-- RESUMEN DE DIAGNÓSTICO
-- =====================================================

-- Contar registros importantes
SELECT 
  'Transacciones hoy' as tipo,
  COUNT(*) as cantidad
FROM points_transactions
WHERE child_id = '29bb4826-b032-4d77-9e90-6f3f7da21b6f'
  AND DATE(created_at) = CURRENT_DATE

UNION ALL

SELECT 
  'Habit records hoy' as tipo,
  COUNT(*) as cantidad
FROM habit_records hr
JOIN habits h ON h.id = hr.habit_id
WHERE h.child_id = '29bb4826-b032-4d77-9e90-6f3f7da21b6f'
  AND hr.date = CURRENT_DATE

UNION ALL

SELECT 
  'Routine completions hoy' as tipo,
  COUNT(*) as cantidad
FROM routine_completions
WHERE child_id = '29bb4826-b032-4d77-9e90-6f3f7da21b6f'
  AND completion_date = CURRENT_DATE;
