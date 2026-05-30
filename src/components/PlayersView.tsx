import React, { useState, useRef } from 'react';
import { Player, Team } from '../types';
import { generateId, parseCSV } from '../utils';
import { UserPlus, Upload, Trash2, Play, Users } from 'lucide-react';

interface PlayersViewProps {
  players: Player[];
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  onGenerateMatches: (type: 'mixed' | 'same-gender' | 'popcorn' | 'manual', isDynamic: boolean, manualTeams?: Team[]) => void;
  numCourts: number;
  setNumCourts: (num: number) => void;
  cycles: number | '';
  setCycles: (num: number | '') => void;
}

export default function PlayersView({ players, setPlayers, onGenerateMatches, numCourts, setNumCourts, cycles, setCycles }: PlayersViewProps) {
  const [name, setName] = useState('');
  const [skill, setSkill] = useState('3.0');
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [pendingFormat, setPendingFormat] = useState<'mixed' | 'same-gender' | 'popcorn' | null>(null);
  const [stagedFormat, setStagedFormat] = useState<{ format: 'mixed' | 'same-gender' | 'popcorn', isDynamic: boolean } | null>(null);
  const [isManualBuilder, setIsManualBuilder] = useState(false);
  const [manualTeams, setManualTeams] = useState<Team[]>([]);
  const [selectedPlayersForTeam, setSelectedPlayersForTeam] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFormatSelect = (isDynamic: boolean) => {
    if (!pendingFormat) return;

    if (cycles === '') {
      let actualCycles = 1;
      if (isDynamic) {
        const males = players.filter(p => p.gender === 'Male').length;
        const females = players.filter(p => p.gender === 'Female').length;
        if (males > 0 && females > 0) {
          actualCycles = Math.max(males, females);
        } else {
          actualCycles = Math.max(1, players.length - 1);
        }
      }
      setCycles(actualCycles);
      setStagedFormat({ format: pendingFormat, isDynamic });
      setPendingFormat(null);
      return;
    }

    onGenerateMatches(pendingFormat, isDynamic);
    setPendingFormat(null);
  };

  const handleTogglePlayerForTeam = (playerId: string) => {
    if (selectedPlayersForTeam.includes(playerId)) {
      setSelectedPlayersForTeam(prev => prev.filter(id => id !== playerId));
    } else if (selectedPlayersForTeam.length < 2) {
      setSelectedPlayersForTeam(prev => [...prev, playerId]);
    }
  };

  const handleCreateManualTeam = () => {
    if (selectedPlayersForTeam.length === 2) {
      setManualTeams(prev => [
        ...prev,
        {
          id: generateId(),
          player1Id: selectedPlayersForTeam[0],
          player2Id: selectedPlayersForTeam[1]
        }
      ]);
      setSelectedPlayersForTeam([]);
    }
  };

  const handleRemoveManualTeam = (teamId: string) => {
    setManualTeams(prev => prev.filter(t => t.id !== teamId));
  };

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    const newPlayer: Player = {
      id: generateId(),
      name: name.trim(),
      skill,
      gender,
    };
    
    setPlayers([...players, newPlayer]);
    setName('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        const parsed = parseCSV(text);
        const newPlayers: Player[] = parsed.map(p => ({
          id: generateId(),
          name: p.name || 'Unknown',
          skill: p.skill || '3.0',
          gender: p.gender || 'Male',
        }));
        setPlayers(prev => [...prev, ...newPlayers]);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePlayer = (id: string) => {
    setPlayers(players.filter(p => p.id !== id));
  };

  const updatePlayer = (id: string, updates: Partial<Player>) => {
    setPlayers(players.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  return (
    <div className="p-4 space-y-6 max-w-2xl mx-auto">
      {/* Header section w/ Start Tourney button */}
      <div className="flex flex-col gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-1">
          <h2 className="text-lg font-semibold text-gray-800">Tournament Setup</h2>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col">
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-2 border border-gray-200 px-3 py-1.5 rounded-lg bg-gray-50 flex-1 sm:flex-none">
                <label className="text-sm text-gray-600 font-medium whitespace-nowrap">Courts:</label>
                <input 
                  type="number" 
                  min="1" 
                  max="20"
                  value={numCourts}
                  onChange={e => setNumCourts(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-12 text-center text-gray-800 font-bold bg-transparent focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-2 border border-gray-200 px-3 py-1.5 rounded-lg bg-gray-50 flex-1 sm:flex-none" title="Leave empty for Auto Calculation">
                <label className="text-sm text-gray-600 font-medium whitespace-nowrap">Rounds / Cycles:</label>
                <input 
                  type="number" 
                  min="1" 
                  max="50"
                  value={cycles}
                  placeholder="Auto"
                  onChange={e => setCycles(e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-14 text-center text-gray-800 font-bold bg-transparent focus:outline-none placeholder-gray-400"
                />
              </div>
            </div>
            {!stagedFormat ? (
              <div className="hidden lg:block text-xs text-gray-500 mt-2">
                <strong>Tip:</strong> Leave Rounds/Cycles empty ("Auto") to automatically calculate a perfect rotation.
              </div>
            ) : (
              <div className="hidden lg:block text-xs text-blue-600 mt-2 font-medium">
                Calculated {cycles} rounds. You can adjust this number manually, then click Confirm & Generate.
              </div>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2 w-full lg:w-auto">
            {!stagedFormat ? (
              <div className="w-full text-xs text-gray-500 mb-1 lg:hidden">
                 <strong>Tip:</strong> Leave Rounds/Cycles empty ("Auto") to calculate perfect numbers.
              </div>
            ) : (
              <div className="w-full text-xs text-blue-600 mb-1 lg:hidden font-medium">
                 {cycles} Rounds Calculated - Adjust manually if needed.
              </div>
            )}
            {!stagedFormat ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                <button 
                  onClick={() => setPendingFormat('mixed')}
                  disabled={players.length < 4}
                  title="Strictly pairs Male/Female. Any uneven numbers will remain unpaired."
                  className="flex-1 justify-center bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors text-sm whitespace-nowrap"
                >
                  <Play size={16} />
                  Mixed Doubles
                </button>
                <button 
                  onClick={() => setPendingFormat('same-gender')}
                  disabled={players.length < 4}
                  className="flex-1 justify-center bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors text-sm whitespace-nowrap"
                >
                  <Play size={16} />
                  Single Gender
                </button>
                <button 
                  onClick={() => setPendingFormat('popcorn')}
                  disabled={players.length < 4}
                  className="flex-1 justify-center bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors text-sm whitespace-nowrap"
                >
                  <Play size={16} />
                  Popcorn Scramble
                </button>
                <button 
                  onClick={() => setIsManualBuilder(true)}
                  disabled={players.length < 4}
                  className="flex-1 justify-center bg-[#DF8D79] hover:bg-[#C87560] disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors text-sm whitespace-nowrap"
                >
                  <Users size={16} />
                  PPA Fixed Teams
                </button>
              </div>
            ) : (
              <div className="flex gap-2 w-full">
                <button 
                  onClick={() => {
                    onGenerateMatches(stagedFormat.format, stagedFormat.isDynamic);
                    setStagedFormat(null);
                  }}
                  className="flex-1 justify-center bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors text-sm"
                >
                  <Play size={16} fill="currentColor" />
                  Confirm & Generate Matches
                </button>
                <button 
                  onClick={() => setStagedFormat(null)}
                  className="justify-center bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Player Form */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-700">Add Player</h3>
          <div>
             <input 
                type="file" 
                accept=".csv" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                className="hidden" 
                id="csv-upload"
              />
             <label 
                htmlFor="csv-upload" 
                className="text-sm flex items-center gap-1.5 text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors font-medium"
              >
               <Upload size={16} />
               Import CSV
             </label>
          </div>
        </div>
        
        <form onSubmit={handleAddPlayer} className="flex flex-col sm:flex-row gap-3">
          <input 
            type="text" 
            placeholder="Player Name" 
            value={name}
            onChange={e => setName(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            required
          />
          <div className="flex gap-2">
            <select 
              value={skill} 
              onChange={e => setSkill(e.target.value)}
              className="border border-gray-300 rounded-lg px-2 py-2 bg-white"
            >
              {['2.5', '3.0', '3.5', '4.0', '4.5', '5.0+'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select 
              value={gender} 
              onChange={e => setGender(e.target.value as 'Male' | 'Female')}
              className="border border-gray-300 rounded-lg px-2 py-2 bg-white"
            >
              <option value="Male">M</option>
              <option value="Female">F</option>
            </select>
            <button 
              type="submit"
              className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <UserPlus size={20} />
            </button>
          </div>
        </form>
      </div>

      {/* Roster List */}
      <div>
        <div className="flex justify-between items-end mb-3 px-1">
          <h3 className="font-semibold text-gray-700">Roster</h3>
          <span className="text-sm text-gray-500 font-medium">{players.length} Players</span>
        </div>
        
        {players.length === 0 ? (
          <div className="text-center p-8 bg-white rounded-xl border border-dashed border-gray-300 text-gray-500">
            No players added yet. Add players manually or import a CSV (Name, Skill, Gender).
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100 overflow-hidden">
            {players.map(player => (
              <div key={player.id} className="flex justify-between items-center p-3 hover:bg-gray-50 transition-colors">
                <div>
                  <p className="font-medium text-gray-800">{player.name}</p>
                  <div className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                    <select 
                      value={player.gender} 
                      onChange={(e) => updatePlayer(player.id, { gender: e.target.value as 'Male' | 'Female' })}
                      className="border border-gray-200 rounded px-1 py-0.5 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                    <span>&bull;</span>
                    <select 
                      value={player.skill} 
                      onChange={(e) => updatePlayer(player.id, { skill: e.target.value })}
                      className="border border-gray-200 rounded px-1 py-0.5 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {['2.5', '3.0', '3.5', '4.0', '4.5', '5.0+'].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <button 
                  onClick={() => removePlayer(player.id)}
                  className="text-red-400 hover:text-red-600 p-2"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Format Confirmation Modal */}
      {pendingFormat && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Partner Assignment</h3>
              <p className="text-sm text-gray-500 mt-1">
                Do you want to keep the same teams for all rounds, or switch partners?
              </p>
            </div>
            
            <div className="p-4 flex flex-col gap-3 bg-gray-50">
              <button 
                onClick={() => handleFormatSelect(false)}
                className="w-full bg-white border border-gray-200 hover:border-blue-400 hover:bg-blue-50 text-gray-800 text-left px-4 py-3 rounded-lg shadow-sm font-medium transition-colors"
              >
                Fixed Partners
                <div className="text-xs text-gray-500 font-normal mt-0.5">Play with the same partner all tournament.</div>
              </button>
              
              <button 
                onClick={() => handleFormatSelect(true)}
                className="w-full bg-white border border-gray-200 hover:border-cyan-400 hover:bg-cyan-50 text-gray-800 text-left px-4 py-3 rounded-lg shadow-sm font-medium transition-colors"
              >
                Dynamic Rotation
                <div className="text-xs text-gray-500 font-normal mt-0.5">Switch partners dynamically every round.</div>
              </button>
            </div>
            
            <div className="p-3 border-t border-gray-100 flex justify-end bg-white">
              <button 
                onClick={() => setPendingFormat(null)} 
                className="text-sm font-medium text-gray-600 hover:text-gray-900 px-4 py-2 rounded transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PPA Manual Team Builder Modal */}
      {isManualBuilder && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden text-[#5A4537]">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-[#F6EFE9]">
              <div>
                <h3 className="text-xl font-bold font-fredoka text-[#A95A47]">PPA Fixed Teams</h3>
                <p className="text-sm text-gray-600 font-medium">Please pair players into fixed teams.</p>
              </div>
              <button onClick={() => setIsManualBuilder(false)} className="text-gray-500 hover:text-gray-900 px-3 py-1 bg-white rounded shadow-sm border border-gray-200">Close</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 md:grid-cols-2 gap-6 bg-white">
              {/* Unpaired Players */}
              <div>
                <h4 className="font-bold mb-3 flex items-center gap-2">
                  Unpaired Players 
                  {selectedPlayersForTeam.length > 0 && <span className="text-xs bg-[#DF8D79] text-white px-2 py-0.5 rounded-full">{selectedPlayersForTeam.length}/2 selected</span>}
                </h4>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {players.filter(p => !manualTeams.some(t => t.player1Id === p.id || t.player2Id === p.id)).map(player => (
                    <div 
                      key={player.id} 
                      onClick={() => handleTogglePlayerForTeam(player.id)}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors flex justify-between items-center ${selectedPlayersForTeam.includes(player.id) ? 'border-[#DF8D79] bg-[#DF8D79]/10' : 'border-gray-200 hover:border-gray-300 bg-gray-50'}`}
                    >
                      <div className="font-semibold">{player.name}</div>
                      <div className="text-xs text-gray-500">{player.gender.charAt(0)} • {player.skill}</div>
                    </div>
                  ))}
                  {players.filter(p => !manualTeams.some(t => t.player1Id === p.id || t.player2Id === p.id)).length === 0 && (
                    <div className="text-sm text-gray-500 italic p-4 text-center border border-dashed rounded bg-gray-50">No Unpaired Players</div>
                  )}
                </div>
                <button 
                  onClick={handleCreateManualTeam}
                  disabled={selectedPlayersForTeam.length !== 2}
                  className="w-full mt-4 bg-[#DF8D79] hover:bg-[#C87560] disabled:bg-gray-300 text-white font-bold py-2.5 rounded-lg transition-colors"
                >
                  Confirm Team
                </button>
              </div>

              {/* Formed Teams */}
              <div>
                <h4 className="font-bold mb-3">Formed Teams ({manualTeams.length})</h4>
                <div className="space-y-2 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                  {manualTeams.map(team => {
                    const p1 = players.find(p => p.id === team.player1Id);
                    const p2 = players.find(p => p.id === team.player2Id);
                    return (
                      <div key={team.id} className="p-3 border border-green-200 bg-green-50 rounded-lg flex flex-col relative pr-10">
                         <div className="font-semibold text-green-900">{p1?.name} & {p2?.name}</div>
                         <div className="text-xs text-green-700 mt-0.5">{p1?.gender.charAt(0)}{p1?.skill} + {p2?.gender.charAt(0)}{p2?.skill}</div>
                         <button type="button" onClick={() => handleRemoveManualTeam(team.id)} className="absolute right-2 top-2 text-green-700 hover:text-red-600 bg-white shadow-sm p-1.5 rounded-md"><Trash2 size={14} /></button>
                      </div>
                    )
                  })}
                  {manualTeams.length === 0 && (
                    <div className="text-sm text-gray-500 italic p-4 text-center border border-dashed rounded bg-gray-50">No teams formed yet</div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 flex justify-between items-center bg-gray-50">
               <div className="text-xs text-gray-500 flex-1 pr-4">Make sure you have an even number of teams if playing round robin.</div>
               <button 
                 onClick={() => {
                   onGenerateMatches('manual', false, manualTeams);
                   setIsManualBuilder(false);
                 }}
                 disabled={manualTeams.length < 2}
                 className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors whitespace-nowrap"
               >
                 <Play size={16} fill="currentColor" />
                 Start Tournament
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
