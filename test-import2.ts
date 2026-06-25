import { generateId } from './src/utils';

let updatedPlayers: any[] = [];
let updatedTeams: any[] = [];
let updatedMatches: any[] = [];

const getOrCreatePlayer = (name: string) => {
  let p = updatedPlayers.find(p => p.name?.toLowerCase() === name?.toLowerCase());
  if (!p) {
    p = { id: generateId(), name, skill: '3.0', gender: 'Male' };
    updatedPlayers.push(p);
  }
  return p;
};

const getOrCreateTeam = (p1Name: string, p2Name: string) => {
  const p1 = getOrCreatePlayer(p1Name);
  const p2 = p2Name ? getOrCreatePlayer(p2Name) : p1;
  
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

const t1 = getOrCreateTeam('Grace', 'Hugo');
const t2 = getOrCreateTeam('Gu ge', 'Tracy');
updatedMatches.push({
  team1Id: t1.id,
  team2Id: t2.id,
  score1: 11,
  score2: 5,
  isCompleted: true
});

console.log({ updatedPlayers, updatedTeams, updatedMatches });
