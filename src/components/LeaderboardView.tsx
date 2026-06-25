import React, { useState, useRef } from 'react';
import { PlayerStats, Player, Team, TournamentInfo } from '../types';
import { Medal, Printer, Copy, CheckCircle, Upload, ChevronDown } from 'lucide-react';
import { StandingsMode } from '../App';

interface LeaderboardViewProps {
  leaderboard: PlayerStats[];
  players: Player[];
  teams: Team[];
  tournamentInfo: TournamentInfo;
  onImportMatches?: (csv: string) => void;
  standingsMode: StandingsMode;
  setStandingsMode: (mode: StandingsMode) => void;
}

export default function LeaderboardView({ leaderboard, players, teams, tournamentInfo, onImportMatches, standingsMode, setStandingsMode }: LeaderboardViewProps) {
  const [showPrintHint, setShowPrintHint] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getEntityName = (id: string) => {
    if (standingsMode === 'individual') {
      return players.find(p => p.id === id)?.name || 'Unknown';
    } else {
      const team = teams.find(t => t.id === id);
      if (team) {
        const p1 = players.find(p => p.id === team.player1Id)?.name || 'Unknown';
        const p2 = team.player2Id && team.player2Id !== team.player1Id ? players.find(p => p.id === team.player2Id)?.name : null;
        return p2 ? `${p1} & ${p2}` : p1;
      }
      return 'Unknown';
    }
  };

  const handlePrint = () => {
    if (window.top !== window.self) {
      setShowPrintHint(true);
    }
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (text && onImportMatches) {
          onImportMatches(text);
        }
      } catch (err) {
        console.error("Error importing matches:", err);
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.onerror = () => {
      console.error("Error reading file");
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const totalWinsRecorded = leaderboard.reduce((sum, s) => sum + s.wins, 0);
  const totalMatchesPlayed = Math.floor(totalWinsRecorded / 2);
  const totalPointsRecorded = leaderboard.reduce((sum, s) => sum + s.pointsFor, 0);
  const totalPointsScored = Math.floor(totalPointsRecorded / 2);
  
  const sumAbsDiff = leaderboard.reduce((sum, s) => sum + Math.abs(s.pointDiff), 0);
  const avgPointDiff = totalMatchesPlayed > 0 
    ? (sumAbsDiff / (totalMatchesPlayed * 4)).toFixed(1) 
    : '0.0';

  let highestStreakPlayer = 'N/A';
  let maxWinStreak = 0;
  leaderboard.forEach(stat => {
    if (stat.winStreak > maxWinStreak) {
      maxWinStreak = stat.winStreak;
      highestStreakPlayer = getEntityName(stat.playerId);
    } else if (stat.winStreak === maxWinStreak && maxWinStreak > 0) {
      // Keep it simple
    }
  });

  const handleCopyLog = (stat: PlayerStats, playerName: string) => {
    let text = `${playerName} - Tournament Log\n`;
    if (tournamentInfo.name) text += `Event: ${tournamentInfo.name}\n`;
    if (tournamentInfo.date) text += `Date: ${tournamentInfo.date}\n`;
    if (tournamentInfo.location) text += `Location: ${tournamentInfo.location}\n`;
    text += `\nPerformance:\n`;
    text += `- Wins: ${stat.wins}\n`;
    text += `- Losses: ${stat.losses}\n`;
    text += `- Points For: ${stat.pointsFor}\n`;
    text += `- Point Differential: ${stat.pointDiff > 0 ? '+' : ''}${stat.pointDiff}\n`;
    
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(stat.playerId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const importBanner = (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-4 print:hidden mb-6">
      <div className="flex-1">
        <h3 className="font-semibold text-gray-700 mb-1">Standings Format</h3>
        <div className="relative">
          <select 
            value={standingsMode}
            onChange={(e) => setStandingsMode(e.target.value as StandingsMode)}
            className="w-full sm:w-64 appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-2 px-3 pr-8 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#DF8D79] transition-colors"
          >
            <option value="individual">Individual (e.g. Mixed Doubles, Popcorn)</option>
            <option value="team-round-robin">Team - Round Robin / Pool Play</option>
            <option value="team-ppa">Team - PPA Fixed (50% Cut)</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-2.5 text-gray-500 pointer-events-none" size={16} />
        </div>
      </div>
      <div>
        <input 
          type="file" 
          accept=".csv" 
          ref={fileInputRef} 
          onChange={handleFileUpload} 
          className="hidden" 
          id="matches-csv-upload"
        />
        <label 
          htmlFor="matches-csv-upload" 
          className="text-sm flex items-center gap-1.5 text-blue-600 bg-blue-50 px-4 py-2 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors font-medium whitespace-nowrap"
        >
         <Upload size={16} />
         Import CSV
        </label>
      </div>
    </div>
  );

  if (leaderboard.length === 0) {
    return (
      <div className="p-4 max-w-2xl mx-auto space-y-4">
        {importBanner}
        <div className="p-8 text-center text-gray-500 mt-10">
          <p>No matches completed yet.</p>
          <p className="text-sm mt-2">Check back once scores are submitted.</p>
        </div>
      </div>
    );
  }

  const getRankStyle = (index: number) => {
    switch(index) {
      case 0: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 1: return 'bg-gray-200 text-gray-700 border-gray-300';
      case 2: return 'bg-amber-100 text-amber-800 border-amber-200';
      default: return 'bg-white text-gray-600 border-gray-100';
    }
  };

  const getRankIcon = (index: number) => {
    switch(index) {
      case 0: return <Medal size={20} className="text-yellow-600" />;
      case 1: return <Medal size={20} className="text-gray-500" />;
      case 2: return <Medal size={20} className="text-amber-700" />;
      default: return <span className="w-5 text-center text-sm font-bold opacity-50">{index + 1}</span>;
    }
  }

  const ppaCutIndex = standingsMode === 'team-ppa' ? Math.ceil(leaderboard.length / 2) : -1;

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4">
      {importBanner}
      <div className="flex justify-between items-center px-2 print:hidden">
        <h2 className="text-xl font-bold text-gray-800">Live Standings</h2>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium text-sm transition-colors"
        >
          <Printer size={16} />
          Print Results
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

      {/* Stats Summary */}
      {totalMatchesPlayed > 0 && (
        <div className="bg-[#5A4537]/5 border border-[#5A4537]/10 rounded-[1.5rem] p-5 shadow-sm print:hidden mb-6">
          <h3 className="font-extrabold text-[#5A4537] mb-4 tracking-wide uppercase text-xs flex items-center justify-between">
            <span>Overall Stats</span>
            <span className="bg-[#5A4537] text-white px-2 py-0.5 rounded-full text-[10px]">Public</span>
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/50 p-3 rounded-xl border border-white shadow-sm text-center">
              <div className="text-xl font-black text-[#5A4537]">{totalMatchesPlayed}</div>
              <div className="text-[10px] text-[#A3978D] font-bold uppercase tracking-wider mt-1">Matches Played</div>
            </div>
            <div className="bg-white/50 p-3 rounded-xl border border-white shadow-sm text-center">
              <div className="text-xl font-black text-[#5A4537]">{totalPointsScored}</div>
              <div className="text-[10px] text-[#A3978D] font-bold uppercase tracking-wider mt-1">Total Points</div>
            </div>
            <div className="bg-white/50 p-3 rounded-xl border border-white shadow-sm text-center">
              <div className="text-xl font-black text-[#5A4537]">{avgPointDiff}</div>
              <div className="text-[10px] text-[#A3978D] font-bold uppercase tracking-wider mt-1">Avg Point Diff</div>
            </div>
            <div className="bg-[#DF8D79]/10 p-3 rounded-xl border border-[#DF8D79]/20 shadow-sm text-center flex flex-col justify-center">
              <div className="text-base font-black text-[#A95A47] truncate px-1" title={highestStreakPlayer}>
                {highestStreakPlayer}
              </div>
              <div className="text-[10px] text-[#A95A47] font-bold uppercase tracking-wider mt-1">
                Highest Win Streak {maxWinStreak > 0 ? `(${maxWinStreak})` : ''}
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="space-y-2">
        {leaderboard.map((stat, index) => (
          <React.Fragment key={stat.playerId}>
            {index === ppaCutIndex && (
              <div className="relative py-4 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-dashed border-red-300"></div>
                </div>
                <div className="relative bg-[#F6EFE9] px-4 text-xs font-bold text-red-500 uppercase tracking-widest">
                  Cut Line
                </div>
              </div>
            )}
            <div 
              className={`flex items-center p-3 rounded-xl border ${getRankStyle(index)} shadow-sm transition-all duration-200 ${index >= ppaCutIndex && ppaCutIndex !== -1 ? 'opacity-60 grayscale-[50%]' : ''}`}
            >
            <div className="w-10 flex justify-center items-center">
              {getRankIcon(index)}
            </div>
            
            <div className="flex-1 ml-2">
              <div className="flex justify-between items-start">
                <h3 className={`font-bold ${index < 3 ? 'text-lg' : 'text-base'}`}>
                  {getEntityName(stat.playerId)}
                </h3>
              </div>
              <div className="flex flex-wrap text-[10px] opacity-70 gap-1.5 mt-0.5 font-semibold uppercase tracking-wider mb-1">
                {tournamentInfo.name && <span>{tournamentInfo.name}</span>}
                {tournamentInfo.date && <span>• {new Date(tournamentInfo.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric'})}</span>}
                {tournamentInfo.location && <span>• {tournamentInfo.location}</span>}
              </div>
              <div className="flex flex-wrap text-xs opacity-75 gap-x-3 gap-y-1 mt-0.5 font-medium">
                <span>Losses: {stat.losses}</span>
                <span>Points For: {stat.pointsFor}</span>
                <span>Point Diff (+/-): {stat.pointDiff > 0 ? `+${stat.pointDiff}` : stat.pointDiff}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right flex flex-col items-end">
                <div className="text-2xl font-black opacity-90">{stat.wins}</div>
                <div className="text-[10px] uppercase tracking-wider opacity-60 font-bold">Wins</div>
              </div>
              <button 
                onClick={() => handleCopyLog(stat, getEntityName(stat.playerId))}
                className="opacity-50 hover:opacity-100 transition-opacity p-2 print:hidden"
                title="Copy performance log for App A"
              >
                {copiedId === stat.playerId ? <CheckCircle size={18} className="text-green-600" /> : <Copy size={18} />}
              </button>
            </div>
          </div>
          </React.Fragment>
        ))}
      </div>
      
      <div className="text-xs text-gray-400 text-center mt-6 p-4">
        Rankings calculated by Wins, then Point Differential. Formula may vary by tournament.
      </div>
    </div>
  );
}
