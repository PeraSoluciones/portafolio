CREATE SCHEMA IF NOT EXISTS auth;
-- Mock Supabase auth.uid() function for shadow database
CREATE OR REPLACE FUNCTION auth.uid()
RETURNS uuid
LANGUAGE sql
AS $$
  SELECT '00000000-0000-0000-0000-000000000000'::uuid;
$$;
-- Funciones
CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RAISE LOG 'Executing handle_new_user for new user: %', NEW.id;
  INSERT INTO public.users (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Triggers
CREATE OR REPLACE TRIGGER "update_behaviors_updated_at" BEFORE UPDATE ON "public"."behaviors" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();
CREATE OR REPLACE TRIGGER "update_children_updated_at" BEFORE UPDATE ON "public"."children" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();
CREATE OR REPLACE TRIGGER "update_habits_updated_at" BEFORE UPDATE ON "public"."habits" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();
CREATE OR REPLACE TRIGGER "update_resources_updated_at" BEFORE UPDATE ON "public"."resources" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();
CREATE OR REPLACE TRIGGER "update_rewards_updated_at" BEFORE UPDATE ON "public"."rewards" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();
CREATE OR REPLACE TRIGGER "update_routines_updated_at" BEFORE UPDATE ON "public"."routines" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();
CREATE OR REPLACE TRIGGER "update_users_updated_at" BEFORE UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();

-- RLS Policies
CREATE POLICY "Allow authenticated users to insert their own children" ON "public"."children" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "parent_id"));
CREATE POLICY "Allow individual user insert access" ON "public"."users" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));
CREATE POLICY "Allow individual user select access" ON "public"."users" FOR SELECT USING (("auth"."uid"() = "id"));
CREATE POLICY "Allow individual user update access" ON "public"."users" FOR UPDATE USING (("auth"."uid"() = "id"));
CREATE POLICY "Everyone can view active resources" ON "public"."resources" FOR SELECT USING (("is_active" = true));
CREATE POLICY "Parents can delete their children's behavior records" ON "public"."behavior_records" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM ("public"."behaviors"
     JOIN "public"."children" ON (("children"."id" = "behaviors"."child_id")))
  WHERE (("behaviors"."id" = "behavior_records"."behavior_id") AND ("children"."parent_id" = "auth"."uid"())))));
CREATE POLICY "Parents can delete their children's behaviors" ON "public"."behaviors" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."children"
  WHERE (("children"."id" = "behaviors"."child_id") AND ("children"."parent_id" = "auth"."uid"())))));
CREATE POLICY "Parents can delete their children's habit records" ON "public"."habit_records" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM ("public"."habits"
     JOIN "public"."children" ON (("children"."id" = "habits"."child_id")))
  WHERE (("habits"."id" = "habit_records"."habit_id") AND ("children"."parent_id" = "auth"."uid"())))));
CREATE POLICY "Parents can delete their children's habits" ON "public"."habits" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."children"
  WHERE (("children"."id" = "habits"."child_id") AND ("children"."parent_id" = "auth"."uid"())))));
CREATE POLICY "Parents can delete their children's rewards" ON "public"."rewards" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."children"
  WHERE (("children"."id" = "rewards"."child_id") AND ("children"."parent_id" = "auth"."uid"())))));
CREATE POLICY "Parents can delete their children's routines" ON "public"."routines" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."children"
  WHERE (("children"."id" = "routines"."child_id") AND ("children"."parent_id" = "auth"."uid"())))));
CREATE POLICY "Parents can insert their children's behavior records" ON "public"."behavior_records" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."behaviors"
     JOIN "public"."children" ON (("children"."id" = "behaviors"."child_id")))
  WHERE (("behaviors"."id" = "behavior_records"."behavior_id") AND ("children"."parent_id" = "auth"."uid"())))));
CREATE POLICY "Parents can insert their children's behaviors" ON "public"."behaviors" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."children"
  WHERE (("children"."id" = "behaviors"."child_id") AND ("children"."parent_id" = "auth"."uid"())))));
CREATE POLICY "Parents can insert their children's habit records" ON "public"."habit_records" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."habits"
     JOIN "public"."children" ON (("children"."id" = "habits"."child_id")))
  WHERE (("habits"."id" = "habit_records"."habit_id") AND ("children"."parent_id" = "auth"."uid"())))));
