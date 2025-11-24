-- =====================================================
-- RE-TEST: SISTEMA DE COMPLETITUD DE RUTINAS
-- =====================================================
-- Ejecuta este script DESPUÉS de fix-routine-trigger.sql
-- para verificar que el sistema ahora funciona correctamente

DO $$
DECLARE
  test_child_id UUID := 'e783a827-4cba-446c-81c3-20f8b5d74d7e';
  test_routine_id UUID;
  test_habit_id UUID;
  rec RECORD;
  points_before INTEGER;
  points_after INTEGER;
BEGIN
  -- Obtener la rutina de prueba existente
  SELECT id INTO test_routine_id 
  FROM routines 
  WHERE child_id = test_child_id 
    AND title = '🌅 Rutina Matutina de Prueba'
  LIMIT 1;

  IF test_routine_id IS NULL THEN
    RAISE EXCEPTION 'No se encontró la rutina de prueba. Ejecuta test-routine-completion.sql primero.';
  END IF;

  RAISE NOTICE '==========================================';
  RAISE NOTICE 'RE-TEST DEL SISTEMA DE RUTINAS';
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'Routine ID: %', test_routine_id;

  -- Limpiar registros de prueba anteriores
  DELETE FROM habit_records 
  WHERE habit_id IN (
    SELECT habit_id FROM routine_habits WHERE routine_id = test_routine_id
  )
  AND date = CURRENT_DATE;

  DELETE FROM routine_completions 
  WHERE routine_id = test_routine_id 
    AND completion_date = CURRENT_DATE;

  DELETE FROM points_transactions
  WHERE child_id = test_child_id
    AND DATE(created_at) = CURRENT_DATE;

  RAISE NOTICE 'Registros de prueba anteriores eliminados';

  -- Obtener saldo inicial
  SELECT points_balance INTO points_before
  FROM children WHERE id = test_child_id;

  RAISE NOTICE 'Saldo inicial: % pts', points_before;

  -- =====================================================
  -- PASO 1: Completar primer hábito (33%)
  -- =====================================================
  
  SELECT habit_id INTO test_habit_id
  FROM routine_habits
  WHERE routine_id = test_routine_id
  ORDER BY sequence_order NULLS LAST
  LIMIT 1;

  INSERT INTO habit_records (habit_id, date, value, notes)
  VALUES (test_habit_id, CURRENT_DATE, 1, 'Re-test: Primer hábito');

  PERFORM pg_sleep(0.5);

  -- Verificar completitud
  SELECT completion_percentage INTO rec
  FROM routine_completions
  WHERE routine_id = test_routine_id
    AND completion_date = CURRENT_DATE;

  IF rec IS NOT NULL THEN
    RAISE NOTICE '✅ Completitud registrada: %', rec;
  ELSE
    RAISE NOTICE '❌ NO se registró completitud';
  END IF;

  -- =====================================================
  -- PASO 2: Completar segundo hábito (66%)
  -- =====================================================
  
  SELECT habit_id INTO test_habit_id
  FROM routine_habits
  WHERE routine_id = test_routine_id
    AND habit_id != test_habit_id
  ORDER BY sequence_order NULLS LAST
  LIMIT 1;

  INSERT INTO habit_records (habit_id, date, value, notes)
  VALUES (test_habit_id, CURRENT_DATE, 1, 'Re-test: Segundo hábito');

  PERFORM pg_sleep(0.5);

  SELECT completion_percentage INTO rec
  FROM routine_completions
  WHERE routine_id = test_routine_id
    AND completion_date = CURRENT_DATE;

  RAISE NOTICE 'Completitud actual: %', rec;

  -- =====================================================
  -- PASO 3: Completar tercer hábito (100%)
  -- =====================================================
  
  SELECT habit_id INTO test_habit_id
  FROM routine_habits rh
  WHERE rh.routine_id = test_routine_id
    AND NOT EXISTS (
      SELECT 1 FROM habit_records hr 
      WHERE hr.habit_id = rh.habit_id 
        AND hr.date = CURRENT_DATE
    )
  LIMIT 1;

  INSERT INTO habit_records (habit_id, date, value, notes)
  VALUES (test_habit_id, CURRENT_DATE, 1, 'Re-test: Tercer hábito');

  PERFORM pg_sleep(0.5);

  -- =====================================================
  -- VERIFICACIÓN FINAL
  -- =====================================================
  
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'RESULTADOS FINALES:';
  RAISE NOTICE '==========================================';

  -- Completitud de rutina
  FOR rec IN
    SELECT 
      r.title,
      rc.completion_percentage,
      rc.completed_habits,
      rc.total_habits,
      rc.points_earned
    FROM routine_completions rc
    JOIN routines r ON r.id = rc.routine_id
    WHERE rc.routine_id = test_routine_id
      AND rc.completion_date = CURRENT_DATE
  LOOP
    RAISE NOTICE 'Rutina: %', rec.title;
    RAISE NOTICE '  Completitud: % (%/%)', 
      rec.completion_percentage || '%',
      rec.completed_habits,
      rec.total_habits;
    RAISE NOTICE '  Puntos bonus: % pts', rec.points_earned;
  END LOOP;

  -- Puntos ganados
  SELECT 
    COALESCE(SUM(CASE WHEN transaction_type = 'HABIT' THEN points ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN transaction_type = 'ROUTINE' THEN points ELSE 0 END), 0)
  INTO points_before, points_after
  FROM points_transactions
  WHERE child_id = test_child_id
    AND DATE(created_at) = CURRENT_DATE;

  RAISE NOTICE 'Puntos por hábitos: % pts', points_before;
  RAISE NOTICE 'Puntos bonus por rutina: % pts', points_after;

  -- Saldo final
  SELECT points_balance INTO rec
  FROM children WHERE id = test_child_id;

  RAISE NOTICE 'Saldo final: % pts', rec;

  -- Verificación de éxito
  RAISE NOTICE '==========================================';
  IF points_after = 50 THEN
    RAISE NOTICE '✅ ¡ÉXITO! El sistema funciona correctamente';
    RAISE NOTICE '   Se otorgaron los 50 puntos bonus por completar la rutina';
  ELSE
    RAISE NOTICE '❌ ERROR: No se otorgaron los puntos bonus';
    RAISE NOTICE '   Esperado: 50 pts, Recibido: % pts', points_after;
  END IF;
  RAISE NOTICE '==========================================';

END $$;
