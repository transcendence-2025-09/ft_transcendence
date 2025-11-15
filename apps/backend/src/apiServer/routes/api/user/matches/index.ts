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
                player1_score: Type.Number(),
                player2_score: Type.Number(),
                winner_id: Type.Number(),
                played_at: Type.String(),
                ball_speed: Type.Optional(Type.Number()),
                ball_radius: Type.Optional(Type.Number()),
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
            id,
            tournament_id,
            round,
            player1_id,
            player2_id,
            player1_score,
            player2_score,
            winner_id,
            played_at,
            ball_speed,
            ball_radius
          FROM matches
          WHERE player1_id = ? OR player2_id = ?
          ORDER BY played_at DESC
          LIMIT 10
          `,
          [userId, userId],
        );

        return reply.status(200).send({ matches: matches || [] });
      } catch (error) {
        fastify.log.error({ error }, "Failed to fetch user matches");
        return reply.status(500).send({ error: "Internal server error" });
      }
    },
  );
};

export default plugin;
