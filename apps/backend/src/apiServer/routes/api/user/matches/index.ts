import {
  type FastifyPluginAsyncTypebox,
  Type,
} from "@fastify/type-provider-typebox";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  // GET /api/user/matches - ユーザーの試合履歴を取得（直近10戦）
  fastify.get(
    "/",
    {
      schema: {
        response: {
          200: Type.Object({
            matches: Type.Array(
              Type.Object({
                id: Type.String(),
                tournament_id: Type.String(),
                round: Type.Number(),
                player1_id: Type.Number(),
                player2_id: Type.Number(),
                player1_name: Type.String(),
                player2_name: Type.String(),
                player1_score: Type.Number(),
                player2_score: Type.Number(),
                winner_id: Type.Number(),
                played_at: Type.String(),
                ball_speed: Type.Optional(Type.Number()),
                ball_radius: Type.Optional(Type.Number()),
                score_logs: Type.Optional(
                  Type.Array(
                    Type.Object({
                      scored_player_id: Type.Number(),
                      scored_player_name: Type.String(),
                      current_player1_score: Type.Number(),
                      current_player2_score: Type.Number(),
                      elapsed_seconds: Type.Optional(Type.Number()),
                    }),
                  ),
                ),
              }),
            ),
          }),
          401: Type.Object({
            error: Type.String(),
          }),
          500: Type.Object({
            error: Type.String(),
          }),
        },
      },
    },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: "Unauthorized" });
      }

      try {
        const userId = request.user.id;

        // ユーザーが参加した試合を直近10戦取得
        const matches = await fastify.db.all(
          `
          SELECT 
            m.id,
            m.tournament_id,
            m.round,
            m.player1_id,
            m.player2_id,
            u1.name as player1_name,
            u2.name as player2_name,
            m.player1_score,
            m.player2_score,
            m.winner_id,
            m.played_at,
            m.ball_speed,
            m.ball_radius
          FROM matches m
          LEFT JOIN users u1 ON m.player1_id = u1.id
          LEFT JOIN users u2 ON m.player2_id = u2.id
          WHERE m.player1_id = ? OR m.player2_id = ?
          ORDER BY m.played_at DESC
          LIMIT 10
          `,
          [userId, userId],
        );

        // 各マッチの score_logs を取得
        const matchesWithLogs: Array<Record<string, unknown>> =
          await Promise.all(
            (matches || []).map(async (match: Record<string, unknown>) => {
              const logs = await fastify.db.all(
                `
              SELECT 
                sl.scored_player_id,
                u.name as scored_player_name,
                sl.current_player1_score,
                sl.current_player2_score,
                sl.elapsed_seconds
              FROM score_logs sl
              LEFT JOIN users u ON sl.scored_player_id = u.id
              WHERE sl.match_id = ?
              ORDER BY sl.elapsed_seconds ASC
              `,
                [match.id],
              );
              return {
                ...match,
                score_logs: logs || [],
              };
            }),
          );

        return reply.status(200).send({
          matches: (matchesWithLogs || []) as Array<{
            id: string;
            tournament_id: string;
            round: number;
            player1_id: number;
            player2_id: number;
            player1_name: string;
            player2_name: string;
            player1_score: number;
            player2_score: number;
            winner_id: number;
            played_at: string;
            ball_speed?: number;
            ball_radius?: number;
            score_logs?: Array<{
              scored_player_id: number;
              scored_player_name: string;
              current_player1_score: number;
              current_player2_score: number;
              elapsed_seconds?: number;
            }>;
          }>,
        });
      } catch (error) {
        fastify.log.error({ error }, "Failed to fetch user matches");
        return reply.status(500).send({ error: "Internal server error" });
      }
    },
  );
};

export default plugin;
