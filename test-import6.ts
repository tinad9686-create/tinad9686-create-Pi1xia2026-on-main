import { generateId } from './src/utils';

interface Player { id: string; name: string; }
interface Team { id: string; player1Id: string; player2Id: string; }
interface Match { team1Id: string; team2Id: string; score1: number; score2: number; isCompleted: boolean; }

let players: Player[] = [{id: 'p1', name: 'Grace'}, {id: 'p2', name: 'Hugo'}, {id: 'p3', name: 'Gu ge'}, {id: 'p4', name: 'Tracy'}];
let teams: Team[] = [{id: 't1', player1Id: 'p1', player2Id: 'p2'}, {id: 't2', player1Id: 'p3', player2Id: 'p4'}];
let matches: Match[] = [{team1Id: 't1', team2Id: 't2', score1: 0, score2: 0, isCompleted: false}];

const csvText = "Grace,Hugo,11,Gu ge,Tracy,5\r\nSarah Su,Iris,11,Molly,Rubin,5";

const parseMatchResultsCSV = (csvText: string) => {
  const lines = csvText.split(/\r\n|\r|\n/).filter(line => line.trim() !== '');
  return lines.map(line => {
    const parts = line.split(/[,\t;]/).map(s => s.trim().replace(/^"|"$/g, ''));
    const parseScore = (val: string) => {
      if (!val) return 0;
      const cleaned = val.replace(/[^\d]/g, '');
      const parsed = parseInt(cleaned, 10);
      return isNaN(parsed) ? 0 : parsed;
    };
    return {
      team1Player1Name: parts[0] || '',
      team1Player2Name: parts[1] || '',
      score1: parseScore(parts[2]),
      team2Player1Name: parts[3] || '',
      team2Player2Name: parts[4] || '',
      score2: parseScore(parts[5]),
    };
  }).filter(r => r.team1Player1Name && r.team2Player1Name);
};

const parsedMatches = parseMatchResultsCSV(csvText);

let updatedPlayers = [...players];
let updatedTeams = [...teams];
let updatedMatches = [...matches];

const getOrCreatePlayer = (name: string): Player => {
  const cleanName = (name || "Unknown").trim();
  let p = updatedPlayers.find(p => (p.name || "").toLowerCase() === cleanName.toLowerCase());
  if (!p) {
    p = { id: Math.random().toString(), name: cleanName };
    updatedPlayers.push(p);
  }
  return p;
};

const getOrCreateTeam = (p1Name: string, p2Name: string): Team => {
  const p1 = getOrCreatePlayer(p1Name);
  const p2 = p2Name ? getOrCreatePlayer(p2Name) : p1;
  
  let team = updatedTeams.find(t => 
    (t.player1Id === p1.id && t.player2Id === p2.id) || 
    (t.player1Id === p2.id && t.player2Id === p1.id)
  );
  if (!team) {
    team = { id: Math.random().toString(), player1Id: p1.id, player2Id: p2.id };
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
      team1Id: t1.id,
      team2Id: t2.id,
      score1: mr.score1,
      score2: mr.score2,
      isCompleted: true,
    });
  }
});

console.log(JSON.stringify(updatedMatches, null, 2));
