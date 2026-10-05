CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  display_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text NOT NULL,
  instructor text NOT NULL,
  color text NOT NULL DEFAULT 'brand',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.courses TO authenticated;
GRANT ALL ON public.courses TO service_role;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "courses readable" ON public.courses FOR SELECT TO authenticated USING (true);

CREATE TABLE public.lectures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  kind text NOT NULL,
  meta text NOT NULL,
  thumbnail text NOT NULL,
  s3_key text,
  fallback_url text,
  duration_seconds int NOT NULL DEFAULT 0,
  position int NOT NULL DEFAULT 0
);
GRANT SELECT ON public.lectures TO authenticated;
GRANT ALL ON public.lectures TO service_role;
ALTER TABLE public.lectures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lectures readable" ON public.lectures FOR SELECT TO authenticated USING (true);

CREATE TABLE public.lecture_progress (
  user_id uuid NOT NULL,
  lecture_id uuid NOT NULL REFERENCES public.lectures(id) ON DELETE CASCADE,
  percent int NOT NULL DEFAULT 0,
  position_seconds int NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, lecture_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lecture_progress TO authenticated;
GRANT ALL ON public.lecture_progress TO service_role;
ALTER TABLE public.lecture_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own progress all" ON public.lecture_progress FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

WITH c AS (
  INSERT INTO public.courses (title, category, instructor, color) VALUES
  ('Full-Stack React & Node', 'Web Development', 'Dr. Maya Chen', 'accent'),
  ('Database Design', 'Data', 'Leo Park', 'violet'),
  ('TypeScript Mastery', 'Languages', 'Sana Idris', 'rose'),
  ('Cloud & DevOps', 'Infrastructure', 'Omar Haddad', 'amber')
  RETURNING id, title
)
INSERT INTO public.lectures (course_id, title, kind, meta, thumbnail, s3_key, fallback_url, duration_seconds, position)
SELECT c.id, l.title, l.kind, l.meta, l.thumb, l.s3_key, l.url, l.dur, l.pos FROM c JOIN (VALUES
  ('Full-Stack React & Node', 'Building REST APIs with Express', 'video', '12:40', 'coding', 'lectures/rest-apis.mp4', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', 760, 1),
  ('Full-Stack React & Node', 'Auth with JWT & Refresh Tokens', 'video', '24:18', 'instructor', 'lectures/jwt-auth.mp4', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', 1458, 2),
  ('Full-Stack React & Node', 'System design office hours', 'live', 'Today 6pm', 'live', NULL, NULL, 3600, 3),
  ('Database Design', 'Indexing Strategies for PostgreSQL', 'article', '8 min read', 'notebook', NULL, NULL, 480, 1),
  ('Database Design', 'Query optimizer lab', 'lab', '45 min', 'terminal', NULL, NULL, 2700, 2),
  ('TypeScript Mastery', 'Generics & Utility Types Check', 'quiz', '15 questions', 'quiz', NULL, NULL, 900, 1),
  ('TypeScript Mastery', 'Advanced type inference', 'video', '18:32', 'keyboard', 'lectures/ts-inference.mp4', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4', 1112, 2),
  ('Cloud & DevOps', 'Streaming media from S3', 'video', '21:05', 'cloud', 'lectures/s3-streaming.mp4', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4', 1265, 1),
  ('Cloud & DevOps', 'Deployment checklist', 'pdf', '32 pages', 'paper', NULL, NULL, 600, 2)
) AS l(course, title, kind, meta, thumb, s3_key, url, dur, pos) ON l.course = c.title;