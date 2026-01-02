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
  two_factor_secret: string | null;
  two_factor_enabled: boolean;
};

export type CreateUserDTO = Omit<
  UserRecord,
  "id" | "two_factor_secret" | "two_factor_enabled"
>;

export function createUsersRepository(fastify: FastifyInstance) {
  return {
    async findByFtId(ft_id: number): Promise<UserRecord | null> {
      try {
        const user = await fastify.db.get(
          "SELECT * FROM users WHERE ft_id = ?",
          [ft_id],
        );
        return {
          ...user,
          two_factor_enabled: Boolean(user.two_factor_enabled),
        }
      } catch (error) {
        console.error(error);
        return null;
      }
    },

    async findById(id: number): Promise<UserRecord | null> {
      try {
        const user = await fastify.db.get("SELECT * FROM users WHERE id = ?", [
          id,
        ]);
        return {
          ...user,
          two_factor_enabled: Boolean(user.two_factor_enabled),
        }
      } catch (error) {
        console.error(error);
        return null;
      }
    },

    async createUser(data: CreateUserDTO): Promise<UserRecord | null> {
      const { name, email, ft_id } = data;
      try {
        await fastify.db.run(
          "INSERT OR IGNORE INTO users (name, email, ft_id) VALUES (?, ?, ?)",
          [name, email, ft_id],
        );
        const user = await fastify.db.get(
          "SELECT * FROM users WHERE ft_id = ?",
          [ft_id],
        );
        return {
          ...user,
          two_factor_enabled: Boolean(user.two_factor_enabled),
        }
      } catch (error) {
        console.error(error);
        return null;
      }
    },

    async setTwoFactor(id: number, secret: string): Promise<boolean> {
      try {
        const result = await fastify.db.run(
          "UPDATE users SET two_factor_secret = ?, two_factor_enabled = 1 WHERE id = ?",
          [secret, id],
        );
        return (result.changes ?? 0) > 0;
      } catch (error) {
        console.error(error);
        return false;
      }
    },

    async removeTwoFactor(id: number): Promise<boolean> {
      try {
        const result = await fastify.db.run(
          "UPDATE users SET two_factor_secret = NULL, two_factor_enabled = 0 WHERE id = ?",
          [id],
        );
        return (result.changes ?? 0) > 0;
      } catch (error) {
        console.error(error);
        return false;
      }
    },
  };
}

export default fp(async (fastify) => {
  fastify.decorate("usersRepository", createUsersRepository(fastify));
});
