-- =====================================================
-- FIX: AMBIGÜEDAD EN evaluate_routine_completion
-- =====================================================
-- Corrige el error "column reference points_earned is ambiguous"

CREATE OR REPLACE FUNCTION evaluate_routine_completion(
  p_routine_id UUID,
  p_child_id UUID,
  p_completion_date DATE
)
RETURNS TABLE (
  completion_id UUID,
  completion_percentage INTEGER,
  points_earned INTEGER
) AS $$
DECLARE
  v_total_habits INTEGER;
  v_completed_habits INTEGER;
  v_completion_percentage INTEGER;
  v_completion_id UUID;
  v_points_earned INTEGER := 0;
BEGIN
  -- Contar hábitos totales y completados para esta rutina
  SELECT 
    COUNT(*) as total,
    COUNT(hr.id) as completed
  INTO v_total_habits, v_completed_habits
  FROM routine_habits rh
  LEFT JOIN habit_records hr ON hr.habit_id = rh.habit_id 
    AND hr.date = p_completion_date
  WHERE rh.routine_id = p_routine_id;

  -- Calcular porcentaje
  v_completion_percentage := CASE 
    WHEN v_total_habits > 0 
    THEN (v_completed_habits * 100) / v_total_habits 
    ELSE 0 
  END;

  -- Insertar o actualizar registro de completitud
  INSERT INTO routine_completions (
    routine_id,
    child_id,
    completion_date,
    completion_percentage,
    total_habits,
    completed_habits,
    points_earned
  ) VALUES (
    p_routine_id,
    p_child_id,
    p_completion_date,
    v_completion_percentage,
    v_total_habits,
    v_completed_habits,
    0 -- Los puntos se asignarán en el trigger
  )
  ON CONFLICT (routine_id, child_id, completion_date)
  DO UPDATE SET
    completion_percentage = EXCLUDED.completion_percentage,
    total_habits = EXCLUDED.total_habits,
    completed_habits = EXCLUDED.completed_habits,
    updated_at = NOW()
  RETURNING id, routine_completions.points_earned -- ✅ FIX: Calificar con nombre de tabla
  INTO v_completion_id, v_points_earned;

  RETURN QUERY SELECT v_completion_id, v_completion_percentage, v_points_earned;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION evaluate_routine_completion IS 'Calcula y registra el porcentaje de completitud de una rutina';

-- Verificar que la función se actualizó
SELECT 'evaluate_routine_completion actualizada correctamente' as status;
