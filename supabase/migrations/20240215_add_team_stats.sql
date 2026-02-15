-- Migració per afegir columna team_stats JSONB a matches
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS team_stats JSONB;

COMMENT ON COLUMN public.matches.team_stats IS 'Emmagatzema strokes, birdies i hio a nivell d''equip per a partits en mode EQUIPS.';
