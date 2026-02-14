-- 1. Create table `players`
CREATE TABLE IF NOT EXISTS public.players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create table `matches`
CREATE TABLE IF NOT EXISTS public.matches (
  id TEXT PRIMARY KEY, -- The app uses string IDs (e.g. Date.now().toString())
  match_code TEXT,
  custom_name TEXT,
  date DATE NOT NULL,
  mode TEXT NOT NULL, -- 'INDIVIDUAL' or 'PARELLA'
  type TEXT NOT NULL, -- 'Lliga' or 'Amistós'
  player_count INT NOT NULL,
  status TEXT NOT NULL, -- 'CLOSED', etc.
  winner TEXT,
  course TEXT NOT NULL,
  par INT NOT NULL,
  players JSONB NOT NULL, -- array of user names
  teams JSONB,            -- array of arrays of names
  strokes_total_per_player JSONB NOT NULL,
  points_per_player JSONB NOT NULL,
  birdies_per_player JSONB NOT NULL,
  hio_per_player JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create indexes
CREATE INDEX IF NOT EXISTS idx_matches_date ON public.matches (date);
CREATE INDEX IF NOT EXISTS idx_matches_course ON public.matches (course);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- 5. Create policies for "Free mode without login" (Public/Anon access)
-- WARNING: This allows anyone with the API key to Select, Insert, Update, and Delete data.
-- Ideal for development or simple apps without authentication, but NOT secure for production with sensitive data.

-- Policy for players
CREATE POLICY "Enable generic access for all users on players" 
ON public.players
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Policy for matches
CREATE POLICY "Enable generic access for all users on matches" 
ON public.matches
FOR ALL 
USING (true) 
WITH CHECK (true);
