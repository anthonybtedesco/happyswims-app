

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pgsodium";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."AvailabilityStatus" AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'EXCEPTION'
);


ALTER TYPE "public"."AvailabilityStatus" OWNER TO "postgres";


CREATE TYPE "public"."BookingStatus" AS ENUM (
    'INTERESTED',
    'SCHEDULED',
    'BOOKED',
    'COMPLETED',
    'CANCELLED',
    'IGNORED'
);


ALTER TYPE "public"."BookingStatus" OWNER TO "postgres";


CREATE TYPE "public"."PaymentStatus" AS ENUM (
    'PENDING',
    'DEPOSIT',
    'PAID',
    'REFUNDED'
);


ALTER TYPE "public"."PaymentStatus" OWNER TO "postgres";


CREATE TYPE "public"."RecurrenceType" AS ENUM (
    'NONE',
    'DAILY',
    'WEEKLY',
    'MONTHLY',
    'WEEKDAYS',
    'WEEKENDS'
);


ALTER TYPE "public"."RecurrenceType" OWNER TO "postgres";


CREATE TYPE "public"."availabilitystatus" AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'EXCEPTION'
);


ALTER TYPE "public"."availabilitystatus" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_time_off"("p_instructor_id" "uuid", "p_start_date" "date", "p_end_date" "date" DEFAULT NULL::"date") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    existing_availability RECORD;
    new_start_date date;
    new_end_date date;
BEGIN
    -- If no end_date provided, set it to a far future date
    IF p_end_date IS NULL THEN
        p_end_date := '2099-12-31'::date;
    END IF;

    -- Find all availabilities that overlap with the time off period
    FOR existing_availability IN
        SELECT id, start_date, end_date, day_of_week, timerange, status
        FROM public.availability
        WHERE instructor_id = p_instructor_id
        AND (
            (start_date IS NULL OR start_date <= p_end_date) AND
            (end_date IS NULL OR end_date >= p_start_date)
        )
    LOOP
        -- Handle the case where existing availability starts before time off
        IF existing_availability.start_date IS NULL OR existing_availability.start_date < p_start_date THEN
            -- Update existing availability to end before time off
            UPDATE public.availability
            SET end_date = p_start_date - INTERVAL '1 day'
            WHERE id = existing_availability.id;
        END IF;

        -- Handle the case where existing availability ends after time off
        IF existing_availability.end_date IS NULL OR existing_availability.end_date > p_end_date THEN
            -- Create new availability starting after time off
            INSERT INTO public.availability (
                instructor_id,
                day_of_week,
                timerange,
                status,
                start_date,
                end_date
            ) VALUES (
                p_instructor_id,
                existing_availability.day_of_week,
                existing_availability.timerange,
                existing_availability.status,
                p_end_date + INTERVAL '1 day',
                existing_availability.end_date
            );
        END IF;

        -- If existing availability is completely within time off period, delete it
        IF (existing_availability.start_date IS NULL OR existing_availability.start_date >= p_start_date) AND
           (existing_availability.end_date IS NULL OR existing_availability.end_date <= p_end_date) THEN
            DELETE FROM public.availability WHERE id = existing_availability.id;
        END IF;
    END LOOP;
END;
$$;


