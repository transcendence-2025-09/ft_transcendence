import { promises as fs } from "node:fs";
import path from "node:path";
import type { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import { type Database, open } from "sqlite";
import sqlite3 from "sqlite3";

async function setupSqlite(): Promise<Database> {
  const db = await open({
    filename: path.join(
      process.cwd(),
      "src",
      "database",
      "storage",
      "database.sqlite",
    ),
    driver: sqlite3.Database,
  });

  const schemaPath = path.join(
    process.cwd(),
    "src",
    "database",
    "sql",
    "schema.sql",
  );
  const schema = await fs.readFile(schemaPath, "utf-8");
  await db.exec(schema);

  // MEMO: devの場合のみ実行とかでもいいかも
  const seedPath = path.join(
    process.cwd(),
    "src",
    "database",
    "sql",
    "seed.sql",
  );
  const seed = await fs.readFile(seedPath, "utf-8");
  await db.exec(seed);

  return db;
}

const dbPlugin: FastifyPluginAsync = async (fastify): Promise<void> => {
  const db = await setupSqlite();
  fastify.decorate("db", db);

  fastify.addHook("onClose", (_instance, done) => {
    db.close()
      .then(() => done())
      .catch(done);
  });
};

export default fp(dbPlugin);
