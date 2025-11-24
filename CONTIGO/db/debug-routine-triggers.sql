-- =====================================================
-- SCRIPT DE DIAGNÓSTICO: TRIGGERS DE RUTINAS
-- =====================================================

-- 1. Verificar que los triggers existen y están activos
SELECT 
  t.tgname as trigger_name,
  t.tgenabled as enabled,
  c.relname as table_name,
  p.proname as function_name
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_proc p ON p.oid = t.tgfoid
WHERE t.tgname IN ('check_routine_completion_trigger', 'on_routine_completed_trigger')
ORDER BY t.tgname;

-- 2. Verificar la definición del trigger
SELECT 
  pg_get_triggerdef(oid) as trigger_definition
FROM pg_trigger
WHERE tgname = 'check_routine_completion_trigger';

-- 3. Probar la función manualmente con datos de prueba
DO $$
DECLARE
  test_child_id UUID := 'e783a827-4cba-446c-81c3-20f8b5d74d7e';
  test_routine_id UUID;
  result RECORD;
BEGIN
  -- Obtener la rutina de prueba creada
  SELECT id INTO test_routine_id 
  FROM routines 
  WHERE child_id = test_child_id 
    AND title = '🌅 Rutina Matutina de Prueba'
  LIMIT 1;

  IF test_routine_id IS NULL THEN
    RAISE NOTICE 'No se encontró la rutina de prueba';
    RETURN;
  END IF;

  RAISE NOTICE 'Probando función evaluate_routine_completion()';
  RAISE NOTICE 'Routine ID: %', test_routine_id;
  RAISE NOTICE 'Child ID: %', test_child_id;
  RAISE NOTICE 'Date: %', CURRENT_DATE;

  -- Llamar manualmente a la función
  SELECT * INTO result
  FROM evaluate_routine_completion(
    test_routine_id,
    test_child_id,
    CURRENT_DATE
  );

  RAISE NOTICE 'Resultado:';
  RAISE NOTICE '  completion_id: %', result.completion_id;
  RAISE NOTICE '  completion_percentage: %', result.completion_percentage;
  RAISE NOTICE '  points_earned: %', result.points_earned;

  -- Verificar si se creó el registro
  IF EXISTS (
    SELECT 1 FROM routine_completions 
    WHERE routine_id = test_routine_id 
      AND child_id = test_child_id 
      AND completion_date = CURRENT_DATE
  ) THEN
    RAISE NOTICE '✅ Registro en routine_completions creado correctamente';
  ELSE
    RAISE NOTICE '❌ NO se creó registro en routine_completions';
  END IF;

  -- Verificar transacciones de puntos
  FOR result IN
    SELECT transaction_type, points, description
    FROM points_transactions
    WHERE child_id = test_child_id
      AND DATE(created_at) = CURRENT_DATE
    ORDER BY created_at
  LOOP
    RAISE NOTICE 'Transacción: % - % pts - %', 
      result.transaction_type, result.points, result.description;
  END LOOP;

END $$;

-- 4. Verificar hábitos y registros
SELECT 
  h.title as habito,
  hr.date as fecha,
  hr.value as valor,
  rh.routine_id as rutina_id,
  rh.points_value as puntos_habito
FROM habits h
JOIN habit_records hr ON hr.habit_id = h.id
LEFT JOIN routine_habits rh ON rh.habit_id = h.id
WHERE h.child_id = 'e783a827-4cba-446c-81c3-20f8b5d74d7e'
  AND hr.date = CURRENT_DATE
ORDER BY h.created_at;

-- 5. Verificar configuración de la rutina
SELECT 
  r.id,
  r.title,
  r.completion_threshold,
  r.routine_points,
  r.days,
  COUNT(rh.id) as total_habits
FROM routines r
LEFT JOIN routine_habits rh ON rh.routine_id = r.id
WHERE r.child_id = 'e783a827-4cba-446c-81c3-20f8b5d74d7e'
  AND r.title = '🌅 Rutina Matutina de Prueba'
GROUP BY r.id, r.title, r.completion_threshold, r.routine_points, r.days;

-- 6. Verificar el día de la semana
SELECT 
  CURRENT_DATE as fecha,
  TO_CHAR(CURRENT_DATE, 'DAY') as dia_nombre,
  UPPER(TRIM(TO_CHAR(CURRENT_DATE, 'DAY'))) as dia_normalizado,
  CASE 
    WHEN UPPER(TRIM(TO_CHAR(CURRENT_DATE, 'DAY'))) = ANY(ARRAY['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'])
    THEN 'Día laboral - debería estar en la rutina'
    ELSE 'Fin de semana - NO está en la rutina'
  END as verificacion;