ALTER FUNCTION "public"."create_time_off"("p_instructor_id" "uuid", "p_start_date" "date", "p_end_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."merge_availabilities"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    rec RECORD;
    merged boolean;
BEGIN
    merged := true;
    WHILE merged LOOP
        merged := false;
        FOR rec IN
            SELECT a1.id as id1, a2.id as id2, a1.instructor_id, a1.day_of_week, a1.status,
                   split_part(a1.timerange, '-', 1) as start1, split_part(a1.timerange, '-', 2) as end1,
                   split_part(a2.timerange, '-', 1) as start2, split_part(a2.timerange, '-', 2) as end2
            FROM public.availability a1
            JOIN public.availability a2 ON a1.instructor_id = a2.instructor_id AND a1.day_of_week = a2.day_of_week AND a1.id <> a2.id AND a1.status = a2.status
            WHERE (a1.end1 >= a2.start2 AND a1.start1 <= a2.end2) OR (a1.end1 = a2.start2) OR (a2.end1 = a1.start2)
            LIMIT 1
        LOOP
            UPDATE public.availability
            SET timerange = LEAST(rec.start1, rec.start2) || '-' || GREATEST(rec.end1, rec.end2), updated_at = now()
            WHERE id = rec.id1;
            DELETE FROM public.availability WHERE id = rec.id2;
            merged := true;
            EXIT;
        END LOOP;
    END LOOP;
END;
$$;


ALTER FUNCTION "public"."merge_availabilities"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."address" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "address_line" "text",
    "city" "text",
    "state" "text",
    "zip" "text",
    "user_id" "uuid",
    "latitude" real,
    "longitude" real
);


ALTER TABLE "public"."address" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."address_tag" (
    "created_at" timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "address_id" "uuid" NOT NULL,
    "tag_id" "uuid" NOT NULL
);


ALTER TABLE "public"."address_tag" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."admin" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid" NOT NULL
);


ALTER TABLE "public"."admin" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."availability" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "instructor_id" "uuid" NOT NULL,
    "day_of_week" smallint NOT NULL,
    "timerange" "text" NOT NULL,
    "status" "public"."availabilitystatus" DEFAULT 'ACTIVE'::"public"."availabilitystatus" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "start_date" "date" DEFAULT CURRENT_DATE,
    "end_date" "date",
    CONSTRAINT "availability_day_of_week_check" CHECK ((("day_of_week" >= 0) AND ("day_of_week" <= 6))),
    CONSTRAINT "availability_timerange_check" CHECK (("timerange" ~ '^[0-2][0-9]:[0-5][0-9]-[0-2][0-9]:[0-5][0-9]$'::"text"))
);


ALTER TABLE "public"."availability" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."booking" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "pool_address_id" "uuid",
    "client_id" "uuid",
    "instructor_id" "uuid",
    "start_time" timestamp with time zone,
    "end_time" timestamp with time zone,
    "duration" bigint,
    "recurrence_weeks" bigint,
    "calendar_event_id" "text",
    "google_event_link" "text",
    "user_id" "uuid" DEFAULT "auth"."uid"(),
    "booking_status" "public"."BookingStatus" DEFAULT 'SCHEDULED'::"public"."BookingStatus" NOT NULL,
    "payment_status" "public"."PaymentStatus" DEFAULT 'PENDING'::"public"."PaymentStatus" NOT NULL,
    "status" "text" NOT NULL
);


ALTER TABLE "public"."booking" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."booking_tag" (
    "created_at" timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "booking_id" "uuid" NOT NULL,
    "tag_id" "uuid" NOT NULL
);


ALTER TABLE "public"."booking_tag" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."client" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "first_name" "text",
    "last_name" "text",
    "home_address_id" "uuid",
    "user_id" "uuid" NOT NULL
);


ALTER TABLE "public"."client" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."client_tag" (
    "created_at" timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "client_id" "uuid" NOT NULL,
    "tag_id" "uuid" NOT NULL
);


ALTER TABLE "public"."client_tag" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."instructor" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "home_address_id" "uuid",
    "first_name" "text",
    "last_name" "text",
    "user_id" "uuid",
    "phone_number" "text"
);


ALTER TABLE "public"."instructor" OWNER TO "postgres";


COMMENT ON COLUMN "public"."instructor"."phone_number" IS 'Phone number used for instructor authentication';



CREATE TABLE IF NOT EXISTS "public"."instructor_tag" (
    "created_at" timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "instructor_id" "uuid" NOT NULL,
    "tag_id" "uuid" NOT NULL
);


ALTER TABLE "public"."instructor_tag" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."product" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "title" "text",
    "description" "text",
    "price" bigint
);


ALTER TABLE "public"."product" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."student" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "client_id" "uuid",
    "first_name" "text",
    "birthdate" "date"
);


