CREATE TABLE IF NOT EXISTS users (
  uid TEXT PRIMARY KEY,
  email TEXT,
  name TEXT,
  plan TEXT NOT NULL DEFAULT 'free',
  progress TEXT NOT NULL DEFAULT '{}',
  created INTEGER,
  updated INTEGER
);
