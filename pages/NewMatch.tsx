
import React, { useState, useEffect, useMemo } from 'react';
import { Player } from '../types';

interface NewMatchProps {
  players: Player[];
  onBack: () => void;
  onStart: (config: any) => void;
}

interface Course {
  name: string;
  par: number;
}

const INITIAL_COURSES: Course[] = [
  { name: 'Pitch & Putt Gualta', par: 54 },
  { name: 'Golf Lloret', par: 54 },
  { name: 'Platja d\'Aro', par: 54 },
  { name: 'Mas Nou Golf', par: 72 },
  { name: 'Golf de Pals', par: 73 },
];

const NewMatch: React.FC<NewMatchProps> = ({ players, onBack, onStart }) => {
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [mode, setMode] = useState<'Individual' | 'Equips'>('Individual');
  const [matchType, setMatchType] = useState<'Lliga' | 'Amistós'>('Lliga');
  const [matchName, setMatchName] = useState('');
  const [matchDate, setMatchDate] = useState(new Date().toISOString().split('T')[0]);
  const [isEditingDate, setIsEditingDate] = useState(false);

  const [availableCourses, setAvailableCourses] = useState<Course[]>(() => {
    const saved = localStorage.getItem('golf_courses');
    return saved ? JSON.parse(saved) : INITIAL_COURSES;
  });

  const [selectedCourse, setSelectedCourse] = useState<Course>(availableCourses[0] || INITIAL_COURSES[0]);
  const [showCoursePicker, setShowCoursePicker] = useState(false);
  const [isCreatingCourse, setIsCreatingCourse] = useState(false);
  const [newCourseName, setNewCourseName] = useState('');
  const [newCoursePar, setNewCoursePar] = useState(54);

  const [teams, setTeams] = useState<string[][]>([]);
  const [showTeamsPreview, setShowTeamsPreview] = useState(false);
  const [teamSelectionMode, setTeamSelectionMode] = useState<'RANDOM' | 'MANUAL'>('RANDOM');
  const [manualTeams, setManualTeams] = useState<string[][]>([]);

  useEffect(() => {
    localStorage.setItem('golf_courses', JSON.stringify(availableCourses));
  }, [availableCourses]);

  useEffect(() => {
    if (mode === 'Equips' && teamSelectionMode === 'MANUAL') {
      const numPlayers = selectedPlayers.length;
      if (numPlayers < 2) {
        setManualTeams([]);
        return;
      }
      const structure: string[][] = [];
      for (let i = 0; i < numPlayers; i += 2) {
        if (i + 1 < numPlayers) {
          structure.push(['', '']);
        } else {
          if (structure.length > 0) {
            structure[structure.length - 1].push('');
          } else {
            structure.push(['']);
          }
        }
      }
      setManualTeams(prev => {
        if (prev.flat().length !== structure.flat().length) return structure;
        return prev.map(team => team.map(pid => selectedPlayers.includes(pid) ? pid : ''));
      });
    }
  }, [selectedPlayers.length, mode, teamSelectionMode]);

  const isManualTeamsValid = useMemo(() => {
    if (mode !== 'Equips' || teamSelectionMode === 'RANDOM') return true;
    const flat = manualTeams.flat().filter(id => id !== '');
    const unique = new Set(flat);
    return flat.length === selectedPlayers.length && unique.size === flat.length;
  }, [mode, teamSelectionMode, manualTeams, selectedPlayers.length]);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatDateDisplay = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  const togglePlayer = (id: string) => {
    setSelectedPlayers(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  const handleSelectAll = () => {
    if (selectedPlayers.length === players.length) {
      setSelectedPlayers([]);
    } else {
      setSelectedPlayers(players.map(p => p.id));
    }
  };

  const handleAddNewCourse = () => {
    if (newCourseName.trim()) {
      const newCourse: Course = { name: newCourseName.trim(), par: newCoursePar };
      setAvailableCourses(prev => [...prev, newCourse]);
      setSelectedCourse(newCourse);
      setNewCourseName('');
      setNewCoursePar(54);
      setIsCreatingCourse(false);
    }
  };

  const handleDeleteCourse = (e: React.MouseEvent, courseName: string) => {
    e.stopPropagation();
    const updatedCourses = availableCourses.filter(c => c.name !== courseName);
    setAvailableCourses(updatedCourses);
    if (selectedCourse.name === courseName && updatedCourses.length > 0) {
      setSelectedCourse(updatedCourses[0]);
    }
  };

  const generateTeams = () => {
    if (selectedPlayers.length < 2 && mode === 'Equips') return;

    if (mode === 'Individual') {
      handleFinalStart([]);
      return;
    }

    if (teamSelectionMode === 'RANDOM') {
      const shuffled = [...selectedPlayers].sort(() => Math.random() - 0.5);
      const newTeams: string[][] = [];

      for (let i = 0; i < shuffled.length; i += 2) {
        if (i + 1 < shuffled.length) {
          newTeams.push([shuffled[i], shuffled[i + 1]]);
        } else {
          if (newTeams.length > 0) {
            newTeams[newTeams.length - 1].push(shuffled[i]);
          } else {
            newTeams.push([shuffled[i]]);
          }
        }
      }
      setTeams(newTeams);
      setShowTeamsPreview(true);
    } else {
      if (isManualTeamsValid) {
        handleFinalStart(manualTeams);
      }
    }
  };

  const handleFinalStart = (finalTeams: string[][]) => {
    onStart({
      playerIds: selectedPlayers,
      course: selectedCourse,
      mode: mode,
      date: matchDate,
      type: matchType,
      customName: matchName.trim() || undefined,
      teams: finalTeams.length > 0 ? finalTeams : undefined
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-background-dark relative">
      <header className="px-6 py-4 flex items-center justify-between sticky top-0 z-40 bg-background-dark/80 ios-blur">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-start text-primary">
          <span className="material-icons-round">chevron_left</span>
        </button>
        <h1 className="text-lg font-semibold tracking-tight">Configuració Partit</h1>
        <div className="w-10"></div>
      </header>

      <main className="flex-1 px-6 pb-32">
        <div className="max-w-md mx-auto space-y-8">
          <section className="mt-4">
            <label className="text-[10px] uppercase tracking-[0.2em] text-primary font-black block mb-2 opacity-60">Nom del Partit</label>
            <input
              type="text"
              placeholder="Ex: Torneig Master..."
              value={matchName}
              onChange={(e) => setMatchName(e.target.value)}
              className="w-full bg-neutral-dark/40 border-2 border-primary/10 rounded-2xl px-5 py-4 text-white font-bold focus:border-primary/40 focus:ring-0 transition-all placeholder:text-white/10"
            />
          </section>

          <section className="bg-neutral-dark/40 border border-primary/10 rounded-xl p-5 space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-primary/60 font-bold block mb-4">Dades Generals</label>

            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <span className="material-icons-round text-primary text-sm">calendar_today</span>
                {isEditingDate ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={matchDate}
                      onChange={(e) => setMatchDate(e.target.value)}
                      className="bg-neutral-dark border border-primary/30 rounded-lg px-2 py-1 text-white text-sm focus:outline-none focus:border-primary"
                    />
                    <button
                      onClick={() => setIsEditingDate(false)}
                      type="button"
                      className="bg-primary text-background-dark p-1 rounded-full active:scale-90 transition-transform flex items-center justify-center w-6 h-6"
                    >
                      <span className="material-icons-round text-sm font-bold">check</span>
                    </button>
                  </div>
                ) : (
                  <p className="text-sm font-medium text-slate-300">{formatDateDisplay(matchDate)}</p>
                )}
              </div>

              {!isEditingDate && (
                <button
                  onClick={() => setIsEditingDate(true)}
                  type="button"
                  className="bg-primary/10 text-primary px-3 py-2 rounded-xl text-xs font-bold active:scale-90 transition-transform"
                >
                  Editar Data
                </button>
              )}
            </div>

            <div className="h-px bg-primary/10 my-1"></div>

            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <span className="material-icons-round text-primary text-sm">flag</span>
                <div className="flex flex-col">
                  <p className="text-sm font-medium text-slate-300 truncate max-w-[150px]">{selectedCourse.name}</p>
                  <p className="text-[10px] text-primary/40 font-black">PAR {selectedCourse.par}</p>
                </div>
              </div>
              <button onClick={() => setShowCoursePicker(true)} className="bg-primary/10 text-primary px-3 py-2 rounded-xl text-xs font-bold active:scale-90 transition-transform">
                Editar Camp
              </button>
            </div>

            <div className="pt-4 pb-2 space-y-3">
              <label className="text-[10px] uppercase tracking-widest text-primary/60 font-bold">Modalitat i Tipus</label>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex p-1 bg-background-dark/60 rounded-lg border border-primary/5">
                  <button onClick={() => setMode('Individual')} className={`flex-1 py-2 rounded-md text-[10px] font-black uppercase transition-all ${mode === 'Individual' ? 'bg-primary text-background-dark shadow-lg' : 'text-slate-400'}`}>Individual</button>
                  <button onClick={() => setMode('Equips')} className={`flex-1 py-2 rounded-md text-[10px] font-black uppercase transition-all ${mode === 'Equips' ? 'bg-primary text-background-dark shadow-lg' : 'text-slate-400'}`}>Equips</button>
                </div>
                <div className="flex p-1 bg-background-dark/60 rounded-lg border border-primary/5">
                  <button onClick={() => setMatchType('Lliga')} className={`flex-1 py-2 rounded-md text-[10px] font-black uppercase transition-all ${matchType === 'Lliga' ? 'bg-primary text-background-dark shadow-lg' : 'text-slate-400'}`}>Lliga</button>
                  <button onClick={() => setMatchType('Amistós')} className={`flex-1 py-2 rounded-md text-[10px] font-black uppercase transition-all ${matchType === 'Amistós' ? 'bg-slate-700 text-slate-300 shadow-lg' : 'text-slate-400'}`}>Amistós</button>
                </div>
              </div>

              {mode === 'Equips' && (
                <div className="pt-4 space-y-3 border-t border-primary/5 mt-4">
                  <label className="text-[10px] uppercase tracking-widest text-primary/60 font-bold">Generació d'Equips</label>
                  <div className="flex p-1 bg-background-dark/60 rounded-lg border border-primary/5">
                    <button onClick={() => setTeamSelectionMode('RANDOM')} className={`flex-1 py-2 rounded-md text-[10px] font-black uppercase transition-all ${teamSelectionMode === 'RANDOM' ? 'bg-primary text-background-dark shadow-lg' : 'text-slate-400'}`}>Sorteig (Auto)</button>
                    <button onClick={() => setTeamSelectionMode('MANUAL')} className={`flex-1 py-2 rounded-md text-[10px] font-black uppercase transition-all ${teamSelectionMode === 'MANUAL' ? 'bg-primary text-background-dark shadow-lg' : 'text-slate-400'}`}>Manual</button>
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Seleccionar Jugadors ({selectedPlayers.length})</h2>
              <button onClick={handleSelectAll} className="text-primary text-sm font-bold active:scale-95 transition-transform">{selectedPlayers.length === players.length ? 'Cap' : 'Tots'}</button>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {players.map(player => (
                <label key={player.id} className={`flex items-center justify-between p-4 rounded-xl border transition-all active:scale-[0.98] ${selectedPlayers.includes(player.id) ? 'bg-neutral-dark/40 border-primary/30' : 'bg-neutral-dark/20 border-transparent'}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${selectedPlayers.includes(player.id) ? 'bg-primary text-background-dark' : 'bg-neutral-muted text-slate-400'}`}>{getInitials(player.name)}</div>
                    <p className={`font-bold ${selectedPlayers.includes(player.id) ? 'text-slate-100' : 'text-slate-400'}`}>{player.name}</p>
                  </div>
                  <input type="checkbox" className="hidden" checked={selectedPlayers.includes(player.id)} onChange={() => togglePlayer(player.id)} />
                  <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center ${selectedPlayers.includes(player.id) ? 'bg-primary border-primary' : 'border-slate-600'}`}>{selectedPlayers.includes(player.id) && <span className="material-icons-round text-background-dark text-sm font-bold">check</span>}</div>
                </label>
              ))}
            </div>
          </section>

          {mode === 'Equips' && teamSelectionMode === 'MANUAL' && (
            <section className="space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Configuració Equips</h2>
                <button
                  onClick={() => {
                    const filledIds = manualTeams[0].filter(id => id !== '');
                    const remaining = selectedPlayers.filter(pid => !filledIds.includes(pid));
                    if (manualTeams.length > 1) {
                      const newTeams = [...manualTeams];
                      const slotsToFill = newTeams[1].length;
                      newTeams[1] = [...remaining.slice(0, slotsToFill)];
                      setManualTeams(newTeams);
                    }
                  }}
                  className="text-primary text-[10px] font-black uppercase tracking-widest"
                >
                  Auto-omplir Team 2
                </button>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {manualTeams.map((team, tIdx) => (
                  <div key={tIdx} className="bg-neutral-dark/40 border border-primary/10 p-5 rounded-2xl space-y-4">
                    <span className="text-[10px] font-black text-primary/40 uppercase tracking-[0.2em]">EQUIP {tIdx + 1}</span>
                    <div className="grid grid-cols-2 gap-3">
                      {team.map((playerSlot, pIdx) => (
                        <div key={pIdx} className="relative">
                          <select
                            value={playerSlot}
                            onChange={(e) => {
                              const newTeams = [...manualTeams];
                              newTeams[tIdx][pIdx] = e.target.value;
                              setManualTeams(newTeams);
                            }}
                            className="w-full bg-background-dark border-2 border-primary/10 rounded-xl px-3 py-3 text-xs font-bold text-white focus:outline-none focus:border-primary/40 appearance-none"
                          >
                            <option value="">Triar...</option>
                            {selectedPlayers.map(pid => {
                              const p = players.find(player => player.id === pid);
                              return <option key={pid} value={pid}>{p?.name}</option>;
                            })}
                          </select>
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-primary/40">
                            <span className="material-icons-round text-sm">expand_more</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {!isManualTeamsValid && selectedPlayers.length >= 2 && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-[10px] font-black uppercase tracking-wider justify-center">
                  <span className="material-icons-round text-sm">error_outline</span>
                  <span>Assigna tots els jugadors sense repetir-ne cap</span>
                </div>
              )}
            </section>
          )}
        </div>
      </main>

      {showTeamsPreview && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-background-dark/95 backdrop-blur-md" onClick={() => setShowTeamsPreview(false)}></div>
          <div className="relative w-full max-w-md bg-neutral-dark border border-primary/20 rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in duration-300 max-h-[80vh] overflow-y-auto">
            <h2 className="text-2xl font-black text-primary mb-2 text-center">SORTEIG D'EQUIPS</h2>
            <p className="text-slate-400 text-xs text-center mb-6 uppercase tracking-widest font-bold">Parelles Generades Aleatòriament</p>

            <div className="space-y-4">
              {teams.map((team, idx) => (
                <div key={idx} className="bg-background-dark/40 border border-primary/10 p-4 rounded-2xl">
                  <span className="text-[10px] font-black text-primary/40 uppercase mb-2 block">EQUIP {idx + 1}</span>
                  <div className="flex items-center justify-between">
                    {team.map((pid, pidx) => {
                      const p = players.find(player => player.id === pid);
                      return (
                        <React.Fragment key={pid}>
                          <div className="flex flex-col items-center flex-1">
                            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold mb-1">{getInitials(p?.name || '')}</div>
                            <span className="text-xs font-bold text-center truncate w-full">{p?.name}</span>
                          </div>
                          {pidx < team.length - 1 && <span className="text-primary/30 mx-2">&</span>}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex gap-3">
              <button onClick={() => generateTeams()} className="flex-1 bg-slate-800 text-white font-bold py-4 rounded-xl active:scale-95 transition-transform uppercase text-xs">Repetir Sorteig</button>
              <button onClick={() => handleFinalStart(teams)} className="flex-1 bg-primary text-background-dark font-black py-4 rounded-xl shadow-lg active:scale-95 transition-transform uppercase text-xs">Acceptar i Jugar</button>
            </div>
          </div>
        </div>
      )}

      {showCoursePicker && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-background-dark/95 backdrop-blur-md" onClick={() => setShowCoursePicker(false)}></div>
          <div className="relative w-full max-w-md bg-neutral-dark border border-primary/20 rounded-3xl p-6 shadow-2xl animate-in fade-in slide-in-from-bottom-10 duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Seleccionar Camp</h3>
              <button onClick={() => setShowCoursePicker(false)} className="text-slate-400"><span className="material-icons-round">close</span></button>
            </div>

            {isCreatingCourse ? (
              <div className="space-y-4 animate-in fade-in duration-200">
                <input type="text" placeholder="Nom del Camp" value={newCourseName} onChange={(e) => setNewCourseName(e.target.value)} className="w-full bg-background-dark border border-primary/10 rounded-xl px-4 py-3 text-white" />
                <div className="flex items-center justify-between bg-background-dark border border-primary/10 rounded-xl px-4 py-3">
                  <span className="text-xs font-bold text-slate-400">Par del Camp</span>
                  <div className="flex items-center gap-4">
                    <button onClick={() => setNewCoursePar(p => Math.max(1, p - 1))} className="text-primary"><span className="material-icons-round">remove_circle_outline</span></button>
                    <span className="text-xl font-bold text-primary w-8 text-center">{newCoursePar}</span>
                    <button onClick={() => setNewCoursePar(p => p + 1)} className="text-primary"><span className="material-icons-round">add_circle_outline</span></button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setIsCreatingCourse(false)} className="flex-1 bg-slate-800 text-white font-bold py-3 rounded-xl">Cancelar</button>
                  <button onClick={handleAddNewCourse} className="flex-1 bg-primary text-background-dark font-black py-3 rounded-xl">Guardar Camp</button>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-2 max-h-64 overflow-y-auto hide-scrollbar mb-6">
                  {availableCourses.map(c => (
                    <div key={c.name} onClick={() => { setSelectedCourse(c); setShowCoursePicker(false); }} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${selectedCourse.name === c.name ? 'bg-primary/20 border-primary' : 'bg-background-dark border-transparent'}`}>
                      <div>
                        <p className="font-bold">{c.name}</p>
                        <p className="text-[10px] text-primary/60 font-black">PAR {c.par}</p>
                      </div>
                      <button onClick={(e) => handleDeleteCourse(e, c.name)} className="text-red-500/40 hover:text-red-500 p-2"><span className="material-icons-round text-lg">delete</span></button>
                    </div>
                  ))}
                </div>
                <button onClick={() => setIsCreatingCourse(true)} className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-primary/20 rounded-xl text-primary font-bold text-sm hover:bg-primary/5 transition-all">
                  <span className="material-icons-round">add</span>
                  Afegir Camp Nou
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <footer className="fixed bottom-0 left-0 right-0 p-6 bg-background-dark/95 ios-blur border-t border-primary/5 z-50">
        <div className="max-w-md mx-auto">
          <button
            onClick={generateTeams}
            disabled={selectedPlayers.length === 0 || (mode === 'Equips' && teamSelectionMode === 'MANUAL' && !isManualTeamsValid)}
            className="w-full bg-primary text-background-dark font-black py-4 rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 active:scale-[0.97] transition-all disabled:opacity-50 disabled:grayscale"
          >
            <span>{(mode === 'Equips' && teamSelectionMode === 'RANDOM') ? 'Sortejar Parelles' : 'Començar Partit'}</span>
            <span className="material-icons-round">{(mode === 'Equips' && teamSelectionMode === 'RANDOM') ? 'shuffle' : 'play_arrow'}</span>
          </button>
        </div>
      </footer>
    </div>
  );
};

export default NewMatch;