ALTER TABLE "public"."student" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."student_tag" (
    "created_at" timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "student_id" "uuid" NOT NULL,
    "tag_id" "uuid" NOT NULL
);


ALTER TABLE "public"."student_tag" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tag" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "name" "text" NOT NULL,
    "color" "text",
    "description" "text"
);


ALTER TABLE "public"."tag" OWNER TO "postgres";


ALTER TABLE ONLY "public"."address"
    ADD CONSTRAINT "address_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."address_tag"
    ADD CONSTRAINT "address_tag_pkey" PRIMARY KEY ("address_id", "tag_id");



ALTER TABLE ONLY "public"."admin"
    ADD CONSTRAINT "admin_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."availability"
    ADD CONSTRAINT "availability_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."booking"
    ADD CONSTRAINT "booking_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."booking_tag"
    ADD CONSTRAINT "booking_tag_pkey" PRIMARY KEY ("booking_id", "tag_id");



ALTER TABLE ONLY "public"."client"
    ADD CONSTRAINT "client_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."client_tag"
    ADD CONSTRAINT "client_tag_pkey" PRIMARY KEY ("client_id", "tag_id");



ALTER TABLE ONLY "public"."client"
    ADD CONSTRAINT "client_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."instructor"
    ADD CONSTRAINT "instructor_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."instructor_tag"
    ADD CONSTRAINT "instructor_tag_pkey" PRIMARY KEY ("instructor_id", "tag_id");



ALTER TABLE ONLY "public"."product"
    ADD CONSTRAINT "product_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."student_tag"
    ADD CONSTRAINT "student_tag_pkey" PRIMARY KEY ("student_id", "tag_id");



ALTER TABLE ONLY "public"."student"
    ADD CONSTRAINT "swimmer_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tag"
    ADD CONSTRAINT "tag_pkey" PRIMARY KEY ("id");



CREATE UNIQUE INDEX "instructor_phone_number_key" ON "public"."instructor" USING "btree" ("phone_number");



CREATE UNIQUE INDEX "tag_name_key" ON "public"."tag" USING "btree" ("name");



ALTER TABLE ONLY "public"."address_tag"
    ADD CONSTRAINT "address_tag_address_id_fkey" FOREIGN KEY ("address_id") REFERENCES "public"."address"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."address_tag"
    ADD CONSTRAINT "address_tag_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."tag"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."address"
    ADD CONSTRAINT "address_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."admin"
    ADD CONSTRAINT "admin_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."availability"
    ADD CONSTRAINT "availability_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "public"."instructor"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."booking"
    ADD CONSTRAINT "booking_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."client"("id");



ALTER TABLE ONLY "public"."booking"
    ADD CONSTRAINT "booking_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "public"."instructor"("id");



ALTER TABLE ONLY "public"."booking"
    ADD CONSTRAINT "booking_pool_address_id_fkey" FOREIGN KEY ("pool_address_id") REFERENCES "public"."address"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."booking_tag"
    ADD CONSTRAINT "booking_tag_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."booking"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."booking_tag"
    ADD CONSTRAINT "booking_tag_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."tag"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."booking"
    ADD CONSTRAINT "booking_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."client"
    ADD CONSTRAINT "client_home_address_id_fkey" FOREIGN KEY ("home_address_id") REFERENCES "public"."address"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."client_tag"
    ADD CONSTRAINT "client_tag_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."client"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."client_tag"
    ADD CONSTRAINT "client_tag_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."tag"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."client"
    ADD CONSTRAINT "client_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."instructor"
    ADD CONSTRAINT "instructor_home_address_id_fkey" FOREIGN KEY ("home_address_id") REFERENCES "public"."address"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."instructor_tag"
    ADD CONSTRAINT "instructor_tag_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "public"."instructor"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."instructor_tag"
    ADD CONSTRAINT "instructor_tag_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."tag"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."instructor"
    ADD CONSTRAINT "instructor_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."student_tag"
    ADD CONSTRAINT "student_tag_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."student"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."student_tag"
    ADD CONSTRAINT "student_tag_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."tag"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."student"
    ADD CONSTRAINT "swimmer_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."client"("id");



