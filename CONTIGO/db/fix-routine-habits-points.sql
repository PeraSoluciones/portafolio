-- =====================================================
-- FIX: CONFIGURAR PUNTOS PARA HÁBITOS SIN PUNTOS
-- =====================================================

-- 1. Ver hábitos sin puntos en routine_habits
SELECT 
  r.title as rutina,
  h.title as habito,
  rh.points_value as puntos_actuales,
  h.points_value as puntos_directos_habito
FROM routine_habits rh
JOIN routines r ON r.id = rh.routine_id
JOIN habits h ON h.id = rh.habit_id
WHERE rh.points_value = 0 OR rh.points_value IS NULL
ORDER BY r.title, h.title;

-- 2. Actualizar puntos a un valor por defecto (10 puntos)
-- Solo para hábitos que tienen points_value = 0
-- NOTA: routine_habits no tiene columna updated_at, así que no la actualizamos
UPDATE routine_habits
SET points_value = 10
WHERE points_value = 0 OR points_value IS NULL;

-- 3. Verificar que se actualizaron
SELECT 
  r.title as rutina,
  h.title as habito,
  rh.points_value as puntos_configurados
FROM routine_habits rh
JOIN routines r ON r.id = rh.routine_id
JOIN habits h ON h.id = rh.habit_id
WHERE r.is_active = true
ORDER BY r.title, h.title;

RAISE NOTICE '✅ Puntos configurados para hábitos en rutinas';
