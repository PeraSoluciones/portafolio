-- Create a SECURITY DEFINER function to check access without triggering RLS recursion
CREATE OR REPLACE FUNCTION has_professional_access(child_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM professional_patient_access 
    WHERE professional_id = auth.uid() 
    AND child_id = child_uuid
    -- No status check, allowing pending/active/revoked? Maybe exclude revoked.
    AND status != 'revoked'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the children policy to use this function
DROP POLICY IF EXISTS "Professionals can view assigned children" ON children;

CREATE POLICY "Professionals can view assigned children" 
    ON children FOR SELECT 
    USING (has_professional_access(id));
