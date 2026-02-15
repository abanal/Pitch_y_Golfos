
export enum MatchStatus {
  OPEN = 'Obert',
  CLOSED = 'Tancat'
}

export enum GameMode {
  INDIVIDUAL = 'individual',
  PARELLA = 'parella'
}

export interface Player {
  id: string;
  name: string;
  avatar?: string;
  position?: number;
  score?: number;
  birdies?: number;
  hio?: number;
  points?: number;
  delta?: string;
  matchesPlayed?: number;
}

export interface Match {
  id: string;
  matchCode: string;
  customName?: string;
  date: string; // YYYY-MM-DD
  mode: GameMode;
  type: 'Lliga' | 'Amistós';
  playerCount: number;
  status: MatchStatus;
  winner?: string;
  course: string;
  par: number;
  players: string[];
  teams?: string[][]; // Per emmagatzemar les parelles del sorteig
  strokes_total_per_player: Record<string, number>;
  points_per_player: Record<string, number>;
  birdies_per_player: Record<string, number>;
  hio_per_player: Record<string, number>;
  team_stats?: Record<string, { strokes: number; birdies: number; hio: number }>;
}

export type View = 'Ranking' | 'Historial' | 'Perfil' | 'Ajustes' | 'NuevoMatch' | 'ScoreEntry' | 'Jugadors' | 'Stats';
