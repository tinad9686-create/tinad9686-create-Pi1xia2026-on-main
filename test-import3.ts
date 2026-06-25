import { generateId } from './src/utils';

let players = [
  { id: 'p1', name: 'Grace' },
  { id: 'p2', name: 'Hugo' },
  { id: 'p3', name: 'Gu ge' },
  { id: 'p4', name: 'Tracy' }
];

let teams = [
  { id: 't1', player1Id: 'p1', player2Id: 'p2' },
  { id: 't2', player1Id: 'p3', player2Id: 'p4' }
];

let matches = [
  {
    id: 'm1',
    team1Id: 't1',
    team2Id: 't2',
    score1: 11,
    score2: 5,
    isCompleted: true
  }
];

const statsMap: any = {};
players.forEach(p => {
  statsMap[p.id] = { playerId: p.id, wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0, pointDiff: 0, winStreak: 0, currentStreak: 0 };
});

matches.filter(m => m.isCompleted).forEach(match => {
  const team1 = teams.find(t => t.id === match.team1Id);
  const team2 = teams.find(t => t.id === match.team2Id);
  if (!team1 || !team2) return;

  const team1Wins = match.score1 > match.score2;
  const team2Wins = match.score2 > match.score1;

  const updateStats = (t: any, pointsFor: number, pointsAgainst: number, won: boolean) => {
    [t.player1Id, t.player2Id].forEach(pid => {
      if (statsMap[pid]) {
        statsMap[pid].pointsFor += pointsFor;
        statsMap[pid].pointsAgainst += pointsAgainst;
        statsMap[pid].pointDiff += (pointsFor - pointsAgainst);
        
        if (won) {
          statsMap[pid].wins += 1;
          statsMap[pid].currentStreak += 1;
        } else if (pointsFor < pointsAgainst) {
          statsMap[pid].losses += 1;
          statsMap[pid].currentStreak = 0;
        } else {
          statsMap[pid].currentStreak = 0;
        }
      }
    });
  };

  updateStats(team1, match.score1, match.score2, team1Wins);
  updateStats(team2, match.score2, match.score1, team2Wins);
});

console.log(statsMap);
