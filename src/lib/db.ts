import Database from 'better-sqlite3';
import path from 'path';

// Initialize database connection
const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'db', 'dev.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Types
export interface User {
  id: number;
  phone_number: string;
  first_name: string;
  last_name: string;
  created_at: string;
}

export interface Bet {
  id: string;
  creator_phone: string;
  game_id: string;
  game_name: string;
  game_date: string;
  chosen_team: string;
  chosen_team_id: string;
  point_spread: number;
  max_amount: number;
  status: 'open' | 'settled';
  created_at: string;
}

export interface BetAcceptance {
  id: number;
  bet_id: string;
  acceptor_phone: string;
  amount: number;
  accepted_at: string;
}

export interface BetResult {
  id: number;
  bet_id: string;
  winning_team_id: string;
  home_score: number;
  away_score: number;
  settled_at: string;
}

// User queries
export const getUser = (phoneNumber: string): User | undefined => {
  const stmt = db.prepare('SELECT * FROM users WHERE phone_number = ?');
  return stmt.get(phoneNumber) as User | undefined;
};

export const createUser = (phoneNumber: string, firstName: string, lastName: string): User => {
  const stmt = db.prepare(
    'INSERT INTO users (phone_number, first_name, last_name) VALUES (?, ?, ?) RETURNING *'
  );
  return stmt.get(phoneNumber, firstName, lastName) as User;
};

export const upsertUser = (phoneNumber: string, firstName: string, lastName: string): User => {
  const existing = getUser(phoneNumber);
  if (existing) {
    // Update name if it changed
    const stmt = db.prepare(
      'UPDATE users SET first_name = ?, last_name = ? WHERE phone_number = ? RETURNING *'
    );
    return stmt.get(firstName, lastName, phoneNumber) as User;
  }
  return createUser(phoneNumber, firstName, lastName);
};

// Bet queries
export const getBet = (betId: string): Bet | undefined => {
  const stmt = db.prepare('SELECT * FROM bets WHERE id = ?');
  return stmt.get(betId) as Bet | undefined;
};

export const createBet = (bet: Omit<Bet, 'created_at' | 'status'>): Bet => {
  const stmt = db.prepare(`
    INSERT INTO bets (id, creator_phone, game_id, game_name, game_date, chosen_team, chosen_team_id, point_spread, max_amount)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    RETURNING *
  `);
  return stmt.get(
    bet.id,
    bet.creator_phone,
    bet.game_id,
    bet.game_name,
    bet.game_date,
    bet.chosen_team,
    bet.chosen_team_id,
    bet.point_spread,
    bet.max_amount
  ) as Bet;
};

export const updateBetStatus = (betId: string, status: 'open' | 'settled'): void => {
  const stmt = db.prepare('UPDATE bets SET status = ? WHERE id = ?');
  stmt.run(status, betId);
};

export const getOpenBetsByGame = (gameId: string): Bet[] => {
  const stmt = db.prepare('SELECT * FROM bets WHERE game_id = ? AND status = ?');
  return stmt.all(gameId, 'open') as Bet[];
};

// Bet acceptance queries
export const getBetAcceptances = (betId: string): BetAcceptance[] => {
  const stmt = db.prepare('SELECT * FROM bet_acceptances WHERE bet_id = ? ORDER BY accepted_at');
  return stmt.all(betId) as BetAcceptance[];
};

export const getAcceptance = (betId: string, acceptorPhone: string): BetAcceptance | undefined => {
  const stmt = db.prepare('SELECT * FROM bet_acceptances WHERE bet_id = ? AND acceptor_phone = ?');
  return stmt.get(betId, acceptorPhone) as BetAcceptance | undefined;
};

export const createAcceptance = (betId: string, acceptorPhone: string, amount: number): BetAcceptance => {
  const stmt = db.prepare(`
    INSERT INTO bet_acceptances (bet_id, acceptor_phone, amount)
    VALUES (?, ?, ?)
    RETURNING *
  `);
  return stmt.get(betId, acceptorPhone, amount) as BetAcceptance;
};

// Bet result queries
export const getBetResult = (betId: string): BetResult | undefined => {
  const stmt = db.prepare('SELECT * FROM bet_results WHERE bet_id = ?');
  return stmt.get(betId) as BetResult | undefined;
};

export const createBetResult = (
  betId: string,
  winningTeamId: string,
  homeScore: number,
  awayScore: number
): BetResult => {
  const stmt = db.prepare(`
    INSERT INTO bet_results (bet_id, winning_team_id, home_score, away_score)
    VALUES (?, ?, ?, ?)
    RETURNING *
  `);
  return stmt.get(betId, winningTeamId, homeScore, awayScore) as BetResult;
};

// Combined queries for bet details
export interface BetWithCreator extends Bet {
  creator_first_name: string;
  creator_last_name: string;
}

export const getBetWithCreator = (betId: string): BetWithCreator | undefined => {
  const stmt = db.prepare(`
    SELECT b.*, u.first_name as creator_first_name, u.last_name as creator_last_name
    FROM bets b
    JOIN users u ON b.creator_phone = u.phone_number
    WHERE b.id = ?
  `);
  return stmt.get(betId) as BetWithCreator | undefined;
};

export interface AcceptanceWithUser extends BetAcceptance {
  first_name: string;
  last_name: string;
}

export const getBetAcceptancesWithUsers = (betId: string): AcceptanceWithUser[] => {
  const stmt = db.prepare(`
    SELECT a.*, u.first_name, u.last_name
    FROM bet_acceptances a
    JOIN users u ON a.acceptor_phone = u.phone_number
    WHERE a.bet_id = ?
    ORDER BY a.accepted_at
  `);
  return stmt.all(betId) as AcceptanceWithUser[];
};

// User's bets queries
export const getBetsCreatedByUser = (phoneNumber: string): Bet[] => {
  const stmt = db.prepare('SELECT * FROM bets WHERE creator_phone = ? ORDER BY created_at DESC');
  return stmt.all(phoneNumber) as Bet[];
};

export interface BetAcceptanceWithBetInfo extends BetAcceptance {
  game_name: string;
  game_date: string;
  chosen_team: string;
  chosen_team_id: string;
  point_spread: number;
  max_amount: number;
  status: 'open' | 'settled';
  creator_phone: string;
}

export const getBetsAcceptedByUser = (phoneNumber: string): BetAcceptanceWithBetInfo[] => {
  const stmt = db.prepare(`
    SELECT a.*, b.game_name, b.game_date, b.chosen_team, b.chosen_team_id,
           b.point_spread, b.max_amount, b.status, b.creator_phone
    FROM bet_acceptances a
    JOIN bets b ON a.bet_id = b.id
    WHERE a.acceptor_phone = ?
    ORDER BY a.accepted_at DESC
  `);
  return stmt.all(phoneNumber) as BetAcceptanceWithBetInfo[];
};

export default db;
