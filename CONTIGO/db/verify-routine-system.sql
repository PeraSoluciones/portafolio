-- =====================================================
-- SCRIPT DE VERIFICACIÓN: SISTEMA DE RUTINAS
-- =====================================================
-- Ejecuta este script DESPUÉS de implement-routine-completions.sql
-- para verificar que todo está funcionando correctamente

-- =====================================================
-- 1. VERIFICAR TABLAS Y COLUMNAS
-- =====================================================

SELECT 
  'routine_completions' as tabla,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'routine_completions') as existe
UNION ALL
SELECT 
  'routines.completion_threshold',
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'routines' AND column_name = 'completion_threshold')
UNION ALL
SELECT 
  'routines.routine_points',
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'routines' AND column_name = 'routine_points')
UNION ALL
SELECT 
  'routine_habits.sequence_order',
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'routine_habits' AND column_name = 'sequence_order');

-- =====================================================
-- 2. VERIFICAR FUNCIONES
-- =====================================================

SELECT 
  routine_name as funcion,
  'Existe' as estado
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'evaluate_routine_completion',
    'on_routine_completed',
    'check_routine_completion_on_habit_change',
    'get_routine_streak'
  )
ORDER BY routine_name;

-- =====================================================
-- 3. VERIFICAR TRIGGERS
-- =====================================================

SELECT 
  trigger_name,
  event_object_table as tabla,
  action_timing || ' ' || string_agg(event_manipulation, ', ') as eventos
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name IN (
    'check_routine_completion_trigger',
    'on_routine_completed_trigger'
  )
GROUP BY trigger_name, event_object_table, action_timing
ORDER BY trigger_name;

-- =====================================================
-- 4. VERIFICAR POLÍTICAS RLS
-- =====================================================

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'routine_completions'
ORDER BY policyname;

-- =====================================================
-- 5. LISTAR RUTINAS EXISTENTES CON NUEVA CONFIGURACIÓN
-- =====================================================

SELECT 
  r.id,
  r.title,
  r.completion_threshold,
  r.routine_points,
  r.requires_sequence,
  r.is_active,
  COUNT(rh.id) as total_habits
FROM routines r
LEFT JOIN routine_habits rh ON rh.routine_id = r.id
GROUP BY r.id, r.title, r.completion_threshold, r.routine_points, r.requires_sequence, r.is_active
ORDER BY r.created_at DESC
LIMIT 10;

-- =====================================================
-- 6. VERIFICAR REGISTROS DE COMPLETITUD (últimos 7 días)
-- =====================================================

SELECT 
  rc.completion_date,
  r.title as rutina,
  c.name as hijo,
  rc.completion_percentage || '%' as completitud,
  rc.completed_habits || '/' || rc.total_habits as habitos,
  rc.points_earned as puntos_bonus
FROM routine_completions rc
JOIN routines r ON r.id = rc.routine_id
JOIN children c ON c.id = rc.child_id
WHERE rc.completion_date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY rc.completion_date DESC, rc.completed_at DESC
LIMIT 20;

-- =====================================================
-- 7. VERIFICAR TRANSACCIONES DE PUNTOS POR RUTINAS
-- =====================================================

SELECT 
  pt.created_at,
  c.name as hijo,
  pt.transaction_type,
  pt.description,
  pt.points,
  pt.balance_after
FROM points_transactions pt
JOIN children c ON c.id = pt.child_id
WHERE pt.transaction_type = 'ROUTINE'
ORDER BY pt.created_at DESC
LIMIT 10;

-- =====================================================
-- 8. ESTADÍSTICAS DE ADHERENCIA (última semana)
-- =====================================================

SELECT 
  r.title as rutina,
  c.name as hijo,
  COUNT(*) as dias_intentados,
  SUM(CASE WHEN rc.completion_percentage >= r.completion_threshold THEN 1 ELSE 0 END) as dias_completados,
  ROUND(AVG(rc.completion_percentage), 2) || '%' as promedio_completitud,
  SUM(rc.points_earned) as puntos_totales
FROM routine_completions rc
JOIN routines r ON r.id = rc.routine_id
JOIN children c ON c.id = rc.child_id
WHERE rc.completion_date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY r.id, r.title, c.id, c.name, r.completion_threshold
ORDER BY dias_completados DESC;

-- =====================================================
-- 9. VERIFICAR ÍNDICES
-- =====================================================

SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('routine_completions', 'routine_habits')
  AND schemaname = 'public'
ORDER BY tablename, indexname;

-- =====================================================
-- 10. RESUMEN GENERAL
-- =====================================================

SELECT 
  'Total rutinas' as metrica,
  COUNT(*)::text as valor
FROM routines
WHERE is_active = true
UNION ALL
SELECT 
  'Rutinas con puntos bonus',
  COUNT(*)::text
FROM routines
WHERE is_active = true AND routine_points > 0
UNION ALL
SELECT 
  'Total hábitos en rutinas',
  COUNT(*)::text
FROM routine_habits
UNION ALL
SELECT 
  'Registros de completitud (últimos 7 días)',
  COUNT(*)::text
FROM routine_completions
WHERE completion_date >= CURRENT_DATE - INTERVAL '7 days'
UNION ALL
SELECT 
  'Transacciones de puntos por rutinas',
  COUNT(*)::text
FROM points_transactions
WHERE transaction_type = 'ROUTINE';
