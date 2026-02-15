
import React from 'react';
import { Match, Player, GameMode, MatchStatus } from '../types';
import { getPlayerPointsFromMatch } from '../src/lib/statsHelper';

interface StatsProps {
  players: Player[];
  matches: Match[];
}

interface PlayerStats {
  jugador: string;
  punts: number;
  partits_lliga: number;
  partits_totals: number;
  mitjana_cops_individual: number | null;
  mitjana_cops_parella: number | null;
  sobre_par_ind: number | null;
  sobre_par_par: number | null;
  birdies_total: number;
  hio_total: number;
}

const Stats: React.FC<StatsProps> = ({ players, matches }) => {
  const calculateStats = (): PlayerStats[] => {
    // 1. Inicialitzar resum
    const summary: Record<string, {
      pts: number,
      pjLliga: number,
      pjTotal: number,
      birdies: number,
      hio: number,
      strokesInd: number,
      countInd: number,
      strokesPar: number,
      countPar: number,
      parInd: number,
      parPar: number
    }> = {};

    players.forEach(p => {
      summary[p.name] = {
        pts: 0, pjLliga: 0, pjTotal: 0, birdies: 0, hio: 0,
        strokesInd: 0, countInd: 0, strokesPar: 0, countPar: 0,
        parInd: 0, parPar: 0
      };
    });

    // 2. Passada única pels matches
    matches.filter(m => m.status === MatchStatus.CLOSED).forEach(m => {
      m.players.forEach(playerName => {
        const stats = summary[playerName];
        if (!stats) return;

        stats.pjTotal++;

        if (m.type === 'Lliga') {
          stats.pjLliga++;
          stats.pts += (m.points_per_player?.[playerName] ?? 0);
          stats.birdies += (m.birdies_per_player?.[playerName] ?? 0);
          stats.hio += (m.hio_per_player?.[playerName] ?? 0);

          const s = m.strokes_total_per_player?.[playerName] ?? 0;
          if (m.mode === GameMode.INDIVIDUAL) {
            stats.strokesInd += s;
            stats.parInd += m.par;
            stats.countInd++;
          } else {
            stats.strokesPar += s;
            stats.parPar += m.par;
            stats.countPar++;
          }
        }
      });
    });

    // 3. Mapeig final
    const result = players.map(player => {
      const s = summary[player.name];
      return {
        jugador: player.name,
        punts: s.pts,
        partits_lliga: s.pjLliga,
        partits_totals: s.pjTotal,
        mitjana_cops_individual: s.countInd > 0 ? s.strokesInd / s.countInd : null,
        mitjana_cops_parella: s.countPar > 0 ? s.strokesPar / s.countPar : null,
        sobre_par_ind: s.countInd > 0 ? (s.strokesInd - s.parInd) / s.countInd : null,
        sobre_par_par: s.countPar > 0 ? (s.strokesPar - s.parPar) / s.countPar : null,
        birdies_total: s.birdies,
        hio_total: s.hio
      };
    });

    if (process.env.NODE_ENV === 'development') {
      console.log("STATS BEFORE SORT:", result.map(p => ({ n: p.jugador, pts: p.punts })));
    }

    const sorted = result.sort((a, b) => b.punts - a.punts);

    if (process.env.NODE_ENV === 'development') {
      console.log("STATS AFTER SORT:", sorted.map(p => ({ n: p.jugador, pts: p.punts })));
    }

    return sorted;
  };



  const statsData = calculateStats();

  const renderParValue = (val: number | null) => {
    if (val === null) return <span className="text-slate-400">—</span>;
    const formatted = val > 0 ? `+${val.toFixed(2)}` : val.toFixed(2);
    return (
      <span className={`font-bold ${val <= 0 ? 'text-primary' : 'text-red-400'}`}>
        {formatted}
      </span>
    );
  };

  return (
    <div className="pb-24 animate-in fade-in duration-500">
      <header className="px-6 py-6 sticky top-0 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md z-30 border-b border-primary/10">
        <h1 className="text-2xl font-bold tracking-tight">Estadístiques</h1>
        <p className="text-xs text-slate-500 dark:text-primary/60 font-medium">Només dades de partits de Lliga tancats</p>
      </header>

      <main className="p-4">
        <div className="overflow-x-auto hide-scrollbar rounded-2xl border border-primary/10 shadow-xl bg-white dark:bg-neutral-dark/40">
          <table className="min-w-[800px] w-full divide-y divide-primary/10 text-left text-[10px]">
            <thead className="bg-primary/5">
              <tr>
                <th className="px-4 py-4 font-black uppercase tracking-wider text-primary/70 sticky left-0 bg-white dark:bg-neutral-dark z-10 border-r border-primary/5">Jugador</th>
                <th className="px-4 py-4 font-black uppercase tracking-wider text-primary/70 text-center">Punts Lliga</th>
                <th className="px-4 py-4 font-black uppercase tracking-wider text-primary/70 text-center">PJ Lliga</th>
                <th className="px-4 py-4 font-black uppercase tracking-wider text-primary/70 text-center">Birdies</th>
                <th className="px-4 py-4 font-black uppercase tracking-wider text-primary/70 text-center">HIO</th>
                <th className="px-4 py-4 font-black uppercase tracking-wider text-primary/70 text-center">M. Ind.</th>
                <th className="px-4 py-4 font-black uppercase tracking-wider text-primary/70 text-center">M. Par.</th>
                <th className="px-4 py-4 font-black uppercase tracking-wider text-primary/70 text-center">+/-PAR IND.</th>
                <th className="px-4 py-4 font-black uppercase tracking-wider text-primary/70 text-center">+/-PAR PAR.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/5">
              {statsData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-slate-500 italic">No hi ha partits tancats encara</td>
                </tr>
              ) : (
                statsData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-primary/5 transition-colors">
                    <td className="px-4 py-4 font-bold text-slate-900 dark:text-slate-100 sticky left-0 bg-white dark:bg-neutral-dark/90 border-r border-primary/5">
                      {row.jugador}
                    </td>
                    <td className="px-4 py-4 font-bold text-center text-primary text-xs">{row.punts}</td>
                    <td className="px-4 py-4 text-center font-medium">{row.partits_lliga}</td>
                    <td className="px-4 py-4 text-center font-medium text-green-400">{row.birdies_total}</td>
                    <td className="px-4 py-4 text-center font-medium text-purple-400">{row.hio_total}</td>
                    <td className="px-4 py-4 text-center font-medium">
                      {row.mitjana_cops_individual !== null ? row.mitjana_cops_individual.toFixed(1) : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-4 text-center font-medium">
                      {row.mitjana_cops_parella !== null ? row.mitjana_cops_parella.toFixed(1) : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-4 text-center">
                      {renderParValue(row.sobre_par_ind)}
                    </td>
                    <td className="px-4 py-4 text-center">
                      {renderParValue(row.sobre_par_par)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6 space-y-3">
          <div className="flex items-center gap-2 text-[9px] text-slate-500 font-bold uppercase tracking-widest bg-slate-100 dark:bg-white/5 p-3 rounded-lg border border-slate-200 dark:border-white/5">
            <span className="material-icons-round text-sm text-primary">info</span>
            <span>Els punts i mitjanes només contemplen partits de "Lliga".</span>
          </div>
          <div className="flex items-center gap-2 text-[9px] text-slate-500 font-bold uppercase tracking-widest bg-slate-100 dark:bg-white/5 p-3 rounded-lg border border-slate-200 dark:border-white/5">
            <span className="material-icons-round text-sm text-primary">analytics</span>
            <span>Esborrar un partit de l'historial recalcula automàticament totes aquestes dades.</span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Stats;
