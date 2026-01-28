const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// SQL schema embedded directly (in case schema.sql file isn't available)
const SCHEMA_SQL = `
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
  id TEXT PRIMARY KEY,
  creator_phone TEXT NOT NULL,
  game_id TEXT NOT NULL,
  game_name TEXT NOT NULL,
  game_date TEXT NOT NULL,
  chosen_team TEXT NOT NULL,
  chosen_team_id TEXT NOT NULL,
  point_spread REAL NOT NULL,
  max_amount REAL NOT NULL,
  status TEXT DEFAULT 'open',
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
  amount REAL NOT NULL,
  accepted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (bet_id) REFERENCES bets(id),
  FOREIGN KEY (acceptor_phone) REFERENCES users(phone_number),
  UNIQUE(bet_id, acceptor_phone)
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
`;

function initializeDatabase() {
  try {
    console.log('=== DATABASE INITIALIZATION START ===');
    console.log('Node version:', process.version);
    console.log('Platform:', process.platform);
    console.log('CWD:', process.cwd());

    // Determine database path
    const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'db', 'dev.db');
    console.log('Database path:', dbPath);

    // Ensure database directory exists
    const dbDir = path.dirname(dbPath);
    console.log('Database directory:', dbDir);

    if (!fs.existsSync(dbDir)) {
      console.log('Creating database directory...');
      fs.mkdirSync(dbDir, { recursive: true });
      console.log('Directory created successfully');
    } else {
      console.log('Database directory already exists');
    }

    console.log('Attempting to open database with better-sqlite3...');

    // Create/open database
    const db = new Database(dbPath);
    console.log('Database opened successfully');

    // Execute schema (using IF NOT EXISTS so it's safe to run multiple times)
    db.exec(SCHEMA_SQL);

    // Verify tables were created
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log('Database tables:', tables.map(t => t.name).join(', '));

    db.close();
    console.log('Database initialized successfully!');
    return true;
  } catch (error) {
    console.error('ERROR: Failed to initialize database:', error.message);
    console.error(error.stack);
    return false;
  }
}

// Run if called directly
if (require.main === module) {
  const success = initializeDatabase();
  process.exit(success ? 0 : 1);
}

module.exports = { initializeDatabase };
