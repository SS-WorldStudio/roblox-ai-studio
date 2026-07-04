const path = require("path");
const fs = require("fs");

const dbDir = path.join(__dirname, "..", "..", "data");
const dbPath = path.join(dbDir, "trends.db");

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const schema = `
CREATE TABLE IF NOT EXISTS scans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scannedAt TEXT NOT NULL,
  device TEXT NOT NULL,
  country TEXT NOT NULL,
  totalGames INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS games (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scanId INTEGER NOT NULL,
  name TEXT NOT NULL,
  url TEXT,
  likes TEXT,
  players TEXT,
  rawText TEXT,
  FOREIGN KEY (scanId) REFERENCES scans(id)
);

CREATE TABLE IF NOT EXISTS opportunities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scanId INTEGER NOT NULL,
  title TEXT NOT NULL,
  score INTEGER,
  genre TEXT,
  coreLoop TEXT,
  whyItCouldWork TEXT,
  buildDifficulty TEXT,
  monetizationIdeas TEXT,
  estimatedBuildTime TEXT,
  risks TEXT,
  FOREIGN KEY (scanId) REFERENCES scans(id)
);
`;

module.exports = {
  dbPath,
  schema
};
