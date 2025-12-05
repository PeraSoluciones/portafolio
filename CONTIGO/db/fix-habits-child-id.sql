-- =====================================================
-- FIX: ACTUALIZAR CHILD_ID EN HÁBITOS
-- =====================================================
-- Este script corrige hábitos que no tienen child_id o tienen uno incorrecto
-- basándose en las rutinas a las que están asignados

-- 1. Ver el problema actual
SELECT 
  'Hábitos sin child_id o con child_id incorrecto' as problema,
  COUNT(*) as cantidad
FROM routine_habits rh
JOIN habits h ON h.id = rh.habit_id
JOIN routines r ON r.id = rh.routine_id
WHERE h.child_id IS NULL OR h.child_id != r.child_id;

-- 2. Actualizar hábitos sin child_id basándose en la rutina
UPDATE habits h
SET child_id = r.child_id,
    updated_at = NOW()
FROM routine_habits rh
JOIN routines r ON r.id = rh.routine_id
WHERE h.id = rh.habit_id
  AND (h.child_id IS NULL OR h.child_id != r.child_id);

-- 3. Verificar que se corrigió
SELECT 
  'Hábitos corregidos' as resultado,
  COUNT(*) as cantidad
FROM habits
WHERE updated_at > NOW() - INTERVAL '1 minute';

-- 4. Verificar que no quedan hábitos sin child_id en rutinas activas
SELECT 
  r.title as rutina,
  h.title as habito,
  h.child_id as habito_child_id,
  r.child_id as rutina_child_id
FROM routine_habits rh
JOIN habits h ON h.id = rh.habit_id
JOIN routines r ON r.id = rh.routine_id
WHERE r.is_active = true
  AND (h.child_id IS NULL OR h.child_id != r.child_id);
-- Debería retornar 0 filas

RAISE NOTICE '✅ Child IDs de hábitos actualizados correctamente';
