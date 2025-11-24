-- Fix RLS to allow professionals to claim their invitations
-- The existing policy requires professional_id to be set, but it is null initially.

CREATE POLICY "Professionals can claim their invitations"
    ON professional_patient_access FOR UPDATE
    USING (professional_email = auth.email());

-- Also allow them to see pending invitations to claim them
CREATE POLICY "Professionals can view pending invitations"
    ON professional_patient_access FOR SELECT
    USING (professional_email = auth.email());
