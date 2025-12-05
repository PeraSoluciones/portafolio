-- =====================================================
-- DIAGNÓSTICO: POLÍTICAS RLS DE routine_completions
-- =====================================================

-- 1. Ver las políticas actuales de routine_completions
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'routine_completions'
ORDER BY policyname;

-- 2. Probar query directa como padre
-- Reemplaza 'your-child-id' con un child_id real
DO $$
DECLARE
  test_child_id UUID := 'e783a827-4cba-446c-81c3-20f8b5d74d7e'; -- Reemplazar con child_id real
BEGIN
  -- Probar query simple
  RAISE NOTICE 'Test 1: Query simple';
  PERFORM * FROM routine_completions 
  WHERE child_id = test_child_id;
  
  -- Probar query con JOIN
  RAISE NOTICE 'Test 2: Query con JOIN a routines';
  PERFORM * FROM routine_completions rc
  JOIN routines r ON r.id = rc.routine_id
  WHERE rc.child_id = test_child_id;
  
  RAISE NOTICE 'Tests completados sin errores';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error: %', SQLERRM;
END $$;

-- 3. Ver si hay registros en routine_completions
SELECT 
  COUNT(*) as total_registros,
  COUNT(DISTINCT child_id) as total_ninos,
  COUNT(DISTINCT routine_id) as total_rutinas
FROM routine_completions;

-- 4. Ver registros recientes
SELECT 
  rc.id,
  rc.child_id,
  rc.routine_id,
  rc.completion_date,
  rc.completion_percentage,
  r.title as routine_title
FROM routine_completions rc
LEFT JOIN routines r ON r.id = rc.routine_id
ORDER BY rc.created_at DESC
LIMIT 10;
