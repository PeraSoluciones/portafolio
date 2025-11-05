-- =====================================================
-- MIGRACIÓN: AGREGAR CAMPO DE PUNTOS A LA TABLA HÁBITOS
-- =====================================================

-- Esta migración agrega un campo de puntos directo a la tabla de hábitos
-- para permitir asignar un valor de puntos específico a cada hábito
-- que se usará cuando el hábito se complete fuera de una rutina
-- o como valor predeterminado en las rutinas

-- 1. Agregar columna de puntos a la tabla hábitos
ALTER TABLE habits ADD COLUMN IF NOT EXISTS points_value INTEGER DEFAULT 0 CHECK (points_value >= 0);

-- 2. Crear índice para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_habits_points_value ON habits(points_value);

-- 3. Actualizar el trigger para considerar los puntos directos del hábito
-- cuando no hay puntos asignados a través de rutinas
CREATE OR REPLACE FUNCTION on_habit_record_created_with_points()
RETURNS TRIGGER AS $$
DECLARE
  total_points INTEGER := 0;
  habit_child_id UUID;
  habit_title TEXT;
  habit_points INTEGER;
  routine_points INTEGER;
  result RECORD;
BEGIN
  -- Obtener información del hábito, incluyendo su valor de puntos directo
  SELECT h.child_id, h.title, h.points_value INTO habit_child_id, habit_title, habit_points
  FROM habits h
  WHERE h.id = NEW.habit_id;
  
  -- Sumar puntos de todas las rutinas que incluyen este hábito
  SELECT COALESCE(SUM(rh.points_value), 0) INTO routine_points
  FROM routine_habits rh
  JOIN routines r ON r.id = rh.routine_id
  WHERE rh.habit_id = NEW.habit_id
  AND r.is_active = true
  AND rh.points_value > 0;
  
  -- Si hay puntos asignados en rutinas, usar esos
  -- Si no, usar los puntos directos del hábito
  IF routine_points > 0 THEN
    total_points := routine_points;
  ELSIF habit_points > 0 THEN
    total_points := habit_points;
  END IF;
  
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

-- 4. Reemplazar el trigger existente con el nuevo que considera puntos directos
DROP TRIGGER IF EXISTS on_habit_record_created_trigger ON habit_records;
CREATE TRIGGER on_habit_record_created_trigger
  AFTER INSERT ON habit_records
  FOR EACH ROW EXECUTE FUNCTION on_habit_record_created_with_points();

-- 5. Verificar que la columna se agregó correctamente
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default,
  check_clause
FROM information_schema.columns 
WHERE table_name = 'habits' 
  AND table_schema = 'public'
  AND column_name = 'points_value';