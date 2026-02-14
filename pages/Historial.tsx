
import React from 'react';
import { Match, MatchStatus } from '../types';

interface HistorialProps {
  matches: Match[];
  onEditMatch: (match: Match) => void;
  onDeleteMatch: (id: string) => void;
  onUpdateMatch: (match: Match) => Promise<void>;
}

const Historial: React.FC<HistorialProps> = ({ matches, onEditMatch, onDeleteMatch, onUpdateMatch }) => {
  const [editingDateMatchId, setEditingDateMatchId] = React.useState<string | null>(null);
  const [tempDate, setTempDate] = React.useState<string>("");

  const handleActionDeleteMatch = (e: React.MouseEvent, matchId: string) => {
    e.preventDefault();
    e.stopPropagation();
    // Esborrat directe segons petició
    onDeleteMatch(matchId);
  };

  const handleStartEditDate = (match: Match) => {
    setEditingDateMatchId(match.id);
    setTempDate(match.date);
  };

  const handleSaveDate = async (match: Match) => {
    if (!tempDate) return;
    try {
      const updatedMatch = { ...match, date: tempDate };
      await onUpdateMatch(updatedMatch);
      setEditingDateMatchId(null);
    } catch (error) {
      console.error("Failed to update date", error);
      alert("Error actualitzant la data");
    }
  };

  const handleCancelEditDate = () => {
    setEditingDateMatchId(null);
  };

  return (
    <div className="pb-24">
      <header className="px-6 py-6 flex items-center justify-between sticky top-0 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md z-30">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Historial</h1>
          <p className="text-xs text-slate-500 dark:text-primary/60 font-medium">Lligueta Pitch & Golfos</p>
        </div>
        <button className="w-10 h-10 rounded-full bg-slate-200 dark:bg-primary/10 flex items-center justify-center">
          <span className="material-icons-round text-slate-700 dark:text-primary">filter_list</span>
        </button>
      </header>

      <main className="px-4 space-y-6 relative mt-4">
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-primary/10 -z-10"></div>

        {matches.length === 0 ? (
          <div className="py-20 text-center text-slate-500 italic">
            No hi ha partits a l'historial.
          </div>
        ) : (
          matches.map((match) => (
            <div key={match.id} className={`relative pl-10 ${match.status === MatchStatus.CLOSED ? 'opacity-90' : ''}`}>
              <div className={`absolute left-1.5 top-6 w-3.5 h-3.5 rounded-full border-4 border-background-light dark:border-background-dark shadow-sm ${match.status === MatchStatus.OPEN ? 'bg-primary shadow-[0_0_10px_rgba(19,236,91,0.4)]' : 'bg-slate-400'}`}></div>

              <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl overflow-hidden shadow-sm">
                <div className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block uppercase tracking-widest">
                        {match.customName ? 'Nom Partit' : 'ID Partit'}
                      </span>
                      <h3 className="font-bold text-lg truncate max-w-[200px]">
                        {match.customName || match.matchCode}
                      </h3>
                    </div>
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${match.status === MatchStatus.OPEN ? 'bg-primary/20 text-primary border-primary/30' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 border-transparent'}`}>
                      {match.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="material-icons-round text-primary text-lg">calendar_today</span>
                      {editingDateMatchId === match.id ? (
                        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 rounded px-1">
                          <input
                            type="date"
                            value={tempDate}
                            onChange={(e) => setTempDate(e.target.value)}
                            className="bg-transparent text-xs font-medium w-24 border-none focus:ring-0 p-0"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <button
                            onClick={(e) => { e.stopPropagation(); handleSaveDate(match); }}
                            className="text-green-500 hover:text-green-600"
                          >
                            <span className="material-icons-round text-sm">check</span>
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleCancelEditDate(); }}
                            className="text-red-500 hover:text-red-600"
                          >
                            <span className="material-icons-round text-sm">close</span>
                          </button>
                        </div>
                      ) : (
                        <div
                          className="flex items-center gap-1 group cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded px-1 -ml-1 transition-colors"
                          onClick={(e) => { e.stopPropagation(); handleStartEditDate(match); }}
                          title="Editar data"
                        >
                          <span className="text-xs font-medium">{match.date}</span>
                          <span className="material-icons-round text-[10px] text-slate-400 opacity-50 group-hover:opacity-100 transition-opacity">edit</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-icons-round text-primary text-lg">flag</span>
                      <span className="text-xs font-medium truncate">{match.course}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-icons-round text-primary text-lg">groups</span>
                      <span className="text-xs font-medium">{match.playerCount} Jug.</span>
                    </div>
                  </div>

                  {match.status === MatchStatus.CLOSED ? (
                    <div className="bg-primary/10 dark:bg-primary/5 rounded-lg p-3 border border-primary/20 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                        <span className="material-icons-round text-background-dark text-sm">emoji_events</span>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 dark:text-primary/60 uppercase font-bold tracking-tighter">Guanyador</p>
                        <p className="font-bold text-primary">{match.winner}</p>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="flex border-t border-slate-100 dark:border-slate-700/50">
                  <button
                    onClick={() => onEditMatch(match)}
                    className="flex-1 py-3 flex items-center justify-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                  >
                    <span className="material-icons-round text-sm">edit</span>
                    Editar
                  </button>
                  <div className="w-px bg-slate-100 dark:border-slate-700/50"></div>
                  <button
                    type="button"
                    onClick={(e) => handleActionDeleteMatch(e, match.id)}
                    className="flex-1 py-3 flex items-center justify-center gap-2 text-xs font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                  >
                    <span className="material-icons-round text-sm">delete_outline</span>
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
};

export default Historial;
