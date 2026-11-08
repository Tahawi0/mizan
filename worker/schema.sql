CREATE TABLE IF NOT EXISTS users (
  uid TEXT PRIMARY KEY,
  email TEXT,
  name TEXT,
  plan TEXT NOT NULL DEFAULT 'free',
  progress TEXT NOT NULL DEFAULT '{}',
  created INTEGER,
  updated INTEGER
);
CREATE TABLE IF NOT EXISTS league_members (
  uid TEXT PRIMARY KEY,
  nick TEXT NOT NULL,
  nick_key TEXT NOT NULL UNIQUE,
  joined INTEGER
);
CREATE TABLE IF NOT EXISTS league_points (
  uid TEXT NOT NULL,
  day TEXT NOT NULL,
  week TEXT NOT NULL,
  game TEXT NOT NULL,
  pts INTEGER NOT NULL,
  PRIMARY KEY (uid, day, game)
);
CREATE INDEX IF NOT EXISTS league_points_week ON league_points(week);

-- عدّاد الألعاب المجهول
CREATE TABLE IF NOT EXISTS events(day TEXT NOT NULL, game TEXT NOT NULL, ev TEXT NOT NULL, n INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(day, game, ev));
