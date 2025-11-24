DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'professional_patient_access' AND column_name = 'professional_email') THEN
        ALTER TABLE professional_patient_access ADD COLUMN professional_email TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'professional_patient_access' AND column_name = 'invited_by_email') THEN
        ALTER TABLE professional_patient_access ADD COLUMN invited_by_email TEXT;
    END IF;
END $$;
