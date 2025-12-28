INSERT OR IGNORE INTO users (id, name, email, ft_id) VALUES
(1000, "John Doe", "john.doe@example.com", 1000),
(1001, "Jane Smith", "jane.smith@example.com", 1001),
(1002, "Alice Johnson", "alice.johnson@example.com", 1002),
(1003, "Bob Brown", "bob.brown@example.com", 1003);

INSERT OR IGNORE INTO tournaments (id, name, host_id, winner_id) VALUES
("019a48c3-e038-7024-8530-662c19e53424", "AAAAA", 1000, 1000); -- uid1000主催、uid1000優勝

INSERT OR IGNORE INTO matches (id, tournament_id, round, player1_id, player2_id, player1_score, player2_score, winner_id, ball_speed, ball_radius) VALUES
("019a43ec-b8cf-75b9-b590-b8f1be43320f", "019a48c3-e038-7024-8530-662c19e53424", 1, 1000, 1001, 3, 2, 1000, 6, 12), -- 1回戦 1000 vs 1001, 3-2で1000の勝ち
("019a43ed-0040-78b0-8c44-8ee2cdcb9b9e", "019a48c3-e038-7024-8530-662c19e53424", 1, 1002, 1003, 1, 3, 1003, 6, 12), -- 1回戦 1002 vs 1003, 1-3で1003の勝ち
("019a43eb-9e07-7b76-a523-8c1c6cd09c73", "019a48c3-e038-7024-8530-662c19e53424", 2, 1000, 1003, 3, 0, 1000, 6, 12); -- 決勝(2回戦) 1000 vs 1003, 3-0で1000の勝ち

INSERT OR IGNORE INTO user_stats (id, user_id, average_score, number_of_matches, number_of_wins, current_winning_streak, total_score_points, total_loss_points, last_match_id) VALUES
("019a43e6-4b5a-7753-8d32-f69d893d8d0a", 1000, 3.0, 2, 2, 2, 6, 2, "019a43eb-9e07-7b76-a523-8c1c6cd09c73"), -- uid1000の統計情報
("019a43e6-4b5a-7b63-bc62-65f99f9b77c4", 1001, 2.0, 1, 0, 0, 2, 3, "019a43ec-b8cf-75b9-b590-b8f1be43320f"), -- uid1001の統計情報
("019a43e6-4b5a-7fdf-9cd3-115667b5d2ef", 1002, 1.0, 1, 0, 0, 1, 3, "019a43ed-0040-78b0-8c44-8ee2cdcb9b9e"), -- uid1002の統計情報
("019a43e6-4b5a-719b-a72f-033aed3e5c01", 1003, 3.0, 2, 1, 0, 3, 4, "019a43eb-9e07-7b76-a523-8c1c6cd09c73"); -- uid1003の統計情報

INSERT OR IGNORE INTO score_logs (id, match_id, scored_player_id, current_player1_score, current_player2_score, elapsed_seconds) VALUES
("019a43e1-8d3f-7f4a-8f4e-4f5e8d6c9a1b", "019a43ec-b8cf-75b9-b590-b8f1be43320f", 1000, 1, 0, 30), -- match 019a43ec: 1000 scores first point
("019a43e1-9a2b-72c3-9d5f-5e6f7d8c0b2c", "019a43ec-b8cf-75b9-b590-b8f1be43320f", 1001, 1, 1, 60), -- match 019a43ec: 1001 scores to tie
("019a43e1-ab3c-7d4e-a6b7-6f7e8d9c1d3d", "019a43ec-b8cf-75b9-b590-b8f1be43320f", 1000, 2, 1, 90), -- match 019a43ec: 1000 scores again
("019a43e1-ab3c-7d4e-a6b7-6f7e8d9c1d3e", "019a43ec-b8cf-75b9-b590-b8f1be43320f", 1001, 2, 2, 110), -- match 019a43ec: 1001 scores to tie again
("019a43e1-bc4d-8e5f-b7c8-7g8h9i0j2k3l", "019a43ec-b8cf-75b9-b590-b8f1be43320f", 1000, 3, 2, 120), -- match 019a43ec: 1000 scores winning point
("019a43e1-cd5e-9f6g-c8d9-8h9i0j1k2l3m", "019a43ed-0040-78b0-8c44-8ee2cdcb9b9e", 1003, 0, 1, 40), -- match 019a43ed: 1003 scores first point
("019a43e1-de6f-0g7h-d9e0-9i0j1k2l3m4m", "019a43ed-0040-78b0-8c44-8ee2cdcb9b9e", 1003, 0, 2, 80), -- match 019a43ed: 1003 scores again
("019a43e1-de6f-0g7h-d9e0-9i0j1k2l3m4n", "019a43ed-0040-78b0-8c44-8ee2cdcb9b9e", 1002, 1, 2, 100), -- match 019a43ed: 1002 scores to avoid shutout
("019a43e1-ef7g-1h8i-e0f1-0j1k2l3m4n5o", "019a43ed-0040-78b0-8c44-8ee2cdcb9b9e", 1003, 1, 3, 120); -- match 019a43ed: 1003 scores winning point