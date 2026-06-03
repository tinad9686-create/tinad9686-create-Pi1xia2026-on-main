/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Users, LayoutGrid, Trophy, PlaySquare, ArrowRight } from 'lucide-react';
import { Player, Team, Match, Video, PlayerStats, TournamentInfo } from './types';
import PlayersView from './components/PlayersView';
import MatchesView from './components/MatchesView';
import LeaderboardView from './components/LeaderboardView';
import VideoHubView from './components/VideoHubView';
import { generateMixedTeams, generateSameGenderTeams, generatePopcornTeams, generateMatches, generateDynamicMatches } from './utils';

type Tab = 'players' | 'matches' | 'leaderboard' | 'videos';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('videos');
  const [tournamentInfo, setTournamentInfo] = useState<TournamentInfo>({ name: '', date: '', location: '' });
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [videos, setVideos] = useState<Video[]>([
    {
      id: 'v1',
      title: 'Tournament Highlights',
      url: 'https://www.youtube.com/embed/xsew3pKBLlw?controls=1&modestbranding=1&rel=0',
      comments: [
        { id: 'c1', author: 'Director', text: 'Great rally at 10-9!', timestamp: new Date() }
      ]
    },
    {
      id: 'v2',
      title: 'Pickleball Basics',
      url: 'https://www.youtube.com/embed/OLyodmMGzK8?controls=1&modestbranding=1&rel=0',
      comments: []
    }
  ]);
  const [numCourts, setNumCourts] = useState<number>(4);
  const [cycles, setCycles] = useState<number | ''>('');

  const [leftoverPlayers, setLeftoverPlayers] = useState<Player[]>([]);

  const handleGenerateMatches = (type: 'mixed' | 'same-gender' | 'popcorn' | 'manual', isDynamic: boolean = false, manualTeams?: Team[]) => {
    let actualCycles = typeof cycles === 'number' ? cycles : 0;
    
    // Auto-calculate if not provided
    if (!actualCycles || actualCycles <= 0) {
      if (isDynamic) {
        const males = players.filter(p => p.gender === 'Male').length;
        const females = players.filter(p => p.gender === 'Female').length;
        if (males > 0 && females > 0) {
          actualCycles = Math.max(males, females);
        } else {
          actualCycles = Math.max(1, players.length - 1);
        }
      } else {
        actualCycles = 1;
      }
    }

    if (isDynamic && type !== 'manual') {
      const { teams: dynamicTeams, matches: dynamicMatches } = generateDynamicMatches(players, actualCycles, numCourts, type);
      setTeams(dynamicTeams);
      setMatches(dynamicMatches);
      setLeftoverPlayers([]); // Handled dynamically per round
      setActiveTab('matches');
      return;
    }

    let generatedTeams;
    if (type === 'manual' && manualTeams) generatedTeams = manualTeams;
    else if (type === 'mixed') generatedTeams = generateMixedTeams(players);
    else if (type === 'same-gender') generatedTeams = generateSameGenderTeams(players);
    else generatedTeams = generatePopcornTeams(players);
    
    const inTeamIds = new Set(generatedTeams.flatMap(t => [t.player1Id, t.player2Id]));
    const leftovers = players.filter(p => !inTeamIds.has(p.id));
    setLeftoverPlayers(leftovers);

    const generatedMatches = generateMatches(generatedTeams, numCourts, actualCycles);
    setTeams(generatedTeams);
    setMatches(generatedMatches);
    setActiveTab('matches');
  };

  const handlePairLeftovers = () => {
    const newTeams = generateSameGenderTeams(leftoverPlayers);
    if (newTeams.length === 0) {
      return;
    }
    const allTeams = [...teams, ...newTeams];
    setTeams(allTeams);
    
    const inTeamIds = new Set(allTeams.flatMap(t => [t.player1Id, t.player2Id]));
    setLeftoverPlayers(players.filter(p => !inTeamIds.has(p.id)));

    let actualCycles = typeof cycles === 'number' ? cycles : 1;
    const allMatches = generateMatches(allTeams, numCourts, actualCycles);
    setMatches(allMatches);
  };

  const updateMatchScore = (matchId: string, score1: number, score2: number, isCompleted: boolean = true) => {
    setMatches(prev => prev.map(m => 
      m.id === matchId ? { ...m, score1, score2, isCompleted } : m
    ));
  };

  // Calculate leaderboard
  const leaderboard = useMemo(() => {
    const statsMap: Record<string, PlayerStats> = {};
    
    players.forEach(p => {
      statsMap[p.id] = { playerId: p.id, wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0, pointDiff: 0, winStreak: 0, currentStreak: 0 };
    });

    // Make sure matches are sorted chronologically if there's an implicit order
    // We'll process them in the order they appear in the array
    matches.filter(m => m.isCompleted).forEach(match => {
      const team1 = teams.find(t => t.id === match.team1Id);
      const team2 = teams.find(t => t.id === match.team2Id);
      if (!team1 || !team2) return;

      const team1Wins = match.score1 > match.score2;
      const team2Wins = match.score2 > match.score1;

      const updateStats = (t: Team, pointsFor: number, pointsAgainst: number, won: boolean) => {
        [t.player1Id, t.player2Id].forEach(pid => {
          if (statsMap[pid]) {
            statsMap[pid].pointsFor += pointsFor;
            statsMap[pid].pointsAgainst += pointsAgainst;
            statsMap[pid].pointDiff += (pointsFor - pointsAgainst);
            
            if (won) {
              statsMap[pid].wins += 1;
              statsMap[pid].currentStreak += 1;
              if (statsMap[pid].currentStreak > statsMap[pid].winStreak) {
                statsMap[pid].winStreak = statsMap[pid].currentStreak;
              }
            } else if (pointsFor < pointsAgainst) {
              statsMap[pid].losses += 1;
              statsMap[pid].currentStreak = 0;
            } else {
              // Tie, breaks streak or maintains? Usually breaks win streak, but let's reset it to be safe
              statsMap[pid].currentStreak = 0;
            }
          }
        });
      };

      updateStats(team1, match.score1, match.score2, team1Wins);
      updateStats(team2, match.score2, match.score1, team2Wins);
    });

    return Object.values(statsMap).sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      return b.pointDiff - a.pointDiff;
    });
  }, [players, teams, matches]);

  return (
    <div className="min-h-screen bg-[#F6EFE9] flex flex-col font-sans text-[#5A4537]">
      {/* Top Banner */}
      <div className="text-[#5A4537] flex items-center justify-between px-4 py-3 print:hidden">
        <div className="flex items-center gap-2 select-none origin-left">
          {/* The P Icon */}
          <svg className="h-10 w-10 drop-shadow-sm" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="p-grad" x1="0%" y1="20%" x2="100%" y2="80%">
                <stop offset="0%" stopColor="#DF8D79" />
                <stop offset="40%" stopColor="#D9AD6A" />
                <stop offset="100%" stopColor="#8E9CA3" />
              </linearGradient>
            </defs>
            <path d="M 70,85 L 25,45 C 5,25 25,5 50,15 C 85,25 80,65 50,60 C 30,55 15,40 25,45" stroke="url(#p-grad)" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {/* The ilxia text */}
          <div className="relative flex items-baseline font-black text-[32px] tracking-tighter -ml-1 mt-1 opacity-90" style={{ fontFamily: 'Fredoka, sans-serif' }}>
            <div className="absolute -top-3 left-4 w-2.5 h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: '#DF8D79' }}>
              <div className="w-full h-full opacity-30" style={{ backgroundImage: 'radial-gradient(#000 20%, transparent 30%)', backgroundSize: '3px 3px' }}></div>
            </div>
            <div className="absolute -top-1 left-[50px] w-2 h-2 bg-[#D9AD6A] rounded-full shadow-sm"></div>
            
            <span className="text-[#8E9CA3]">i</span>
            <span className="text-[#A39A96]">l</span>
            <span className="text-[#DF8D79]">x</span>
            <span className="text-[#D9AD6A]">i</span>
            <span className="text-[#D9AD6A]">a</span>
          </div>
        </div>
        <a 
          href="https://ascepd.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center text-[10px] sm:text-xs bg-[#1A4B29] hover:bg-[#13371e] text-white transition-colors px-4 py-2 sm:px-5 sm:py-2.5 rounded-full font-bold uppercase tracking-widest shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0"
        >
          Launch App
        </a>
      </div>

      {/* Main Content Area */}
      <main className="flex flex-col flex-1 overflow-x-hidden overflow-y-auto print:overflow-visible pb-28 print:pb-0">
        {activeTab === 'players' && (
          <PlayersView 
            players={players} 
            setPlayers={setPlayers} 
            onGenerateMatches={handleGenerateMatches}
            numCourts={numCourts}
            setNumCourts={setNumCourts}
            cycles={cycles}
            setCycles={setCycles}
            tournamentInfo={tournamentInfo}
            setTournamentInfo={setTournamentInfo}
          />
        )}
        {activeTab === 'matches' && (
          <MatchesView 
            matches={matches} 
            teams={teams}
            players={players}
            leftoverPlayers={leftoverPlayers}
            onPairLeftovers={handlePairLeftovers}
            updateMatchScore={updateMatchScore}
          />
        )}
        {activeTab === 'leaderboard' && (
          <LeaderboardView leaderboard={leaderboard} players={players} tournamentInfo={tournamentInfo} />
        )}
        {activeTab === 'videos' && (
           <VideoHubView videos={videos} setVideos={setVideos} />
        )}

        {/* Copyright Footer (Handled inside VideoHubView for videos tab) */}
        {activeTab !== 'videos' && (
          <div className="mt-auto pt-4 pb-6 text-center select-none opacity-90 print:hidden w-full px-2 overflow-hidden">
            <p className="text-[#C49A4C] text-[10px] sm:text-xs font-bold tracking-widest uppercase break-words">
              © 2026 ASCEP WELL-BEING DESIGN. ALL RIGHTS RESERVED.
            </p>
          </div>
        )}
      </main>

      {/* Bottom Mobile Navigation */}
      <nav className="fixed bottom-6 left-0 w-full z-10 px-4 pb-env-safe print:hidden">
        <div className="bg-[#F6EFE9] rounded-[2rem] shadow-[0_8px_30px_rgba(90,69,55,0.1)] border border-[#E5DACD] flex justify-around items-center h-16 max-w-md mx-auto px-2">
          <button 
            onClick={() => setActiveTab('videos')}
            className={`flex flex-col items-center justify-center w-full h-full gap-1 ${activeTab === 'videos' ? 'text-[#E07A5F]' : 'text-[#A3978D] hover:text-[#5A4537]'}`}
          >
            <PlaySquare size={20} className={activeTab === 'videos' ? 'fill-[#E07A5F]/20' : ''} />
            <span className="text-xs font-semibold tracking-wide">Hub</span>
          </button>
          <button 
            onClick={() => setActiveTab('players')}
            className={`flex flex-col items-center justify-center w-full h-full gap-1 ${activeTab === 'players' ? 'text-[#E07A5F]' : 'text-[#A3978D] hover:text-[#5A4537]'}`}
          >
            <Users size={20} className={activeTab === 'players' ? 'fill-[#E07A5F]/20' : ''} />
            <span className="text-xs font-semibold tracking-wide">Roster</span>
          </button>
          <button 
            onClick={() => setActiveTab('matches')}
            className={`flex flex-col items-center justify-center w-full h-full gap-1 ${activeTab === 'matches' ? 'text-[#E07A5F]' : 'text-[#A3978D] hover:text-[#5A4537]'}`}
          >
            <LayoutGrid size={20} className={activeTab === 'matches' ? 'fill-[#E07A5F]/20' : ''} />
            <span className="text-xs font-semibold tracking-wide">Matches</span>
          </button>
          <button 
            onClick={() => setActiveTab('leaderboard')}
            className={`flex flex-col items-center justify-center w-full h-full gap-1 ${activeTab === 'leaderboard' ? 'text-[#E07A5F]' : 'text-[#A3978D] hover:text-[#5A4537]'}`}
          >
            <Trophy size={20} className={activeTab === 'leaderboard' ? 'fill-[#E07A5F]/20' : ''} />
            <span className="text-xs font-semibold tracking-wide">Standings</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
