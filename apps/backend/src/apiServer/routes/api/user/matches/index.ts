import {
  ErrorResponseSchema,
  type Matches,
  type MatchesResponse,
  MatchesResponseSchema,
  type ScoreLog,
} from "@transcendence/shared";
import {
  type FastifyPluginAsyncZod,
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";

type MatchRow = Omit<Matches, "score_logs"> & { score_logs: string };
type Match = MatchesResponse["matches"][number];

const plugin: FastifyPluginAsyncZod = async (fastify) => {
  fastify.setValidatorCompiler(validatorCompiler);
  fastify.setSerializerCompiler(serializerCompiler);
  // GET /api/user/matches - ユーザーの試合履歴を取得（直近10戦）
  fastify.get(
    "/",
    {
      schema: {
        response: {
          200: MatchesResponseSchema,
          401: ErrorResponseSchema,
          500: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: "Unauthorized" });
      }

      try {
        // ユーザーが参加した試合を直近10戦取得 + score_logsも結合
        const matches = await fastify.db.all<MatchRow[]>(
          `
          SELECT
            m.id,
            m.tournament_id,
            m.round,
            m.player1_id,
            m.player2_id,
            u1.name AS player1_name,
            u2.name AS player2_name,
            m.player1_score,
            m.player2_score,
            m.winner_id,
            m.played_at,
            m.ball_speed,
            m.ball_radius,
            COALESCE(
              json_group_array(
                json_object(
                  'scored_player_id', sl.scored_player_id,
                  'scored_player_name', u3.name,
                  'current_player1_score', sl.current_player1_score,
                  'current_player2_score', sl.current_player2_score,
                  'elapsed_seconds', sl.elapsed_seconds
                ) ORDER BY sl.elapsed_seconds ASC
              ),
              '[]'
            ) AS score_logs
          FROM matches m
          LEFT JOIN users u1 ON m.player1_id = u1.id
          LEFT JOIN users u2 ON m.player2_id = u2.id
          LEFT JOIN score_logs sl ON sl.match_id = m.id
          LEFT JOIN users u3 ON sl.scored_player_id = u3.id
          WHERE m.player1_id = ? OR m.player2_id = ?
          GROUP BY m.id
          ORDER BY m.played_at DESC
          LIMIT 10;
          `,
          [request.user.id, request.user.id],
        );
        // score_logs を JSON 文字列から配列に変換
        const normalized: Match[] = (matches || []).map((m: MatchRow) => {
          let scoreLogs: ScoreLog[] | undefined;
          if (m.score_logs) {
            const parsed = JSON.parse(m.score_logs) as ScoreLog[];
            scoreLogs = Array.isArray(parsed)
              ? parsed.map(
                  (log: ScoreLog | string): ScoreLog =>
                    typeof log === "string" ? JSON.parse(log) : log,
                )
              : [];
          }
          return {
            ...m,
            score_logs: scoreLogs,
          } as Match;
        });

        const parsed = MatchesResponseSchema.safeParse({ matches: normalized });
        if (!parsed.success) {
          fastify.log.error(
            {
              error: parsed.error.issues,
              input: JSON.stringify(normalized, null, 2),
            },
            "Matches validation failed",
          );
          throw new Error("Data validation failed");
        }

        return reply.status(200).send(parsed.data);
      } catch (error) {
        if (error instanceof Error) {
          fastify.log.error(
            { error: error.message, stack: error.stack },
            "Failed to fetch user matches",
          );
        } else {
          fastify.log.error(
            { error: JSON.stringify(error) },
            "Failed to fetch user matches",
          );
        }
        return reply.status(500).send({ error: "Internal server error" });
      }
    },
  );
};

export default plugin;