CREATE POLICY "Parents can insert their children's habits" ON "public"."habits" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."children"
  WHERE (("children"."id" = "habits"."child_id") AND ("children"."parent_id" = "auth"."uid"())))));
CREATE POLICY "Parents can insert their children's reward claims" ON "public"."reward_claims" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."rewards"
     JOIN "public"."children" ON (("children"."id" = "rewards"."child_id")))
  WHERE (("rewards"."id" = "reward_claims"."reward_id") AND ("children"."parent_id" = "auth"."uid"())))));
CREATE POLICY "Parents can insert their children's rewards" ON "public"."rewards" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."children"
  WHERE (("children"."id" = "rewards"."child_id") AND ("children"."parent_id" = "auth"."uid"())))));
CREATE POLICY "Parents can insert their children's routines" ON "public"."routines" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."children"
  WHERE (("children"."id" = "routines"."child_id") AND ("children"."parent_id" = "auth"."uid"())))));
CREATE POLICY "Parents can update their children's behaviors" ON "public"."behaviors" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."children"
  WHERE (("children"."id" = "behaviors"."child_id") AND ("children"."parent_id" = "auth"."uid"())))));
CREATE POLICY "Parents can update their children's habit records" ON "public"."habit_records" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM ("public"."habits"
     JOIN "public"."children" ON (("children"."id" = "habits"."child_id")))
  WHERE (("habits"."id" = "habit_records"."habit_id") AND ("children"."parent_id" = "auth"."uid"())))));
CREATE POLICY "Parents can update their children's habits" ON "public"."habits" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."children"
  WHERE (("children"."id" = "habits"."child_id") AND ("children"."parent_id" = "auth"."uid"())))));
CREATE POLICY "Parents can update their children's rewards" ON "public"."rewards" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."children"
  WHERE (("children"."id" = "rewards"."child_id") AND ("children"."parent_id" = "auth"."uid"())))));
CREATE POLICY "Parents can update their children's routines" ON "public"."routines" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."children"
  WHERE (("children"."id" = "routines"."child_id") AND ("children"."parent_id" = "auth"."uid"())))));
CREATE POLICY "Parents can view their children's behavior records" ON "public"."behavior_records" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."behaviors"
     JOIN "public"."children" ON (("children"."id" = "behaviors"."child_id")))
  WHERE (("behaviors"."id" = "behavior_records"."behavior_id") AND ("children"."parent_id" = "auth"."uid"())))));
CREATE POLICY "Parents can view their children's behaviors" ON "public"."behaviors" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."children"
  WHERE (("children"."id" = "behaviors"."child_id") AND ("children"."parent_id" = "auth"."uid"())))));
CREATE POLICY "Parents can view their children's habit records" ON "public"."habit_records" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."habits"
     JOIN "public"."children" ON (("children"."id" = "habits"."child_id")))
  WHERE (("habits"."id" = "habit_records"."habit_id") AND ("children"."parent_id" = "auth"."uid"())))));
CREATE POLICY "Parents can view their children's habits" ON "public"."habits" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."children"
  WHERE (("children"."id" = "habits"."child_id") AND ("children"."parent_id" = "auth"."uid"())))));
CREATE POLICY "Parents can view their children's reward claims" ON "public"."reward_claims" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."rewards"
     JOIN "public"."children" ON (("children"."id" = "rewards"."child_id")))
  WHERE (("rewards"."id" = "reward_claims"."reward_id") AND ("children"."parent_id" = "auth"."uid"())))));
CREATE POLICY "Parents can view their children's rewards" ON "public"."rewards" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."children"
  WHERE (("children"."id" = "rewards"."child_id") AND ("children"."parent_id" = "auth"."uid"())))));
CREATE POLICY "Parents can view their children's routines" ON "public"."routines" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."children"
  WHERE (("children"."id" = "routines"."child_id") AND ("children"."parent_id" = "auth"."uid"())))));
CREATE POLICY "Users can delete their own children" ON "public"."children" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "parent_id"));
CREATE POLICY "Users can update their own children" ON "public"."children" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "parent_id")) WITH CHECK (("auth"."uid"() = "parent_id"));
CREATE POLICY "Users can view their own children" ON "public"."children" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "parent_id"));

-- Enable RLS
ALTER TABLE "public"."behavior_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."behaviors" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."children" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."habit_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."habits" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."reward_claims" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."rewards" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."routines" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;