CREATE POLICY "Allow full access for team@agfarms.dev" ON "public"."address" USING ((("auth"."jwt"() ->> 'email'::"text") = ANY (ARRAY['team@agfarms.dev'::"text", 'santiago@happyswims.life'::"text", 'kayla@happyswims.life'::"text"]))) WITH CHECK ((("auth"."jwt"() ->> 'email'::"text") = ANY (ARRAY['team@agfarms.dev'::"text", 'santiago@happyswims.life'::"text", 'kayla@happyswims.life'::"text"])));



CREATE POLICY "Allow full access for team@agfarms.dev" ON "public"."address_tag" USING ((("auth"."jwt"() ->> 'email'::"text") = ANY (ARRAY['team@agfarms.dev'::"text", 'santiago@happyswims.life'::"text", 'kayla@happyswims.life'::"text"]))) WITH CHECK ((("auth"."jwt"() ->> 'email'::"text") = ANY (ARRAY['team@agfarms.dev'::"text", 'santiago@happyswims.life'::"text", 'kayla@happyswims.life'::"text"])));



CREATE POLICY "Allow full access for team@agfarms.dev" ON "public"."booking" USING ((("auth"."jwt"() ->> 'email'::"text") = ANY (ARRAY['team@agfarms.dev'::"text", 'santiago@happyswims.life'::"text", 'kayla@happyswims.life'::"text"]))) WITH CHECK ((("auth"."jwt"() ->> 'email'::"text") = ANY (ARRAY['team@agfarms.dev'::"text", 'santiago@happyswims.life'::"text", 'kayla@happyswims.life'::"text"])));



CREATE POLICY "Allow full access for team@agfarms.dev" ON "public"."booking_tag" USING ((("auth"."jwt"() ->> 'email'::"text") = ANY (ARRAY['team@agfarms.dev'::"text", 'santiago@happyswims.life'::"text", 'kayla@happyswims.life'::"text"]))) WITH CHECK ((("auth"."jwt"() ->> 'email'::"text") = ANY (ARRAY['team@agfarms.dev'::"text", 'santiago@happyswims.life'::"text", 'kayla@happyswims.life'::"text"])));



CREATE POLICY "Allow full access for team@agfarms.dev" ON "public"."client_tag" USING ((("auth"."jwt"() ->> 'email'::"text") = ANY (ARRAY['team@agfarms.dev'::"text", 'santiago@happyswims.life'::"text", 'kayla@happyswims.life'::"text"]))) WITH CHECK ((("auth"."jwt"() ->> 'email'::"text") = ANY (ARRAY['team@agfarms.dev'::"text", 'santiago@happyswims.life'::"text", 'kayla@happyswims.life'::"text"])));



CREATE POLICY "Allow full access for team@agfarms.dev" ON "public"."instructor" USING ((("auth"."jwt"() ->> 'email'::"text") = ANY (ARRAY['team@agfarms.dev'::"text", 'santiago@happyswims.life'::"text", 'kayla@happyswims.life'::"text"]))) WITH CHECK ((("auth"."jwt"() ->> 'email'::"text") = ANY (ARRAY['team@agfarms.dev'::"text", 'santiago@happyswims.life'::"text", 'kayla@happyswims.life'::"text"])));



CREATE POLICY "Allow full access for team@agfarms.dev" ON "public"."instructor_tag" USING ((("auth"."jwt"() ->> 'email'::"text") = ANY (ARRAY['team@agfarms.dev'::"text", 'santiago@happyswims.life'::"text", 'kayla@happyswims.life'::"text"]))) WITH CHECK ((("auth"."jwt"() ->> 'email'::"text") = ANY (ARRAY['team@agfarms.dev'::"text", 'santiago@happyswims.life'::"text", 'kayla@happyswims.life'::"text"])));



