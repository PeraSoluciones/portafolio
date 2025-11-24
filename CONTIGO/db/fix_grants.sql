-- Fix Permissions for Professional Integration
-- The table 'professional_patient_access' was created but permissions were not granted to application roles.

GRANT ALL ON TABLE professional_patient_access TO authenticated;
GRANT ALL ON TABLE professional_patient_access TO service_role;

-- Also ensure the sequence (if any, though we use UUIDs) is accessible, just in case.
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
