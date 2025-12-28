import {
  type FastifyPluginAsyncTypebox,
  Type,
} from "@fastify/type-provider-typebox";
import type { FastifyRequest } from "fastify";
import { v7 as uuidv7 } from "uuid";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  const { tournamentsManager } = fastify;

  // POST /internal/tournaments/:id/matches/:matchId/result - 試合結果を内部から受信
  fastify.post(
    "/",
    {
      schema: {
        params: Type.Object({
          id: Type.String(),
          matchId: Type.String(),
        }),
        body: Type.Object({
          winnerId: Type.Number(),
          score: Type.Object({
            leftPlayer: Type.Number(),
            rightPlayer: Type.Number(),
          }),
          ballSpeed: Type.Optional(Type.Number()),
          ballRadius: Type.Optional(Type.Number()),
          scoreLogs: Type.Optional(
            Type.Array(
              Type.Object({
                left: Type.Number(),
                right: Type.Number(),
                elapsedSeconds: Type.Number(),
              }),
            ),
          ),
        }),
        response: {
          200: Type.Object({
            success: Type.Boolean(),
            message: Type.String(),
          }),
          400: Type.Object({
            error: Type.String(),
          }),
          404: Type.Object({
            error: Type.String(),
          }),
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { id: string; matchId: string } }>,
      reply,
    ) => {
      const { id: tournamentId, matchId } = request.params;
      const { winnerId, score, ballSpeed, ballRadius, scoreLogs } =
        request.body as {
          winnerId: number;
          score: { leftPlayer: number; rightPlayer: number };
          ballSpeed?: number;
          ballRadius?: number;
          scoreLogs?: Array<{
            left: number;
            right: number;
            elapsedSeconds: number;
          }>;
        };

      fastify.log.info(
        {
          tournamentId,
          matchId,
          winnerId,
          score,
        },
        "Received match result from game server",
      );

      const tournament = tournamentsManager.getTournament(tournamentId);
      if (!tournament) {
        return reply.status(404).send({ error: "Tournament not found" });
      }

      const match = tournamentsManager.submitMatchResult(
        tournamentId,
        matchId,
        winnerId,
        score,
      );

      if (!match) {
        return reply.status(400).send({
          error:
            "Failed to submit match result (match may not exist, not in progress, or invalid winner)",
        });
      }

      // Save ballSpeed and ballRadius to matches table
      if (ballSpeed !== undefined || ballRadius !== undefined) {
        const updateFields = [];
        const updateValues = [];

        if (ballSpeed !== undefined) {
          updateFields.push("ball_speed = ?");
          updateValues.push(ballSpeed);
        }

        if (ballRadius !== undefined) {
          updateFields.push("ball_radius = ?");
          updateValues.push(ballRadius);
        }

        updateValues.push(matchId);

        const updateQuery = `UPDATE matches SET ${updateFields.join(", ")} WHERE id = ?`;
        try {
          await fastify.db.run(updateQuery, updateValues);
          fastify.log.info(
            { matchId, ballSpeed, ballRadius },
            "Updated match with ballSpeed and ballRadius",
          );
        } catch (error) {
          fastify.log.error(
            { error, matchId },
            "Failed to update match with ballSpeed and ballRadius",
          );
        }
      }

      // Save scoreLogs to score_logs table
      if (scoreLogs && scoreLogs.length > 0) {
        try {
          for (const log of scoreLogs) {
            // log.left > log.right の場合は leftPlayer がスコアを取った、そうでなければ rightPlayer
            const scoredPlayerId =
              log.left > log.right
                ? match.leftPlayer.userId
                : match.rightPlayer.userId;
            await fastify.db.run(
              `INSERT INTO score_logs (id, match_id, scored_player_id, current_player1_score, current_player2_score, elapsed_seconds)
               VALUES (?, ?, ?, ?, ?, ?)`,
              [
                uuidv7(),
                matchId,
                scoredPlayerId,
                log.left,
                log.right,
                log.elapsedSeconds,
              ],
            );
          }
          fastify.log.info(
            { matchId, scoreLogsCount: scoreLogs.length },
            "Saved scoreLogs to database",
          );
        } catch (error) {
          fastify.log.error(
            { error, matchId },
            "Failed to save scoreLogs to database",
          );
        }
      }

      return reply.status(200).send({
        success: true,
        message: "Match result recorded successfully",
      });
    },
  );
};

export default plugin;
