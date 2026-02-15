
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
    return players.map(player => {
      // Filtrar tots els partits tancats del jugador
      const closedMatches = matches.filter(m =>
        m.status === MatchStatus.CLOSED &&
        m.players.includes(player.name)
      );

      // Els punts NOMÉS compten per partits de Lliga
      const lligaMatches = closedMatches.filter(m => m.type === 'Lliga');

      if (process.env.NODE_ENV === 'development') {
        lligaMatches.forEach(m => {
          console.log(`[STATS] Llegint Partit: ${m.id} | Mode: ${m.mode} | Equips: ${m.teams?.length || 0} | PointsMap:`, m.points_per_player);
          if (!m.points_per_player || !(player.name in m.points_per_player)) {
            console.error(`[STATS] Alerta: El partit ${m.id} no conté punts per ${player.name}`);
          }
        });
      }

      const totalPoints = lligaMatches.reduce((acc, m) => acc + getPlayerPointsFromMatch(m, player.name), 0);

      const totalBirdies = lligaMatches.reduce((acc, m) => acc + (m.birdies_per_player?.[player.name] || 0), 0);
      const totalHIO = lligaMatches.reduce((acc, m) => acc + (m.hio_per_player?.[player.name] || 0), 0);

      const individualMatches = lligaMatches.filter(m => m.mode === GameMode.INDIVIDUAL);
      const parellaMatches = lligaMatches.filter(m => m.mode === GameMode.PARELLA);

      const avgIndividual = individualMatches.length > 0
        ? individualMatches.reduce((acc, m) => acc + (m.strokes_total_per_player[player.name] || 0), 0) / individualMatches.length
        : null;

      const avgParella = parellaMatches.length > 0
        ? parellaMatches.reduce((acc, m) => acc + (m.strokes_total_per_player[player.name] || 0), 0) / parellaMatches.length
        : null;

      // Utilitzem el PAR configurat per cada partit per una mitjana més real
      const sumParDiffInd = individualMatches.reduce((acc, m) => acc + ((m.strokes_total_per_player[player.name] || 0) - m.par), 0);
      const sobreParInd = individualMatches.length > 0 ? sumParDiffInd / individualMatches.length : null;

      const sumParDiffPar = parellaMatches.reduce((acc, m) => acc + ((m.strokes_total_per_player[player.name] || 0) - m.par), 0);
      const sobreParPar = parellaMatches.length > 0 ? sumParDiffPar / parellaMatches.length : null;

      return {
        jugador: player.name,
        punts: totalPoints,
        partits_lliga: lligaMatches.length,
        partits_totals: closedMatches.length,
        mitjana_cops_individual: avgIndividual,
        mitjana_cops_parella: avgParella,
        sobre_par_ind: sobreParInd,
        sobre_par_par: sobreParPar,
        birdies_total: totalBirdies,
        hio_total: totalHIO
      };
    }).sort((a, b) => b.punts - a.punts);
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
