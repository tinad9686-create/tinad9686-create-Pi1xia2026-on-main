import { Player, Team, Match } from './types';

export const generateId = () => Math.random().toString(36).substr(2, 9);

export const parseCSV = (csvText: string): Partial<Player>[] => {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '');
  return lines.map(line => {
    const [name, skill, gender] = line.split(',').map(s => s.trim());
    return {
      name,
      skill: skill || '3.0',
      gender: (gender?.toLowerCase().startsWith('m') ? 'Male' : 'Female') as 'Male' | 'Female',
    };
  });
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
