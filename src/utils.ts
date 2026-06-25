import { Player, Team, Match } from './types';

export const generateId = () => Math.random().toString(36).substr(2, 9);

export const parseCSV = (csvText: string): Partial<Player>[] => {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '');
  return lines.map(line => {
    const parts = line.split(/[,\t;]/).map(s => s.trim().replace(/^"|"$/g, ''));
    const name = parts[0];
    const skill = parts[1];
    const gender = parts[2];
    const ppaScore = parts[3] ? parseFloat(parts[3]) : undefined;
    return {
      name,
      skill: skill || '3.0',
      gender: (gender?.toLowerCase()?.startsWith('m') ? 'Male' : 'Female') as 'Male' | 'Female',
      ppaScore: !isNaN(ppaScore as number) ? ppaScore : undefined,
    };
  });
};

export interface ParsedMatchResult {
  team1Player1Name: string;
  team1Player2Name: string;
  score1: number;
  team2Player1Name: string;
  team2Player2Name: string;
  score2: number;
}

export const parseMatchResultsCSV = (csvText: string): ParsedMatchResult[] => {
  const lines = csvText.split(/\r\n|\r|\n/).filter(line => line.trim() !== '');
  const parsedMatches: ParsedMatchResult[] = [];
  
  const parseScore = (val: string) => {
    if (!val) return 0;
    const cleaned = val.replace(/[^\d]/g, '');
    const parsed = parseInt(cleaned, 10);
    return isNaN(parsed) ? 0 : parsed;
  };

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const parts = line.split(/[,\t;]/).map(s => s.trim().replace(/^"|"$/g, ''));
    
    // Check if it's a 6-column format (t1p1, t1p2, score1, t2p1, t2p2, score2)
    if (parts.length >= 6 || (parts.length >= 4 && parts[3])) {
      parsedMatches.push({
        team1Player1Name: parts[0] || '',
        team1Player2Name: parts[1] || '',
        score1: parseScore(parts[2]),
        team2Player1Name: parts[3] || '',
        team2Player2Name: parts[4] || '',
        score2: parseScore(parts[5]),
      });
      i++;
    } 
    // Check if it's a 3-column format spanning two lines
    else if (i + 1 < lines.length) {
      const nextLine = lines[i + 1];
      const nextParts = nextLine.split(/[,\t;]/).map(s => s.trim().replace(/^"|"$/g, ''));
      
      parsedMatches.push({
        team1Player1Name: parts[0] || '',
        team1Player2Name: parts[1] || '',
        score1: parseScore(parts[2] || parts[parts.length - 1]),
        team2Player1Name: nextParts[0] || '',
        team2Player2Name: nextParts[1] || '',
        score2: parseScore(nextParts[2] || nextParts[nextParts.length - 1]),
      });
      i += 2;
    } else {
      i++; // Skip invalid single line at the end
    }
  }
  
  return parsedMatches.filter(r => r.team1Player1Name && r.team2Player1Name);
};

export const generateMixedTeams = (players: Player[]): Team[] => {
  const males = players.filter(p => p.gender === 'Male').sort(() => 0.5 - Math.random());
  const females = players.filter(p => p.gender === 'Female').sort(() => 0.5 - Math.random());
  
  const teams: Team[] = [];
  const maxPairs = Math.min(males.length, females.length);
  
  // Create mixed teams
  for (let i = 0; i < maxPairs; i++) {
    teams.push({
      id: generateId(),
      player1Id: males[i].id,
      player2Id: females[i].id,
    });
  }

  return teams;
};

export const generateSameGenderTeams = (players: Player[]): Team[] => {
  const males = players.filter(p => p.gender === 'Male').sort(() => 0.5 - Math.random());
  const females = players.filter(p => p.gender === 'Female').sort(() => 0.5 - Math.random());
  
  const teams: Team[] = [];
  
  for (let i = 0; i < males.length; i += 2) {
    if (i + 1 < males.length) {
      teams.push({
        id: generateId(),
        player1Id: males[i].id,
        player2Id: males[i+1].id,
      });
    }
  }

  for (let i = 0; i < females.length; i += 2) {
    if (i + 1 < females.length) {
      teams.push({
        id: generateId(),
        player1Id: females[i].id,
        player2Id: females[i+1].id,
      });
    }
  }
  
  // Leftovers become mixed if we pool them
  const leftoverMales = males.length % 2 !== 0 ? [males[males.length - 1]] : [];
  const leftoverFemales = females.length % 2 !== 0 ? [females[females.length - 1]] : [];
  
  const leftovers = [...leftoverMales, ...leftoverFemales];
  if (leftovers.length >= 2) {
      teams.push({
        id: generateId(),
        player1Id: leftovers[0].id,
        player2Id: leftovers[1].id,
      });
  }

  return teams;
};