CREATE POLICY "Allow full access for team@agfarms.dev" ON "public"."student" USING ((("auth"."jwt"() ->> 'email'::"text") = ANY (ARRAY['team@agfarms.dev'::"text", 'santiago@happyswims.life'::"text", 'kayla@happyswims.life'::"text"]))) WITH CHECK ((("auth"."jwt"() ->> 'email'::"text") = ANY (ARRAY['team@agfarms.dev'::"text", 'santiago@happyswims.life'::"text", 'kayla@happyswims.life'::"text"])));



CREATE POLICY "Allow full access for team@agfarms.dev" ON "public"."tag" USING ((("auth"."jwt"() ->> 'email'::"text") = ANY (ARRAY['team@agfarms.dev'::"text", 'santiago@happyswims.life'::"text", 'kayla@happyswims.life'::"text"]))) WITH CHECK ((("auth"."jwt"() ->> 'email'::"text") = ANY (ARRAY['team@agfarms.dev'::"text", 'santiago@happyswims.life'::"text", 'kayla@happyswims.life'::"text"])));



CREATE POLICY "Allow full access for team@agfarms.dev, santiago@happyswims.lif" ON "public"."student_tag" USING ((("auth"."jwt"() ->> 'email'::"text") = ANY (ARRAY['team@agfarms.dev'::"text", 'santiago@happyswims.life'::"text", 'kayla@happyswims.life'::"text"]))) WITH CHECK ((("auth"."jwt"() ->> 'email'::"text") = ANY (ARRAY['team@agfarms.dev'::"text", 'santiago@happyswims.life'::"text", 'kayla@happyswims.life'::"text"])));



CREATE POLICY "Allow full access to team@agfarms.dev" ON "public"."client" TO "authenticated" USING ((("auth"."jwt"() ->> 'email'::"text") = ANY (ARRAY['team@agfarms.dev'::"text", 'santiago@happyswims.life'::"text", 'kayla@happyswims.life'::"text"]))) WITH CHECK ((("auth"."jwt"() ->> 'email'::"text") = ANY (ARRAY['team@agfarms.dev'::"text", 'santiago@happyswims.life'::"text", 'kayla@happyswims.life'::"text"])));



CREATE POLICY "Clients can delete their own students" ON "public"."student" FOR DELETE TO "authenticated" USING (("client_id" IN ( SELECT "client"."id"
   FROM "public"."client"
  WHERE ("client"."user_id" = "auth"."uid"()))));



CREATE POLICY "Clients can insert their own students" ON "public"."student" FOR INSERT TO "authenticated" WITH CHECK (("client_id" IN ( SELECT "client"."id"
   FROM "public"."client"
  WHERE ("client"."user_id" = "auth"."uid"()))));



CREATE POLICY "Clients can update their own students" ON "public"."student" FOR UPDATE TO "authenticated" USING (("client_id" IN ( SELECT "client"."id"
   FROM "public"."client"
  WHERE ("client"."user_id" = "auth"."uid"())))) WITH CHECK (("client_id" IN ( SELECT "client"."id"
   FROM "public"."client"
  WHERE ("client"."user_id" = "auth"."uid"()))));



CREATE POLICY "Clients can view their own students" ON "public"."student" FOR SELECT TO "authenticated" USING (("client_id" IN ( SELECT "client"."id"
   FROM "public"."client"
  WHERE ("client"."user_id" = "auth"."uid"()))));



CREATE POLICY "Enable insert for authenticated users only" ON "public"."address" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users only" ON "public"."instructor" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users only" ON "public"."student" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable insert for users based on user_id" ON "public"."booking" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Enable read access for all users" ON "public"."address" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."booking" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."client" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."instructor" FOR SELECT USING (true);



CREATE POLICY "Instructors can manage their own availability" ON "public"."availability" USING (("instructor_id" IN ( SELECT "instructor"."id"
   FROM "public"."instructor"
  WHERE ("instructor"."user_id" = "auth"."uid"())))) WITH CHECK (("instructor_id" IN ( SELECT "instructor"."id"
   FROM "public"."instructor"
  WHERE ("instructor"."user_id" = "auth"."uid"()))));



