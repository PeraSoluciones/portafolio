-- =====================================================
-- DIAGNÓSTICO: PUNTOS EN RUTINAS
-- =====================================================

-- 1. Ver rutinas y sus hábitos con puntos
SELECT 
  r.title as rutina,
  r.child_id,
  h.title as habito,
  h.child_id as habito_child_id,
  rh.points_value as puntos_rutina,
  h.points_value as puntos_habito_directo
FROM routines r
JOIN routine_habits rh ON rh.routine_id = r.id
JOIN habits h ON h.id = rh.habit_id
WHERE r.is_active = true
  AND r.title IN ('Rutina de la noche', 'Rutina de la mañana')
ORDER BY r.title, h.title;

-- 2. Ver específicamente "Rutina de la noche"
SELECT 
  r.id as routine_id,
  r.title,
  r.child_id,
  json_agg(
    json_build_object(
      'habit_id', h.id,
      'habit_title', h.title,
      'habit_child_id', h.child_id,
      'points_value', rh.points_value,
      'is_required', rh.is_required
    )
  ) as habits
FROM routines r
JOIN routine_habits rh ON rh.routine_id = r.id
JOIN habits h ON h.id = rh.habit_id
WHERE r.title = 'Rutina de la noche'
GROUP BY r.id, r.title, r.child_id;

-- 3. Verificar que los hábitos tienen child_id correcto
SELECT 
  h.id,
  h.title,
  h.child_id,
  h.points_value as direct_points,
  COUNT(rh.id) as en_cuantas_rutinas
FROM habits h
LEFT JOIN routine_habits rh ON rh.habit_id = h.id
WHERE h.title IN (
  SELECT DISTINCT h2.title 
  FROM routine_habits rh2
  JOIN habits h2 ON h2.id = rh2.habit_id
  JOIN routines r2 ON r2.id = rh2.routine_id
  WHERE r2.title = 'Rutina de la noche'
)
GROUP BY h.id, h.title, h.child_id, h.points_value;
