import React, { useState, useEffect } from 'react';
import { View, Player, Match } from './types';
import { fetchPlayers, addPlayer, deletePlayer, fetchMatches, upsertMatch, deleteMatch } from './src/lib/db';
import Ranking from './pages/Ranking';
import Historial from './pages/Historial';
import Profile from './pages/Profile';
import NewMatch from './pages/NewMatch';
import ScoreEntry from './pages/ScoreEntry';
import ManagePlayers from './pages/ManagePlayers';
import Stats from './pages/Stats';
import { MOCK_PLAYERS, MOCK_MATCHES } from './constants';

interface MatchConfig {
  id?: string;
  playerIds: string[];
  course: { name: string; par: number };
  mode: 'Individual' | 'Equips';
  type: 'Lliga' | 'Amistós';
  date: string;
  customName?: string;
  teams?: string[][];
  existingScores?: any;
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<View>('Ranking');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [currentMatchConfig, setCurrentMatchConfig] = useState<MatchConfig | null>(null);

  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);

  // Fetch data from Supabase on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [dbPlayers, dbMatches] = await Promise.all([
        fetchPlayers(),
        fetchMatches()
      ]);
      setPlayers(dbPlayers);
      setMatches(dbMatches);
    } catch (error) {
      console.error("Failed to load data:", error);
    }
  };

  const handleAddPlayer = async (newPlayer: Player) => {
    try {
      // Optimistic update (optional) or just wait for DB
      const added = await addPlayer(newPlayer.name);
      if (added) {
        setPlayers(prev => [...prev, added]);
      }
    } catch (error) {
      alert("Error afegint jugador. Revisa la consola.");
    }
  };

  const handleDeletePlayer = async (id: string) => {
    console.log("Deleting player:", id);
    try {
      const playerToDelete = players.find(p => p.id === id);
      if (!playerToDelete) return;

      await deletePlayer(id);

      // Update local state
      setPlayers(prev => prev.filter(p => p.id !== id));

      // Cleanup matches related to this player
      const playerName = playerToDelete.name;
      if (playerName) {
        // NOTE: This local update is tricky because we need to update matches in DB too if we remove a player from them.
        // For now, we keep local optimistic update for matches to reflect UI, 
        // BUT ideally we should also update the match in DB removing the player.
        // Given the requirement was just "delete from matches" logic in UI, we keep it visually. 
        // A proper impl would re-save the affected matches.
        setMatches(prevMatches => {
          return prevMatches.map(match => {
            if (match.players.includes(playerName)) {
              const newPlayers = match.players.filter(name => name !== playerName);
              const newStrokes = { ...match.strokes_total_per_player };
              delete newStrokes[playerName];
              const newPoints = { ...match.points_per_player };
              delete newPoints[playerName];
              return {
                ...match,
                players: newPlayers,
                playerCount: newPlayers.length,
                strokes_total_per_player: newStrokes,
                points_per_player: newPoints,
                winner: match.winner === playerName ? (newPlayers[0] || "N/A") : match.winner
              };
            }
            return match;
          }).filter(match => match.players.length > 0);
        });
      }

      if (selectedPlayerId === id) {
        setSelectedPlayerId(null);
        setActiveTab('Ranking');
      }
    } catch (error) {
      console.error("Error deleting player:", error);
      alert("Error esborrant jugador.");
    }
  };

  const handleDeleteMatch = async (id: string) => {
    try {
      await deleteMatch(id);
      setMatches(prev => prev.filter(m => m.id !== id));
    } catch (error) {
      console.error("Error deleting match:", error);
      alert("Error esborrant partit.");
    }
  };

  const handleSelectPlayer = (id: string) => {
    setSelectedPlayerId(id);
    setActiveTab('Perfil');
  };

  const handleStartMatch = (config: MatchConfig) => {
    setCurrentMatchConfig(config);
    setActiveTab('ScoreEntry');
  };

  const handleEditMatch = (match: Match) => {
    const playerIds = players.filter(p => match.players.includes(p.name)).map(p => p.id);

    setCurrentMatchConfig({
      id: match.id,
      playerIds: playerIds,
      course: { name: match.course, par: match.par },
      mode: match.mode === 'individual' ? 'Individual' : 'Equips',
      type: match.type || 'Lliga',
      date: match.date,
      customName: match.customName,
      teams: match.teams,
      existingScores: {
        strokes: match.strokes_total_per_player,
        birdies: match.birdies_per_player || {},
        hio: match.hio_per_player || {}
      }
    });
    setActiveTab('ScoreEntry');
  };

  const handleFinishMatch = async (finishedMatch: Match) => {
    try {
      const savedMatch = await upsertMatch(finishedMatch);
      if (savedMatch) {
        setMatches(prev => {
          const exists = prev.find(m => m.id === savedMatch.id);
          if (exists) {
            return prev.map(m => m.id === savedMatch.id ? savedMatch : m);
          }
          return [savedMatch, ...prev];
        });
        setActiveTab('Historial');
      }
    } catch (error) {
      console.error("Error saving match:", error);
      alert("Error guardant el partit.");
    }
  };

  const renderView = () => {
    switch (activeTab) {
      case 'Ranking':
        return <Ranking players={players} matches={matches} onNewMatch={() => setActiveTab('NuevoMatch')} onSelectPlayer={handleSelectPlayer} />;
      case 'Historial':
        return <Historial matches={matches} onDeleteMatch={handleDeleteMatch} onEditMatch={handleEditMatch} onUpdateMatch={async (updatedMatch) => { await handleFinishMatch(updatedMatch); }} />;
      case 'Stats':
        return <Stats players={players} matches={matches} />;
      case 'Perfil':
        const player = players.find(p => p.id === selectedPlayerId) || players[0];
        return <Profile player={player} matches={matches} onBack={() => setActiveTab('Ranking')} onRegisterMatch={() => setActiveTab('NuevoMatch')} />;
      case 'Jugadors':
        return <ManagePlayers players={players} onAdd={handleAddPlayer} onDelete={handleDeletePlayer} onSelectPlayer={handleSelectPlayer} />;
      case 'NuevoMatch':
        return <NewMatch players={players} onBack={() => setActiveTab('Ranking')} onStart={handleStartMatch} />;
      case 'ScoreEntry':
        if (!currentMatchConfig) return <Ranking players={players} matches={matches} onNewMatch={() => setActiveTab('NuevoMatch')} onSelectPlayer={handleSelectPlayer} />;
        const selectedPlayers = players.filter(p => currentMatchConfig.playerIds.includes(p.id));
        return (
          <ScoreEntry
            players={selectedPlayers}
            course={currentMatchConfig.course}
            matchDate={currentMatchConfig.date}
            matchMode={currentMatchConfig.mode}
            matchType={currentMatchConfig.type}
            customName={currentMatchConfig.customName}
            matchId={currentMatchConfig.id}
            teams={currentMatchConfig.teams}
            existingScores={currentMatchConfig.existingScores}
            onBack={() => setActiveTab('Historial')}
            onFinish={handleFinishMatch}
          />
        );
      default:
        return <Ranking players={players} matches={matches} onNewMatch={() => setActiveTab('NuevoMatch')} onSelectPlayer={handleSelectPlayer} />;
    }
  };

  const showNavbar = !['NuevoMatch', 'ScoreEntry', 'Perfil'].includes(activeTab);

  return (
    <div className="max-w-md mx-auto min-h-screen relative flex flex-col bg-background-light dark:bg-background-dark">
      <main className="flex-1 overflow-x-hidden">
        {renderView()}
      </main>

      {showNavbar && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-2 py-3 flex justify-around items-center z-50 max-w-md mx-auto">
          <button onClick={() => setActiveTab('Ranking')} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'Ranking' ? 'text-primary' : 'text-slate-400 dark:text-slate-600'}`}>
            <span className="material-icons-round">emoji_events</span>
            <span className="text-[10px] font-bold">Rànquing</span>
          </button>
          <button onClick={() => setActiveTab('Historial')} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'Historial' ? 'text-primary' : 'text-slate-400 dark:text-slate-600'}`}>
            <span className="material-icons-round">history</span>
            <span className="text-[10px] font-bold">Historial</span>
          </button>
          <button onClick={() => setActiveTab('Stats')} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'Stats' ? 'text-primary' : 'text-slate-400 dark:text-slate-600'}`}>
            <span className="material-icons-round">bar_chart</span>
            <span className="text-[10px] font-bold">Stats</span>
          </button>
          <button onClick={() => setActiveTab('Jugadors')} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'Jugadors' ? 'text-primary' : 'text-slate-400 dark:text-slate-600'}`}>
            <span className="material-icons-round">group_add</span>
            <span className="text-[10px] font-bold">Jugadors</span>
          </button>
        </nav>
      )}

      <div className="fixed inset-0 -z-20 pointer-events-none opacity-[0.03] dark:opacity-[0.05]">
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #13ec5b 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
      </div>
    </div>
  );
};

export default App;
