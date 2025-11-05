-- CORRECCIÓN DE POLÍTICAS RLS PARA ROUTINE_HABITS (usando SELECT en lugar de RAISE)

-- Primero, eliminamos las políticas existentes si hay alguna
DROP POLICY IF EXISTS "Parents can view their children's routine habits" ON routine_habits;
DROP POLICY IF EXISTS "Parents can insert their children's routine habits" ON routine_habits;
DROP POLICY IF EXISTS "Parents can update their children's routine habits" ON routine_habits;
DROP POLICY IF EXISTS "Parents can delete their children's routine habits" ON routine_habits;

-- Política para permitir a los usuarios ver las asignaciones de hábitos a rutinas
-- de sus propios hijos (a través de la relación children -> parent_id)
CREATE POLICY "Parents can view routine habits of their own children" ON routine_habits
    FOR SELECT USING (
        (SELECT auth.uid()) IN (
            SELECT parent_id 
            FROM children 
            WHERE id = (
                SELECT child_id 
                FROM routines 
                WHERE id = routine_habits.routine_id
            )
        )
    );

-- Política para permitir a los usuarios insertar asignaciones de hábitos a rutinas
-- solo para sus propios hijos
CREATE POLICY "Parents can insert routine habits for their own children" ON routine_habits
    FOR INSERT WITH CHECK (
        (SELECT auth.uid()) IN (
            SELECT parent_id 
            FROM children 
            WHERE id = (
                SELECT child_id 
                FROM routines 
                WHERE id = routine_id
            )
        )
        AND (SELECT auth.uid()) IN (
            SELECT parent_id 
            FROM children 
            WHERE id = (
                SELECT child_id 
                FROM habits 
                WHERE id = habit_id
            )
        )
    );

-- Política para permitir a los usuarios actualizar asignaciones de hábitos a rutinas
-- solo de sus propios hijos
CREATE POLICY "Parents can update routine habits of their own children" ON routine_habits
    FOR UPDATE USING (
        (SELECT auth.uid()) IN (
            SELECT parent_id 
            FROM children 
            WHERE id = (
                SELECT child_id 
                FROM routines 
                WHERE id = routine_habits.routine_id
            )
        )
        AND (SELECT auth.uid()) IN (
            SELECT parent_id 
            FROM children 
            WHERE id = (
                SELECT child_id 
                FROM habits 
                WHERE id = routine_habits.habit_id
            )
        )
    );

-- Política para permitir a los usuarios eliminar asignaciones de hábitos a rutinas
-- solo de sus propios hijos
CREATE POLICY "Parents can delete routine habits of their own children" ON routine_habits
    FOR DELETE USING (
        (SELECT auth.uid()) IN (
            SELECT parent_id 
            FROM children 
            WHERE id = (
                SELECT child_id 
                FROM routines 
                WHERE id = routine_habits.routine_id
            )
        )
        AND (SELECT auth.uid()) IN (
            SELECT parent_id 
            FROM children 
            WHERE id = (
                SELECT child_id 
                FROM habits 
                WHERE id = routine_habits.habit_id
            )
        )
    );

-- Verificar que las políticas se hayan creado correctamente
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'routine_habits'
ORDER BY policyname;

-- Mensajes informativos usando SELECT
SELECT '====================================================' AS info;
SELECT 'POLÍTICAS RLS PARA ROUTINE_HABITS CORREGIDAS' AS info;
SELECT '====================================================' AS info;
SELECT 'Ahora los padres deberían poder gestionar los hábitos de las rutinas' AS info;
SELECT 'Si el problema persiste, verifica:' AS info;
SELECT '1. Que el usuario esté autenticado correctamente' AS info;
SELECT '2. Que el JWT se esté enviando en las cabeceras' AS info;
SELECT '3. Que las relaciones entre padres e hijos estén correctas' AS info;
SELECT '====================================================' AS info;
