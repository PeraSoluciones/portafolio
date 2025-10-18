-- Drop duplicated tables with CamelCase notation
DROP TABLE IF EXISTS "public"."User" CASCADE;
DROP TABLE IF EXISTS "public"."Child" CASCADE;
DROP TABLE IF EXISTS "public"."Routine" CASCADE;
DROP TABLE IF EXISTS "public"."Habit" CASCADE;
DROP TABLE IF EXISTS "public"."HabitRecord" CASCADE;
DROP TABLE IF EXISTS "public"."Behavior" CASCADE;
DROP TABLE IF EXISTS "public"."BehaviorRecord" CASCADE;
DROP TABLE IF EXISTS "public"."Reward" CASCADE;
DROP TABLE IF EXISTS "public"."RewardClaim" CASCADE;
DROP TABLE IF EXISTS "public"."Resource" CASCADE;

-- Drop functions if they exist
DROP FUNCTION IF EXISTS "public"."handle_new_user"();
DROP FUNCTION IF EXISTS "public"."update_updated_at_column"() CASCADE;