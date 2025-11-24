-- Phase 3: Professional Treatment Integration

-- 1. Professional Profiles Table
CREATE TABLE IF NOT EXISTS professional_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    specialty TEXT,
    license_number TEXT,
    contact_email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE professional_profiles ENABLE ROW LEVEL SECURITY;

-- Policies for professional_profiles
-- Users can view and edit their own profile
CREATE POLICY "Users can view own professional profile" 
    ON professional_profiles FOR SELECT 
    USING (auth.uid() = id);

CREATE POLICY "Users can update own professional profile" 
    ON professional_profiles FOR UPDATE 
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own professional profile" 
    ON professional_profiles FOR INSERT 
    WITH CHECK (auth.uid() = id);

-- 2. Professional Patient Access Table
CREATE TYPE professional_access_status AS ENUM ('pending', 'active', 'revoked');

CREATE TABLE IF NOT EXISTS professional_patient_access (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    professional_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    child_id UUID REFERENCES children(id) ON DELETE CASCADE,
    permissions JSONB DEFAULT '["view_reports"]'::jsonb,
    status professional_access_status DEFAULT 'pending',
    invited_by_email TEXT, -- Email of the parent who invited (for audit/verification)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(professional_id, child_id)
);

-- Enable RLS
ALTER TABLE professional_patient_access ENABLE ROW LEVEL SECURITY;

-- Policies for professional_patient_access

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


-- 3. Update RLS Policies for Child Data Access

-- Helper function to check if user is an active professional for a child
CREATE OR REPLACE FUNCTION is_active_professional_for_child(child_uuid UUID) 
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM professional_patient_access 
    WHERE professional_id = auth.uid() 
    AND child_id = child_uuid 
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policy for 'children' table
CREATE POLICY "Professionals can view assigned children" 
    ON children FOR SELECT 
    USING (is_active_professional_for_child(id));

-- Policy for 'habits' table
CREATE POLICY "Professionals can view habits of assigned children" 
    ON habits FOR SELECT 
    USING (is_active_professional_for_child(child_id));

-- Policy for 'routines' table
CREATE POLICY "Professionals can view routines of assigned children" 
    ON routines FOR SELECT 
    USING (is_active_professional_for_child(child_id));

-- Policy for 'behavior_records' table (linked to child_id via behaviors)
CREATE POLICY "Professionals can view behavior records of assigned children" 
    ON behavior_records FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM behaviors
            WHERE behaviors.id = behavior_records.behavior_id
            AND is_active_professional_for_child(behaviors.child_id)
        )
    );

-- Policy for 'habit_records' table (linked to child_id via habits)
CREATE POLICY "Professionals can view habit records of assigned children" 
    ON habit_records FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM habits
            WHERE habits.id = habit_records.habit_id
            AND is_active_professional_for_child(habits.child_id)
        )
    );

-- Policy for 'points_transactions' table (linked to child_id)
CREATE POLICY "Professionals can view points transactions of assigned children" 
    ON points_transactions FOR SELECT 
    USING (is_active_professional_for_child(child_id));

-- Policy for 'routine_habits' (linked to routine_id)
CREATE POLICY "Professionals can view routine habits of assigned children" 
    ON routine_habits FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM routines
            WHERE routines.id = routine_habits.routine_id
            AND is_active_professional_for_child(routines.child_id)
        )
    );
