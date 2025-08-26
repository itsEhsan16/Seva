-- Add suspension fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

-- Add index for suspended users
CREATE INDEX IF NOT EXISTS idx_profiles_suspended ON profiles(is_suspended) WHERE is_suspended = TRUE;

-- Add comment
COMMENT ON COLUMN profiles.is_suspended IS 'Whether the user account is suspended';
COMMENT ON COLUMN profiles.suspended_at IS 'When the user was suspended';
COMMENT ON COLUMN profiles.suspension_reason IS 'Reason for suspension';