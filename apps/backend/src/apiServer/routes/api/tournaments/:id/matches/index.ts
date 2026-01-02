import {
  type FastifyPluginAsyncZod,
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import { z } from "zod";
import { ErrorSchema, MatchSchema } from "../../utils/schemas.js";

const plugin: FastifyPluginAsyncZod = async (fastify) => {
  fastify.setValidatorCompiler(validatorCompiler);
  fastify.setSerializerCompiler(serializerCompiler);

  const { tournamentsManager } = fastify;

  // GET /api/tournaments/:id/matches - マッチ一覧取得
  fastify.get(
    "/",
    {
      schema: {
        params: z.object({
          id: z.string(),
        }),
        response: {
          200: z.object({
            matches: z.array(MatchSchema),
          }),
          401: ErrorSchema,
          404: ErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const matches = tournamentsManager.getMatches(id);

      if (!matches) {
        return reply.status(404).send({ error: "Tournament not found" });
      }

      return reply.status(200).send({ matches });
    },
  );
};

export default plugin;
