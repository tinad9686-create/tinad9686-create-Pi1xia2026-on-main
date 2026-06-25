import React, { useState } from 'react';
import { Match, Team, Player } from '../types';
import { Check, Printer, AlertCircle, ChevronDown, ChevronRight, Download } from 'lucide-react';

interface MatchesViewProps {
  matches: Match[];
  teams: Team[];
  players: Player[];
  leftoverPlayers: Player[];
  onPairLeftovers: () => void;
  updateMatchScore: (matchId: string, score1: number, score2: number, isCompleted?: boolean) => void;
}

export default function MatchesView({ matches, teams, players, leftoverPlayers, onPairLeftovers, updateMatchScore }: MatchesViewProps) {
  const [showPrintHint, setShowPrintHint] = useState(false);
  const [expandedRounds, setExpandedRounds] = useState<Record<string, boolean>>({});

  const toggleRound = (round: string) => {
    setExpandedRounds(prev => ({
      ...prev,
      [round]: !prev[round]
    }));
  };

  const getPlayerName = (playerId: string) => players.find(p => p.id === playerId)?.name || 'Unknown';
    
  const handlePrint = () => {
    if (window.top !== window.self) {
      setShowPrintHint(true);
    }
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handleExportCSV = () => {
    let csvContent = "";
    matches.forEach(match => {
      const team1 = teams.find(t => t.id === match.team1Id);
      const team2 = teams.find(t => t.id === match.team2Id);
      
      const t1p1 = getPlayerName(team1?.player1Id || '');
      const t1p2 = team1?.player2Id ? getPlayerName(team1.player2Id) : '';
      const t2p1 = getPlayerName(team2?.player1Id || '');
      const t2p2 = team2?.player2Id ? getPlayerName(team2.player2Id) : '';
      
      csvContent += `${t1p1},${t1p2},${match.score1},${t2p1},${t2p2},${match.score2}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "matches.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getTeamLabel = (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    if (!team) return 'Unknown Team';
    return `${getPlayerName(team.player1Id)} & ${getPlayerName(team.player2Id)}`;
  };

  // Group matches by round
  const matchesByRound = matches.reduce((acc, match) => {
    const roundNumber = match.round || 1;
    if (!acc[roundNumber]) acc[roundNumber] = [];
    acc[roundNumber].push(match);
    return acc;
  }, {} as Record<number, Match[]>);

  if (matches.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 mt-4">
        <p>No matches generated yet.</p>
        <p className="text-sm mt-2">Go to the Roster tab to start the tournament.</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 max-w-2xl mx-auto">
      <div className="flex justify-end items-center gap-3 print:hidden">
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium text-sm transition-colors"
        >
          <Download size={16} />
          Export CSV
        </button>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium text-sm transition-colors"
        >
          <Printer size={16} />
          Print Schedule
        </button>
      </div>

      {showPrintHint && (
        <div className="bg-[#DF8D79]/10 border border-[#DF8D79]/20 p-5 rounded-[1.5rem] shadow-sm print:hidden">
          <h3 className="font-extrabold text-[#A95A47]">Print may be blocked in preview</h3>
          <p className="text-[#A95A47] text-sm mt-1">
            If the print dialog didn't appear, please open this app in a new tab by clicking the <strong>Arrow Icon (↗)</strong> at the top right of your screen, then try printing again!
          </p>
          <button onClick={() => setShowPrintHint(false)} className="mt-3 text-sm font-bold text-[#A95A47] hover:text-[#5A4537] transition-colors">
            Dismiss
          </button>
        </div>
      )}

      {leftoverPlayers.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 shadow-sm print:hidden">
          <h3 className="font-semibold text-orange-800 mb-2 flex items-center gap-2">
            <AlertCircle size={18} /> Unpaired Players
          </h3>
          <p className="text-sm text-orange-700 mb-3">
            Because you selected Fixed Partners, these players could not be permanently paired and will sit out the tournament: <span className="font-medium">{leftoverPlayers.map(p => p.name).join(', ')}</span>.<br/><br/>
            <strong>To ensure everyone gets to play, go back and Generate Matches using "Dynamic Rotation" instead.</strong>
          </p>
          <button 
            onClick={() => {
              // using prompt if window isn't fully supported without user interacting, but simple confirm is ok here
              if (matches.some(m => m.isCompleted) && typeof window !== 'undefined') {
                if (!window.confirm("Warning: Pairing new teams will regenerate the entire round-robin schedule and clear existing scores. Continue?")) return;
              }
              onPairLeftovers();
            }}
            disabled={leftoverPlayers.length < 2}
            className="bg-orange-600 hover:bg-orange-700 disabled:bg-orange-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {leftoverPlayers.length < 2 ? "Need at least 2 leftovers to pair" : "Pair up leftovers (Regenerates Schedule)"}
          </button>
        </div>
      )}

      {Object.entries(matchesByRound).map(([round, roundMatches]) => {
        // Calculate players with byes in this round
        const activePlayerIds = new Set<string>();
        roundMatches.forEach(match => {
          const team1 = teams.find(t => t.id === match.team1Id);
          const team2 = teams.find(t => t.id === match.team2Id);
          if (team1) {
            activePlayerIds.add(team1.player1Id);
            activePlayerIds.add(team1.player2Id);
          }
          if (team2) {
            activePlayerIds.add(team2.player1Id);
            activePlayerIds.add(team2.player2Id);
          }
        });
        const sittingOutPlayers = players.filter(p => !activePlayerIds.has(p.id) && !leftoverPlayers.some(lp => lp.id === p.id));

        const isExpanded = expandedRounds[round] || false;

        return (
        <div key={round} className="bg-[#F6EFE9] rounded-[1.5rem] shadow-sm border border-[#E5DACD] overflow-hidden">
          <button 
            onClick={() => toggleRound(round)}
            className="w-full bg-[#DF8D79]/15 px-5 py-3 border-b border-[#DF8D79]/20 flex justify-between items-center hover:bg-[#DF8D79]/25 transition-colors text-left"
          >
            <div className="flex items-center gap-2">
              {isExpanded ? <ChevronDown size={20} className="text-[#A95A47]" /> : <ChevronRight size={20} className="text-[#A95A47]" />}
              <h3 className="font-bold text-[#A95A47]">Round {round}</h3>
            </div>
            {sittingOutPlayers.length > 0 && (
              <span className="text-xs font-bold text-[#A95A47] bg-[#DF8D79]/20 px-2.5 py-1 rounded-full">
                {sittingOutPlayers.length} byes
              </span>
            )}
          </button>
          
          {isExpanded && (
            <>
              {sittingOutPlayers.length > 0 && (
            <div className="px-5 py-2.5 bg-[#E8DDD1]/50 border-b border-[#E5DACD] text-sm">
              <span className="text-[#95887D] font-bold mr-2 uppercase tracking-wide text-xs">Sitting Out:</span>
              <span className="text-[#5A4537] font-medium">{sittingOutPlayers.map(p => p.name).join(', ')}</span>
            </div>
          )}

          <div className="divide-y divide-[#E5DACD]">
            {roundMatches.map(match => (
              <div key={match.id} className={`p-5 ${match.isCompleted ? 'bg-[#E8DDD1]/30 opacity-75' : ''}`}>
                <div className="flex flex-col gap-3">
                  <div className="text-xs font-bold text-[#A3978D] uppercase tracking-wide">Court {match.court}</div>
                  
                  {/* Team 1 Row */}
                  <div className="flex justify-between items-center">
                    <span className={`font-medium ${match.isCompleted && match.score1 > match.score2 ? 'text-[#1A4B29] font-bold' : 'text-[#5A4537]'}`}>
                      {getTeamLabel(match.team1Id)}
                    </span>
                    <input 
                      type="number"
                      min="0"
                      value={match.score1}
                      onChange={(e) => updateMatchScore(match.id, parseInt(e.target.value) || 0, match.score2, match.isCompleted)}
                      className="w-16 border border-[#D8CCBD] rounded-xl px-2 py-1 text-center font-bold text-lg bg-white/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#AED743] shadow-sm transition-colors text-[#5A4537]"
                      disabled={match.isCompleted}
                    />
                  </div>

                  {/* Team 2 Row */}
                  <div className="flex justify-between items-center">
                    <span className={`font-medium ${match.isCompleted && match.score2 > match.score1 ? 'text-[#1A4B29] font-bold' : 'text-[#5A4537]'}`}>
                      {getTeamLabel(match.team2Id)}
                    </span>
                    <input 
                      type="number"
                      min="0"
                      value={match.score2}
                      onChange={(e) => updateMatchScore(match.id, match.score1, parseInt(e.target.value) || 0, match.isCompleted)}
                      className="w-16 border border-[#D8CCBD] rounded-xl px-2 py-1 text-center font-bold text-lg bg-white/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#AED743] shadow-sm transition-colors text-[#5A4537]"
                      disabled={match.isCompleted}
                    />
                  </div>
                  
                  {/* Action Button */}
                  <div className="mt-2 flex justify-end print:hidden">
                    {match.isCompleted ? (
                      <button 
                        onClick={() => updateMatchScore(match.id, match.score1, match.score2, false)}
                        className="text-sm text-[#A3978D] hover:text-[#5A4537] underline font-medium px-2 py-1"
                      >
                        Edit Score
                      </button>
                    ) : (
                      <button
                        onClick={() => updateMatchScore(match.id, match.score1, match.score2, true)}
                        className="bg-[#1A4B29] hover:bg-[#13371e] text-white px-5 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors shadow-sm"
                      >
                        <Check size={16} /> Complete
                      </button>
                    )}
                  </div>

                </div>
              </div>
            ))}
          </div>
            </>
          )}
        </div>
        );
      })}
    </div>
  );
}
