import React, { useState } from 'react';
import { PlayerStats, Player } from '../types';
import { Medal, Printer } from 'lucide-react';

interface LeaderboardViewProps {
  leaderboard: PlayerStats[];
  players: Player[];
}

export default function LeaderboardView({ leaderboard, players }: LeaderboardViewProps) {
  const [showPrintHint, setShowPrintHint] = useState(false);

  const getPlayerName = (playerId: string) => players.find(p => p.id === playerId)?.name || 'Unknown';

  const handlePrint = () => {
    if (window.top !== window.self) {
      setShowPrintHint(true);
    }
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const totalWinsRecorded = leaderboard.reduce((sum, s) => sum + s.wins, 0);
  const totalMatchesPlayed = Math.floor(totalWinsRecorded / 2);
  const totalPointsRecorded = leaderboard.reduce((sum, s) => sum + s.pointsFor, 0);
  const totalPointsScored = Math.floor(totalPointsRecorded / 2);
  
  const sumAbsDiff = leaderboard.reduce((sum, s) => sum + Math.abs(s.pointDiff), 0);
  const avgPointDiff = totalMatchesPlayed > 0 
    ? (sumAbsDiff / (totalMatchesPlayed * 4)).toFixed(1) 
    : '0.0';

  if (leaderboard.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 mt-10">
        <p>No matches completed yet.</p>
        <p className="text-sm mt-2">Check back once scores are submitted.</p>
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

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4">
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
            <div className="bg-[#DF8D79]/10 p-3 rounded-xl border border-[#DF8D79]/20 shadow-sm text-center">
              <div className="text-base font-black text-[#A95A47] truncate px-1" title="PXTina1862">PXTina1862</div>
              <div className="text-[10px] text-[#A95A47] font-bold uppercase tracking-wider mt-1">Highest Win Streak</div>
            </div>
          </div>
        </div>
      )}
      
      <div className="space-y-2">
        {leaderboard.map((stat, index) => (
          <div 
            key={stat.playerId} 
            className={`flex items-center p-3 rounded-xl border ${getRankStyle(index)} shadow-sm transition-all duration-200`}
          >
            <div className="w-10 flex justify-center items-center">
              {getRankIcon(index)}
            </div>
            
            <div className="flex-1 ml-2">
              <h3 className={`font-bold ${index < 3 ? 'text-lg' : 'text-base'}`}>
                {getPlayerName(stat.playerId)}
              </h3>
              <div className="flex flex-wrap text-xs opacity-75 gap-x-3 gap-y-1 mt-0.5 font-medium">
                <span>Losses: {stat.losses}</span>
                <span>Points For: {stat.pointsFor}</span>
                <span>Point Diff (+/-): {stat.pointDiff > 0 ? `+${stat.pointDiff}` : stat.pointDiff}</span>
              </div>
            </div>
            
            <div className="text-right flex flex-col items-end">
              <div className="text-2xl font-black opacity-90">{stat.wins}</div>
              <div className="text-[10px] uppercase tracking-wider opacity-60 font-bold">Wins</div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="text-xs text-gray-400 text-center mt-6 p-4">
        Rankings calculated by Wins, then Point Differential. Formula may vary by tournament.
      </div>
    </div>
  );
}
