
import React, { useState, useMemo } from 'react';
import { Player, Match, MatchStatus, GameMode } from '../types';
import { calculateMatchPoints, computeDenseRankPositions, computeCompetitionRank, computeDenseRank } from '../src/lib/statsHelper';

interface ScoreEntryProps {
  players: Player[];
  course: { name: string; par: number };
  matchDate: string;
  matchMode: 'Individual' | 'Equips';
  matchType: 'Lliga' | 'Amistós';
  customName?: string;
  matchId?: string;
  teams?: string[][];
  existingScores?: {
    strokes: Record<string, number>;
    birdies: Record<string, number>;
    hio: Record<string, number>;
  };
  onBack: () => void;
  onFinish: (match: Match) => void;
}

interface PlayerScore {
  id: string;
  name: string;
  strokes: number;
  birdies: number;
  hio: number;
}

const ScoreEntry: React.FC<ScoreEntryProps> = ({
  players,
  course,
  matchDate,
  matchMode,
  matchType,
  customName,
  matchId,
  teams,
  existingScores,
  onBack,
  onFinish
}) => {
  const [playerScores, setPlayerScores] = useState<PlayerScore[]>(
    players.map(p => ({
      id: p.id,
      name: p.name,
      strokes: existingScores?.strokes?.[p.name] ?? course.par,
      birdies: existingScores?.birdies?.[p.name] ?? 0,
      hio: existingScores?.hio?.[p.name] ?? 0
    }))
  );

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const updateScore = (id: string, key: keyof PlayerScore, delta: number) => {
    setPlayerScores(prev => prev.map(ps => {
      if (ps.id === id) {
        const newVal = Math.max(0, (ps[key] as number) + delta);
        return { ...ps, [key]: newVal };
      }
      return ps;
    }));
  };

  const handleManualStrokesChange = (id: string, value: string) => {
    const num = parseInt(value) || 0;
    setPlayerScores(prev => prev.map(ps => {
      if (ps.id === id) {
        return { ...ps, strokes: num };
      }
      return ps;
    }));
  };

  const rankings = useMemo(() => {
    const scoresMap: Record<string, number> = {};
    playerScores.forEach(ps => scoresMap[ps.id] = ps.strokes);
    return computeCompetitionRank(Object.keys(scoresMap), (a, b) => scoresMap[a] - scoresMap[b], k => k);
  }, [playerScores]);

  const handleFinishMatch = () => {
    const strokesMap: Record<string, number> = {};
    const birdiesMap: Record<string, number> = {};
    const hioMap: Record<string, number> = {};

    // 1. Prepare data maps
    playerScores.forEach(ps => {
      strokesMap[ps.name] = ps.strokes;
      birdiesMap[ps.name] = ps.birdies;
      hioMap[ps.name] = ps.hio;
    });

    // 2. Resolve teams from IDs to Names for storage and calculation
    const resolvedTeams = teams?.map(teamIds =>
      teamIds.map(pid => players.find(p => p.id === pid)?.name || '')
    ) || [];

    // 3. Construct a partial match for calculation
    const matchData: Partial<Match> = {
      mode: matchMode === 'Individual' ? GameMode.INDIVIDUAL : GameMode.PARELLA,
      type: matchType,
      players: playerScores.map(ps => ps.name),
      teams: resolvedTeams,
      strokes_total_per_player: strokesMap,
      birdies_per_player: birdiesMap,
      hio_per_player: hioMap
    };

    // 4. Calculate points using the new helper
    const pointsMap = calculateMatchPoints(matchData);

    // 5. Determine winner (Rank 1)
    // 5. Determine winner (Rank 1)
    let winner = "N/A";
    if (matchMode === 'Equips' && resolvedTeams.length > 0) {
      const teamScores: Record<string, number> = {};
      resolvedTeams.forEach((members, idx) => {
        teamScores[idx] = members.reduce((acc, name) => acc + (strokesMap[name] || 0), 0);
      });
      const teamRanks = computeCompetitionRank(
        Object.keys(teamScores),
        (a, b) => teamScores[a] - teamScores[b],
        id => id
      );
      const winningTeamIds = Object.keys(teamRanks).filter(id => teamRanks[id] === 1);
      winner = winningTeamIds.map(id => resolvedTeams[parseInt(id)].join(' & ')).join(', ');
    } else {
      const rankPositions = computeCompetitionRank(
        Object.keys(strokesMap),
        (a, b) => strokesMap[a] - strokesMap[b],
        id => id
      );
      const winningPlayers = Object.keys(rankPositions).filter(name => rankPositions[name] === 1);
      winner = winningPlayers.join(', ');
    }

    const newMatch: Match = {
      id: matchId ?? Date.now().toString(),
      matchCode: `MATCH-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`,
      customName: customName,
      date: matchDate,
      mode: matchData.mode!,
      type: matchType,
      playerCount: players.length,
      status: MatchStatus.CLOSED,
      winner: winner,
      course: course.name,
      par: course.par,
      players: matchData.players!,
      teams: resolvedTeams,
      strokes_total_per_player: strokesMap,
      points_per_player: pointsMap,
      birdies_per_player: birdiesMap,
      hio_per_player: hioMap
    };

    onFinish(newMatch);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background-dark">
      <header className="sticky top-0 z-30 bg-background-dark/90 ios-blur border-b border-primary/10 px-4 pt-8 pb-4">
        <div className="flex items-center justify-between mb-2">
          <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full bg-primary/10 text-primary active:scale-90 transition-transform">
            <span className="material-icons-round">arrow_back_ios_new</span>
          </button>
          <div className="text-center">
            <h1 className="text-lg font-bold tracking-tight">
              {matchId ? 'Edició Resultats' : 'Marcador en Viu'}
            </h1>
            <p className="text-[10px] text-primary/60 font-bold uppercase tracking-widest">
              {matchType} • {customName || course.name}
            </p>
          </div>
          <div className="w-10"></div>
        </div>
        <div className="flex items-center justify-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mt-2">
          <span className="material-icons-round text-sm">flag</span>
          <span>PAR {course.par}</span>
        </div>
      </header>

      <main className="px-4 py-6 pb-44 space-y-8 max-w-md mx-auto w-full">
        {matchMode === 'Equips' && teams && (
          <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-icons-round text-primary text-sm">shuffle</span>
              <span className="text-[10px] font-black text-primary uppercase">Equips de la sessió</span>
            </div>
            <div className="space-y-2">
              {teams.map((team, idx) => (
                <div key={idx} className="text-xs font-bold text-slate-300">
                  <span className="text-primary/60">E{idx + 1}:</span> {team.map(pid => players.find(p => p.id === pid)?.name).join(' & ')}
                </div>
              ))}
            </div>
          </div>
        )}

        {playerScores.map((ps) => (
          <div key={ps.id} className="bg-neutral-dark/40 border border-primary/10 rounded-[2.5rem] p-6 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <span className="material-icons-round text-8xl">sports_golf</span>
            </div>

            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl border-2 border-primary/30 flex items-center justify-center bg-background-dark text-primary font-black text-xl shadow-lg shadow-primary/10">
                    {getInitials(ps.name)}
                  </div>
                  <div className={`absolute -top-2 -left-2 w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border-2 border-background-dark shadow-md ${rankings[ps.id] === 1 ? 'bg-primary text-background-dark' : 'bg-slate-700 text-slate-300'}`}>
                    #{rankings[ps.id]}
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white leading-tight">{ps.name}</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                    <span className="text-[10px] text-primary uppercase font-black tracking-widest">En joc</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${ps.strokes <= course.par ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                  {ps.strokes - course.par === 0 ? 'E' : ps.strokes - course.par > 0 ? `+${ps.strokes - course.par}` : ps.strokes - course.par}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-background-dark/60 p-1.5 rounded-[2rem] border border-primary/5">
                <div className="flex items-center justify-between">
                  <button onClick={() => updateScore(ps.id, 'strokes', -1)} className="w-16 h-16 rounded-[1.5rem] bg-slate-800/80 text-white flex items-center justify-center active:scale-90 transition-all shadow-lg active:bg-slate-700">
                    <span className="material-icons-round text-2xl">remove</span>
                  </button>
                  <div className="flex-1 flex flex-col items-center">
                    <input type="number" value={ps.strokes} onChange={(e) => handleManualStrokesChange(ps.id, e.target.value)} className="w-full bg-transparent border-none text-center text-5xl font-black py-2 text-primary focus:ring-0 appearance-none selection:bg-primary/30" />
                    <span className="text-[9px] uppercase font-black text-slate-500 tracking-[0.3em] -mt-2">COPS TOTALS</span>
                  </div>
                  <button onClick={() => updateScore(ps.id, 'strokes', 1)} className="w-16 h-16 rounded-[1.5rem] bg-primary text-background-dark flex items-center justify-center active:scale-90 transition-all shadow-lg shadow-primary/20">
                    <span className="material-icons-round text-2xl font-black">add</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-neutral-muted/20 p-3 rounded-2xl border border-white/5 flex flex-col items-center">
                  <span className="text-[9px] text-slate-500 uppercase font-black mb-3 tracking-widest">Birdies</span>
                  <div className="flex items-center justify-between w-full">
                    <button onClick={() => updateScore(ps.id, 'birdies', -1)} className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center active:scale-90 transition-all">
                      <span className="material-icons-round text-xs">remove</span>
                    </button>
                    <span className="text-xl font-bold text-white">{ps.birdies}</span>
                    <button onClick={() => updateScore(ps.id, 'birdies', 1)} className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center active:scale-90 transition-all">
                      <span className="material-icons-round text-xs">add</span>
                    </button>
                  </div>
                </div>

                <div className="bg-primary/5 p-3 rounded-2xl border border-primary/10 flex flex-col items-center">
                  <span className="text-[9px] text-primary/60 uppercase font-black mb-3 tracking-widest">Hole in one</span>
                  <div className="flex items-center justify-between w-full">
                    <button onClick={() => updateScore(ps.id, 'hio', -1)} className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center active:scale-90 transition-all">
                      <span className="material-icons-round text-xs">remove</span>
                    </button>
                    <span className="text-xl font-bold text-primary">{ps.hio}</span>
                    <button onClick={() => updateScore(ps.id, 'hio', 1)} className="w-8 h-8 rounded-lg bg-primary text-background-dark flex items-center justify-center active:scale-90 transition-all shadow-sm">
                      <span className="material-icons-round text-xs">add</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </main>

      <footer className="fixed bottom-0 inset-x-0 bg-background-dark/95 border-t border-primary/20 px-6 pt-6 pb-10 z-40 max-w-md mx-auto ios-blur">
        <button onClick={handleFinishMatch} className="w-full bg-primary text-background-dark font-black py-4.5 rounded-2xl flex items-center justify-center gap-3 shadow-[0_15px_35px_rgba(19,236,91,0.3)] active:scale-[0.98] active:brightness-90 transition-all uppercase tracking-widest text-sm">
          <span className="material-icons-round text-xl">check_circle</span>
          <span>{matchId ? 'Guardar Canvis' : 'Finalitzar i Guardar'}</span>
        </button>
      </footer>
    </div>
  );
};

export default ScoreEntry;
