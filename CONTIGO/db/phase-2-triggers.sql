-- =====================================================
-- FASE 2: TRIGGERS AUTOMÁTICOS PARA EL SISTEMA DE PUNTOS
-- =====================================================

-- Función trigger para asignar puntos cuando se registra un comportamiento
CREATE OR REPLACE FUNCTION on_behavior_record_created()
RETURNS TRIGGER AS $$
DECLARE
  behavior_points INTEGER;
  child_id UUID;
  behavior_title TEXT;
  result RECORD;
BEGIN
  -- Obtener los detalles del comportamiento
  SELECT b.points_value, b.child_id, b.title INTO behavior_points, child_id, behavior_title
  FROM behaviors b
  WHERE b.id = NEW.behavior_id;
  
  -- Usar la función principal para crear la transacción de puntos
  SELECT * INTO result FROM handle_points_transaction(
    child_id,
    'BEHAVIOR',
    NEW.behavior_id,
    behavior_points,
    'Puntos por comportamiento: ' || behavior_title,
    FALSE -- No permitir saldo negativo
  );
  
  -- Verificar que la transacción fue exitosa
  IF NOT result.success THEN
    RAISE EXCEPTION 'Error al procesar puntos de comportamiento: %', result.message;
  END IF;
  
  -- Retornar el nuevo registro
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función trigger para asignar puntos cuando se registra un hábito
CREATE OR REPLACE FUNCTION on_habit_record_created()
RETURNS TRIGGER AS $$
DECLARE
  total_points INTEGER := 0;
  habit_child_id UUID;
  habit_title TEXT;
  result RECORD;
BEGIN
  -- Obtener información del hábito
  SELECT h.child_id, h.title INTO habit_child_id, habit_title
  FROM habits h
  WHERE h.id = NEW.habit_id;
  
  -- Sumar puntos de todas las rutinas que incluyen este hábito
  SELECT COALESCE(SUM(rh.points_value), 0) INTO total_points
  FROM routine_habits rh
  JOIN routines r ON r.id = rh.routine_id
  WHERE rh.habit_id = NEW.habit_id
  AND r.is_active = true
  AND rh.points_value > 0;
  
  -- Si hay puntos asignados, crear la transacción
  IF total_points > 0 THEN
    SELECT * INTO result FROM handle_points_transaction(
      habit_child_id,
      'HABIT',
      NEW.habit_id,
      total_points,
      'Puntos por hábito completado: ' || habit_title,
      FALSE -- No permitir saldo negativo
    );
    
    -- Verificar que la transacción fue exitosa
    IF NOT result.success THEN
      RAISE EXCEPTION 'Error al procesar puntos de hábito: %', result.message;
    END IF;
  END IF;
  
  -- Retornar el nuevo registro
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función trigger para descontar puntos cuando se reclama una recompensa
CREATE OR REPLACE FUNCTION on_reward_claimed()
RETURNS TRIGGER AS $$
DECLARE
  reward_points INTEGER;
  child_id UUID;
  reward_title TEXT;
  result RECORD;
BEGIN
  -- Obtener detalles de la recompensa
  SELECT r.points_required, r.child_id, r.title INTO reward_points, child_id, reward_title
  FROM rewards r
  WHERE r.id = NEW.reward_id;
  
  -- Usar la función principal para crear la transacción de puntos (negativa)
  SELECT * INTO result FROM handle_points_transaction(
    child_id,
    'REWARD_REDEMPTION',
    NEW.reward_id,
    -reward_points,
    'Canjeo de recompensa: ' || reward_title,
    FALSE -- No permitir saldo negativo
  );
  
  -- Verificar que la transacción fue exitosa
  IF NOT result.success THEN
    RAISE EXCEPTION 'Error al procesar canje de recompensa: %', result.message;
    -- En caso de error, hacer rollback del reclamo
    DELETE FROM reward_claims WHERE id = NEW.id;
    RETURN NULL;
  END IF;
  
  -- Retornar el nuevo registro
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función trigger para asignar puntos cuando se completa una rutina
CREATE OR REPLACE FUNCTION on_routine_completed()
RETURNS TRIGGER AS $$
DECLARE
  routine_points INTEGER := 0;
  child_id UUID;
  routine_title TEXT;
  result RECORD;