export const generatePopcornTeams = (players: Player[]): Team[] => {
  const shuffledPlayers = [...players].sort(() => 0.5 - Math.random());
  
  const teams: Team[] = [];
  
  for (let i = 0; i < shuffledPlayers.length; i += 2) {
    if (i + 1 < shuffledPlayers.length) {
      teams.push({
        id: generateId(),
        player1Id: shuffledPlayers[i].id,
        player2Id: shuffledPlayers[i+1].id,
      });
    }
  }

  return teams;
};

export const generatePPAMatches = (teams: Team[], players: Player[], numCourts: number): Match[] => {
  if (teams.length < 2) return [];

  // 1. Calculate scores for each team
  const teamScores = teams.map(team => {
    const p1 = players.find(p => p.id === team.player1Id);
    const p2 = players.find(p => p.id === team.player2Id);
    const score1 = p1?.ppaScore || 0;
    const score2 = p2?.ppaScore || 0;
    return {
      team,
      score: score1 + score2
    };
  });

  // 2. Sort teams by score descending
  teamScores.sort((a, b) => b.score - a.score);
  const sortedTeams = teamScores.map(t => t.team);

  // 3. Generate seeding order (power of 2)
  let power = 1;
  while (power < sortedTeams.length) power *= 2;

  let order = [0, 1];
  let currentSize = 2;
  while (currentSize < power) {
    const nextOrder: number[] = [];
    for (let i = 0; i < order.length; i++) {
      nextOrder.push(order[i]);
      nextOrder.push(currentSize * 2 - 1 - order[i]);
    }
    order = nextOrder;
    currentSize *= 2;
  }

  // Filter out byes (indices >= sortedTeams.length)
  const validOrder = order.filter(idx => idx < sortedTeams.length);

  const matches: Match[] = [];
  let currentCourt = 1;
  
  // Create matches according to validOrder pairs
  for (let i = 0; i < Math.floor(validOrder.length / 2); i++) {
    const team1Idx = validOrder[i * 2];
    const team2Idx = validOrder[i * 2 + 1];

    matches.push({
      id: generateId(),
      team1Id: sortedTeams[team1Idx].id,
      team2Id: sortedTeams[team2Idx].id,
      court: currentCourt,
      score1: 0,
      score2: 0,
      isCompleted: false,
      round: 1,
    });

    currentCourt++;
    if (currentCourt > numCourts) currentCourt = 1;
  }

  return matches;
};

export const generateMatches = (teams: Team[], numCourts: number, cycles: number = 1): Match[] => {
  if (teams.length < 2) return [];

  const matches: Match[] = [];
  const tournamentTeams = [...teams];
  
  // If odd number of teams, add a dummy "Bye" team
  if (tournamentTeams.length % 2 !== 0) {
    tournamentTeams.push({ id: 'BYE', player1Id: 'BYE', player2Id: 'BYE' });
  }

  const numTeams = tournamentTeams.length;
  const numRounds = numTeams - 1;
  const halfSize = numTeams / 2;

  let currentCourt = 1;

  for (let cycle = 0; cycle < cycles; cycle++) {
    for (let round = 1; round <= numRounds; round++) {
      const overallRound = cycle * numRounds + round;
      
      for (let i = 0; i < halfSize; i++) {
        const team1 = tournamentTeams[i];
        const team2 = tournamentTeams[numTeams - 1 - i];

        // Ignore matches against the "Bye" team
        if (team1.id !== 'BYE' && team2.id !== 'BYE') {
          matches.push({
            id: generateId(),
            team1Id: team1.id,
            team2Id: team2.id,
            court: currentCourt,
            score1: 0,
            score2: 0,
            isCompleted: false,
            round: overallRound,
          });

          currentCourt++;
          if (currentCourt > numCourts) currentCourt = 1;
        }
      }

      // Rotate teams for the next round (keep first team fixed)
      const firstTeam = tournamentTeams[0];
      const lastTeam = tournamentTeams.pop()!;
      tournamentTeams.splice(1, 0, lastTeam);
    }
  }

  return matches;
};

