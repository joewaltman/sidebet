const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// Determine database path
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'dev.db');
const schemaPath = path.join(__dirname, 'schema.sql');

console.log('Initializing database at:', dbPath);

// Create database
const db = new Database(dbPath);

// Read and execute schema
const schema = fs.readFileSync(schemaPath, 'utf-8');
db.exec(schema);

console.log('Database initialized successfully!');
db.close();
