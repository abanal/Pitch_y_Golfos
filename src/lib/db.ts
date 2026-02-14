import { supabase } from './supabaseClient';
import { Player, Match, MatchStatus, GameMode } from '../../types';

// --- PLAYERS ---

export const fetchPlayers = async (): Promise<Player[]> => {
    try {
        const { data, error } = await supabase
            .from('players')
            .select('*')
            .order('name', { ascending: true });

        if (error) {
            console.error('Error fetching players:', error.message);
            throw error;
        }

        return (data || []).map((p) => ({
            id: p.id,
            name: p.name,
            // Optional fields are not stored in the simple players table
            // They are calculated at runtime or stored in a different way if needed
        }));
    } catch (err) {
        console.error('Unexpected error fetching players:', err);
        throw err; // Re-throw to handle in UI
    }
};

export const addPlayer = async (name: string): Promise<Player | null> => {
    try {
        const { data, error } = await supabase
            .from('players')
            .insert([{ name }])
            .select()
            .single();

        if (error) {
            console.error('Error adding player:', error.message);
            throw error;
        }

        if (!data) return null;

        return {
            id: data.id,
            name: data.name,
        };
    } catch (err) {
        console.error('Unexpected error adding player:', err);
        throw err;
    }
};

export const deletePlayer = async (id: string): Promise<void> => {
    try {
        const { error } = await supabase.from('players').delete().eq('id', id);

        if (error) {
            console.error('Error deleting player:', error.message);
            throw error;
        }
    } catch (err) {
        console.error('Unexpected error deleting player:', err);
        throw err;
    }
};

// --- MATCHES ---

export const fetchMatches = async (): Promise<Match[]> => {
    try {
        const { data, error } = await supabase
            .from('matches')
            .select('*')
            .order('date', { ascending: false });

        if (error) {
            console.error('Error fetching matches:', error.message);
            throw error;
        }

        // Map DB columns (snake_case) to TS types (camelCase)
        // The JSONB fields usually come back as objects, which fits the record types
        return (data || []).map((m: any) => ({
            id: m.id,
            matchCode: m.match_code,
            customName: m.custom_name,
            date: m.date,
            mode: m.mode as GameMode,
            type: m.type as 'Lliga' | 'Amistós',
            playerCount: m.player_count,
            status: m.status as MatchStatus,
            winner: m.winner,
            course: m.course,
            par: m.par,
            players: m.players, // JSONB array -> string[]
            teams: m.teams,     // JSONB array -> string[][]
            strokes_total_per_player: m.strokes_total_per_player,
            points_per_player: m.points_per_player,
            birdies_per_player: m.birdies_per_player,
            hio_per_player: m.hio_per_player,
        }));
    } catch (err) {
        console.error('Unexpected error fetching matches:', err);
        throw err;
    }
};

export const upsertMatch = async (match: Match): Promise<Match | null> => {
    try {
        // Map TS types (camelCase) to DB columns (snake_case)
        const dbMatch = {
            id: match.id,
            match_code: match.matchCode,
            custom_name: match.customName,
            date: match.date,
            mode: match.mode,
            type: match.type,
            player_count: match.playerCount,
            status: match.status,
            winner: match.winner,
            course: match.course,
            par: match.par,
            players: match.players,
            teams: match.teams,
            strokes_total_per_player: match.strokes_total_per_player,
            points_per_player: match.points_per_player,
            birdies_per_player: match.birdies_per_player,
            hio_per_player: match.hio_per_player,
            // created_at is handled by default or we can leave it
        };

        const { data, error } = await supabase
            .from('matches')
            .upsert(dbMatch)
            .select()
            .single();

        if (error) {
            console.error('Error upserting match:', error.message);
            throw error;
        }

        if (!data) return null;

        // Convert back to TS structure
        return {
            id: data.id,
            matchCode: data.match_code,
            customName: data.custom_name,
            date: data.date,
            mode: data.mode as GameMode,
            type: data.type as 'Lliga' | 'Amistós',
            playerCount: data.player_count,
            status: data.status as MatchStatus,
            winner: data.winner,
            course: data.course,
            par: data.par,
            players: data.players,
            teams: data.teams,
            strokes_total_per_player: data.strokes_total_per_player,
            points_per_player: data.points_per_player,
            birdies_per_player: data.birdies_per_player,
            hio_per_player: data.hio_per_player,
        };
    } catch (err) {
        console.error('Unexpected error upserting match:', err);
        throw err;
    }
};

export const deleteMatch = async (id: string): Promise<void> => {
    try {
        const { error } = await supabase.from('matches').delete().eq('id', id);

        if (error) {
            console.error('Error deleting match:', error.message);
            throw error;
        }
    } catch (err) {
        console.error('Unexpected error deleting match:', err);
        throw err;
    }
};
