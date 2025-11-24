-- Comprehensive Fix for Phase 3 Professional Integration
-- Run this script to ensure all tables, columns, and policies are correctly defined.

-- 1. Ensure Enum Exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'professional_access_status') THEN
        CREATE TYPE professional_access_status AS ENUM ('pending', 'active', 'revoked');
    END IF;
END $$;

-- 2. Ensure Table Exists
CREATE TABLE IF NOT EXISTS professional_patient_access (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    professional_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    child_id UUID REFERENCES children(id) ON DELETE CASCADE,
    permissions JSONB DEFAULT '["view_reports"]'::jsonb,
    status professional_access_status DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(professional_id, child_id)
);

-- 3. Ensure Columns Exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'professional_patient_access' AND column_name = 'professional_email') THEN
        ALTER TABLE professional_patient_access ADD COLUMN professional_email TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'professional_patient_access' AND column_name = 'invited_by_email') THEN
        ALTER TABLE professional_patient_access ADD COLUMN invited_by_email TEXT;
    END IF;
END $$;

-- 4. Enable RLS
ALTER TABLE professional_patient_access ENABLE ROW LEVEL SECURITY;

-- 5. Re-apply Policies (Drop first to avoid conflicts)
DROP POLICY IF EXISTS "Professionals can view their access records" ON professional_patient_access;
DROP POLICY IF EXISTS "Parents can view access records for their children" ON professional_patient_access;
DROP POLICY IF EXISTS "Parents can invite professionals" ON professional_patient_access;
DROP POLICY IF EXISTS "Parents can update access status" ON professional_patient_access;
DROP POLICY IF EXISTS "Professionals can update their own access status" ON professional_patient_access;

-- Professionals can view their own access records
CREATE POLICY "Professionals can view their access records" 
    ON professional_patient_access FOR SELECT 
    USING (auth.uid() = professional_id);

-- Parents can view access records for their children
CREATE POLICY "Parents can view access records for their children" 
    ON professional_patient_access FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM children 
            WHERE children.id = professional_patient_access.child_id 
            AND children.parent_id = auth.uid()
        )
    );

-- Parents can insert invitations (pending status)
CREATE POLICY "Parents can invite professionals" 
    ON professional_patient_access FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM children 
            WHERE children.id = professional_patient_access.child_id 
            AND children.parent_id = auth.uid()
        )
    );

-- Parents can update status (e.g., revoke)
CREATE POLICY "Parents can update access status" 
    ON professional_patient_access FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM children 
            WHERE children.id = professional_patient_access.child_id 
            AND children.parent_id = auth.uid()
        )
    );

-- Professionals can update status (accept invitation)
CREATE POLICY "Professionals can update their own access status" 
    ON professional_patient_access FOR UPDATE 
    USING (auth.uid() = professional_id);
