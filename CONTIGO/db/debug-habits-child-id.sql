-- =====================================================
-- DIAGNÓSTICO: HÁBITOS SIN CHILD_ID
-- =====================================================

-- 1. Ver hábitos que están en rutinas pero no tienen child_id
SELECT 
  h.id as habit_id,
  h.title as habit_title,
  h.child_id as habit_child_id,
  r.id as routine_id,
  r.title as routine_title,
  r.child_id as routine_child_id
FROM routine_habits rh
JOIN habits h ON h.id = rh.habit_id
JOIN routines r ON r.id = rh.routine_id
WHERE h.child_id IS NULL OR h.child_id != r.child_id
ORDER BY r.title;

-- 2. Ver todos los hábitos con sus child_id
SELECT 
  id,
  title,
  child_id,
  category,
  created_at
FROM habits
ORDER BY created_at DESC
LIMIT 20;

-- 3. Contar hábitos sin child_id
SELECT 
  COUNT(*) as habitos_sin_child_id
FROM habits
WHERE child_id IS NULL;

-- 4. Ver rutinas de hoy con sus hábitos y child_ids
SELECT 
  r.title as rutina,
  r.child_id as rutina_child_id,
  h.title as habito,
  h.child_id as habito_child_id,
  CASE 
    WHEN h.child_id = r.child_id THEN '✅ Coincide'
    WHEN h.child_id IS NULL THEN '❌ Hábito sin child_id'
    ELSE '⚠️ No coincide'
  END as estado
FROM routines r
JOIN routine_habits rh ON rh.routine_id = r.id
JOIN habits h ON h.id = rh.habit_id
WHERE r.is_active = true
ORDER BY r.title, h.title;
