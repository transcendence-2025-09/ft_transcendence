import Fastify, { type FastifyInstance } from "fastify";
import "dotenv/config";

const app: FastifyInstance = Fastify({ logger: true });

app.get("/", (_req, rep) => {
  // console.log(req);
  console.log(process.env.NODE_ENV);
  rep.send("Hello from Game server");
});

try {
  app.listen({ port: 3001, host: "0.0.0.0" });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
