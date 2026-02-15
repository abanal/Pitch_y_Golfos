import { Match, MatchStatus, GameMode } from '../../types';

export const filterMatchesByType = (
    matches: Match[],
    player: string,
    type: 'ALL' | 'Lliga' | 'Amistós'
): Match[] => {
    let filtered = matches.filter(m => m.status === MatchStatus.CLOSED && m.players.includes(player));
    if (type !== 'ALL') {
        filtered = filtered.filter(m => m.type === type);
    }
    return filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

export const computeOverPar = (match: Match, player: string): number => {
    const strokes = match.strokes_total_per_player[player] || 0;
    return strokes - match.par;
};

export const computeStats = (matches: Match[], player: string) => {
    const gamesPlayed = matches.length;
    // Points usually only match.type === 'Lliga', but if filtered by Amistós, points likely 0. 
    // We sum whatever points are there.
    const totalPoints = matches.reduce((acc, m) => acc + (m.points_per_player[player] || 0), 0);

    let bestOverPar = gamesPlayed > 0 ? Infinity : null;
    let totalOverPar = 0;

    let indOverParSum = 0;
    let indCount = 0;

    let parOverParSum = 0;
    let parCount = 0;

    // Trend: take last 5 matches from the provided sorted list
    // The provided matches should be sorted chronologically? 
    // We'll separate logic if needed, but assuming matches passed here are correct subset.

    const last5 = matches.slice(-5);
    const trendSum = last5.reduce((acc, m) => acc + computeOverPar(m, player), 0);
    const trendAvg = last5.length > 0 ? trendSum / last5.length : null;

    matches.forEach(m => {
        const op = computeOverPar(m, player);
        if (op < (bestOverPar ?? Infinity)) bestOverPar = op;
        totalOverPar += op;

        if (m.mode === GameMode.INDIVIDUAL) {
            indOverParSum += op;
            indCount++;
        } else if (m.mode === GameMode.PARELLA) {
            parOverParSum += op;
            parCount++;
        }
    });

    return {
        gamesPlayed,
        totalPoints,
        bestOverPar: bestOverPar,
        avgOverParGlobal: gamesPlayed > 0 ? totalOverPar / gamesPlayed : null,
        avgOverParInd: indCount > 0 ? indOverParSum / indCount : null,
        avgOverParPar: parCount > 0 ? parOverParSum / parCount : null,
        trendAvg: trendAvg,
        indCount,
        parCount
    };
};

export const computeAccumulatedPoints = (matches: Match[], player: string) => {
    // Assume matches sorted by date
    // Filter only Lliga? The requirement says "Only for matches with type === 'Lliga'"
    // But if the user selected "Amistós", this chart might be empty or irrelevant. 
    // PROMPT: "Gràfica 3 ... Només per matches amb type === Lliga". So we filter inside or expect usage to filter.
    // We'll implement a function that takes matches (presumed sorted) and returns data points.

    const lligaMatches = matches.filter(m => m.type === 'Lliga');

    let accumulate = 0;
    return lligaMatches.map(m => {
        accumulate += (m.points_per_player[player] || 0);
        return {
            date: m.date,
            points: accumulate
        };
    });
};

export const computeEvolutionOverParData = (matches: Match[], player: string) => {
    // Returns array for Line Chart
    return matches.map(m => ({
        date: m.date,
        overPar: computeOverPar(m, player),
        mode: m.mode // 'individual' | 'parella'
    }));
};

/**
 * FUNCIO GENÈRICA DE DENSE RANK
 * items: llista d'elements a ordenar
 * compareFn: funció de comparació (tipus sort)
 * idFn: funció per obtenir l'identificador únic de l'element
 */
export const computeDenseRank = <T>(
    items: T[],
    compareFn: (a: T, b: T) => number,
    idFn: (item: T) => string
): Record<string, number> => {
    if (items.length === 0) return {};
    const sorted = [...items].sort(compareFn);
    const ranks: Record<string, number> = {};
    let currentRank = 0;
    sorted.forEach((item, idx) => {
        if (idx === 0) {
            currentRank = 1;
        } else if (compareFn(sorted[idx - 1], item) !== 0) {
            currentRank++;
        }
        ranks[idFn(item)] = currentRank;
    });
    return ranks;
};

/**
 * FUNCIO GENÈRICA DE COMPETITION RANK (1, 1, 3, 4...)
 * Els empats reben la mateixa posició, i es salten les següents.
 */
export const computeCompetitionRank = <T>(
    items: T[],
    compareFn: (a: T, b: T) => number,
    idFn: (item: T) => string
): Record<string, number> => {
    if (items.length === 0) return {};
    const sorted = [...items].sort(compareFn);
    const ranks: Record<string, number> = {};
    let lastRank = 1;

    sorted.forEach((item, idx) => {
        if (idx > 0 && compareFn(sorted[idx - 1], item) !== 0) {
            lastRank = idx + 1;
        }
        ranks[idFn(item)] = lastRank;
    });
    return ranks;
};

/**
 * LOGICA DE PUNTS AMB COMPETITION RANK I BONUS
 */
export const calculateMatchPoints = (match: Partial<Match>): Record<string, number> => {
    const {
        mode,
        type,
        players = [],
        teams = [],
        strokes_total_per_player: strokes = {},
        birdies_per_player: birdies = {},
        hio_per_player: hio = {}
    } = match;

    const pointsMap: Record<string, number> = {};

    if (type !== 'Lliga') {
        players.forEach(p => pointsMap[p] = 0);
        return pointsMap;
    }

    if (mode === GameMode.INDIVIDUAL) {
        const N = players.length;
        const ranks = computeCompetitionRank(
            players,
            (a, b) => (strokes[a] || 0) - (strokes[b] || 0),
            (name) => name
        );

        console.log(`--- CALCANT PUNTS INDIVIDUAL (N=${N}, Competition Rank) ---`);
        players.forEach(name => {
            const position = ranks[name] || 1;
            const basePoints = (N - position + 1) * 5;
            const bonus = (birdies[name] || 0) * 1 + (hio[name] || 0) * 10;
            pointsMap[name] = basePoints + bonus;
            console.log(`[IND] ${name}: Strokes=${strokes[name]}, Pos=${position}, Base=${basePoints}, Bonus=${bonus}, Total=${pointsMap[name]}`);
        });
    } else {
        // Mode PARELLES / EQUIPS (Suporta mida variable)
        const N = teams.length;
        const teamStats = teams.map((members, idx) => {
            const teamScore = members.reduce((acc, name) => acc + (strokes[name] || 0), 0);
            return { id: idx.toString(), members, teamScore, size: members.length };
        });

        // 2. Competition Ranking NOMÉS per teamScore
        const teamRanks = computeCompetitionRank(
            teamStats,
            (a, b) => a.teamScore - b.teamScore,
            (t) => t.id
        );

        console.log(`--- CALCANT PUNTS EQUIPS (N=${N}, Competition Rank) ---`);
        teamStats.forEach(team => {
            const position = teamRanks[team.id];
            const basePointsTeam = (N - position + 1) * 5;

            console.log(`[EQUIP ${parseInt(team.id) + 1}] Membres: ${team.members.join(', ')} | Mida: ${team.size} | Cops: ${team.teamScore} | Pos: ${position} | Base: ${basePointsTeam}`);

            team.members.forEach(name => {
                const bonus = (birdies[name] || 0) * 1 + (hio[name] || 0) * 10;
                pointsMap[name] = basePointsTeam + bonus;
                console.log(`  > Jugador: ${name} | Base: ${basePointsTeam} | Bonus: ${bonus} | Total: ${pointsMap[name]}`);
            });
        });
    }

    return pointsMap;
};


// Mantenim per compatibilitat amb versions simples si cal
export const computeDenseRankPositions = (scoresByKey: Record<string, number>): Record<string, number> => {
    const keys = Object.keys(scoresByKey);
    return computeDenseRank(keys, (a, b) => (scoresByKey[a] || 0) - (scoresByKey[b] || 0), k => k);
};

