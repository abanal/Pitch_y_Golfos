
import React, { useState, useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid, Legend, Cell
} from 'recharts';
import { Player, Match, GameMode } from '../types';
import {
  filterMatchesByType,
  computeStats,
  computeAccumulatedPoints,
  computeEvolutionOverParData,
  computeOverPar
} from '../src/lib/statsHelper';

interface ProfileProps {
  player: Player;
  matches: Match[];
  onBack: () => void;
  onRegisterMatch: () => void;
}

const Profile: React.FC<ProfileProps> = ({ player, matches, onBack }) => {
  const [filterType, setFilterType] = useState<'ALL' | 'Lliga' | 'Amistós'>('ALL');

  if (!player) return null;

  const filteredMatches = useMemo(() =>
    filterMatchesByType(matches, player.name, filterType),
    [matches, player.name, filterType]);

  const stats = useMemo(() =>
    computeStats(filteredMatches, player.name),
    [filteredMatches, player.name]);

  const evolutionData = useMemo(() =>
    computeEvolutionOverParData(filteredMatches, player.name),
    [filteredMatches, player.name]);

  const pointsData = useMemo(() =>
    computeAccumulatedPoints(matches.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()), player.name), // Pass all matches sorted, helper filters Lliga
    [matches, player.name]);

  const comparisonData = useMemo(() => [
    { name: 'Individual', value: stats.avgOverParInd ?? 0 },
    { name: 'Parelles', value: stats.avgOverParPar ?? 0 }
  ], [stats]);

  const renderKPI = (label: string, value: string | number | null, unit?: string, highlight?: boolean) => (
    <div className={`flex flex-col items-center justify-center p-4 rounded-2xl border ${highlight ? 'bg-primary/10 border-primary/30' : 'bg-white dark:bg-neutral-dark/40 border-primary/10'} shadow-sm`}>
      <span className="text-[10px] uppercase font-black text-slate-400 dark:text-slate-500 tracking-widest mb-1">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className={`text-2xl font-black ${highlight ? 'text-primary' : 'text-slate-800 dark:text-slate-200'}`}>
          {value === null || value === Infinity ? '—' : value}
        </span>
        {unit && <span className="text-xs font-bold text-slate-400">{unit}</span>}
      </div>
    </div>
  );

  const formatOverPar = (val: number | null) => {
    if (val === null) return '—';
    return val > 0 ? `+${val.toFixed(1)}` : val.toFixed(1);
  };

  return (
    <div className="pb-32 bg-background-light dark:bg-background-dark min-h-screen">
      <header className="sticky top-0 z-30 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-primary/10 px-4 py-4 flex items-center justify-between">
        <button
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-primary/10 text-primary active:scale-90 transition-transform"
        >
          <span className="material-icons-round">arrow_back_ios_new</span>
        </button>
        <div className="flex flex-col items-center">
          <span className="font-bold text-lg leading-none">{player.name}</span>
          <span className="text-[10px] text-primary uppercase font-black tracking-widest mt-1">Perfil & Stats</span>
        </div>
        <div className="w-10 h-10"></div>
      </header>

      <main className="px-4 pt-6 space-y-8 max-w-md mx-auto">

        {/* FILTRES */}
        <div className="flex p-1 bg-slate-200 dark:bg-neutral-dark rounded-xl">
          {(['ALL', 'Lliga', 'Amistós'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${filterType === type ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              {type === 'ALL' ? 'Totes' : type}
            </button>
          ))}
        </div>

        {/* KPIs BLOCK 1 */}
        <div className="grid grid-cols-3 gap-3">
          {renderKPI('Partides', stats.gamesPlayed)}
          {renderKPI('Punts', stats.totalPoints, 'pts', true)}
          {renderKPI('Millor', formatOverPar(stats.bestOverPar), 'par')}
        </div>

        {/* KPIs BLOCK 2 */}
        <div className="grid grid-cols-2 gap-3">
          {renderKPI('Global', formatOverPar(stats.avgOverParGlobal), 'avg')}
          {renderKPI('Tendència (5)', formatOverPar(stats.trendAvg), 'avg')}
          {renderKPI('Individual', formatOverPar(stats.avgOverParInd), 'avg')}
          {renderKPI('Parelles', formatOverPar(stats.avgOverParPar), 'avg')}
        </div>

        {/* Chart 1: Evolution Over Par */}
        <section className="bg-white dark:bg-neutral-dark/40 p-4 rounded-2xl border border-primary/10 shadow-sm">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
            <span className="material-icons-round text-primary text-sm">show_chart</span>
            Evolució Sobre Par
          </h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={evolutionData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" hide />
                <YAxis hide domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', fontSize: '10px', color: '#fff' }}
                />
                <ReferenceLine y={0} stroke="#13ec5b" strokeDasharray="3 3" opacity={0.5} />
                {/* We map individual points, but to distinguish lines we might need separate data series or custom dot payload? 
                    Recharts line expects continuous data usually. 
                    Let's use one Line but color dots? Or just one monotonic line if mixed?
                    The requirements asked for "Blue line: Individual, Orange: Pair". 
                    If they are mixed chronologically, a single line connecting them might be confusing if we want 2 colors.
                    Better: 2 Lines, connecting only their own points? Or one line color coded? Recharts Lines are one color.
                    Let's split data into 2 series matching the dates? 
                    Actually, if I put both 'individual' and 'parella' score in same object keys, I can draw 2 lines.
                */}
                <Line
                  type="monotone"
                  dataKey="overPar"
                  data={evolutionData.map(d => ({ ...d, overPar: d.mode === 'individual' ? d.overPar : null }))}
                  name="Individual"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#3b82f6' }}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="overPar"
                  data={evolutionData.map(d => ({ ...d, overPar: d.mode === 'parella' ? d.overPar : null }))}
                  name="Parelles"
                  stroke="#f97316"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#f97316' }}
                  connectNulls
                />
                <Legend iconSize={8} wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Chart 2: Mode Comparison */}
        <section className="bg-white dark:bg-neutral-dark/40 p-4 rounded-2xl border border-primary/10 shadow-sm">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
            <span className="material-icons-round text-primary text-sm">bar_chart</span>
            Comparativa Mitjanes
          </h3>
          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', fontSize: '10px', color: '#fff' }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                  <Cell fill="#3b82f6" />
                  <Cell fill="#f97316" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Chart 3: Accumulated Points (Only if Lliga) */}
        {pointsData.length > 0 && (
          <section className="bg-white dark:bg-neutral-dark/40 p-4 rounded-2xl border border-primary/10 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
              <span className="material-icons-round text-primary text-sm">trending_up</span>
              Punts Acumulats (Lliga)
            </h3>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={pointsData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" hide />
                  <YAxis hide />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', fontSize: '10px', color: '#fff' }} />
                  <Line type="monotone" dataKey="points" stroke="#13ec5b" strokeWidth={3} dot={false} activeDot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        {/* Table Matches */}
        <section>
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4 px-2">Historial Partides</h3>
          <div className="bg-white dark:bg-neutral-dark/40 rounded-2xl border border-primary/10 overflow-hidden shadow-sm">
            {filteredMatches.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 italic">No hi ha partits amb aquest filtre.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[10px]">
                  <thead className="bg-primary/5 text-primary/60 border-b border-primary/5">
                    <tr>
                      <th className="px-4 py-3 font-black uppercase">Data</th>
                      <th className="px-2 py-3 font-black uppercase text-center">Mode</th>
                      <th className="px-2 py-3 font-black uppercase text-center">Camp</th>
                      <th className="px-2 py-3 font-black uppercase text-center">Cops</th>
                      <th className="px-2 py-3 font-black uppercase text-center">Pts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-primary/5">
                    {filteredMatches.map(m => {
                      const st = m.strokes_total_per_player[player.name];
                      const op = computeOverPar(m, player.name);
                      const pts = m.points_per_player[player.name] || 0;
                      return (
                        <tr key={m.id} className="hover:bg-primary/5 transition-colors">
                          <td className="px-4 py-3 font-bold text-slate-300">{m.date}</td>
                          <td className="px-2 py-3 text-center opacity-70">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] ${m.mode === 'individual' ? 'bg-blue-500/10 text-blue-400' : 'bg-orange-500/10 text-orange-400'}`}>
                              {m.mode === 'individual' ? 'IND' : 'PAR'}
                            </span>
                          </td>
                          <td className="px-2 py-3 text-center truncate max-w-[80px] text-slate-400">{m.course}</td>
                          <td className="px-2 py-3 text-center font-bold">
                            {st} <span className={`text-[9px] ${op > 0 ? 'text-red-400' : 'text-primary'}`}>{op > 0 ? `+${op}` : op === 0 ? 'E' : op}</span>
                          </td>
                          <td className="px-2 py-3 text-center font-black text-primary">{pts}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

      </main>
    </div>
  );
};

export default Profile;
