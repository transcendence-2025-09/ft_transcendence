CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  ft_id INTEGER UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  two_factor_secret TEXT,
  two_factor_enabled BOOLEAN DEFAULT 0,
);

CREATE TABLE IF NOT EXISTS tournaments (
  id TEXT NOT NULL PRIMARY KEY, -- UUID?
  name TEXT NOT NULL,
  host_id INTEGER NOT NULL,
  winner_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (host_id) REFERENCES users(id),
  FOREIGN KEY (winner_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS matches (
  id TEXT NOT NULL PRIMARY KEY, -- UUID?
  tournament_id TEXT NOT NULL,
  round INTEGER NOT NULL, -- 1回戦なら1, 2回戦なら2など
  player1_id INTEGER NOT NULL,
  player2_id INTEGER NOT NULL,
  player1_score INTEGER NOT NULL,
  player2_score INTEGER NOT NULL,
  winner_id INTEGER, -- スコアから判断できるが、クエリを簡単にするため
  played_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id),
  FOREIGN KEY (player1_id) REFERENCES users(id),
  FOREIGN KEY (player2_id) REFERENCES users(id),
  FOREIGN KEY (winner_id) REFERENCES users(id)
);