export const generateDynamicMatches = (players: Player[], numRounds: number, numCourts: number, format: 'mixed' | 'same-gender' | 'popcorn' = 'popcorn') => {
  const matches: Match[] = [];
  const teams: Team[] = [];
  const teamCache: Record<string, Team> = {};

  const getTeam = (p1Id: string, p2Id: string) => {
    const sorted = [p1Id, p2Id].sort();
    const key = sorted.join('-');
    if (!teamCache[key]) {
      teamCache[key] = {
        id: generateId(),
        player1Id: sorted[0],
        player2Id: sorted[1],
      };
      teams.push(teamCache[key]);
    }
    return teamCache[key];
  };

  let currentCourt = 1;

  // Track who has sat out to try and distribute byes
  const sitOutCounts: Record<string, number> = {};
  players.forEach(p => sitOutCounts[p.id] = 0);

  for (let r = 1; r <= numRounds; r++) {
    let roundPlayers = [...players];
    let roundPairs: Team[] = [];

    const males = roundPlayers.filter(p => p.gender === 'Male');
    const females = roundPlayers.filter(p => p.gender === 'Female');
    
    if (format === 'mixed') {
      if (males.length === females.length && males.length > 0) {
        // Structured rotation for perfect mixed
        const rotatedFemales = [...females];
        for (let i = 0; i < ((r - 1) % females.length); i++) {
          rotatedFemales.push(rotatedFemales.shift()!);
        }
        for (let i = 0; i < males.length; i++) {
          roundPairs.push(getTeam(males[i].id, rotatedFemales[i].id));
        }
      } else {
        // Strict mixed doubles with uneven numbers
        const rotatingMales = [...males].sort((a,b) => (sitOutCounts[b.id] - sitOutCounts[a.id]) || (0.5 - Math.random()));
        const rotatingFemales = [...females].sort((a,b) => (sitOutCounts[b.id] - sitOutCounts[a.id]) || (0.5 - Math.random()));
        
        const numPairs = Math.min(rotatingMales.length, rotatingFemales.length);
        for (let i = 0; i < numPairs; i++) {
          roundPairs.push(getTeam(rotatingMales[i].id, rotatingFemales[i].id));
        }
        
        // Record byes for those who didn't play
        for (let i = numPairs; i < rotatingMales.length; i++) sitOutCounts[rotatingMales[i].id]++;
        for (let i = numPairs; i < rotatingFemales.length; i++) sitOutCounts[rotatingFemales[i].id]++;
      }
    } else if (format === 'same-gender') {
      // Same gender rotation
      const rotatingMales = [...males].sort((a,b) => (sitOutCounts[b.id] - sitOutCounts[a.id]) || (0.5 - Math.random()));
      const rotatingFemales = [...females].sort((a,b) => (sitOutCounts[b.id] - sitOutCounts[a.id]) || (0.5 - Math.random()));
      
      while (rotatingMales.length >= 2) {
        roundPairs.push(getTeam(rotatingMales.shift()!.id, rotatingMales.shift()!.id));
      }
      while (rotatingFemales.length >= 2) {
        roundPairs.push(getTeam(rotatingFemales.shift()!.id, rotatingFemales.shift()!.id));
      }
      
      // Byes
      rotatingMales.forEach(p => sitOutCounts[p.id]++);
      rotatingFemales.forEach(p => sitOutCounts[p.id]++);
    } else {
      // General random pair up, distribute byes
      roundPlayers.sort((a, b) => {
        if (sitOutCounts[a.id] !== sitOutCounts[b.id]) {
          return sitOutCounts[b.id] - sitOutCounts[a.id];
        }
        return 0.5 - Math.random();
      });

      while (roundPlayers.length >= 2) {
        const p1 = roundPlayers.shift()!;
        const p2 = roundPlayers.shift()!;
        roundPairs.push(getTeam(p1.id, p2.id));
      }
      
      // Anyone remaining gets a bye
      roundPlayers.forEach(p => sitOutCounts[p.id]++);
    }

    const shuffledPairs = [...roundPairs].sort(() => 0.5 - Math.random());
    
    for (let i = 0; i < shuffledPairs.length; i += 2) {
      if (i + 1 < shuffledPairs.length) {
        matches.push({
          id: generateId(),
          team1Id: shuffledPairs[i].id,
          team2Id: shuffledPairs[i+1].id,
          court: currentCourt,
          score1: 0,
          score2: 0,
          isCompleted: false,
          round: r,
        });
        currentCourt++;
        if (currentCourt > numCourts) currentCourt = 1;
      }
    }
  }

  return { matches, teams };
};
