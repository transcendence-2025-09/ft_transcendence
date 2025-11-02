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

INSERT OR IGNORE INTO user_stats (id, user_id, average_score, number_of_matches, number_of_wins, current_winning_streak, total_score_points, total_loss_points, last_match_id) VALUES
("a1b2c3d4-e5f6-7890-abcd-ef1234567890", 1000, 3.0, 2, 2, 2, 6, 2, "49e5f9ec-186c-adb1-618e-2d1da0095654"), -- uid1000の統計情報
("b1c2d3e4-f5a6-7890-bcde-fa2345678901", 1001, 2.0, 1, 0, 0, 2, 3, "29e5f9ec-186c-adb1-618e-2d1da0095654"), -- uid1001の統計情報
("c1d2e3f4-a5b6-7890-cdef-ab3456789012", 1002, 1.0, 1, 0, 0, 1, 3, "39e5f9ec-186c-adb1-618e-2d1da0095654"), -- uid1002の統計情報
("d1e2f3a4-b5c6-7890-def0-bc4567890123", 1003, 3.0, 2, 1, 0, 3, 4, "49e5f9ec-186c-adb1-618e-2d1da0095654"); -- uid1003の統計情報
