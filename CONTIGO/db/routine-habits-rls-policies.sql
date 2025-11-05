-- =====================================================
-- POLÍTICAS RLS PARA LA TABLA ROUTINE_HABITS
-- =====================================================
-- Este script crea las políticas de seguridad a nivel de fila (RLS)
-- para la tabla routine_habits, permitiendo que los padres
-- accedan solo a los datos de sus propios hijos

-- Política para permitir a los usuarios ver las asignaciones de hábitos a rutinas
-- de sus propios hijos (a través de la relación children -> parent_id)
CREATE POLICY "Parents can view routine habits of their own children" ON routine_habits
    FOR SELECT USING (
        auth.uid() IN (
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
        auth.uid() IN (
            SELECT parent_id 
            FROM children 
            WHERE id = (
                SELECT child_id 
                FROM routines 
                WHERE id = NEW.routine_id
            )
        )
        AND auth.uid() IN (
            SELECT parent_id 
            FROM children 
            WHERE id = (
                SELECT child_id 
                FROM habits 
                WHERE id = NEW.habit_id
            )
        )
    );

-- Política para permitir a los usuarios actualizar asignaciones de hábitos a rutinas
-- solo de sus propios hijos
CREATE POLICY "Parents can update routine habits of their own children" ON routine_habits
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT parent_id 
            FROM children 
            WHERE id = (
                SELECT child_id 
                FROM routines 
                WHERE id = routine_habits.routine_id
            )
        )
        AND auth.uid() IN (
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
        auth.uid() IN (
            SELECT parent_id 
            FROM children 
            WHERE id = (
                SELECT child_id 
                FROM routines 
                WHERE id = routine_habits.routine_id
            )
        )
        AND auth.uid() IN (
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
    cmd
FROM pg_policies 
WHERE tablename = 'routine_habits'
ORDER BY policyname;

RAISE NOTICE '====================================================';
RAISE NOTICE 'POLÍTICAS RLS PARA ROUTINE_HABITS CREADAS CORRECTAMENTE';
RAISE NOTICE '====================================================';