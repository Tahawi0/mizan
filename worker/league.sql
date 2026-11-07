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
