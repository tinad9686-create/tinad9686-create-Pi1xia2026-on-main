export type Gender = 'Male' | 'Female';

export interface Player {
  id: string;
  name: string;
  skill: string;
  gender: Gender;
  ppaScore?: number;
}

export interface Team {
  id: string;
  player1Id: string;
  player2Id: string;
}

export interface Match {
  id: string;
  team1Id: string;
  team2Id: string;
  court: number;
  score1: number;
  score2: number;
  isCompleted: boolean;
  round?: number;
}

export interface PlayerStats {
  playerId: string;
  wins: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
  pointDiff: number;
  winStreak: number;
  currentStreak: number;
}

export interface TournamentInfo {
  name: string;
  date: string;
  location: string;
}

export interface AppUser {
  id: string;
  username: string;
  role: 'owner' | 'director' | 'coach' | 'player';
  status: 'pending' | 'approved';
  licenseNumber?: string;
  createdAt: number;
}

export interface VideoComment {
  id: string;
  author: string;
  text: string;
  timestamp: Date;
}

export interface Video {
  id: string;
  url: string;
  title: string;
  uploaderId?: string;
  uploaderName?: string;
  comments: VideoComment[];
  expiresAt?: number;
}
