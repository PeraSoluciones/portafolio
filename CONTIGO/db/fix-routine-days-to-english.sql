-- =====================================================
-- FIX: NORMALIZAR DÍAS DE RUTINAS A INGLÉS
-- =====================================================
-- Este script convierte todos los días de español a inglés
-- para que sean consistentes con el código de la aplicación

-- 1. Verificar estado actual
SELECT 
  id,
  title,
  days as dias_actuales,
  child_id
FROM routines
WHERE is_active = true
ORDER BY created_at;

-- 2. Actualizar rutinas con días en español a inglés
UPDATE routines
SET days = (
  SELECT ARRAY_AGG(
    CASE day_value
      WHEN 'LUN' THEN 'MONDAY'
      WHEN 'MAR' THEN 'TUESDAY'
      WHEN 'MIÉ' THEN 'WEDNESDAY'
      WHEN 'MIE' THEN 'WEDNESDAY'  -- Por si acaso hay sin acento
      WHEN 'JUE' THEN 'THURSDAY'
      WHEN 'VIE' THEN 'FRIDAY'
      WHEN 'SÁB' THEN 'SATURDAY'
      WHEN 'SAB' THEN 'SATURDAY'   -- Por si acaso hay sin acento
      WHEN 'DOM' THEN 'SUNDAY'
      -- Si ya está en inglés, dejarlo como está
      ELSE day_value
    END
  )
  FROM unnest(routines.days) AS day_value
),
updated_at = NOW()
WHERE EXISTS (
  SELECT 1 FROM unnest(days) d
  WHERE d IN ('LUN', 'MAR', 'MIÉ', 'MIE', 'JUE', 'VIE', 'SÁB', 'SAB', 'DOM')
);

-- 3. Verificar que se actualizaron correctamente
SELECT 
  id,
  title,
  days as dias_actualizados,
  updated_at
FROM routines
WHERE is_active = true
ORDER BY updated_at DESC;

-- 4. Contar rutinas actualizadas
SELECT 
  COUNT(*) as total_rutinas_actualizadas
FROM routines
WHERE updated_at > NOW() - INTERVAL '1 minute';

RAISE NOTICE '✅ Rutinas actualizadas a formato inglés';
RAISE NOTICE 'Ahora todas las rutinas usan: MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY';
