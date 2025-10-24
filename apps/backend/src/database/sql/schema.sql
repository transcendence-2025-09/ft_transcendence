CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  ft_id INTEGER UNIQUE,
  two_factor_secret TEXT,
  two_factor_enabled BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE IF NOT EXISTS tournaments (
  id TEXT NOT NULL PRIMARY KEY, -- UUID?
  name TEXT NOT NULL,
  host_id INTEGER NOT NULL,
  winner_id INTEGER,
  created_at DATETIME DEFAULT (datetime('now', 'localtime')),
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
  played_at DATETIME DEFAULT (datetime('now', 'localtime')),
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id),
  FOREIGN KEY (player1_id) REFERENCES users(id),
  FOREIGN KEY (player2_id) REFERENCES users(id),
  FOREIGN KEY (winner_id) REFERENCES users(id)
);

-- ユーザ個人の統計情報を保存するテーブル
CREATE TABLE IF NOT EXISTS user_stats (
  id TEXT NOT NULL PRIMARY KEY, -- uuidv7
  user_id INTEGER NOT NULL,
  average_score REAL DEFAULT 0, -- 平均スコア
  number_of_matches INTEGER DEFAULT 0, -- 試合数
  number_of_wins INTEGER DEFAULT 0, -- 勝利数 (敗北数=試合数-勝利数)
  current_winning_streak INTEGER DEFAULT 0, -- 連勝数
  total_score_points INTEGER DEFAULT 0, -- 総得点
  total_loss_points INTEGER DEFAULT 0, -- 総失点 (総得失点差=総得点-総失点)
  last_match_id TEXT, -- 最後に参加したmatch ID (matchesテーブルをfetchして照合、更新の有無を判断. null許容)
  last_updated DATETIME DEFAULT (datetime('now', 'localtime')),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (last_match_id) REFERENCES matches(id)
)
