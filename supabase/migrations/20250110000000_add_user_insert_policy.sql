-- ============================================================================
-- Add INSERT policy for user table
-- ============================================================================
-- Description: Allows authenticated users to insert their own user record
--              This fixes the RLS error when creating user records
-- Version: 1.0
-- Date: 2025-01-10
-- ============================================================================

BEGIN;

-- Users can insert their own record
CREATE POLICY "Users can insert own record"
ON "user" FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = id);

COMMIT;

