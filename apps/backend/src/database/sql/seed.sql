INSERT OR IGNORE INTO users (id, name, email, ft_id) VALUES
(1000, "John Doe", "john.doe@example.com", 1000),
(1001, "Jane Smith", "jane.smith@example.com", 1001),
(1002, "Alice Johnson", "alice.johnson@example.com", 1002),
(1003, "Bob Brown", "bob.brown@example.com", 1003);

INSERT OR IGNORE INTO tournaments (id, name, host_id, winner_id) VALUES
("2f4d2306-ca5e-8145-7eb1-4b58773e466e", "AAAAA", 1000, 1000); -- uid1000主催、uid1000優勝

INSERT OR IGNORE INTO matches (id, tournament_id, round, player1_id, player2_id, player1_score, player2_score, winner_id) VALUES
("019a43ec-b8cf-75b9-b590-b8f1be43320f", "2f4d2306-ca5e-8145-7eb1-4b58773e466e", 1, 1000, 1001, 3, 2, 1000), -- 1回戦 1000 vs 1001, 3-2で1000の勝ち
("019a43ed-0040-78b0-8c44-8ee2cdcb9b9e", "2f4d2306-ca5e-8145-7eb1-4b58773e466e", 1, 1002, 1003, 1, 3, 1003), -- 1回戦 1002 vs 1003, 1-3で1003の勝ち
("019a43eb-9e07-7b76-a523-8c1c6cd09c73", "2f4d2306-ca5e-8145-7eb1-4b58773e466e", 2, 1000, 1003, 3, 0, 1000); -- 決勝(2回戦) 1000 vs 1003, 3-0で1000の勝ち

INSERT OR IGNORE INTO user_stats (id, user_id, average_score, number_of_matches, number_of_wins, current_winning_streak, total_score_points, total_loss_points, last_match_id) VALUES
("019a43e6-4b5a-7753-8d32-f69d893d8d0a", 1000, 3.0, 2, 2, 2, 6, 2, "019a43eb-9e07-7b76-a523-8c1c6cd09c73"), -- uid1000の統計情報
("019a43e6-4b5a-7b63-bc62-65f99f9b77c4", 1001, 2.0, 1, 0, 0, 2, 3, "019a43ec-b8cf-75b9-b590-b8f1be43320f"), -- uid1001の統計情報
("019a43e6-4b5a-7fdf-9cd3-115667b5d2ef", 1002, 1.0, 1, 0, 0, 1, 3, "019a43ed-0040-78b0-8c44-8ee2cdcb9b9e"), -- uid1002の統計情報
("019a43e6-4b5a-719b-a72f-033aed3e5c01", 1003, 3.0, 2, 1, 0, 3, 4, "019a43eb-9e07-7b76-a523-8c1c6cd09c73"); -- uid1003の統計情報
