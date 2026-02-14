
import { Match, MatchStatus, Player, GameMode } from './types';

export const MOCK_PLAYERS: Player[] = [
  { id: '1', name: 'R. Nadal', points: 1450, matchesPlayed: 12 },
  { id: '2', name: 'C. Alcaraz', points: 1240, matchesPlayed: 14 },
  { id: '3', name: 'P. Gasly', points: 1180, matchesPlayed: 15 },
  { id: '4', name: 'Sergio García', points: 950, matchesPlayed: 14 }
];

export const MOCK_MATCHES: Match[] = [
  {
    id: '1',
    matchCode: 'MATCH-2024-001',
    date: '2024-03-14',
    mode: GameMode.INDIVIDUAL,
    // Fix: Added missing required property 'type'
    type: 'Lliga',
    playerCount: 1,
    status: MatchStatus.CLOSED,
    winner: "R. Nadal",
    course: 'Pitch & Putt Gualta',
    par: 54,
    players: ['R. Nadal'],
    strokes_total_per_player: { 'R. Nadal': 52 },
    points_per_player: { 'R. Nadal': 25 },
    // Fix: Added missing required properties birdies_per_player and hio_per_player
    birdies_per_player: { 'R. Nadal': 0 },
    hio_per_player: { 'R. Nadal': 0 }
  },
  {
    id: '2',
    matchCode: 'MATCH-2024-002',
    date: '2024-03-15',
    mode: GameMode.INDIVIDUAL,
    // Fix: Added missing required property 'type'
    type: 'Lliga',
    playerCount: 1,
    status: MatchStatus.CLOSED,
    winner: "R. Nadal",
    course: 'Golf Lloret',
    par: 54,
    players: ['R. Nadal'],
    strokes_total_per_player: { 'R. Nadal': 56 },
    points_per_player: { 'R. Nadal': 10 },
    // Fix: Added missing required properties birdies_per_player and hio_per_player
    birdies_per_player: { 'R. Nadal': 0 },
    hio_per_player: { 'R. Nadal': 0 }
  },
  {
    id: '3',
    matchCode: 'MATCH-2024-003',
    date: '2024-03-16',
    mode: GameMode.PARELLA,
    // Fix: Added missing required property 'type'
    type: 'Lliga',
    playerCount: 2,
    status: MatchStatus.CLOSED,
    winner: "Empat",
    course: 'Platja d\'Aro',
    par: 54,
    players: ['R. Nadal', 'C. Alcaraz'],
    strokes_total_per_player: { 'R. Nadal': 52, 'C. Alcaraz': 52 },
    points_per_player: { 'R. Nadal': 15, 'C. Alcaraz': 15 },
    // Fix: Added missing required properties birdies_per_player and hio_per_player
    birdies_per_player: { 'R. Nadal': 0, 'C. Alcaraz': 0 },
    hio_per_player: { 'R. Nadal': 0, 'C. Alcaraz': 0 }
  },
  {
    id: '4',
    matchCode: 'MATCH-2024-004',
    date: '2024-03-17',
    mode: GameMode.INDIVIDUAL,
    // Fix: Added missing required property 'type'
    type: 'Lliga',
    playerCount: 1,
    status: MatchStatus.CLOSED,
    winner: "C. Alcaraz",
    course: 'Mas Nou Golf',
    par: 54,
    players: ['C. Alcaraz'],
    strokes_total_per_player: { 'C. Alcaraz': 58 },
    points_per_player: { 'C. Alcaraz': 5 },
    // Fix: Added missing required properties birdies_per_player and hio_per_player
    birdies_per_player: { 'C. Alcaraz': 0 },
    hio_per_player: { 'C. Alcaraz': 0 }
  }
];
