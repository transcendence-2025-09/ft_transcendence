INSERT OR IGNORE INTO users (id, name, email, ft_id) VALUES
(1000, "John Doe", "john.doe@example.com", 1000),
(1001, "Jane Smith", "jane.smith@example.com", 1001),
(1002, "Alice Johnson", "alice.johnson@example.com", 1002),
(1003, "Bob Brown", "bob.brown@example.com", 1003);

INSERT OR IGNORE INTO tournaments (id, name, host_id, winner_id) VALUES
("2f4d2306-ca5e-8145-7eb1-4b58773e466e", "AAAAA", 1000, 1000); -- uid1000主催、uid1000優勝

INSERT OR IGNORE INTO matches (id, tournament_id, round, player1_id, player2_id, player1_score, player2_score, winner_id) VALUES
("29e5f9ec-186c-adb1-618e-2d1da0095654", "2f4d2306-ca5e-8145-7eb1-4b58773e466e", 1, 1000, 1001, 3, 2, 1000), -- 1回戦 1000 vs 1001, 3-2で1000の勝ち
("39e5f9ec-186c-adb1-618e-2d1da0095654", "2f4d2306-ca5e-8145-7eb1-4b58773e466e", 1, 1002, 1003, 1, 3, 1003), -- 1回戦 1002 vs 1003, 1-3で1003の勝ち
("49e5f9ec-186c-adb1-618e-2d1da0095654", "2f4d2306-ca5e-8145-7eb1-4b58773e466e", 2, 1000, 1003, 3, 0, 1000); -- 決勝(2回戦) 1000 vs 1003, 3-0で1000の勝ち
