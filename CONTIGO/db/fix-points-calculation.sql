-- =====================================================
-- MIGRACIÓN: CORRECCIÓN DE CÁLCULO DE PUNTOS
-- =====================================================

-- 1. Agregar columna routine_id a habit_records
ALTER TABLE habit_records 
ADD COLUMN IF NOT EXISTS routine_id UUID REFERENCES routines(id);

-- 2. Actualizar función on_habit_record_created
CREATE OR REPLACE FUNCTION public.on_habit_record_created()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  base_points INTEGER := 0;
  habit_child_id UUID;
  habit_title TEXT;
  habit_points_value INTEGER;
  routine_points_value INTEGER;
  result RECORD;
  points_to_award INTEGER := 0;
BEGIN
  -- Solo procesar si es un INSERT o si el valor ha aumentado en un UPDATE
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.value > OLD.value) THEN
    
    -- Obtener información del hábito
    SELECT h.child_id, h.title, h.points_value INTO habit_child_id, habit_title, habit_points_value
    FROM habits h
    WHERE h.id = NEW.habit_id;
    
    -- LÓGICA CORREGIDA:
    -- Si tenemos routine_id, usar SOLO los puntos de esa rutina
    IF NEW.routine_id IS NOT NULL THEN
        SELECT rh.points_value INTO routine_points_value
        FROM routine_habits rh
        WHERE rh.habit_id = NEW.habit_id
        AND rh.routine_id = NEW.routine_id;
        
        base_points := COALESCE(routine_points_value, habit_points_value);
    ELSE
        -- Comportamiento anterior (fallback): Sumar puntos de todas las rutinas activas
        -- (Esto se mantiene para compatibilidad, pero idealmente siempre deberíamos tener routine_id)
        SELECT COALESCE(SUM(rh.points_value), 0) INTO routine_points_value
        FROM routine_habits rh
        JOIN routines r ON r.id = rh.routine_id
        WHERE rh.habit_id = NEW.habit_id
        AND r.is_active = true
        AND rh.points_value > 0;
        
        IF routine_points_value > 0 THEN
          base_points := routine_points_value;
        ELSE
          base_points := habit_points_value;
        END IF;
    END IF;

    -- Calcular los puntos a otorgar basados en el cambio de valor
    IF TG_OP = 'UPDATE' THEN
      points_to_award := base_points * (NEW.value - OLD.value);
    ELSE -- Si es un INSERT
      points_to_award := base_points * NEW.value;
    END IF;
    
    -- Si hay puntos a otorgar, crear la transacción
    IF points_to_award > 0 THEN
      SELECT * INTO result FROM handle_points_transaction(
        habit_child_id,
        'HABIT',
        NEW.habit_id,
        points_to_award,
        'Puntos por hábito: ' || habit_title,
        FALSE -- No permitir saldo negativo
      );
      
      -- Verificar que la transacción fue exitosa
      IF NOT result.success THEN
        RAISE EXCEPTION 'Error al procesar puntos de hábito: %', result.message;
      END IF;
    END IF;
  END IF;
  
  -- Retornar el nuevo registro
  RETURN NEW;
END;
$function$;

-- 3. Actualizar función on_habit_record_deleted
CREATE OR REPLACE FUNCTION public.on_habit_record_deleted()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
  
  -- LÓGICA CORREGIDA:
  -- Si tenemos routine_id, usar SOLO los puntos de esa rutina
  IF OLD.routine_id IS NOT NULL THEN
      SELECT rh.points_value INTO routine_points_value
      FROM routine_habits rh
      WHERE rh.habit_id = OLD.habit_id
      AND rh.routine_id = OLD.routine_id;
      
      base_points := COALESCE(routine_points_value, habit_points_value);
  ELSE
      -- Comportamiento anterior (fallback)
      SELECT COALESCE(SUM(rh.points_value), 0) INTO routine_points_value
      FROM routine_habits rh
      JOIN routines r ON r.id = rh.routine_id
      WHERE rh.habit_id = OLD.habit_id
      AND r.is_active = true
      AND rh.points_value > 0;
      
      IF routine_points_value > 0 THEN
        base_points := routine_points_value;
      ELSE
        base_points := habit_points_value;
      END IF;
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
$function$;

-- 4. Intentar eliminar la restricción única anterior (habit_id, date)
-- NOTA: Esto puede fallar si el nombre de la restricción es diferente.
-- Si falla, deberás buscar el nombre correcto en la tabla information_schema.
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'habit_records'::regclass
    AND contype = 'u'
  ) LOOP
    EXECUTE 'ALTER TABLE habit_records DROP CONSTRAINT ' || quote_ident(r.conname);
  END LOOP;
END $$;

-- 5. Agregar nueva restricción única (habit_id, routine_id, date)
-- Esto permite tener el mismo hábito completado en diferentes rutinas el mismo día
ALTER TABLE habit_records
ADD CONSTRAINT habit_records_habit_routine_date_key UNIQUE NULLS NOT DISTINCT (habit_id, routine_id, date);
