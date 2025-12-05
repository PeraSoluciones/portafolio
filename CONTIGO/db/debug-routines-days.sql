-- =====================================================
-- DIAGNÓSTICO: RUTINAS NO SE MUESTRAN EN /today
-- =====================================================

-- 1. Ver cómo están guardados los días en las rutinas
SELECT 
  id,
  title,
  days,
  is_active,
  pg_typeof(days) as tipo_columna
FROM routines
WHERE title LIKE '%noche%'
ORDER BY created_at DESC
LIMIT 5;

-- 2. Verificar el formato exacto de los días
SELECT 
  id,
  title,
  days,
  array_length(days, 1) as cantidad_dias,
  -- Mostrar cada día individualmente
  unnest(days) as dia_individual
FROM routines
WHERE title LIKE '%noche%'
LIMIT 1;

-- 3. Probar el filtro que usa el endpoint
-- Simular lo que hace .contains('days', ['TUESDAY'])
SELECT 
  id,
  title,
  days,
  CASE 
    WHEN 'TUESDAY' = ANY(days) THEN 'SÍ coincide'
    ELSE 'NO coincide'
  END as coincide_tuesday,
  CASE 
    WHEN days @> ARRAY['TUESDAY'] THEN 'SÍ contiene (operador @>)'
    ELSE 'NO contiene (operador @>)'
  END as contiene_tuesday
FROM routines
WHERE title LIKE '%noche%';

-- 4. Ver todas las rutinas activas
SELECT 
  id,
  title,
  days,
  is_active,
  child_id
FROM routines
WHERE is_active = true
ORDER BY created_at DESC;

-- 5. Verificar si hay espacios o caracteres extraños
SELECT 
  id,
  title,
  days,
  -- Mostrar longitud de cada día
  array_agg(length(unnest(days))) as longitudes_dias
FROM routines
WHERE title LIKE '%noche%'
GROUP BY id, title, days;
