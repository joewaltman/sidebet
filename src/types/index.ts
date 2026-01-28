// Shared TypeScript types for the application

export interface User {
  phoneNumber: string;
  firstName: string;
  lastName: string;
}

export interface Game {
  id: string;
  league: 'nfl' | 'nba';
  homeTeam: {
    id: string;
    name: string;
    abbreviation: string;
    logo?: string;
  };
  awayTeam: {
    id: string;
    name: string;
    abbreviation: string;
    logo?: string;
  };
  date: string;
  homeSpread?: number;
  awaySpread?: number;
}

export interface Bet {
  id: string;
  creatorPhone: string;
  creatorFirstName: string;
  creatorLastName: string;
  gameId: string;
  gameName: string;
  gameDate: string;
  chosenTeam: string;
  chosenTeamId: string;
  pointSpread: number;
  maxAmount: number;
  status: 'open' | 'settled';
  createdAt: string;
}

export interface BetAcceptance {
  id: number;
  betId: string;
  acceptorPhone: string;
  acceptorFirstName: string;
  acceptorLastName: string;
  amount: number;
  acceptedAt: string;
}

export interface BetResult {
  id: number;
  betId: string;
  winningTeamId: string;
  homeScore: number;
  awayScore: number;
  settledAt: string;
}

export interface BetDetails extends Bet {
  result?: BetResult;
}

export interface IOU {
  debtor: string; // Name of person who owes
  creditor: string; // Name of person owed
  amount: number;
}
