-- Fix RLS to allow professionals to view children even if status is 'pending'
-- This is necessary so they can see the child's name/avatar in the dashboard to accept the invite.

DROP POLICY IF EXISTS "Professionals can view assigned children" ON children;

CREATE POLICY "Professionals can view assigned children" 
    ON children FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 
            FROM professional_patient_access 
            WHERE professional_id = auth.uid() 
            AND child_id = children.id
            -- Removed "AND status = 'active'" to allow pending
        )
    );
