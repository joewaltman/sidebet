const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// Determine database path
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'dev.db');

// Try multiple locations for schema file (for different deployment environments)
const possibleSchemaPaths = [
  path.join(__dirname, 'schema.sql'),                    // Local development
  path.join(process.cwd(), 'db', 'schema.sql'),          // Railway/production
  path.join('/app', 'db', 'schema.sql'),                 // Docker/container
];

let schemaPath = null;
for (const testPath of possibleSchemaPaths) {
  if (fs.existsSync(testPath)) {
    schemaPath = testPath;
    break;
  }
}

if (!schemaPath) {
  console.error('ERROR: Could not find schema.sql in any of these locations:');
  possibleSchemaPaths.forEach(p => console.error(`  - ${p}`));
  process.exit(1);
}

console.log('Initializing database at:', dbPath);
console.log('Using schema from:', schemaPath);

// Ensure database directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  console.log('Creating database directory:', dbDir);
  fs.mkdirSync(dbDir, { recursive: true });
}

// Create database
const db = new Database(dbPath);

// Read and execute schema
const schema = fs.readFileSync(schemaPath, 'utf-8');
db.exec(schema);

console.log('Database initialized successfully!');
db.close();
