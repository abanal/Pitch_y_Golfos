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
