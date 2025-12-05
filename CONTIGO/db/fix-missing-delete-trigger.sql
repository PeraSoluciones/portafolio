-- =====================================================
-- FIX: AGREGAR TRIGGER PARA REVERTIR PUNTOS AL DESMARCAR HÁBITO
-- =====================================================
-- Este trigger faltante causa que los puntos se acumulen sin revertirse

-- 1. Función para revertir puntos cuando se elimina un habit_record
CREATE OR REPLACE FUNCTION on_habit_record_deleted()
RETURNS TRIGGER AS $$
DECLARE
  base_points INTEGER := 0;
  habit_child_id UUID;
  habit_title TEXT;
  habit_points_value INTEGER;
  routine_points_value INTEGER;
  result RECORD;
  points_to_deduct INTEGER := 0;
BEGIN
  -- Obtener información del hábito
  SELECT h.child_id, h.title, h.points_value 
  INTO habit_child_id, habit_title, habit_points_value
  FROM habits h
  WHERE h.id = OLD.habit_id;
  
  -- Sumar puntos de todas las rutinas activas que incluyen este hábito
  SELECT COALESCE(SUM(rh.points_value), 0) INTO routine_points_value
  FROM routine_habits rh
  JOIN routines r ON r.id = rh.routine_id
  WHERE rh.habit_id = OLD.habit_id
  AND r.is_active = true
  AND rh.points_value > 0;
  
  -- Priorizar puntos de rutina, si no, usar los del hábito
  IF routine_points_value > 0 THEN
    base_points := routine_points_value;
  ELSE
    base_points := habit_points_value;
  END IF;

  -- Calcular los puntos a deducir basados en el valor del registro eliminado
  points_to_deduct := base_points * OLD.value;
  
  -- Si hay puntos a deducir, crear la transacción negativa
  IF points_to_deduct > 0 THEN
    SELECT * INTO result FROM handle_points_transaction(
      habit_child_id,
      'HABIT',
      OLD.habit_id,
      -points_to_deduct,  -- NEGATIVO para revertir
      'Puntos revertidos por desmarcar hábito: ' || habit_title,
      TRUE -- Permitir saldo negativo temporalmente
    );
    
    -- Verificar que la transacción fue exitosa
    IF NOT result.success THEN
      RAISE EXCEPTION 'Error al revertir puntos de hábito: %', result.message;
    END IF;
  END IF;
  
  -- Retornar el registro eliminado
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Crear el trigger para DELETE
DROP TRIGGER IF EXISTS on_habit_record_deleted_trigger ON habit_records;
CREATE TRIGGER on_habit_record_deleted_trigger
  AFTER DELETE ON habit_records
  FOR EACH ROW EXECUTE FUNCTION on_habit_record_deleted();

-- 3. Verificar que se creó correctamente
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'habit_records'
ORDER BY trigger_name;

RAISE NOTICE '✅ Trigger para revertir puntos al desmarcar hábitos creado correctamente';
RAISE NOTICE 'Ahora al DELETE de habit_records se revertirán los puntos automáticamente';
