-- =====================================================
-- FIX: TRIGGER DE COMPLETITUD DE RUTINAS
-- =====================================================
-- Este script corrige el problema del trigger que no se dispara
-- debido a un issue con el formato del día de la semana

-- El problema está en la línea 282 del script original:
-- v_today = ANY(r.days)
-- 
-- El formato de TO_CHAR(date, 'DAY') puede variar según la configuración
-- de PostgreSQL (puede incluir espacios, mayúsculas/minúsculas, etc.)

-- =====================================================
-- SOLUCIÓN: Reemplazar función del trigger
-- =====================================================

CREATE OR REPLACE FUNCTION check_routine_completion_on_habit_change()
RETURNS TRIGGER AS $$
DECLARE
  v_routine_ids UUID[];
  v_routine_id UUID;
  v_child_id UUID;
  v_date DATE;
BEGIN
  -- Determinar la fecha y child_id según la operación
  IF TG_OP = 'DELETE' THEN
    v_date := OLD.date;
    SELECT child_id INTO v_child_id FROM habits WHERE id = OLD.habit_id;
  ELSE
    v_date := NEW.date;
    SELECT child_id INTO v_child_id FROM habits WHERE id = NEW.habit_id;
  END IF;

  -- Obtener rutinas activas que contienen este hábito
  -- SIN filtrar por día (evaluaremos todas las rutinas)
  SELECT ARRAY_AGG(DISTINCT rh.routine_id)
  INTO v_routine_ids
  FROM routine_habits rh
  JOIN routines r ON r.id = rh.routine_id
  WHERE rh.habit_id = COALESCE(NEW.habit_id, OLD.habit_id)
    AND r.is_active = true;

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

-- Recrear el trigger
DROP TRIGGER IF EXISTS check_routine_completion_trigger ON habit_records;
CREATE TRIGGER check_routine_completion_trigger
  AFTER INSERT OR UPDATE OR DELETE ON habit_records
  FOR EACH ROW EXECUTE FUNCTION check_routine_completion_on_habit_change();

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Verificar que el trigger se recreó
SELECT 
  t.tgname as trigger_name,
  t.tgenabled as enabled,
  c.relname as table_name
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
WHERE t.tgname = 'check_routine_completion_trigger';

RAISE NOTICE '✅ Trigger actualizado correctamente';
RAISE NOTICE 'Ahora el trigger evaluará TODAS las rutinas activas que contengan el hábito';
RAISE NOTICE 'sin importar el día de la semana';
