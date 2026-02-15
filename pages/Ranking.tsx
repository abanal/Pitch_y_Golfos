
import React, { useMemo } from 'react';
import { Player, Match, MatchStatus } from '../types';
import { getPlayerPointsFromMatch } from '../src/lib/statsHelper';

interface RankingProps {
  players: Player[];
  matches: Match[];
  onNewMatch: () => void;
  onSelectPlayer: (id: string) => void;
}

const Ranking: React.FC<RankingProps> = ({ players, matches, onNewMatch, onSelectPlayer }) => {
  // Calculem les estadístiques dinàmicament només de partits de LLIGA tancats
  const playersWithDynamicStats = useMemo(() => {
    const totals: Record<string, number> = {};
    const games: Record<string, number> = {};
    const strokes: Record<string, number> = {};
    const pars: Record<string, number> = {};

    const lligaMatches = matches.filter(m => m.status === MatchStatus.CLOSED && m.type === 'Lliga');

    for (const match of lligaMatches) {
      for (const playerName of match.players) {
        const p = match.points_per_player?.[playerName];
        const s = match.strokes_total_per_player?.[playerName] ?? 0;

        if (p === undefined && process.env.NODE_ENV === 'development') {
          console.warn(`[RANKING] Punts no trobats per ${playerName} al match ${match.id}`);
        }

        totals[playerName] = (totals[playerName] ?? 0) + (p ?? 0);
        games[playerName] = (games[playerName] ?? 0) + 1;
        strokes[playerName] = (strokes[playerName] ?? 0) + s;
        pars[playerName] = (pars[playerName] ?? 0) + match.par;
      }
    }

    return players.map(player => {
      const gCount = games[player.name] ?? 0;
      const sSum = strokes[player.name] ?? 0;
      const pSum = pars[player.name] ?? 0;

      return {
        ...player,
        points: totals[player.name] ?? 0,
        matchesPlayed: gCount,
        sobrePar: gCount > 0 ? (sSum - pSum) / gCount : null
      };
    }).sort((a, b) => (b.points || 0) - (a.points || 0));
  }, [players, matches]);

  // SINGLE MATCH AUDIT (DEBUG)
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development' && matches.length > 0) {
      const closedLliga = matches.filter(m => m.status === MatchStatus.CLOSED && m.type === 'Lliga');
      if (closedLliga.length === 0) return;

      const last = [...closedLliga].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      console.log("%c=== SINGLE MATCH AUDIT (DEBUG) ===", "color: #13ec5b; font-weight: bold");
      console.log(`ID: ${last.id} | Mode: ${last.mode} | Data: ${last.date}`);
      console.log("Players in match:", last.players);
      console.log("Points per player (Stored):", last.points_per_player);

      const currentRankingPoints = playersWithDynamicStats.reduce((acc, p) => {
        if (last.players.includes(p.name)) acc[p.name] = p.points;
        return acc;
      }, {} as any);

      console.log("Current totals for these players in ranking:", currentRankingPoints);
      console.log("==================================");
    }
  }, [matches, playersWithDynamicStats]);


  const topThree = playersWithDynamicStats.slice(0, 3);
  const others = playersWithDynamicStats.slice(3);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const renderParBadge = (val: number | null, isSmall: boolean = false) => {
    if (val === null) return null;
    const formatted = val > 0 ? `+${val.toFixed(1)}` : val.toFixed(1);
    return (
      <span className={`${isSmall ? 'text-[9px]' : 'text-[10px]'} font-bold ${val <= 0 ? 'text-primary' : 'text-red-400'}`}>
        {formatted} Par
      </span>
    );
  };

  return (
    <div className="pb-24">
      <header className="sticky top-0 z-30 px-6 py-6 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
            <span className="material-icons-round text-primary text-sm">sports_golf</span>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-primary/60 font-semibold">Lligueta</p>
            <p className="text-sm font-medium">Pitch & Golfos</p>
          </div>
        </div>
        <div className="w-10"></div>
      </header>

      <section className="px-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold tracking-tight">Top Jugadors</h2>
        </div>

        {playersWithDynamicStats.length >= 1 ? (
          <div className="flex items-end justify-center gap-2 h-80 relative">
            {/* 2nd Place */}
            {topThree[1] && (
              <div className="flex-1 flex flex-col items-center cursor-pointer" onClick={() => onSelectPlayer(topThree[1].id)}>
                <div className="relative mb-3">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-300 to-slate-500 border-2 border-slate-400 shadow-lg flex items-center justify-center text-white font-bold text-xl">
                    {getInitials(topThree[1].name)}
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-slate-400 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-md">🥈</div>
                </div>
                <div className="w-full bg-slate-200 dark:bg-white/5 rounded-t-xl p-2 text-center border-x border-t border-slate-300 dark:border-white/10 h-36 flex flex-col justify-between">
                  <span className="text-xs font-semibold truncate px-1">{topThree[1].name}</span>
                  <div>
                    <p className="text-lg font-bold leading-none">{topThree[1].points}</p>
                    <p className="text-[10px] text-slate-500 uppercase mb-1">Punts</p>
                    <div className="flex flex-col items-center gap-1 mb-1">
                      <div className="text-[8px] bg-slate-400/20 text-slate-500 dark:text-slate-400 py-0.5 px-2 rounded-full inline-block border border-slate-400/20 uppercase font-bold">
                        {topThree[1].matchesPlayed} PJ
                      </div>
                      {renderParBadge(topThree[1].sobrePar, true)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 1st Place */}
            {topThree[0] && (
              <div className="flex-1 flex flex-col items-center z-10 cursor-pointer" onClick={() => onSelectPlayer(topThree[0].id)}>
                <div className="relative mb-3 scale-110">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-yellow-300 via-primary to-green-600 border-4 border-primary shadow-[0_0_20px_rgba(19,236,91,0.4)] flex items-center justify-center text-background-dark font-black text-2xl">
                    {getInitials(topThree[0].name)}
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-xs font-bold text-background-dark shadow-md border-2 border-background-dark">🥇</div>
                </div>
                <div className="w-full bg-primary/20 dark:bg-primary/20 rounded-t-2xl p-2 text-center border-x border-t border-primary/40 h-48 flex flex-col justify-between shadow-[0_-10px_30px_rgba(19,236,91,0.1)]">
                  <span className="text-sm font-bold truncate px-1">{topThree[0].name}</span>
                  <div>
                    <p className="text-2xl font-black text-primary leading-none">{topThree[0].points}</p>
                    <p className="text-[10px] text-primary/80 uppercase font-semibold mb-1">Punts</p>
                    <div className="flex flex-col items-center gap-1 mb-2">
                      <div className="text-[9px] bg-primary/20 text-primary py-0.5 px-2 rounded-full inline-block border border-primary/20 uppercase font-black">
                        {topThree[0].matchesPlayed} Partits
                      </div>
                      {renderParBadge(topThree[0].sobrePar)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3rd Place */}
            {topThree[2] && (
              <div className="flex-1 flex flex-col items-center cursor-pointer" onClick={() => onSelectPlayer(topThree[2].id)}>
                <div className="relative mb-3">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-800 border-2 border-orange-700/50 shadow-lg flex items-center justify-center text-white font-bold text-xl">
                    {getInitials(topThree[2].name)}
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-orange-700 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-md">🥉</div>
                </div>
                <div className="w-full bg-slate-200 dark:bg-white/5 rounded-t-xl p-2 text-center border-x border-t border-slate-300 dark:border-white/10 h-32 flex flex-col justify-between">
                  <span className="text-xs font-semibold truncate px-1">{topThree[2].name}</span>
                  <div>
                    <p className="text-lg font-bold leading-none">{topThree[2].points}</p>
                    <p className="text-[10px] text-slate-500 uppercase mb-1">Punts</p>
                    <div className="flex flex-col items-center gap-1 mb-1">
                      <div className="text-[8px] bg-orange-700/20 text-orange-700 dark:text-orange-400 py-0.5 px-2 rounded-full inline-block border border-orange-700/20 uppercase font-bold">
                        {topThree[2].matchesPlayed} PJ
                      </div>
                      {renderParBadge(topThree[2].sobrePar, true)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center bg-slate-100 dark:bg-white/5 rounded-3xl border border-dashed border-slate-300 dark:border-primary/20">
            <p className="text-slate-500 text-sm italic">Crea jugadors i partits per veure el podi</p>
          </div>
        )}
      </section>

      <section className="px-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Rànquing Anual</h3>
        </div>

        <div className="space-y-2">
          <div className="grid grid-cols-12 items-center px-4 py-2 text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-primary/40">
            <div className="col-span-1">#</div>
            <div className="col-span-5">Jugador</div>
            <div className="col-span-2 text-center">Punts</div>
            <div className="col-span-2 text-center">Partits</div>
            <div className="col-span-2 text-right">+/- Par</div>
          </div>

          {others.length > 0 ? (
            others.map((player, idx) => (
              <div
                key={player.id}
                onClick={() => onSelectPlayer(player.id)}
                className="grid grid-cols-12 items-center px-4 py-4 bg-white dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/5 cursor-pointer active:scale-[0.98] transition-all"
              >
                <div className="col-span-1 font-black text-slate-400 text-xs">#{idx + 4}</div>
                <div className="col-span-5 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/10 flex items-center justify-center text-[10px] font-bold text-slate-500 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {getInitials(player.name)}
                  </div>
                  <span className="text-xs font-semibold truncate">{player.name}</span>
                </div>
                <div className="col-span-2 text-center font-bold text-sm text-slate-700 dark:text-slate-200">{player.points}</div>
                <div className="col-span-2 text-center text-[10px] text-slate-500 font-bold uppercase">{player.matchesPlayed}</div>
                <div className="col-span-2 text-right">
                  {renderParBadge(player.sobrePar, true)}
                </div>
              </div>
            ))
          ) : playersWithDynamicStats.length <= 3 && playersWithDynamicStats.length > 0 ? (
            <p className="text-center py-8 text-slate-500 text-xs italic">No hi ha més jugadors al rànquing</p>
          ) : null}
        </div>
      </section>

      <div className="fixed bottom-24 right-6 z-50">
        <button
          onClick={onNewMatch}
          className="bg-primary text-background-dark font-bold px-6 py-4 rounded-2xl shadow-[0_10px_30px_rgba(19,236,91,0.4)] flex items-center gap-2 active:scale-95 transition-transform"
        >
          <span className="material-icons-round font-black">add</span>
          <span className="uppercase tracking-tighter text-sm">Nou Partit</span>
        </button>
      </div>
    </div>
  );
};

export default Ranking;