CREATE POLICY "Instructors can read own data" ON "public"."instructor" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Instructors can update own data" ON "public"."instructor" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Service role has full access to students" ON "public"."student" TO "service_role" USING (true) WITH CHECK (true);



ALTER TABLE "public"."address" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."address_tag" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."admin" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."availability" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."booking" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."booking_tag" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."client" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."client_tag" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."instructor" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."instructor_tag" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."product" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."student" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."student_tag" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tag" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."address";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."availability";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."booking";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."instructor";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";




















































































































































































GRANT ALL ON FUNCTION "public"."create_time_off"("p_instructor_id" "uuid", "p_start_date" "date", "p_end_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."create_time_off"("p_instructor_id" "uuid", "p_start_date" "date", "p_end_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_time_off"("p_instructor_id" "uuid", "p_start_date" "date", "p_end_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."merge_availabilities"() TO "anon";
GRANT ALL ON FUNCTION "public"."merge_availabilities"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."merge_availabilities"() TO "service_role";


















GRANT ALL ON TABLE "public"."address" TO "anon";
GRANT ALL ON TABLE "public"."address" TO "authenticated";
GRANT ALL ON TABLE "public"."address" TO "service_role";



GRANT ALL ON TABLE "public"."address_tag" TO "anon";
GRANT ALL ON TABLE "public"."address_tag" TO "authenticated";
GRANT ALL ON TABLE "public"."address_tag" TO "service_role";



GRANT ALL ON TABLE "public"."admin" TO "anon";
GRANT ALL ON TABLE "public"."admin" TO "authenticated";
GRANT ALL ON TABLE "public"."admin" TO "service_role";



GRANT ALL ON TABLE "public"."availability" TO "anon";
GRANT ALL ON TABLE "public"."availability" TO "authenticated";
GRANT ALL ON TABLE "public"."availability" TO "service_role";



GRANT ALL ON TABLE "public"."booking" TO "anon";
GRANT ALL ON TABLE "public"."booking" TO "authenticated";
GRANT ALL ON TABLE "public"."booking" TO "service_role";



GRANT ALL ON TABLE "public"."booking_tag" TO "anon";
GRANT ALL ON TABLE "public"."booking_tag" TO "authenticated";
GRANT ALL ON TABLE "public"."booking_tag" TO "service_role";



GRANT ALL ON TABLE "public"."client" TO "anon";
GRANT ALL ON TABLE "public"."client" TO "authenticated";
GRANT ALL ON TABLE "public"."client" TO "service_role";



GRANT ALL ON TABLE "public"."client_tag" TO "anon";
GRANT ALL ON TABLE "public"."client_tag" TO "authenticated";
GRANT ALL ON TABLE "public"."client_tag" TO "service_role";



GRANT ALL ON TABLE "public"."instructor" TO "anon";
GRANT ALL ON TABLE "public"."instructor" TO "authenticated";
GRANT ALL ON TABLE "public"."instructor" TO "service_role";



GRANT ALL ON TABLE "public"."instructor_tag" TO "anon";
GRANT ALL ON TABLE "public"."instructor_tag" TO "authenticated";
GRANT ALL ON TABLE "public"."instructor_tag" TO "service_role";



GRANT ALL ON TABLE "public"."product" TO "anon";
GRANT ALL ON TABLE "public"."product" TO "authenticated";
GRANT ALL ON TABLE "public"."product" TO "service_role";



GRANT ALL ON TABLE "public"."student" TO "anon";
GRANT ALL ON TABLE "public"."student" TO "authenticated";
GRANT ALL ON TABLE "public"."student" TO "service_role";



GRANT ALL ON TABLE "public"."student_tag" TO "anon";
GRANT ALL ON TABLE "public"."student_tag" TO "authenticated";
GRANT ALL ON TABLE "public"."student_tag" TO "service_role";



GRANT ALL ON TABLE "public"."tag" TO "anon";
GRANT ALL ON TABLE "public"."tag" TO "authenticated";
GRANT ALL ON TABLE "public"."tag" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
