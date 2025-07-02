DROP TABLE IF EXISTS public.instructor_availability;
DROP TABLE IF EXISTS public.availability;

DO $$ BEGIN
    CREATE TYPE public.AvailabilityStatus AS ENUM (
        'ACTIVE',
        'INACTIVE',
        'EXCEPTION'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.availability (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    instructor_id uuid NOT NULL REFERENCES public.instructor(id) ON DELETE CASCADE,
    day_of_week smallint NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    timerange text NOT NULL CHECK (timerange ~ '^[0-2][0-9]:[0-5][0-9]-[0-2][0-9]:[0-5][0-9]$'),
    status public.AvailabilityStatus NOT NULL DEFAULT 'ACTIVE',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.merge_availabilities() RETURNS void AS $$
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
$$ LANGUAGE plpgsql;

ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors can manage their own availability" ON public.availability
    USING (instructor_id IN (SELECT id FROM public.instructor WHERE user_id = auth.uid()))
    WITH CHECK (instructor_id IN (SELECT id FROM public.instructor WHERE user_id = auth.uid()));

ALTER PUBLICATION supabase_realtime ADD TABLE public.availability;
