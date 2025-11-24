-- =====================================================
-- IMPLEMENTACIÓN: SISTEMA DE COMPLETITUD DE RUTINAS
-- =====================================================
-- Este script implementa el sistema completo de seguimiento
-- de completitud de rutinas basado en la propuesta actualizada

-- =====================================================
-- PASO 1: CREAR TABLA routine_completions
-- =====================================================

CREATE TABLE IF NOT EXISTS routine_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  routine_id UUID NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  completion_date DATE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completion_percentage INTEGER NOT NULL CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  total_habits INTEGER NOT NULL,
  completed_habits INTEGER NOT NULL,
  points_earned INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(routine_id, child_id, completion_date)
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_routine_completions_child_date 
  ON routine_completions(child_id, completion_date DESC);

CREATE INDEX IF NOT EXISTS idx_routine_completions_routine 
  ON routine_completions(routine_id, completion_date DESC);

-- Comentarios para documentación
COMMENT ON TABLE routine_completions IS 'Registra la completitud diaria de rutinas para cada niño';
COMMENT ON COLUMN routine_completions.completion_percentage IS 'Porcentaje de hábitos completados (0-100)';
COMMENT ON COLUMN routine_completions.points_earned IS 'Puntos bonus otorgados por completar la rutina';

-- =====================================================
-- PASO 2: AGREGAR CAMPOS A TABLA routines
-- =====================================================

ALTER TABLE routines 
  ADD COLUMN IF NOT EXISTS completion_threshold INTEGER DEFAULT 100 
  CHECK (completion_threshold > 0 AND completion_threshold <= 100);

ALTER TABLE routines 
  ADD COLUMN IF NOT EXISTS routine_points INTEGER DEFAULT 0 
  CHECK (routine_points >= 0);

ALTER TABLE routines 
  ADD COLUMN IF NOT EXISTS requires_sequence BOOLEAN DEFAULT false;

-- Comentarios
COMMENT ON COLUMN routines.completion_threshold IS 'Porcentaje mínimo de hábitos para considerar rutina completa (default: 100%)';
COMMENT ON COLUMN routines.routine_points IS 'Puntos bonus por completar la rutina entera';
COMMENT ON COLUMN routines.requires_sequence IS 'Si true, los hábitos deben completarse en orden';

-- =====================================================
-- PASO 3: AGREGAR CAMPOS A TABLA routine_habits
-- =====================================================

ALTER TABLE routine_habits 
  ADD COLUMN IF NOT EXISTS sequence_order INTEGER;

ALTER TABLE routine_habits 
  ADD COLUMN IF NOT EXISTS can_skip BOOLEAN DEFAULT false;

-- Índice para ordenamiento
CREATE INDEX IF NOT EXISTS idx_routine_habits_sequence 
  ON routine_habits(routine_id, sequence_order);

COMMENT ON COLUMN routine_habits.sequence_order IS 'Orden del hábito en la rutina (solo si requires_sequence=true)';
COMMENT ON COLUMN routine_habits.can_skip IS 'Si true, puede saltarse sin afectar la secuencia';

-- =====================================================
-- PASO 4: POLÍTICAS RLS PARA routine_completions
-- =====================================================

ALTER TABLE routine_completions ENABLE ROW LEVEL SECURITY;

-- Política para padres
DROP POLICY IF EXISTS "Parents can view their children's routine completions" ON routine_completions;
CREATE POLICY "Parents can view their children's routine completions" ON routine_completions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM children 
            WHERE children.id = routine_completions.child_id 
            AND children.parent_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Parents can insert their children's routine completions" ON routine_completions;
CREATE POLICY "Parents can insert their children's routine completions" ON routine_completions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM children 
            WHERE children.id = routine_completions.child_id 
            AND children.parent_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Parents can update their children's routine completions" ON routine_completions;
CREATE POLICY "Parents can update their children's routine completions" ON routine_completions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM children 
            WHERE children.id = routine_completions.child_id 
            AND children.parent_id = auth.uid()
        )
    );

-- Política para profesionales (si existe la función has_professional_access)
DROP POLICY IF EXISTS "Professionals can view assigned children's routine completions" ON routine_completions;
CREATE POLICY "Professionals can view assigned children's routine completions" ON routine_completions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM professional_patient_access
            WHERE professional_id = auth.uid()
            AND child_id = routine_completions.child_id
            AND status != 'revoked'
        )
    );

