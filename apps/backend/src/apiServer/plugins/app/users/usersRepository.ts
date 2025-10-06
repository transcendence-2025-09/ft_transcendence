import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";

declare module "fastify" {
  interface FastifyInstance {
    usersRepository: ReturnType<typeof createUsersRepository>;
  }
}

export type UserRecord = {
  id: number;
  name: string;
  email: string;
  ft_id: number;
};

export type CreateUserDTO = Omit<UserRecord, "id">;

export function createUsersRepository(fastify: FastifyInstance) {
  return {
    async findByFtId(ft_id: number): Promise<UserRecord | null> {
      const user = await fastify.db.get("SELECT * FROM users WHERE ft_id = ?", [
        ft_id,
      ]);
      return user || null;
    },

    async findById(id: number): Promise<UserRecord | null> {
      const user = await fastify.db.get("SELECT * FROM users WHERE id = ?", [
        id,
      ]);
      return user || null;
    },

    async createUser(data: CreateUserDTO): Promise<UserRecord | null> {
      const { name, email, ft_id } = data;
      await fastify.db.run(
        "INSERT OR IGNORE INTO users (name, email, ft_id) VALUES (?, ?, ?)",
        [name, email, ft_id],
      );
      const user = await fastify.db.get("SELECT * FROM users WHERE ft_id = ?", [
        ft_id,
      ]);
      return user || null; 
    },
  };
}

export default fp(async (fastify) => {
  fastify.decorate("usersRepository", createUsersRepository(fastify));
});
