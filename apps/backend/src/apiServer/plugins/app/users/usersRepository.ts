import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";

declare module "fastify" {
  interface FastifyInstance {
    usersRepository: ReturnType<typeof createUsersRepository>;
  }
}

type User = {
  id: number;
  name: string;
  email: string;
  ft_id: number;
};

type CreateUser = {
  name: string;
  email: string;
  ft_id: number;
};

export function createUsersRepository(fastify: FastifyInstance) {
  return {
    async findByFtId(ft_id: number): Promise<User | null> {
      const user = await fastify.db.get("SELECT * FROM users WHERE ft_id = ?", [
        ft_id,
      ]);
      return user || null;
    },

    async createUser(data: CreateUser) {
      const { name, email, ft_id } = data;
      try {
        await fastify.db.run(
          "INSERT OR IGNORE INTO users (name, email, ft_id) VALUES (?, ?, ?)",
          [name, email, ft_id],
        );
        return true;
      } catch {
        return false;
      }
    },
  };
}

export default fp(async (fastify) => {
  fastify.decorate("usersRepository", createUsersRepository(fastify));
});
