-- =====================================================
-- DIAGNÓSTICO: BUG DE BALANCE ACUMULATIVO
-- =====================================================

-- 1. Ver todas las transacciones de puntos de hoy para un niño
-- Reemplaza con el child_id real
SELECT 
  pt.created_at,
  pt.transaction_type,
  pt.points,
  pt.balance_after,
  pt.description,
  h.title as habit_title
FROM points_transactions pt
LEFT JOIN habits h ON h.id = pt.related_id AND pt.transaction_type = 'HABIT'
WHERE pt.child_id = '29bb4826-b032-4d77-9e90-6f3f7da21b6f'  -- Reemplazar
  AND DATE(pt.created_at) = CURRENT_DATE
ORDER BY pt.created_at DESC;

-- 2. Contar transacciones por hábito (detectar duplicados)
SELECT 
  h.title as habit_title,
  pt.related_id as habit_id,
  COUNT(*) as total_transacciones,
  SUM(pt.points) as puntos_totales,
  array_agg(pt.created_at ORDER BY pt.created_at) as timestamps
FROM points_transactions pt
LEFT JOIN habits h ON h.id = pt.related_id
WHERE pt.child_id = '29bb4826-b032-4d77-9e90-6f3f7da21b6f'  -- Reemplazar
  AND DATE(pt.created_at) = CURRENT_DATE
  AND pt.transaction_type = 'HABIT'
GROUP BY h.title, pt.related_id
HAVING COUNT(*) > 1  -- Solo mostrar hábitos con múltiples transacciones
ORDER BY total_transacciones DESC;

-- 3. Ver registros de hábitos de hoy
SELECT 
  hr.id as record_id,
  h.title as habit_title,
  hr.habit_id,
  hr.date,
  hr.value,
  hr.created_at,
  COUNT(*) OVER (PARTITION BY hr.habit_id) as veces_registrado
FROM habit_records hr
JOIN habits h ON h.id = hr.habit_id
WHERE h.child_id = '29bb4826-b032-4d77-9e90-6f3f7da21b6f'  -- Reemplazar
  AND hr.date = CURRENT_DATE
ORDER BY hr.created_at DESC;

-- 4. Verificar si hay triggers en habit_records
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'habit_records'
ORDER BY trigger_name;

-- 5. Balance calculado vs balance en tabla
SELECT 
  c.name,
  c.points_balance as balance_tabla,
  COALESCE(SUM(pt.points), 0) as balance_calculado,
  c.points_balance - COALESCE(SUM(pt.points), 0) as diferencia
FROM children c
LEFT JOIN points_transactions pt ON pt.child_id = c.id
WHERE c.id = '29bb4826-b032-4d77-9e90-6f3f7da21b6f'  -- Reemplazar
GROUP BY c.id, c.name, c.points_balance;

-- 6. Ver si hay transacciones negativas (al desmarcar)
SELECT 
  pt.created_at,
  pt.transaction_type,
  pt.points,
  pt.balance_after,
  pt.description
FROM points_transactions pt
WHERE pt.child_id = '29bb4826-b032-4d77-9e90-6f3f7da21b6f'  -- Reemplazar
  AND DATE(pt.created_at) = CURRENT_DATE
  AND pt.points < 0
ORDER BY pt.created_at DESC;
