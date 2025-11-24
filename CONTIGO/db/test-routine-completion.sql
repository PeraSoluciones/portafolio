-- =====================================================
-- SCRIPT DE PRUEBA: SISTEMA DE COMPLETITUD DE RUTINAS
-- =====================================================
-- Este script crea datos de prueba para verificar el funcionamiento
-- del sistema de completitud de rutinas

-- IMPORTANTE: Este script usa datos de ejemplo
-- Reemplaza los UUIDs con IDs reales de tu base de datos

-- =====================================================
-- CONFIGURACIÓN: Reemplaza estos valores
-- =====================================================

-- Obtener un child_id real de tu base de datos
DO $$
DECLARE
  test_child_id UUID;
  test_routine_id UUID;
  test_habit_1_id UUID;
  test_habit_2_id UUID;
  test_habit_3_id UUID;
BEGIN
  -- Seleccionar el primer niño disponible
  SELECT id INTO test_child_id FROM children WHERE id = 'e783a827-4cba-446c-81c3-20f8b5d74d7e';
  
  IF test_child_id IS NULL THEN
    RAISE EXCEPTION 'No hay niños en la base de datos. Crea uno primero.';
  END IF;

  RAISE NOTICE 'Usando child_id: %', test_child_id;

  -- =====================================================
  -- PASO 1: Crear rutina de prueba
  -- =====================================================
  
  INSERT INTO routines (
    child_id,
    title,
    description,
    time,
    days,
    is_active,
    completion_threshold,
    routine_points,
    requires_sequence
  ) VALUES (
    test_child_id,
    '🌅 Rutina Matutina de Prueba',
    'Rutina de prueba para verificar el sistema de completitud',
    '07:00',
    ARRAY['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
    true,
    80, -- 80% de hábitos completados para considerar rutina completa
    50, -- 50 puntos bonus por completar la rutina
    false -- No requiere secuencia
  )
  RETURNING id INTO test_routine_id;

  RAISE NOTICE 'Rutina creada con ID: %', test_routine_id;

  -- =====================================================
  -- PASO 2: Crear hábitos de prueba
  -- =====================================================
  
  INSERT INTO habits (
    child_id,
    title,
    description,
    category,
    target_frequency,
    unit,
    points_value
  ) VALUES (
    test_child_id,
    '🛏️ Tender la cama',
    'Tender la cama al levantarse',
    'HYGIENE',
    1,
    'veces',
    0 -- Los puntos vendrán de la rutina
  )
  RETURNING id INTO test_habit_1_id;

  INSERT INTO habits (
    child_id,
    title,
    description,
    category,
    target_frequency,
    unit,
    points_value
  ) VALUES (
    test_child_id,
    '🪥 Lavarse los dientes',
    'Cepillarse los dientes después del desayuno',
    'HYGIENE',
    1,
    'veces',
    0
  )
  RETURNING id INTO test_habit_2_id;

  INSERT INTO habits (
    child_id,
    title,
    description,
    category,
    target_frequency,
    unit,
    points_value
  ) VALUES (
    test_child_id,
    '🍳 Desayunar saludable',
    'Tomar un desayuno nutritivo',
    'NUTRITION',
    1,
    'veces',
    0
  )
  RETURNING id INTO test_habit_3_id;

  RAISE NOTICE 'Hábitos creados: %, %, %', test_habit_1_id, test_habit_2_id, test_habit_3_id;

  -- =====================================================
  -- PASO 3: Asociar hábitos a la rutina
  -- =====================================================
  
  INSERT INTO routine_habits (routine_id, habit_id, points_value, is_required, sequence_order)
  VALUES 
    (test_routine_id, test_habit_1_id, 10, true, 1),
    (test_routine_id, test_habit_2_id, 15, true, 2),
    (test_routine_id, test_habit_3_id, 20, true, 3);

  RAISE NOTICE 'Hábitos asociados a la rutina';

  -- =====================================================
  -- PASO 4: Simular completitud de hábitos
  -- =====================================================
  
  -- Completar 2 de 3 hábitos (66.67% - NO alcanza el 80%)
  INSERT INTO habit_records (habit_id, date, value, notes)
  VALUES 
    (test_habit_1_id, CURRENT_DATE, 1, 'Prueba: Tender la cama'),
    (test_habit_2_id, CURRENT_DATE, 1, 'Prueba: Lavarse los dientes');

  RAISE NOTICE 'Registros de hábitos creados (2/3 completados)';

  -- =====================================================
  -- PASO 5: Verificar resultados
  -- =====================================================
  
  -- Esperar un momento para que los triggers se ejecuten
  PERFORM pg_sleep(1);

  -- Verificar completitud de rutina
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'RESULTADOS DE LA PRUEBA:';
  RAISE NOTICE '==========================================';

  -- Mostrar completitud
  PERFORM (
    SELECT 
      RAISE NOTICE 'Rutina: % - Completitud: %% (%/%)', 
      r.title,
      rc.completion_percentage,
      rc.completed_habits,
      rc.total_habits
    FROM routine_completions rc
    JOIN routines r ON r.id = rc.routine_id
    WHERE rc.routine_id = test_routine_id
      AND rc.completion_date = CURRENT_DATE
  );

  -- Verificar puntos otorgados
  PERFORM (
    SELECT 
      RAISE NOTICE 'Puntos por hábitos: % pts', 
      COALESCE(SUM(points), 0)
    FROM points_transactions
    WHERE child_id = test_child_id
      AND transaction_type = 'HABIT'
      AND DATE(created_at) = CURRENT_DATE
  );

  PERFORM (
    SELECT 
      RAISE NOTICE 'Puntos bonus por rutina: % pts', 
      COALESCE(SUM(points), 0)
    FROM points_transactions
    WHERE child_id = test_child_id
      AND transaction_type = 'ROUTINE'
      AND DATE(created_at) = CURRENT_DATE
  );

  -- =====================================================
  -- PASO 6: Completar el tercer hábito
  -- =====================================================
  
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'Completando tercer hábito...';
  RAISE NOTICE '==========================================';

  INSERT INTO habit_records (habit_id, date, value, notes)
  VALUES (test_habit_3_id, CURRENT_DATE, 1, 'Prueba: Desayunar saludable');

  PERFORM pg_sleep(1);

  -- Verificar nuevamente
  PERFORM (
    SELECT 
      RAISE NOTICE 'Rutina: % - Completitud: %% (%/%)', 
      r.title,
      rc.completion_percentage,
      rc.completed_habits,
      rc.total_habits
    FROM routine_completions rc
    JOIN routines r ON r.id = rc.routine_id
    WHERE rc.routine_id = test_routine_id
      AND rc.completion_date = CURRENT_DATE
  );

  PERFORM (
    SELECT 
      RAISE NOTICE 'Puntos TOTALES por hábitos: % pts', 
      COALESCE(SUM(points), 0)
    FROM points_transactions
    WHERE child_id = test_child_id
      AND transaction_type = 'HABIT'
      AND DATE(created_at) = CURRENT_DATE
  );

  PERFORM (
    SELECT 
      RAISE NOTICE 'Puntos bonus por rutina: % pts (debería ser 50)', 
      COALESCE(SUM(points), 0)
    FROM points_transactions
    WHERE child_id = test_child_id
      AND transaction_type = 'ROUTINE'
      AND DATE(created_at) = CURRENT_DATE
  );

  RAISE NOTICE '==========================================';
  RAISE NOTICE 'PRUEBA COMPLETADA';
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'Si ves "Puntos bonus por rutina: 50 pts", ¡el sistema funciona!';
  
END $$;
