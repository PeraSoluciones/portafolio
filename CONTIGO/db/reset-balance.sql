-- =====================================================
-- RESETEAR BALANCE A 0 PARA EMPEZAR DE NUEVO
-- =====================================================

-- PASO 1: Ver balance actual
SELECT 
    id,
    name,
    points_balance
FROM children
WHERE id = '29bb4826-b032-4d77-9e90-6f3f7da21b6f';

-- PASO 2: Actualizar balance a 0
UPDATE children
SET points_balance = 0
WHERE id = '29bb4826-b032-4d77-9e90-6f3f7da21b6f';

-- PASO 3: Verificar que se actualizó
SELECT 
    id,
    name,
    points_balance
FROM children
WHERE id = '29bb4826-b032-4d77-9e90-6f3f7da21b6f';

-- PASO 4: OPCIONAL - Limpiar transacciones antiguas si quieres empezar completamente limpio
-- ADVERTENCIA: Esto eliminará TODO el historial de puntos
-- DELETE FROM points_transactions WHERE child_id = '29bb4826-b032-4d77-9e90-6f3f7da21b6f';
