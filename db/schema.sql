-- Users: Phone number + name
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone_number TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Bets: Core bet information with point spread
CREATE TABLE IF NOT EXISTS bets (
  id TEXT PRIMARY KEY,                    -- UUID for shareable links
  creator_phone TEXT NOT NULL,
  game_id TEXT NOT NULL,                  -- ESPN game ID
  game_name TEXT NOT NULL,                -- "Lakers vs Warriors"
  game_date TEXT NOT NULL,                -- ISO datetime
  chosen_team TEXT NOT NULL,              -- Team name
  chosen_team_id TEXT NOT NULL,           -- ESPN team ID (for result checking)
  point_spread REAL NOT NULL,             -- Point spread (e.g., -7.5 means team must win by >7.5)
  max_amount REAL NOT NULL,               -- Max bet per person
  status TEXT DEFAULT 'open',             -- 'open', 'settled'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (creator_phone) REFERENCES users(phone_number)
);

CREATE INDEX IF NOT EXISTS idx_bets_status ON bets(status);
CREATE INDEX IF NOT EXISTS idx_bets_game_id ON bets(game_id);

-- Bet Acceptances: Multiple people can accept
CREATE TABLE IF NOT EXISTS bet_acceptances (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bet_id TEXT NOT NULL,
  acceptor_phone TEXT NOT NULL,
  amount REAL NOT NULL,                   -- Amount ≤ max_amount
  accepted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (bet_id) REFERENCES bets(id),
  FOREIGN KEY (acceptor_phone) REFERENCES users(phone_number),
  UNIQUE(bet_id, acceptor_phone)          -- One acceptance per person
);

CREATE INDEX IF NOT EXISTS idx_acceptances_bet_id ON bet_acceptances(bet_id);

-- Bet Results: Automated from ESPN
CREATE TABLE IF NOT EXISTS bet_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bet_id TEXT UNIQUE NOT NULL,
  winning_team_id TEXT NOT NULL,
  home_score INTEGER,
  away_score INTEGER,
  settled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (bet_id) REFERENCES bets(id)
);