-- =====================================================
-- PASO 5: FUNCIÓN PARA EVALUAR COMPLETITUD DE RUTINA
-- =====================================================

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
  RETURNING id, points_earned INTO v_completion_id, v_points_earned;

  RETURN QUERY SELECT v_completion_id, v_completion_percentage, v_points_earned;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION evaluate_routine_completion IS 'Calcula y registra el porcentaje de completitud de una rutina';

-- =====================================================
-- PASO 6: MEJORAR FUNCIÓN on_routine_completed
-- =====================================================

CREATE OR REPLACE FUNCTION on_routine_completed()
RETURNS TRIGGER AS $$
DECLARE
  routine_points INTEGER := 0;
  child_id UUID;
  routine_title TEXT;
  completion_threshold INTEGER;
  result RECORD;
BEGIN
  -- Obtener información de la rutina
  SELECT r.child_id, r.title, r.routine_points, r.completion_threshold 
  INTO child_id, routine_title, routine_points, completion_threshold
  FROM routines r
  WHERE r.id = NEW.routine_id;
  
  -- Solo otorgar puntos si:
  -- 1. Alcanza el umbral de completitud
  -- 2. Hay puntos configurados
  -- 3. Es un INSERT o el porcentaje aumentó
  IF NEW.completion_percentage >= completion_threshold 
     AND routine_points > 0 
     AND (TG_OP = 'INSERT' OR NEW.completion_percentage > OLD.completion_percentage) THEN
    
    SELECT * INTO result FROM handle_points_transaction(
      child_id,
      'ROUTINE',
      NEW.routine_id,
      routine_points,
      'Rutina completada: ' || routine_title || ' (' || NEW.completion_percentage || '%)',
      FALSE -- No permitir saldo negativo
    );
    
    -- Actualizar los puntos ganados en el registro de completitud
    IF result.success THEN
      UPDATE routine_completions
      SET points_earned = routine_points
      WHERE id = NEW.id;
    ELSE
      RAISE WARNING 'Error al procesar puntos de rutina: %', result.message;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION on_routine_completed IS 'Otorga puntos bonus cuando una rutina alcanza el umbral de completitud';

-- =====================================================
-- PASO 7: TRIGGER PARA EVALUAR RUTINAS AL CAMBIAR HÁBITOS
-- =====================================================

CREATE OR REPLACE FUNCTION check_routine_completion_on_habit_change()
RETURNS TRIGGER AS $$
DECLARE
  v_routine_ids UUID[];
  v_routine_id UUID;
  v_child_id UUID;
  v_date DATE;
  v_today TEXT;
BEGIN
  -- Determinar la fecha y child_id según la operación
  IF TG_OP = 'DELETE' THEN
    v_date := OLD.date;
    SELECT child_id INTO v_child_id FROM habits WHERE id = OLD.habit_id;
  ELSE
    v_date := NEW.date;
    SELECT child_id INTO v_child_id FROM habits WHERE id = NEW.habit_id;
  END IF;

  -- Obtener día de la semana en formato que usa la tabla routines
  v_today := UPPER(TO_CHAR(v_date, 'DAY'));
  v_today := TRIM(v_today); -- Eliminar espacios

  -- Obtener rutinas activas que:
  -- 1. Contienen este hábito
  -- 2. Están programadas para este día
  SELECT ARRAY_AGG(DISTINCT rh.routine_id)
  INTO v_routine_ids
  FROM routine_habits rh
  JOIN routines r ON r.id = rh.routine_id
  WHERE rh.habit_id = COALESCE(NEW.habit_id, OLD.habit_id)
    AND r.is_active = true
    AND v_today = ANY(r.days);

  -- Evaluar completitud de cada rutina afectada
  IF v_routine_ids IS NOT NULL THEN
    FOREACH v_routine_id IN ARRAY v_routine_ids
    LOOP
      PERFORM evaluate_routine_completion(
        v_routine_id,
        v_child_id,
        v_date
      );
    END LOOP;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_routine_completion_on_habit_change IS 'Evalúa completitud de rutinas cuando se completa/desmarca un hábito';

-- =====================================================
-- PASO 8: ACTIVAR TRIGGERS
-- =====================================================

-- Trigger para evaluar rutinas cuando cambian hábitos
DROP TRIGGER IF EXISTS check_routine_completion_trigger ON habit_records;
CREATE TRIGGER check_routine_completion_trigger
  AFTER INSERT OR UPDATE OR DELETE ON habit_records
  FOR EACH ROW EXECUTE FUNCTION check_routine_completion_on_habit_change();

