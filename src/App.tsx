/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Users, LayoutGrid, Trophy, PlaySquare, Gamepad2, ArrowRight } from 'lucide-react';
import { Player, Team, Match, Video, PlayerStats, TournamentInfo } from './types';
import PlayersView from './components/PlayersView';
import MatchesView from './components/MatchesView';
import LeaderboardView from './components/LeaderboardView';
import VideoHubView from './components/VideoHubView';
import NeonGameSandbox from './components/NeonGameSandbox';
import { generateMixedTeams, generateSameGenderTeams, generatePopcornTeams, generateMatches, generatePPAMatches, generateDynamicMatches, parseMatchResultsCSV, generateId } from './utils';

type Tab = 'players' | 'matches' | 'leaderboard' | 'videos' | 'game';

export type StandingsMode = 'individual' | 'team-round-robin' | 'team-ppa';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('videos');
  const [standingsMode, setStandingsMode] = useState<StandingsMode>('individual');
  const [tournamentInfo, setTournamentInfo] = useState<TournamentInfo>({ name: '', date: '', location: '' });
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [videos, setVideos] = useState<Video[]>([
    {
      id: 'v1',
      title: 'play pickleball, have a fun weekend',
      url: 'https://www.youtube.com/embed/nfe-qGX4Oec?controls=1&modestbranding=1&rel=0',
      comments: []
    }
  ]);
  const [numCourts, setNumCourts] = useState<number>(4);
  const [cycles, setCycles] = useState<number | ''>('');
  const [gameUnlocked, setGameUnlocked] = useState(false);

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

    let generatedMatches;
    if (type === 'manual') {
      generatedMatches = generatePPAMatches(generatedTeams, players, numCourts);
    } else {
      generatedMatches = generateMatches(generatedTeams, numCourts, actualCycles);
    }
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

  const handleImportMatches = (csvText: string) => {
    const parsedMatches = parseMatchResultsCSV(csvText);
    if (parsedMatches.length === 0) return;

    let updatedPlayers = [...players];
    let updatedTeams = [...teams];
    let updatedMatches = [...matches];
    let highestRound = matches.reduce((max, m) => Math.max(max, m.round || 1), 0);

    const getOrCreatePlayer = (name: string): Player => {
      const cleanName = (name || "Unknown").trim();
      let p = updatedPlayers.find(p => (p.name || "").toLowerCase() === cleanName.toLowerCase());
      if (!p) {
        p = { id: generateId(), name: cleanName, skill: '3.0', gender: 'Male' };
        updatedPlayers.push(p);
      }
      return p;
    };

    const getOrCreateTeam = (p1Name: string, p2Name: string): Team => {
      const p1 = getOrCreatePlayer(p1Name);
      const p2 = p2Name ? getOrCreatePlayer(p2Name) : p1; // If singles, team is just same player twice
      
      let team = updatedTeams.find(t => 
        (t.player1Id === p1.id && t.player2Id === p2.id) || 
        (t.player1Id === p2.id && t.player2Id === p1.id)
      );
      if (!team) {
        team = { id: generateId(), player1Id: p1.id, player2Id: p2.id };
        updatedTeams.push(team);
      }
      return team;
    };

    parsedMatches.forEach((mr, index) => {
      const t1 = getOrCreateTeam(mr.team1Player1Name, mr.team1Player2Name);
      const t2 = getOrCreateTeam(mr.team2Player1Name, mr.team2Player2Name);
      
      const existingMatchIndex = updatedMatches.findIndex(m => 
        (m.team1Id === t1.id && m.team2Id === t2.id) ||
        (m.team1Id === t2.id && m.team2Id === t1.id)
      );

      if (existingMatchIndex >= 0) {
        const existingMatch = updatedMatches[existingMatchIndex];
        const isReversed = existingMatch.team1Id === t2.id;
        
        updatedMatches[existingMatchIndex] = {
          ...existingMatch,
          score1: isReversed ? mr.score2 : mr.score1,
          score2: isReversed ? mr.score1 : mr.score2,
          isCompleted: true
        };
      } else {
        updatedMatches.push({
          id: generateId(),
          team1Id: t1.id,
          team2Id: t2.id,
          court: (index % numCourts) + 1,
          score1: mr.score1,
          score2: mr.score2,
          isCompleted: true,
          round: highestRound + 1
        });
      }
    });

    setPlayers(updatedPlayers);
    setTeams(updatedTeams);
    setMatches(updatedMatches);
  };

  // Calculate leaderboard
  const leaderboard = useMemo(() => {
    const statsMap: Record<string, PlayerStats> = {};
    
    if (standingsMode === 'individual') {
      players.forEach(p => {
        statsMap[p.id] = { playerId: p.id, wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0, pointDiff: 0, winStreak: 0, currentStreak: 0 };
      });
    } else {
      teams.forEach(t => {
        statsMap[t.id] = { playerId: t.id, wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0, pointDiff: 0, winStreak: 0, currentStreak: 0 };
      });
    }

    // Make sure matches are sorted chronologically if there's an implicit order
    // We'll process them in the order they appear in the array
    matches.filter(m => m.isCompleted).forEach(match => {
      const team1 = teams.find(t => t.id === match.team1Id);
      const team2 = teams.find(t => t.id === match.team2Id);
      if (!team1 || !team2) return;

      const team1Wins = match.score1 > match.score2;
      const team2Wins = match.score2 > match.score1;

      if (standingsMode === 'individual') {
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
      } else {
        const updateTeamStats = (tId: string, pointsFor: number, pointsAgainst: number, won: boolean) => {
          if (statsMap[tId]) {
            statsMap[tId].pointsFor += pointsFor;
            statsMap[tId].pointsAgainst += pointsAgainst;
            statsMap[tId].pointDiff += (pointsFor - pointsAgainst);
            
            if (won) {
              statsMap[tId].wins += 1;
              statsMap[tId].currentStreak += 1;
              if (statsMap[tId].currentStreak > statsMap[tId].winStreak) {
                statsMap[tId].winStreak = statsMap[tId].currentStreak;
              }
            } else if (pointsFor < pointsAgainst) {
              statsMap[tId].losses += 1;
              statsMap[tId].currentStreak = 0;
            } else {
              statsMap[tId].currentStreak = 0;
            }
          }
        };

        updateTeamStats(team1.id, match.score1, match.score2, team1Wins);
        updateTeamStats(team2.id, match.score2, match.score1, team2Wins);
      }
    });

    const sorted = Object.values(statsMap).sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      return b.pointDiff - a.pointDiff;
    });
    
    // In PPA format, only top 50% are technically considered for "cut", but the user wants standings displayed.
    // The cut logic might just be visual in the UI.
    return sorted;
  }, [players, teams, matches, standingsMode]);

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
          <LeaderboardView 
            leaderboard={leaderboard} 
            players={players} 
            teams={teams}
            tournamentInfo={tournamentInfo} 
            onImportMatches={handleImportMatches} 
            standingsMode={standingsMode}
            setStandingsMode={setStandingsMode}
          />
        )}
        {activeTab === 'videos' && (
           <VideoHubView videos={videos} setVideos={setVideos} />
        )}
        {activeTab === 'game' && (
          gameUnlocked ? (
            <NeonGameSandbox scenarioId={3} onExit={() => setActiveTab('videos')} />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <div 
                className="bg-[#E5DACD]/40 border border-[#D9AD6A]/30 p-8 rounded-3xl shadow-sm cursor-pointer hover:bg-[#E5DACD]/60 transition-colors"
                onClick={() => {
                  const pwd = prompt("Enter passcode to unlock the game:");
                  if (pwd === "PickleBoss2026") {
                    setGameUnlocked(true);
                  } else if (pwd !== null) {
                    alert("Incorrect passcode.");
                  }
                }}
              >
                <div className="text-[#D9AD6A] mb-4 flex justify-center">
                  <svg className="w-16 h-16 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#5A4537] mb-2 font-display">Under Construction</h2>
                <p className="text-[#8E9CA3] text-sm max-w-xs mx-auto">
                  This game is currently being built. Check back later!
                </p>
              </div>
            </div>
          )
        )}

        {/* Copyright Footer (Handled inside VideoHubView for videos tab) */}
        {(activeTab !== 'videos' && activeTab !== 'game') && (
          <div className="mt-auto pt-4 pb-6 text-center select-none opacity-90 print:hidden w-full px-2 overflow-hidden">
            <p className="text-[#C49A4C] text-[10px] sm:text-xs font-bold tracking-widest uppercase break-words">
              © 2026 ASCEP WELL-BEING DESIGN. ALL RIGHTS RESERVED.
            </p>
          </div>
        )}
      </main>

      {/* Bottom Mobile Navigation */}
      <nav className="fixed bottom-6 left-0 w-full z-10 px-4 pb-env-safe print:hidden">
        <div className="bg-[#F6EFE9] rounded-[2rem] shadow-[0_8px_30px_rgba(90,69,55,0.1)] border border-[#E5DACD] flex justify-around items-center h-16 max-w-lg mx-auto px-2">
          <button 
            onClick={() => setActiveTab('videos')}
            className={`flex flex-col items-center justify-center w-full h-full gap-1 ${activeTab === 'videos' ? 'text-[#E07A5F]' : 'text-[#A3978D] hover:text-[#5A4537]'}`}
          >
            <PlaySquare size={20} className={activeTab === 'videos' ? 'fill-[#E07A5F]/20' : ''} />
            <span className="text-[10px] sm:text-xs font-semibold tracking-wide">Hub</span>
          </button>
          <button 
            onClick={() => setActiveTab('players')}
            className={`flex flex-col items-center justify-center w-full h-full gap-1 ${activeTab === 'players' ? 'text-[#E07A5F]' : 'text-[#A3978D] hover:text-[#5A4537]'}`}
          >
            <Users size={20} className={activeTab === 'players' ? 'fill-[#E07A5F]/20' : ''} />
            <span className="text-[10px] sm:text-xs font-semibold tracking-wide">Roster</span>
          </button>
          <button 
            onClick={() => setActiveTab('matches')}
            className={`flex flex-col items-center justify-center w-full h-full gap-1 ${activeTab === 'matches' ? 'text-[#E07A5F]' : 'text-[#A3978D] hover:text-[#5A4537]'}`}
          >
            <LayoutGrid size={20} className={activeTab === 'matches' ? 'fill-[#E07A5F]/20' : ''} />
            <span className="text-[10px] sm:text-xs font-semibold tracking-wide">Matches</span>
          </button>
          <button 
            onClick={() => setActiveTab('leaderboard')}
            className={`flex flex-col items-center justify-center w-full h-full gap-1 ${activeTab === 'leaderboard' ? 'text-[#E07A5F]' : 'text-[#A3978D] hover:text-[#5A4537]'}`}
          >
            <Trophy size={20} className={activeTab === 'leaderboard' ? 'fill-[#E07A5F]/20' : ''} />
            <span className="text-[10px] sm:text-xs font-semibold tracking-wide">Standings</span>
          </button>
          <button 
            onClick={() => setActiveTab('game')}
            className={`flex flex-col items-center justify-center w-full h-full gap-1 ${activeTab === 'game' ? 'text-[#E07A5F]' : 'text-[#A3978D] hover:text-[#5A4537]'}`}
          >
            <Gamepad2 size={20} className={activeTab === 'game' ? 'fill-[#E07A5F]/20' : ''} />
            <span className="text-[10px] sm:text-xs font-semibold tracking-wide">Game</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
