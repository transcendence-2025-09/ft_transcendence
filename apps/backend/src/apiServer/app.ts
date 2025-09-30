import path from "node:path";
import fastifyAutoload from "@fastify/autoload";
import type { FastifyInstance, FastifyPluginOptions } from "fastify";

export const options = {
  ajv: {
    customOptions: {
      coerceTypes: true,
      removeAdditional: true,
    },
  },
};

export default async function serviceApp(
  fastify: FastifyInstance,
  opts: FastifyPluginOptions,
) {
  await fastify.register(fastifyAutoload, {
    dir: path.join(process.cwd(), "src/apiServer/plugins/external"),
  });

  fastify.register(fastifyAutoload, {
    dir: path.join(process.cwd(), "src/apiServer/plugins/app"),
    options: { ...opts },
  });

  fastify.register(fastifyAutoload, {
    dir: path.join(process.cwd(), "src/apiServer/routes"),
    autoHooks: true,
    cascadeHooks: true,
    options: { ...opts },
  });

  fastify.setErrorHandler((err, request, reply) => {
    fastify.log.error(
      {
        err,
        request: {
          method: request.method,
          url: request.url,
          params: request.params,
          query: request.query,
        },
      },
      "Unhandled error occurred",
    );

    reply.code(err.statusCode ?? 500);

    let message = "Internal Server Error";
    if (err.statusCode && err.statusCode < 500) {
      message = err.message;
    }

    return { message };
  });

  fastify.setNotFoundHandler((request, reply) => {
    request.log.warn(
      {
        request: {
          method: request.method,
          url: request.url,
          params: request.params,
          query: request.query,
        },
      },
      "Resource not found",
    );
    reply.code(404);

    return { message: "Not Found" };
  });
}