BEGIN
  -- Este trigger se puede implementar en el futuro si se decide agregar una tabla de rutinas_completadas
  -- Por ahora, los puntos de rutinas se otorgan a través de los hábitos asociados
  
  -- Obtener información de la rutina
  SELECT r.child_id, r.title INTO child_id, routine_title
  FROM routines r
  WHERE r.id = NEW.routine_id;
  
  -- Sumar puntos de todos los hábitos requeridos en esta rutina
  SELECT COALESCE(SUM(rh.points_value), 0) INTO routine_points
  FROM routine_habits rh
  WHERE rh.routine_id = NEW.routine_id
  AND rh.is_required = true
  AND rh.points_value > 0;
  
  -- Si hay puntos asignados, crear la transacción
  IF routine_points > 0 THEN
    SELECT * INTO result FROM handle_points_transaction(
      child_id,
      'ROUTINE',
      NEW.routine_id,
      routine_points,
      'Puntos por rutina completada: ' || routine_title,
      FALSE -- No permitir saldo negativo
    );
    
    -- Verificar que la transacción fue exitosa
    IF NOT result.success THEN
      RAISE EXCEPTION 'Error al procesar puntos de rutina: %', result.message;
    END IF;
  END IF;
  
  -- Retornar el nuevo registro
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- CREACIÓN DE LOS TRIGGERS
-- =====================================================

-- Eliminar triggers existentes si los hay
DROP TRIGGER IF EXISTS award_behavior_points_trigger ON behavior_records;
DROP TRIGGER IF EXISTS award_habit_points_trigger ON habit_records;
DROP TRIGGER IF EXISTS deduct_reward_points_trigger ON reward_claims;

-- Crear los triggers automáticos
CREATE TRIGGER on_behavior_record_created_trigger
  AFTER INSERT ON behavior_records
  FOR EACH ROW EXECUTE FUNCTION on_behavior_record_created();

CREATE TRIGGER on_habit_record_created_trigger
  AFTER INSERT ON habit_records
  FOR EACH ROW EXECUTE FUNCTION on_habit_record_created();

CREATE TRIGGER on_reward_claimed_trigger
  AFTER INSERT ON reward_claims
  FOR EACH ROW EXECUTE FUNCTION on_reward_claimed();

-- Nota: El trigger de rutinas completadas está preparado pero no activado hasta que se implemente
-- la funcionalidad de seguimiento de completado de rutinas
-- CREATE TRIGGER on_routine_completed_trigger
--   AFTER INSERT ON routine_completions
--   FOR EACH ROW EXECUTE FUNCTION on_routine_completed();

-- =====================================================
-- FUNCIONES ADICIONALES DE SOPORTE
-- =====================================================

-- Función para obtener la próxima recompensa que un niño puede canjear
CREATE OR REPLACE FUNCTION get_next_achievable_reward(p_child_id UUID)
RETURNS TABLE (
  reward_id UUID,
  title TEXT,
  description TEXT,
  points_required INTEGER,
  can_afford BOOLEAN,
  points_needed INTEGER
) AS $$
DECLARE
  current_balance INTEGER;
BEGIN
  -- Obtener el balance actual del niño
  SELECT get_child_points_balance(p_child_id) INTO current_balance;
  
  RETURN QUERY
  SELECT
    r.id,
    r.title,
    r.description,
    r.points_required,
    (r.points_required <= current_balance) as can_afford,
    GREATEST(0, r.points_required - current_balance) as points_needed
  FROM rewards r
  WHERE r.child_id = p_child_id
  AND r.is_active = true
  ORDER BY r.points_required ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar si un niño puede canjear una recompensa específica
CREATE OR REPLACE FUNCTION can_child_claim_reward(p_child_id UUID, p_reward_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_current_balance INTEGER;
  v_points_required INTEGER;
  v_reward_exists BOOLEAN;
BEGIN
  -- Verificar que la recompensa existe y pertenece al niño
  SELECT EXISTS(
    SELECT 1 FROM public.rewards r
    WHERE r.id = p_reward_id
      AND r.child_id = p_child_id
      AND r.is_active = true
  ) INTO v_reward_exists;

  IF NOT v_reward_exists THEN
    RETURN FALSE;
  END IF;

  -- Obtener el balance actual del niño y los puntos requeridos
  SELECT public.get_child_points_balance(p_child_id) INTO v_current_balance;
  SELECT r.points_required INTO v_points_required
  FROM public.rewards r
  WHERE r.id = p_reward_id AND r.child_id = p_child_id;

  -- Verificar si tiene suficientes puntos
  RETURN v_current_balance >= v_points_required;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;