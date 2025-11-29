-- Update default credits to 150 for new users
-- Change the default value in the database schema
ALTER TABLE "User" ALTER COLUMN "credits" SET DEFAULT 150;

-- Optional: Update existing users with 60 credits (old default) to 150 credits
-- Uncomment the line below if you want to update existing users
-- UPDATE "User" SET "credits" = 150 WHERE "credits" = 60;

