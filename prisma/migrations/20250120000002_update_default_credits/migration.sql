-- Update default credits to 60 for new users
-- Update existing users with 150 credits (default) to 60 credits
UPDATE "User" SET "credits" = 60 WHERE "credits" = 150;

-- Note: The default value change is handled by Prisma schema update
-- This migration updates existing users who had the old default of 150

