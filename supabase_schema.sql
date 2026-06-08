-- Challenge 90J — Schema complet

-- Prières quotidiennes
CREATE TABLE IF NOT EXISTS prayers (
  id bigint generated always as identity primary key,
  date date unique not null,
  "Fajr" boolean default false,
  "Dhuhr" boolean default false,
  "Asr" boolean default false,
  "Maghrib" boolean default false,
  "Isha" boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Séances de sport
CREATE TABLE IF NOT EXISTS workouts (
  id bigint generated always as identity primary key,
  date date unique not null,
  done boolean default false,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Mémorisation Coran
CREATE TABLE IF NOT EXISTS quran_pages (
  id bigint generated always as identity primary key,
  date date unique not null,
  done boolean default false,
  page integer,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Certification
CREATE TABLE IF NOT EXISTS cert_study (
  id bigint generated always as identity primary key,
  date date unique not null,
  done boolean default false,
  minutes integer,
  topic text,
  mock_score integer,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Nutrition
CREATE TABLE IF NOT EXISTS nutrition (
  id bigint generated always as identity primary key,
  date date unique not null,
  calories integer,
  protein integer,
  carbs integer,
  fat integer,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Routine matinale (JSON flexible)
CREATE TABLE IF NOT EXISTS morning_routine (
  id bigint generated always as identity primary key,
  date date unique not null,
  fajr boolean default false,
  quran_morning boolean default false,
  dhikr boolean default false,
  hydration boolean default false,
  stretching boolean default false,
  cold_shower boolean default false,
  breakfast boolean default false,
  planning boolean default false,
  supplements_am boolean default false,
  intention boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Routine du soir
CREATE TABLE IF NOT EXISTS evening_routine (
  id bigint generated always as identity primary key,
  date date unique not null,
  maghrib boolean default false,
  isha boolean default false,
  quran_evening boolean default false,
  adhkar_evening boolean default false,
  journal boolean default false,
  review_tasks boolean default false,
  no_screen boolean default false,
  supplements_pm boolean default false,
  gratitude boolean default false,
  sleep boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Rendez-vous
CREATE TABLE IF NOT EXISTS appointments (
  id bigint generated always as identity primary key,
  title text not null,
  date date not null,
  time text,
  type text default 'Autre',
  notes text,
  created_at timestamptz default now()
);

-- RLS : désactivé pour usage personnel (activer si multi-utilisateurs)
ALTER TABLE prayers ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE quran_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE cert_study ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition ENABLE ROW LEVEL SECURITY;
ALTER TABLE morning_routine ENABLE ROW LEVEL SECURITY;
ALTER TABLE evening_routine ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Policies : accès public (anon) pour usage solo
CREATE POLICY "public_all" ON prayers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON workouts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON quran_pages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON cert_study FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON nutrition FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON morning_routine FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON evening_routine FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON appointments FOR ALL USING (true) WITH CHECK (true);
