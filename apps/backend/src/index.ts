import Fastify, { type FastifyInstance, type FastifyRequest } from "fastify";

async function routes(fastify: FastifyInstance) {
	fastify.get("/", async (request: FastifyRequest) => {
		return { hello: "world" };
	});
}

async function buildApp(): Promise<FastifyInstance> {
	const fastify: FastifyInstance = Fastify({
		logger: true,
	});

	fastify.register(routes);

	return fastify;
}

async function start(): Promise<void> {
	try {
		const app: FastifyInstance = await buildApp();
		await app.listen({ port: 3000 });
	} catch (err) {
		console.error(err);
		process.exit(1);
	}
}

start();
