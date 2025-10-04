import "dotenv/config";
import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { pluginMockLogin } from "./mock-login/mockLogin.js";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  if (!process.env.NODE_ENV || process.env.NODE_ENV === "development") {
    await fastify.register(pluginMockLogin);
  }
};

export default plugin;
