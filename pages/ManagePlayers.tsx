
import React, { useState } from 'react';
import { Player } from '../types';

interface ManagePlayersProps {
  players: Player[];
  onAdd: (player: Player) => void;
  onDelete: (id: string) => void;
  onSelectPlayer: (id: string) => void;
}

const ManagePlayers: React.FC<ManagePlayersProps> = ({ players, onAdd, onDelete, onSelectPlayer }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');

  const getInitials = (name: string) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleActionDelete = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation(); // Impedeix que el clic a la paperera obri el perfil
    console.log(`Esborrant jugador immediatament: ${name} (ID: ${id})`);
    onDelete(id);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newPlayer: Player = {
      id: Date.now().toString(),
      name: newName.trim(),
      points: 0,
      matchesPlayed: 0,
      delta: '0.0'
    };

    onAdd(newPlayer);
    setNewName('');
    setShowAddForm(false);
  };

  return (
    <div className="pb-24 animate-in fade-in duration-500">
      <header className="px-6 py-6 flex items-center justify-between sticky top-0 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md z-30 border-b border-primary/10">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestionar Jugadors</h1>
          <p className="text-xs text-slate-500 dark:text-primary/60 font-medium">Llista oficial de la lligueta</p>
        </div>
        <button 
          onClick={() => setShowAddForm(true)}
          className="w-10 h-10 rounded-full bg-primary text-background-dark flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
        >
          <span className="material-icons-round">person_add</span>
        </button>
      </header>

      <main className="px-4 py-6 space-y-3">
        {players.length === 0 ? (
          <div className="py-20 text-center space-y-4">
            <div className="w-16 h-16 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto">
              <span className="material-icons-round text-slate-400 text-3xl">group</span>
            </div>
            <p className="text-slate-500 font-medium">No hi ha jugadors registrats encara.</p>
          </div>
        ) : (
          players.map(player => (
            <div 
              key={player.id} 
              onClick={() => onSelectPlayer(player.id)}
              className="bg-white dark:bg-neutral-dark/40 border border-slate-200 dark:border-primary/10 p-4 rounded-2xl flex items-center justify-between group hover:border-primary/30 transition-all shadow-sm cursor-pointer active:scale-[0.99]"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full border-2 border-primary/20 flex items-center justify-center bg-gradient-to-br from-primary/20 to-neutral-muted text-primary font-bold">
                  {getInitials(player.name)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100">{player.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-primary font-bold uppercase tracking-widest">{player.points} Punts</span>
                    <span className="text-slate-500 dark:text-slate-600">•</span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase">{player.matchesPlayed} Partits</span>
                  </div>
                </div>
              </div>
              <button 
                type="button"
                onClick={(e) => handleActionDelete(e, player.id, player.name)}
                className="w-12 h-12 flex items-center justify-center text-red-500/70 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer"
                aria-label="Esborrar jugador"
              >
                <span className="material-icons-round">delete_outline</span>
              </button>
            </div>
          ))
        )}
      </main>

      {showAddForm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-background-dark/90 backdrop-blur-md" onClick={() => setShowAddForm(false)}></div>
          <form onSubmit={handleSubmit} className="relative w-full max-w-xs bg-neutral-dark border border-primary/30 rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Nou Jugador</h3>
              <button type="button" onClick={() => setShowAddForm(false)} className="text-slate-500 hover:text-white transition-colors">
                <span className="material-icons-round">close</span>
              </button>
            </div>
            <div className="space-y-5">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-primary/60 font-bold block mb-2">Nom Complet</label>
                <input 
                  type="text" 
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ex: Pere Vila"
                  className="w-full bg-background-dark border-2 border-primary/10 rounded-xl px-4 py-3 text-slate-100 focus:border-primary focus:ring-0 transition-all placeholder:text-slate-700"
                  autoFocus
                  required
                />
              </div>
              <button 
                type="submit"
                className="w-full bg-primary text-background-dark font-black py-4 rounded-2xl shadow-lg shadow-primary/20 active:scale-95 transition-transform uppercase tracking-widest text-sm"
              >
                Registrar Jugador
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ManagePlayers;
