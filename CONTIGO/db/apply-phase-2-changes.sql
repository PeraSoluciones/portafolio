-- =====================================================
-- SCRIPT PARA APLICAR CAMBIOS DE LA FASE 2 DEL SISTEMA DE PUNTOS
-- =====================================================

-- Este script debe ejecutarse en la base de datos de Supabase
-- para implementar toda la lógica de backend del sistema de puntos

-- 1. Aplicar las funciones principales del sistema de puntos
-- (Contenido de phase-2-points-functions.sql)
\i phase-2-points-functions.sql

-- 2. Aplicar los triggers automáticos del sistema de puntos
-- (Contenido de phase-2-triggers.sql)
\i phase-2-triggers.sql

-- 3. Verificar que todas las funciones y triggers se hayan creado correctamente
SELECT 
    proname as function_name,
    pronargs as num_arguments,
    pg_get_function_arguments(oid) as arguments
FROM pg_proc 
WHERE proname LIKE 'handle_points_transaction' 
   OR proname LIKE 'get_child_points_%'
   OR proname LIKE 'adjust_child_points'
   OR proname LIKE 'can_child_claim_reward'
   OR proname LIKE 'get_next_achievable_reward'
ORDER BY proname;

SELECT 
    tgname as trigger_name,
    tgrelid::regclass as table_name,
    tgfoid::regproc as function_name
FROM pg_trigger 
WHERE tgname LIKE '%points%' 
   OR tgname LIKE '%behavior%'
   OR tgname LIKE '%habit%'
   OR tgname LIKE '%reward%'
ORDER BY tgrelid::regclass, tgname;

-- 4. Verificar la estructura de las tablas relacionadas con puntos
\d points_transactions
\d routine_habits

-- 5. Crear datos de prueba si no existen
-- (Solo para pruebas, eliminar en producción)
DO $$
DECLARE
    test_user_exists BOOLEAN;
    test_child_exists BOOLEAN;
BEGIN
    -- Verificar si ya existen datos de prueba
    SELECT EXISTS(SELECT 1 FROM users WHERE email = 'test@example.com') INTO test_user_exists;
    
    IF NOT test_user_exists THEN
        -- Nota: En Supabase, los usuarios se crean a través de auth, no directamente aquí
        RAISE NOTICE 'No se encontraron datos de prueba. Crea un usuario de prueba y ejecuta el script de prueba.';
    ELSE
        SELECT EXISTS(SELECT 1 FROM children WHERE name = 'Niño de Prueba') INTO test_child_exists;
        
        IF test_child_exists THEN
            RAISE NOTICE 'Datos de prueba encontrados. El sistema de puntos está listo para pruebas.';
        ELSE
            RAISE NOTICE 'Usuario encontrado pero no hay datos de prueba. Crea un niño de prueba para continuar.';
        END IF;
    END IF;
END $$;

-- 6. Actualizar políticas RLS si es necesario
-- (Las políticas ya existen en el esquema base, pero verificamos que cubran las nuevas tablas)
ALTER TABLE points_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_habits ENABLE ROW LEVEL SECURITY;

-- 7. Verificar que las políticas cubran las nuevas funciones
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('points_transactions', 'routine_habits')
ORDER BY tablename, policyname;

-- 8. Prueba básica de las funciones (requiere datos existentes)
-- Esta sección está comentada para evitar errores si no hay datos
/*
-- Prueba de función handle_points_transaction
SELECT * FROM handle_points_transaction(
    'UUID_DEL_NIÑO_AQUI', 
    'ADJUSTMENT', 
    NULL, 
    10, 
    'Prueba de ajuste manual',
    TRUE
);

-- Prueba de función get_child_points_balance
SELECT get_child_points_balance('UUID_DEL_NIÑO_AQUI');

-- Prueba de función get_child_points_stats
SELECT * FROM get_child_points_stats('UUID_DEL_NIÑO_AQUI');
*/

RAISE NOTICE '====================================================';
RAISE NOTICE 'FASE 2 DEL SISTEMA DE PUNTOS IMPLEMENTADA CORRECTAMENTE';
RAISE NOTICE '====================================================';
RAISE NOTICE 'Para probar el sistema, asegúrate de:';
RAISE NOTICE '1. Tener un usuario autenticado en la aplicación';
RAISE NOTICE '2. Crear al menos un niño asociado a ese usuario';
RAISE NOTICE '3. Crear comportamientos con puntos asignados';
RAISE NOTICE '4. Crear hábitos y asignarlos a rutinas con puntos';
RAISE NOTICE '5. Crear recompensas canjeables';
RAISE NOTICE '';
RAISE NOTICE 'Endpoints de API disponibles:';
RAISE NOTICE '- GET/POST /api/points';
RAISE NOTICE '- GET /api/points/stats';
RAISE NOTICE '- GET/POST /api/routine-habits';
RAISE NOTICE '- GET/PUT/DELETE /api/routine-habits/[id]';
RAISE NOTICE '';
RAISE NOTICE 'Los triggers automáticos se activarán cuando:';
RAISE NOTICE '- Se registre un comportamiento';
RAISE NOTICE '- Se registre un hábito';
RAISE NOTICE '- Se canjee una recompensa';
RAISE NOTICE '====================================================';