-- Trigger para otorgar puntos cuando se completa rutina
DROP TRIGGER IF EXISTS on_routine_completed_trigger ON routine_completions;
CREATE TRIGGER on_routine_completed_trigger
  AFTER INSERT OR UPDATE ON routine_completions
  FOR EACH ROW EXECUTE FUNCTION on_routine_completed();

-- =====================================================
-- PASO 9: FUNCIÓN PARA CALCULAR RACHA DE RUTINA
-- =====================================================

CREATE OR REPLACE FUNCTION get_routine_streak(
  p_routine_id UUID,
  p_child_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_streak INTEGER := 0;
  v_current_date DATE := CURRENT_DATE;
  v_completed BOOLEAN;
  v_threshold INTEGER;
  v_day_name TEXT;
  v_is_scheduled BOOLEAN;
BEGIN
  -- Obtener umbral de completitud de la rutina
  SELECT completion_threshold INTO v_threshold
  FROM routines WHERE id = p_routine_id;

  LOOP
    -- Verificar si la rutina está programada para este día
    v_day_name := UPPER(TO_CHAR(v_current_date, 'DAY'));
    v_day_name := TRIM(v_day_name);
    
    SELECT v_day_name = ANY(days) INTO v_is_scheduled
    FROM routines WHERE id = p_routine_id;
    
    -- Solo contar días en que la rutina está programada
    IF v_is_scheduled THEN
      SELECT EXISTS (
        SELECT 1 FROM routine_completions
        WHERE routine_id = p_routine_id
          AND child_id = p_child_id
          AND completion_date = v_current_date
          AND completion_percentage >= v_threshold
      ) INTO v_completed;

      EXIT WHEN NOT v_completed;
      v_streak := v_streak + 1;
    END IF;
    
    v_current_date := v_current_date - INTERVAL '1 day';
    
    -- Límite de seguridad: no buscar más de 365 días atrás
    EXIT WHEN v_current_date < CURRENT_DATE - INTERVAL '365 days';
  END LOOP;

  RETURN v_streak;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_routine_streak IS 'Calcula la racha actual de días consecutivos completando una rutina';

-- =====================================================
-- PASO 10: VISTA PARA ADHERENCIA SEMANAL
-- =====================================================

CREATE OR REPLACE VIEW routine_adherence_weekly AS
SELECT 
  r.id AS routine_id,
  r.title,
  r.child_id,
  DATE_TRUNC('week', rc.completion_date)::date AS week_start,
  COUNT(*) AS times_attempted,
  SUM(CASE WHEN rc.completion_percentage >= r.completion_threshold THEN 1 ELSE 0 END) AS times_completed,
  ROUND(AVG(rc.completion_percentage), 2) AS avg_completion,
  SUM(rc.points_earned) AS total_points_earned
FROM routines r
LEFT JOIN routine_completions rc ON rc.routine_id = r.id
GROUP BY r.id, r.title, r.child_id, DATE_TRUNC('week', rc.completion_date);

COMMENT ON VIEW routine_adherence_weekly IS 'Estadísticas semanales de adherencia a rutinas';

-- =====================================================
-- VERIFICACIÓN DE INSTALACIÓN
-- =====================================================

-- Verificar que la tabla se creó correctamente
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'routine_completions') THEN
    RAISE NOTICE '✅ Tabla routine_completions creada correctamente';
  ELSE
    RAISE EXCEPTION '❌ Error: Tabla routine_completions no se creó';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'routines' AND column_name = 'completion_threshold') THEN
    RAISE NOTICE '✅ Columna completion_threshold agregada a routines';
  ELSE
    RAISE EXCEPTION '❌ Error: Columna completion_threshold no se agregó';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'check_routine_completion_trigger') THEN
    RAISE NOTICE '✅ Trigger check_routine_completion_trigger creado';
  ELSE
    RAISE EXCEPTION '❌ Error: Trigger check_routine_completion_trigger no se creó';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_routine_completed_trigger') THEN
    RAISE NOTICE '✅ Trigger on_routine_completed_trigger creado';
  ELSE
    RAISE EXCEPTION '❌ Error: Trigger on_routine_completed_trigger no se creó';
  END IF;

  RAISE NOTICE '✅ Instalación completada exitosamente';
END $$;
